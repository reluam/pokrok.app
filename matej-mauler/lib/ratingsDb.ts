import { getDb } from "./db";
import { ensureSchema, registerSchema } from "./schema";

export type RatingSummary = { avg: number; count: number; mine: number | null };

registerSchema({
  name: "ratings",
  statements: (sql) => [
    sql`CREATE TABLE IF NOT EXISTS ratings (
      page_slug TEXT NOT NULL,
      user_id TEXT NOT NULL,
      value SMALLINT NOT NULL CHECK (value BETWEEN 1 AND 5),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (page_slug, user_id)
    )`,
  ],
});

export async function getRatings(pageSlug: string, userId?: string): Promise<RatingSummary> {
  const sql = getDb();
  await ensureSchema(sql);
  const agg = (await sql`
    SELECT COALESCE(AVG(value), 0)::float AS avg, COUNT(*)::int AS count
    FROM ratings WHERE page_slug = ${pageSlug}
  `) as { avg: number; count: number }[];
  let mine: number | null = null;
  if (userId) {
    const r = (await sql`SELECT value FROM ratings WHERE page_slug = ${pageSlug} AND user_id = ${userId}`) as { value: number }[];
    mine = r.length ? Number(r[0].value) : null;
  }
  return { avg: Number(agg[0]?.avg ?? 0), count: Number(agg[0]?.count ?? 0), mine };
}

/** Upsert hodnocení uživatele (1–5). Vrací nový souhrn. */
export async function setRating(pageSlug: string, userId: string, value: number): Promise<RatingSummary | { error: string }> {
  if (!Number.isInteger(value) || value < 1 || value > 5) return { error: "bad_value" };
  const sql = getDb();
  await ensureSchema(sql);
  await sql`
    INSERT INTO ratings (page_slug, user_id, value) VALUES (${pageSlug}, ${userId}, ${value})
    ON CONFLICT (page_slug, user_id) DO UPDATE SET value = ${value}, updated_at = now()
  `;
  return getRatings(pageSlug, userId);
}
