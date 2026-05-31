import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureVvvSchema } from "@/lib/vvvSchema";
import { hhggTerms } from "@/lib/hhgg";

export async function POST() {
  try {
    const sql = getDb();

    await ensureVvvSchema(sql);

    // Seed HHGG canonical terms
    for (const t of hhggTerms) {
      await sql`
        INSERT INTO vvv_terms (slug, name, description, source, author_name)
        VALUES (
          ${t.slug},
          ${t.name},
          ${t.description},
          ${t.book ?? "Stopařův průvodce po galaxii"},
          'Průvodce'
        )
        ON CONFLICT (slug) DO NOTHING
      `;
    }

    return NextResponse.json({ ok: true, seeded: hhggTerms.length });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
