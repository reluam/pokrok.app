import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST() {
  try {
    const sql = getDb();

    await sql`
      CREATE TABLE IF NOT EXISTS community_definitions (
        id          SERIAL PRIMARY KEY,
        term_slug   TEXT NOT NULL,
        content     TEXT NOT NULL,
        author_name TEXT NOT NULL DEFAULT 'Anonym',
        votes       INTEGER NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS definition_votes (
        id            SERIAL PRIMARY KEY,
        definition_id INTEGER NOT NULL REFERENCES community_definitions(id) ON DELETE CASCADE,
        voter_key     TEXT NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(definition_id, voter_key)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS unofficial_terms (
        id         SERIAL PRIMARY KEY,
        slug       TEXT UNIQUE NOT NULL,
        name       TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
