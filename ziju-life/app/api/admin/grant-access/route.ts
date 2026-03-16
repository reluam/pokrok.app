import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sql } from "@/lib/database";
import { sendAuditZivotaAccessEmail } from "@/lib/user-email";

// GET – seznam přístupů k audit-zivota
export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await sql`
      SELECT
        p.id,
        p.user_id,
        u.email,
        p.created_at,
        p.completed_at,
        p.stripe_payment_id
      FROM purchases p
      JOIN users u ON u.id = p.user_id
      WHERE p.product_slug = 'audit-zivota'
      ORDER BY p.created_at DESC
    `;
    return NextResponse.json({ purchases: rows });
  } catch (err) {
    console.error("[grant-access GET]", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

// POST – přiděl přístup (1 nebo více emailů)
export async function POST(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let emails: string[];
  try {
    const body = await req.json();
    const raw: string = body.emails ?? body.email ?? "";
    emails = raw
      .split(/[\n,;]+/)
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  } catch {
    return NextResponse.json({ error: "Neplatný vstup." }, { status: 400 });
  }

  if (emails.length === 0) {
    return NextResponse.json({ error: "Žádný platný e-mail." }, { status: 400 });
  }

  const results: { email: string; ok: boolean; error?: string }[] = [];

  for (const email of emails) {
    try {
      // Vytvoř nebo načti uživatele
      const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const userRows = (await sql`
        INSERT INTO users (id, email, created_at)
        VALUES (${userId}, ${email}, NOW())
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
        RETURNING id
      `) as { id: string }[];
      const resolvedUserId = userRows[0]?.id ?? userId;

      // Vytvoř přístup (bez stripe_payment_id — jde o manuální přidělení)
      const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await sql`
        INSERT INTO purchases (id, user_id, product_slug, stripe_payment_id, created_at)
        VALUES (${purchaseId}, ${resolvedUserId}, 'audit-zivota', NULL, NOW())
      `;

      // Vygeneruj magic token (platný 7 dní — admin přístup)
      const token = `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      const tokenId = `mlt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await sql`
        INSERT INTO magic_link_tokens (id, user_id, token, expires_at, created_at)
        VALUES (${tokenId}, ${resolvedUserId}, ${token}, ${expiresAt}, NOW())
      `;

      const emailResult = await sendAuditZivotaAccessEmail(email, token);
      results.push({ email, ok: emailResult.ok, error: emailResult.error?.toString() });
    } catch (err) {
      console.error(`[grant-access] error for ${email}:`, err);
      results.push({ email, ok: false, error: String(err) });
    }
  }

  return NextResponse.json({ results });
}

// DELETE – odeber přístup (podle purchase ID)
export async function DELETE(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Chybí ID." }, { status: 400 });

  await sql`DELETE FROM purchases WHERE id = ${id} AND product_slug = 'audit-zivota'`;
  return NextResponse.json({ ok: true });
}
