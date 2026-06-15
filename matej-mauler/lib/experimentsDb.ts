import { getDb } from "./db";
import { experiments as STATIC } from "./experiments";
import { dictionaries } from "./dictionaries";
import { notFound } from "next/navigation";
import { isAdmin } from "./adminAuth";

type Sql = ReturnType<typeof getDb>;

export type Stage = "idea" | "draft" | "published";
export type ExperimentRow = {
  slug: string;
  title_cs: string; title_en: string;
  desc_cs: string; desc_en: string;
  color: string; href: string; external: boolean;
  sort_order: number; published: boolean;
  stage: Stage;
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
  // kanban fáze: idea | draft | published — backfill z dosavadního published
  await sql`ALTER TABLE experiments ADD COLUMN IF NOT EXISTS stage TEXT`;
  await sql`UPDATE experiments SET stage = CASE WHEN published THEN 'published' ELSE 'draft' END WHERE stage IS NULL`;
  // seed z kódu (jen co ještě není)
  for (let i = 0; i < STATIC.length; i++) {
    const m = STATIC[i];
    const cs = dictionaries.cs.experiments.find((e) => e.slug === m.slug);
    const en = dictionaries.en.experiments.find((e) => e.slug === m.slug);
    if (!cs || !en || !m.href) continue;
    await sql`INSERT INTO experiments (slug, title_cs, title_en, desc_cs, desc_en, color, href, external, sort_order, published, stage)
      VALUES (${m.slug}, ${cs.title}, ${en.title}, ${cs.description}, ${en.description}, ${m.color}, ${m.href}, ${!!m.external}, ${i}, ${!m.wip}, ${m.wip ? "draft" : "published"})
      ON CONFLICT (slug) DO NOTHING`;
  }
  // korekce přejmenovaných routes (idempotentní)
  await sql`UPDATE experiments SET href = '/time-remaining' WHERE slug = 'cas' AND href = '/kolik-ti-zbyva'`;
  await sql`UPDATE experiments SET href = '/sound-blaster' WHERE slug = 'soundverse' AND href = '/sound-universe'`;
  await sql`UPDATE experiments SET href = '/vesmir' WHERE slug = 'space' AND href = '/space'`;
  await sql`UPDATE experiments SET href = '/zvuk' WHERE slug = 'soundverse' AND href = '/sound-blaster'`;
  await sql`UPDATE experiments SET title_cs = 'Sound Basics', title_en = 'Sound Basics' WHERE slug = 'soundverse' AND title_cs = 'Sound Blaster'`;
  await sql`UPDATE experiments SET href = '/hudba' WHERE slug = 'musicblaster' AND href = '/music-blaster'`;
  // sjednocení 2026-06: Spaghetti = experimenty z The Lab + Encyklopedie; staré experimenty z feedu pryč
  await sql`UPDATE experiments SET published = FALSE WHERE slug IN ('cas','vvv','odds','sonify','foundry','musicvote','anthem','journey','space','soundverse','musicblaster') AND published = TRUE`;
  await sql`UPDATE experiments SET published = FALSE, stage = 'draft', href = '/radio', title_cs = 'Rádio', title_en = 'The Radio', desc_cs = 'Rádio renderované na serveru — všichni slyší totéž a každých 15 vteřin hlasují, co se změní.', desc_en = 'A server-rendered radio — everyone hears the same stream and votes every 15 seconds on what changes next.' WHERE slug = 'radio'`;
  await sql`UPDATE experiments SET href = '/synapse', title_cs = 'Synapse', title_en = 'Synapses', desc_cs = 'Slovo → asociace. Každá odpověď posílí synapsi ve společné síti internetu.', desc_en = ${"Word → association. Every answer strengthens a synapse in the internet's shared network."} WHERE slug = 'brain' AND href = '/brain'`;
  // projektové URL anglicky (2026-06-12)
  await sql`UPDATE experiments SET href = '/encyclopedia' WHERE slug = 'encyklopedie' AND href = '/encyklopedie'`;
  await sql`UPDATE experiments SET href = '/synapsis' WHERE slug = 'brain' AND href IN ('/brain', '/synapse')`;
  // Decision Maker → kanonický draft se slugem 'decision-maker' (kvůli guardu draft = jen admin).
  // Když nápad už pod tímhle slugem existuje, jen se povýší na draft (titul/popis zůstanou).
  await sql`INSERT INTO experiments (slug, title_cs, title_en, desc_cs, desc_en, color, href, external, sort_order, published, stage)
    VALUES ('decision-maker', 'Decision Maker', 'Decision Maker',
      'Nástroj na rozhodování, když jsi zaseknutý na 50/50. Pro a proti s vahami, fyzikální přetahování a moment „odříznutí" (decidere).',
      'A tool for decisions when you are stuck at 50/50. Weighted pros and cons, a physical tug, and the moment of cutting away the rest (decidere).',
      '#E0F2FE', '/decision-maker', FALSE, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM experiments), FALSE, 'draft')
    ON CONFLICT (slug) DO UPDATE SET stage = 'draft', published = FALSE, href = '/decision-maker'`;
  // About / Mapa Spaghetti — draft, samostatný projekt
  await sql`INSERT INTO experiments (slug, title_cs, title_en, desc_cs, desc_en, color, href, external, sort_order, published, stage)
    VALUES ('about', 'Mapa Spaghetti', 'Map of Spaghetti',
      'Mapa toho, jak Spaghetti souvisí: projekty jako nody, koncepty jako sdílené nudle. Proč experimenty vznikly a jak fungují.',
      'A map of how Spaghetti connects: projects as nodes, concepts as shared noodles. Why the experiments came to be and how they work.',
      '#FEF3C7', '/about', FALSE, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM experiments), FALSE, 'draft')
    ON CONFLICT (slug) DO UPDATE SET stage = 'draft', published = FALSE, href = '/about'`;
  // Manuál na život — IKEA-style listovací návod na život, draft (2026-06-15)
  await sql`INSERT INTO experiments (slug, title_cs, title_en, desc_cs, desc_en, color, href, external, sort_order, published, stage)
    VALUES ('life-manual', 'Manuál na život', 'Life Manual',
      'Návod na život ve stylu IKEA montážního manuálu — černobíle, listuje se zleva doprava. Vtipné, naučné a pravdivé střípky: obsah balení, nářadí, varování a kroky sestavení.',
      'A guide to life in the style of an IKEA assembly manual — black and white, flipped left to right. Funny, educational, true bits and pieces: what is in the box, the tools, the warnings, and the assembly steps.',
      '#F5F5F4', '/life-manual', FALSE, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM experiments), FALSE, 'draft')
    ON CONFLICT (slug) DO UPDATE SET stage = 'draft', published = FALSE, href = '/life-manual'`;
  await sql`UPDATE experiments SET title_cs = 'Encyklopedie', title_en = 'The Encyclopedia', desc_cs = 'Encyklopedie absurdních fikčních světů — braná smrtelně vážně. Futurama, Simpsonovi, Red Dwarf, Stopařův průvodce… jako by to všechno byla pravda.', desc_en = ${"An encyclopedia of absurd fictional worlds — taken deadly seriously. Futurama, The Simpsons, Red Dwarf, the Hitchhiker's Guide… as if it were all real."} WHERE slug = 'encyklopedie'`;
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
  // stage je zdroj pravdy pro published (jen 'published' jde na web)
  if (f.stage) n.published = f.stage === "published";
  else if (f.published !== undefined) n.stage = f.published ? "published" : (cur.stage === "idea" ? "idea" : "draft");
  await sql`UPDATE experiments SET title_cs=${n.title_cs}, title_en=${n.title_en}, desc_cs=${n.desc_cs}, desc_en=${n.desc_en}, color=${n.color}, href=${n.href}, external=${n.external}, published=${n.published}, stage=${n.stage}, published_at=${n.published_at || null} WHERE slug=${slug}`;
}

