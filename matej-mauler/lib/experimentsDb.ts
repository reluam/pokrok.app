import { getDb } from "./db";
import { experiments as STATIC } from "./experiments";
import { dictionaries } from "./dictionaries";
import { notFound } from "next/navigation";
import { isAdmin } from "./adminAuth";

type Sql = ReturnType<typeof getDb>;

export type ExperimentRow = {
  slug: string;
  title_cs: string; title_en: string;
  desc_cs: string; desc_en: string;
  color: string; href: string; external: boolean;
  sort_order: number; published: boolean;
  published_at: string | null; created_at?: string;
};
export type PublicExperiment = { slug: string; title: string; description: string; color: string; href: string; external: boolean; date: string; number: number };

let ready = false;

async function ensure(sql: Sql) {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS experiments (
    slug TEXT PRIMARY KEY,
    title_cs TEXT NOT NULL, title_en TEXT NOT NULL,
    desc_cs TEXT NOT NULL, desc_en TEXT NOT NULL,
    color TEXT NOT NULL, href TEXT NOT NULL, external BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE experiments ADD COLUMN IF NOT EXISTS published_at DATE`;
  await sql`ALTER TABLE experiments ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE`;
  // seed z kódu (jen co ještě není)
  for (let i = 0; i < STATIC.length; i++) {
    const m = STATIC[i];
    const cs = dictionaries.cs.experiments.find((e) => e.slug === m.slug);
    const en = dictionaries.en.experiments.find((e) => e.slug === m.slug);
    if (!cs || !en || !m.href) continue;
    await sql`INSERT INTO experiments (slug, title_cs, title_en, desc_cs, desc_en, color, href, external, sort_order, published)
      VALUES (${m.slug}, ${cs.title}, ${en.title}, ${cs.description}, ${en.description}, ${m.color}, ${m.href}, ${!!m.external}, ${i}, ${!m.wip})
      ON CONFLICT (slug) DO NOTHING`;
  }
  // korekce přejmenovaných routes (idempotentní)
  await sql`UPDATE experiments SET href = '/time-remaining' WHERE slug = 'cas' AND href = '/kolik-ti-zbyva'`;
  await sql`UPDATE experiments SET href = '/sound-blaster' WHERE slug = 'soundverse' AND href = '/sound-universe'`;
  ready = true;
}

/* ── Veřejné čtení (s fallbackem na kód při výpadku DB) ─────────── */
const todayISO = () => new Date().toISOString().slice(0, 10);

function staticFallback(lang: "cs" | "en"): PublicExperiment[] {
  return STATIC.filter((m) => m.href && !m.wip).map((m, i) => {
    const c = dictionaries[lang].experiments.find((e) => e.slug === m.slug)!;
    return { slug: m.slug, title: c.title, description: c.description, color: m.color, href: m.href!, external: !!m.external, date: todayISO(), number: i + 1 };
  }).reverse();
}

export async function getPublicExperiments(lang: "cs" | "en"): Promise<PublicExperiment[]> {
  try {
    const sql = getDb();
    await ensure(sql);
    // Chronologicky (nejstarší první) kvůli číslování, pak otočíme → nejnovější nahoře.
    const rows = await sql`SELECT *, COALESCE(published_at, created_at::date)::text AS eff_date FROM experiments WHERE published = TRUE AND deleted = FALSE ORDER BY COALESCE(published_at, created_at::date) ASC, sort_order ASC` as (ExperimentRow & { eff_date: string })[];
    const numbered = rows.map((r, i) => ({ slug: r.slug, title: lang === "cs" ? r.title_cs : r.title_en, description: lang === "cs" ? r.desc_cs : r.desc_en, color: r.color, href: r.href, external: r.external, date: r.eff_date, number: i + 1 }));
    return numbered.reverse();
  } catch {
    return staticFallback(lang);
  }
}

export async function isPublished(slug: string): Promise<boolean> {
  try {
    const sql = getDb();
    await ensure(sql);
    const [row] = await sql`SELECT published, deleted FROM experiments WHERE slug = ${slug}` as { published: boolean; deleted: boolean }[];
    if (!row) return true; // neznámý slug → nech projít (fail open)
    return row.published && !row.deleted; // draft i smazané → zavřít
  } catch {
    return true; // DB výpadek → nech projít
  }
}

/** Hrefy smazaných experimentů — pro middleware (410 Gone). */
export async function getDeletedHrefs(): Promise<string[]> {
  try {
    const sql = getDb();
    await ensure(sql);
    const rows = await sql`SELECT href FROM experiments WHERE deleted = TRUE` as { href: string }[];
    return rows.map((r) => r.href);
  } catch {
    return [];
  }
}

/** Pro experiment routes: draft → 404 pro neadminy. */
export async function guardExperiment(slug: string): Promise<void> {
  if (await isAdmin()) return;
  if (!(await isPublished(slug))) notFound();
}

/* ── Admin operace ─────────────────────────────────────────────── */
export async function getAllExperiments(): Promise<ExperimentRow[]> {
  const sql = getDb();
  await ensure(sql);
  return await sql`SELECT * FROM experiments WHERE deleted = FALSE ORDER BY sort_order ASC` as ExperimentRow[];
}

export async function patchExperiment(slug: string, f: Partial<ExperimentRow>): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  const [cur] = await sql`SELECT * FROM experiments WHERE slug = ${slug}` as ExperimentRow[];
  if (!cur) return;
  const n = { ...cur, ...f };
  await sql`UPDATE experiments SET title_cs=${n.title_cs}, title_en=${n.title_en}, desc_cs=${n.desc_cs}, desc_en=${n.desc_en}, color=${n.color}, href=${n.href}, external=${n.external}, published=${n.published}, published_at=${n.published_at || null} WHERE slug=${slug}`;
}

export async function createExperiment(r: Omit<ExperimentRow, "sort_order" | "published_at" | "created_at">): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  const [{ max }] = await sql`SELECT COALESCE(MAX(sort_order), -1) AS max FROM experiments` as { max: number }[];
  await sql`INSERT INTO experiments (slug, title_cs, title_en, desc_cs, desc_en, color, href, external, sort_order, published)
    VALUES (${r.slug}, ${r.title_cs}, ${r.title_en}, ${r.desc_cs}, ${r.desc_en}, ${r.color}, ${r.href}, ${r.external}, ${max + 1}, ${r.published})
    ON CONFLICT (slug) DO NOTHING`;
}

// Soft-delete: ponecháme řádek jako náhrobek (tombstone) → nereseeduje se z kódu,
// zmizí z homepage/adminu/sitemapy a middleware podle něj vrátí 410 na routě.
export async function deleteExperiment(slug: string): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  await sql`UPDATE experiments SET deleted = TRUE, published = FALSE WHERE slug = ${slug}`;
}

export async function reorderExperiments(order: string[]): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  await sql.transaction(order.map((slug, i) => sql`UPDATE experiments SET sort_order = ${i} WHERE slug = ${slug}`));
}
