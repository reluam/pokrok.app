import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Snaps <noreply@snaps.app>';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function generateCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

const emailTemplates = {
  cs: {
    subject: 'Tvůj přihlašovací kód do Snaps',
    body: (code: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">Přihlášení do Snaps</h2>
        <p style="color: #64748b;">Tvůj ověřovací kód:</p>
        <h1 style="letter-spacing: 8px; font-size: 36px; text-align: center; padding: 16px; background: #f1f5f9; border-radius: 12px; color: #1e293b;">${code}</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 32px;">Kód je platný 5 minut. Pokud jsi o přihlášení nežádal/a, tento e-mail ignoruj.</p>
      </div>`,
  },
  en: {
    subject: 'Your Snaps login code',
    body: (code: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">Sign in to Snaps</h2>
        <p style="color: #64748b;">Your verification code:</p>
        <h1 style="letter-spacing: 8px; font-size: 36px; text-align: center; padding: 16px; background: #f1f5f9; border-radius: 12px; color: #1e293b;">${code}</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 32px;">Code is valid for 5 minutes. If you didn't request this, ignore this email.</p>
      </div>`,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const { email, locale } = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit: max 1 code per 60 seconds per email
    const { data: recent } = await supabase
      .from('magic_codes')
      .select('created_at')
      .eq('email', normalizedEmail)
      .gte('created_at', new Date(Date.now() - 60_000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (recent && recent.length > 0) {
      return new Response(JSON.stringify({ error: 'Please wait 60 seconds before requesting a new code' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Invalidate old unused codes for this email
    await supabase
      .from('magic_codes')
      .update({ used: true })
      .eq('email', normalizedEmail)
      .eq('used', false);

    // Generate and store new code
    const code = generateCode();

    const { error: insertError } = await supabase
      .from('magic_codes')
      .insert({ email: normalizedEmail, code });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create code' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Send email via Resend
    const lang = locale?.startsWith('en') ? 'en' : 'cs';
    const template = emailTemplates[lang];

    const payload = {
      from: FROM_EMAIL,
      to: [normalizedEmail],
      subject: template.subject,
      html: template.body(code),
    };
    console.log('Resend payload:', JSON.stringify({ ...payload, html: '...' }));
    console.log('API key prefix:', RESEND_API_KEY?.slice(0, 8));

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ error: `Resend: ${err}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('Request OTP error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
