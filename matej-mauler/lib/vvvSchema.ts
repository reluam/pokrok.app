import type { NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Idempotentně zajistí, že existují všechny VVV tabulky.
 * Volá se před každým zápisem i čtením, aby se aplikace
 * sama "vyléčila", pokud setup nikdy neproběhl.
 */
export async function ensureVvvSchema(sql: NeonQueryFunction<false, false>) {
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
}
