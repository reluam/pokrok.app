import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hhggTerms } from "@/lib/hhgg";

export async function POST() {
  try {
    const sql = getDb();

    await sql`
      CREATE TABLE IF NOT EXISTS vvv_terms (
        id          SERIAL PRIMARY KEY,
        slug        TEXT UNIQUE NOT NULL,
        name        TEXT NOT NULL,
        description TEXT NOT NULL,
        source      TEXT NOT NULL DEFAULT 'Komunita',
        author_name TEXT NOT NULL DEFAULT 'Neznámý dobrodinec',
        votes       INTEGER NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS vvv_clarifications (
        id          SERIAL PRIMARY KEY,
        term_slug   TEXT NOT NULL,
        content     TEXT NOT NULL,
        author_name TEXT NOT NULL DEFAULT 'Neznámý dobrodinec',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS vvv_votes (
        id        SERIAL PRIMARY KEY,
        term_slug TEXT NOT NULL,
        ip_hash   TEXT NOT NULL,
        voted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_vvv_votes_lookup
      ON vvv_votes(term_slug, ip_hash, voted_at)
    `;

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
