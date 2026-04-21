import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  isAdminEmail,
  signAdminSession,
} from '@web/lib/admin-auth';
import { getAdminSupabase } from '@web/lib/supabase-admin';

export const runtime = 'nodejs';

/**
 * Admin login — two phases, keyed by `action`:
 *
 *   action: 'request'  { email }           → sends OTP via existing request-otp function
 *   action: 'verify'   { email, code }     → verifies OTP against magic_codes, issues admin cookie
 *
 * Only emails in ADMIN_EMAILS allowlist can proceed past the email check.
 */
export async function POST(req: Request) {
  let body: { action?: string; email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Zadej platný e-mail' }, { status: 400 });
  }
  if (!isAdminEmail(email)) {
    // Don't reveal whether the email exists — generic 403.
    return NextResponse.json({ error: 'Tento e-mail nemá přístup.' }, { status: 403 });
  }

  if (body.action === 'request') {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'SUPABASE_URL not configured' }, { status: 500 });
    }
    const res = await fetch(`${supabaseUrl}/functions/v1/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, locale: 'cs' }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.error ?? 'Nepodařilo se odeslat kód' },
        { status: res.status },
      );
    }
    return NextResponse.json({ success: true });
  }

  if (body.action === 'verify') {
    const code = (body.code ?? '').trim();
    if (!code) return NextResponse.json({ error: 'Zadej kód' }, { status: 400 });

    const db = getAdminSupabase();
    const { data: codes, error } = await db
      .from('magic_codes')
      .select('*')
      .eq('email', email)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !codes || codes.length === 0) {
      return NextResponse.json({ error: 'Kód vypršel nebo neexistuje' }, { status: 400 });
    }
    const magic = codes[0];
    if (magic.attempts >= 5) {
      await db.from('magic_codes').update({ used: true }).eq('id', magic.id);
      return NextResponse.json({ error: 'Příliš mnoho pokusů. Vyžádej nový kód.' }, { status: 429 });
    }
    await db.from('magic_codes').update({ attempts: magic.attempts + 1 }).eq('id', magic.id);
    if (magic.code !== code) {
      const remaining = 4 - magic.attempts;
      return NextResponse.json(
        { error: `Neplatný kód. Zbývá ${remaining} pokusů.` },
        { status: 400 },
      );
    }
    await db.from('magic_codes').update({ used: true }).eq('id', magic.id);

    const token = signAdminSession(email);
    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_COOKIE_NAME, token, adminCookieOptions());
    return res;
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