export async function createExperiment(r: Omit<ExperimentRow, "sort_order" | "published_at" | "created_at" | "published"> & { published?: boolean }): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  const stage: Stage = r.stage ?? "idea";
  const published = stage === "published";
  const [{ max }] = await sql`SELECT COALESCE(MAX(sort_order), -1) AS max FROM experiments` as { max: number }[];
  await sql`INSERT INTO experiments (slug, title_cs, title_en, desc_cs, desc_en, color, href, external, sort_order, published, stage)
    VALUES (${r.slug}, ${r.title_cs}, ${r.title_en}, ${r.desc_cs}, ${r.desc_en}, ${r.color}, ${r.href}, ${r.external}, ${max + 1}, ${published}, ${stage})
    ON CONFLICT (slug) DO NOTHING`;
}

/** Volný slug pro nový nápad — slugifikuje titul, při kolizi přidá příponu. */
export async function uniqueSlug(base: string): Promise<string> {
  const sql = getDb();
  await ensure(sql);
  let root = base.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  if (!root) root = "napad";
  const rows = await sql`SELECT slug FROM experiments WHERE slug = ${root} OR slug LIKE ${root + "-%"}` as { slug: string }[];
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(root)) return root;
  for (let i = 2; i < 999; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`;
  return `${root}-${Date.now().toString(36)}`;
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
