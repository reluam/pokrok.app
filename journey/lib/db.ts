// Server-only DB layer (Neon Postgres).
// The whole content tree is stored as a single JSONB document — this matches
// how the admin saves (the entire { areas } payload) and keeps writes atomic.
import "server-only";
import { neon } from "@neondatabase/serverless";
import type { Area } from "./areas";

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  "";

export const hasDb = !!url;

const sql = url ? neon(url) : null;

let ensured = false;
async function ensureSchema() {
  if (!sql || ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS content (
      id         INT PRIMARY KEY DEFAULT 1,
      data       JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT content_single_row CHECK (id = 1)
    )
  `;
  ensured = true;
}

// Load areas from DB. If the table is empty, seed it from the bundled JSON.
export async function dbLoadAreas(seed: () => Area[]): Promise<Area[]> {
  if (!sql) throw new Error("No database configured");
  await ensureSchema();
  const rows = (await sql`SELECT data FROM content WHERE id = 1`) as { data: { areas: Area[] } }[];
  if (rows.length > 0 && rows[0].data?.areas) return rows[0].data.areas;

  const areas = seed();
  await dbSaveAreas(areas);
  return areas;
}

export async function dbSaveAreas(areas: Area[]): Promise<void> {
  if (!sql) throw new Error("No database configured");
  await ensureSchema();
  const json = JSON.stringify({ areas });
  await sql`
    INSERT INTO content (id, data, updated_at)
    VALUES (1, ${json}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
}
