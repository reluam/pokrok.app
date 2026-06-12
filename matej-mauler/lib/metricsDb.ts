import { getDb } from "./db";

type Sql = ReturnType<typeof getDb>;

export type MetricKind = "open" | "interact";
export type ProjectMetrics = { slug: string; opens: number; interacts: number; opens7: number; interacts7: number };

let ready = false;

async function ensure(sql: Sql) {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS project_metrics (
    slug TEXT NOT NULL,
    day DATE NOT NULL,
    kind TEXT NOT NULL,
    n INT NOT NULL DEFAULT 0,
    PRIMARY KEY (slug, day, kind)
  )`;
  ready = true;
}

/** +1 události (open = otevřel projekt, interact = něco v něm udělal). Denní granularita. */
export async function trackEvent(slug: string, kind: MetricKind): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  await sql`INSERT INTO project_metrics (slug, day, kind, n) VALUES (${slug}, CURRENT_DATE, ${kind}, 1)
    ON CONFLICT (slug, day, kind) DO UPDATE SET n = project_metrics.n + 1`;
}

/** Souhrn pro admin dashboard: celkem + posledních 7 dní, per projekt. */
export async function getProjectMetrics(): Promise<ProjectMetrics[]> {
  const sql = getDb();
  await ensure(sql);
  const rows = await sql`SELECT slug, kind,
      SUM(n)::int AS total,
      COALESCE(SUM(n) FILTER (WHERE day >= CURRENT_DATE - 6), 0)::int AS last7
    FROM project_metrics GROUP BY slug, kind` as { slug: string; kind: string; total: number; last7: number }[];
  const map = new Map<string, ProjectMetrics>();
  for (const r of rows) {
    const m = map.get(r.slug) ?? { slug: r.slug, opens: 0, interacts: 0, opens7: 0, interacts7: 0 };
    if (r.kind === "open") { m.opens = r.total; m.opens7 = r.last7; }
    if (r.kind === "interact") { m.interacts = r.total; m.interacts7 = r.last7; }
    map.set(r.slug, m);
  }
  return [...map.values()];
}
