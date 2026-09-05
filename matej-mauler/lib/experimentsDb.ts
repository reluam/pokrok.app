import { getDb } from "./db";
import { experiments as STATIC } from "./experiments";
import { dictionaries } from "./dictionaries";
import { notFound } from "next/navigation";
import { isAdmin } from "./adminAuth";
import { unstable_cache, revalidateTag } from "next/cache";
import { ensureSchema, registerSchema } from "./schema";
import { withFallback } from "./dbFallback";

// Tag, pod kterým žije cache veřejného feedu experimentů. Admin mutace ho shodí
// (revalidateTag) → homepage/archiv se obnoví, jinak se servírují z cache (instant návrat).
const EXPERIMENTS_TAG = "experiments";

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

registerSchema({
  name: "experiments",
  statements: (sql) => [
    sql`CREATE TABLE IF NOT EXISTS experiments (
      slug TEXT PRIMARY KEY,
      title_cs TEXT NOT NULL, title_en TEXT NOT NULL,
      desc_cs TEXT NOT NULL, desc_en TEXT NOT NULL,
      color TEXT NOT NULL, href TEXT NOT NULL, external BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    sql`ALTER TABLE experiments ADD COLUMN IF NOT EXISTS published_at DATE`,
    sql`ALTER TABLE experiments ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE`,
    // kanban fáze: idea | draft | published — backfill z dosavadního published
    sql`ALTER TABLE experiments ADD COLUMN IF NOT EXISTS stage TEXT`,
    sql`UPDATE experiments SET stage = CASE WHEN published THEN 'published' ELSE 'draft' END WHERE stage IS NULL`,
    // seed z kódu (jen co ještě není)
    ...STATIC.flatMap((m, i) => {
      const cs = dictionaries.cs.experiments.find((e) => e.slug === m.slug);
      const en = dictionaries.en.experiments.find((e) => e.slug === m.slug);
      if (!cs || !en || !m.href) return [];
      return [sql`INSERT INTO experiments (slug, title_cs, title_en, desc_cs, desc_en, color, href, external, sort_order, published, stage)
        VALUES (${m.slug}, ${cs.title}, ${en.title}, ${cs.description}, ${en.description}, ${m.color}, ${m.href}, ${!!m.external}, ${i}, ${!m.wip}, ${m.wip ? "draft" : "published"})
        ON CONFLICT (slug) DO NOTHING`];
    }),
    // korekce přejmenovaných routes (idempotentní)
    sql`UPDATE experiments SET href = '/time-remaining' WHERE slug = 'cas' AND href = '/kolik-ti-zbyva'`,
    sql`UPDATE experiments SET href = '/sound-blaster' WHERE slug = 'soundverse' AND href = '/sound-universe'`,
    sql`UPDATE experiments SET href = '/vesmir' WHERE slug = 'space' AND href = '/space'`,
    sql`UPDATE experiments SET href = '/zvuk' WHERE slug = 'soundverse' AND href = '/sound-blaster'`,
    sql`UPDATE experiments SET title_cs = 'Sound Basics', title_en = 'Sound Basics' WHERE slug = 'soundverse' AND title_cs = 'Sound Blaster'`,
    sql`UPDATE experiments SET href = '/hudba' WHERE slug = 'musicblaster' AND href = '/music-blaster'`,
    // sjednocení 2026-06: Spaghetti = experimenty z The Lab + Encyklopedie; staré experimenty z feedu pryč
    sql`UPDATE experiments SET published = FALSE WHERE slug IN ('cas','vvv','odds','sonify','foundry','musicvote','anthem','journey','space','soundverse','musicblaster') AND published = TRUE`,
    sql`UPDATE experiments SET published = FALSE, stage = 'draft', href = '/radio', title_cs = 'Rádio', title_en = 'The Radio', desc_cs = 'Rádio renderované na serveru — všichni slyší totéž a každých 15 vteřin hlasují, co se změní.', desc_en = 'A server-rendered radio — everyone hears the same stream and votes every 15 seconds on what changes next.' WHERE slug = 'radio'`,
    sql`UPDATE experiments SET href = '/synapse', title_cs = 'Synapse', title_en = 'Synapses', desc_cs = 'Slovo → asociace. Každá odpověď posílí synapsi ve společné síti internetu.', desc_en = ${"Word → association. Every answer strengthens a synapse in the internet's shared network."} WHERE slug = 'brain' AND href = '/brain'`,
    // projektové URL anglicky (2026-06-12)
    sql`UPDATE experiments SET href = '/encyclopedia' WHERE slug = 'encyklopedie' AND href = '/encyklopedie'`,
    sql`UPDATE experiments SET href = '/synapsis' WHERE slug = 'brain' AND href IN ('/brain', '/synapse')`,
    // Decision Maker → kanonický draft se slugem 'decision-maker' (kvůli guardu draft = jen admin).
    // Když nápad už pod tímhle slugem existuje, jen se povýší na draft (titul/popis zůstanou).
    sql`INSERT INTO experiments (slug, title_cs, title_en, desc_cs, desc_en, color, href, external, sort_order, published, stage)
      VALUES ('decision-maker', 'Decision Maker', 'Decision Maker',
        'Nástroj na rozhodování, když jsi zaseknutý na 50/50. Pro a proti s vahami, fyzikální přetahování a moment „odříznutí" (decidere).',
        'A tool for decisions when you are stuck at 50/50. Weighted pros and cons, a physical tug, and the moment of cutting away the rest (decidere).',
        '#E0F2FE', '/decision-maker', FALSE, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM experiments), FALSE, 'draft')
      ON CONFLICT (slug) DO UPDATE SET stage = 'draft', published = FALSE, href = '/decision-maker'`,
    // About / Mapa Spaghetti — draft, samostatný projekt
    sql`INSERT INTO experiments (slug, title_cs, title_en, desc_cs, desc_en, color, href, external, sort_order, published, stage)
      VALUES ('about', 'Mapa Spaghetti', 'Map of Spaghetti',
        'Mapa toho, jak Spaghetti souvisí: projekty jako nody, koncepty jako sdílené nudle. Proč experimenty vznikly a jak fungují.',
        'A map of how Spaghetti connects: projects as nodes, concepts as shared noodles. Why the experiments came to be and how they work.',
        '#FEF3C7', '/about', FALSE, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM experiments), FALSE, 'draft')
      ON CONFLICT (slug) DO UPDATE SET stage = 'draft', published = FALSE, href = '/about'`,
    // Manuál na život — IKEA-style listovací návod na život, draft (2026-06-15)
    sql`INSERT INTO experiments (slug, title_cs, title_en, desc_cs, desc_en, color, href, external, sort_order, published, stage)
      VALUES ('life-manual', 'Manuál na život', 'Life Manual',
        'Návod na život ve stylu IKEA montážního manuálu — černobílé technické listy. Vtipné, naučné a pravdivé střípky: záruka a výrobní vady, obsah balení, orgány, palivo, spánek, mentální modely i řešení nejčastějších problémů.',
        'A guide to life in the style of an IKEA assembly manual — black-and-white technical sheets. Funny, educational, true bits and pieces: warranty and defects, what is in the box, organs, fuel, sleep, mental models, and troubleshooting.',
        '#F5F5F4', '/life-manual', FALSE, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM experiments), FALSE, 'draft')
      ON CONFLICT (slug) DO UPDATE SET stage = 'draft', published = FALSE, href = '/life-manual'`,
    // Spaghetti Město (on-chain simulace) bylo z repa odstraněno i s wagmi/viem/RainbowKit.
    // Řádek 'spaghetti-city' může v DB zůstat z dřívějška — je draft a nepublikovaný,
    // takže se nikde nezobrazí; smazat se dá z admin dashboardu.
    sql`UPDATE experiments SET title_cs = 'Encyklopedie', title_en = 'The Encyclopedia', desc_cs = 'Encyklopedie absurdních fikčních světů — braná smrtelně vážně. Futurama, Simpsonovi, Red Dwarf, Stopařův průvodce… jako by to všechno byla pravda.', desc_en = ${"An encyclopedia of absurd fictional worlds — taken deadly seriously. Futurama, The Simpsons, Red Dwarf, the Hitchhiker's Guide… as if it were all real."} WHERE slug = 'encyklopedie'`,
  ],
});

/* ── Veřejné čtení (s fallbackem na kód při výpadku DB) ─────────── */
const todayISO = () => new Date().toISOString().slice(0, 10);

// Na ostré (production) jsou drafty skryté; na preview/lokálně je ukaž —
// aby šlo projekt rozklikat a ladit na preview deploy ještě před publikací.
const showDrafts = () => process.env.VERCEL_ENV !== "production";

/**
 * Experimenty, které se seedují jako draft. Musí sedět se seedem v ensure()
 * výš — hlídá to test. Je to v kódu schválně: na rozhodnutí „tohle není ke
 * zveřejnění" nesmí být potřeba databáze, jinak ji výpadek zveřejní.
 */
export const DRAFT_SLUGS: ReadonlySet<string> = new Set(["about", "decision-maker", "life-manual"]);

// Náhradní feed, když je databáze nedostupná. Jen experimenty, které bez ní
// fungují — radši jedna živá karta než sedm mrtvých.
function staticFallback(lang: "cs" | "en"): PublicExperiment[] {
  return STATIC.filter((m) => m.href && !m.wip && m.offline).map((m, i) => {
    const c = dictionaries[lang].experiments.find((e) => e.slug === m.slug)!;
    return { slug: m.slug, title: c.title, description: c.description, color: m.color, href: m.href!, external: !!m.external, date: todayISO(), number: i + 1 };
  }).reverse();
}

/**
 * Načte feed z databáze. Chybu SCHVÁLNĚ nechytá — musí probublat ven z
 * unstable_cache, aby se selhání neuložilo. Náhradu řeší withFallback nad cachí.
 * Exportované kvůli testu, jinak to volá jen getPublicExperiments.
 */
export async function loadPublicExperiments(lang: "cs" | "en"): Promise<PublicExperiment[]> {
  const sql = getDb();
  await ensureSchema(sql);
  // Chronologicky (nejstarší první) kvůli číslování, pak otočíme → nejnovější nahoře.
  // Na preview/lokálně přidáme i drafty (stage <> 'idea'), ať jsou ve feedu k nalezení.
  const rows = (showDrafts()
    ? await sql`SELECT *, COALESCE(published_at, created_at::date)::text AS eff_date FROM experiments WHERE deleted = FALSE AND stage <> 'idea' ORDER BY COALESCE(published_at, created_at::date) ASC, sort_order ASC`
    : await sql`SELECT *, COALESCE(published_at, created_at::date)::text AS eff_date FROM experiments WHERE published = TRUE AND deleted = FALSE ORDER BY COALESCE(published_at, created_at::date) ASC, sort_order ASC`) as (ExperimentRow & { eff_date: string })[];
  const numbered = rows.map((r, i) => ({ slug: r.slug, title: lang === "cs" ? r.title_cs : r.title_en, description: lang === "cs" ? r.desc_cs : r.desc_en, color: r.color, href: r.href, external: r.external, date: r.eff_date, number: i + 1 }));
  return numbered.reverse();
}

// Cacheovaná verze pro veřejné stránky (homepage, archiv). Admin mutace shodí
// EXPERIMENTS_TAG → změny se projeví hned, revalidate je jen pojistka.
//
// withFallback je NAD cachí schválně: chyba tak probublá ven z cachované funkce
// a nic se neuloží. Kdyby byl catch uvnitř, zapamatovala by se náhrada na celých
// 600 s a jeden zádrhel by znamenal deset minut špatného obsahu.
export async function getPublicExperiments(lang: "cs" | "en"): Promise<PublicExperiment[]> {
  return withFallback(
    `public-experiments/${lang}`,
    () =>
      unstable_cache(
        () => loadPublicExperiments(lang),
        ["public-experiments", lang, showDrafts() ? "drafts" : "pub"],
        { tags: [EXPERIMENTS_TAG], revalidate: 600 },
      )(),
    () => staticFallback(lang),
  );
}

export async function isPublished(slug: string): Promise<boolean> {
  try {
    const sql = getDb();
    await ensureSchema(sql);
    const [row] = await sql`SELECT published, deleted FROM experiments WHERE slug = ${slug}` as { published: boolean; deleted: boolean }[];
    if (!row) return true; // neznámý slug → nech projít (fail open)
    return row.published && !row.deleted; // draft i smazané → zavřít
  } catch (e) {
    console.error("[db] isPublished selhalo, propouštím:", e);
    return true; // DB výpadek → nech projít (drafty chrání DRAFT_SLUGS)
  }
}

/** Hrefy smazaných experimentů — pro middleware (410 Gone). */
export async function getDeletedHrefs(): Promise<string[]> {
  try {
    const sql = getDb();
    await ensureSchema(sql);
    const rows = await sql`SELECT href FROM experiments WHERE deleted = TRUE` as { href: string }[];
    return rows.map((r) => r.href);
  } catch (e) {
    console.error("[db] getDeletedHrefs selhalo:", e);
    return [];
  }
}

/** Pro experiment routes: draft → 404 pro neadminy (na ostré). Na preview/lokálně projde. */
export async function guardExperiment(slug: string): Promise<void> {
  if (await isAdmin()) return;
  if (showDrafts()) return; // preview/dev: ukaž i drafty
  // Draft podle kódu → 404 i když je databáze dole (isPublished tam fail-open propouští).
  if (DRAFT_SLUGS.has(slug)) notFound();
  if (!(await isPublished(slug))) notFound();
}

/* ── Admin operace ─────────────────────────────────────────────── */
export async function getAllExperiments(): Promise<ExperimentRow[]> {
  const sql = getDb();
  await ensureSchema(sql);
  return await sql`SELECT * FROM experiments WHERE deleted = FALSE ORDER BY sort_order ASC` as ExperimentRow[];
}

export async function patchExperiment(slug: string, f: Partial<ExperimentRow>): Promise<void> {
  const sql = getDb();
  await ensureSchema(sql);
  const [cur] = await sql`SELECT * FROM experiments WHERE slug = ${slug}` as ExperimentRow[];
  if (!cur) return;
  const n = { ...cur, ...f };
  // stage je zdroj pravdy pro published (jen 'published' jde na web)
  if (f.stage) n.published = f.stage === "published";
  else if (f.published !== undefined) n.stage = f.published ? "published" : (cur.stage === "idea" ? "idea" : "draft");
  await sql`UPDATE experiments SET title_cs=${n.title_cs}, title_en=${n.title_en}, desc_cs=${n.desc_cs}, desc_en=${n.desc_en}, color=${n.color}, href=${n.href}, external=${n.external}, published=${n.published}, stage=${n.stage}, published_at=${n.published_at || null} WHERE slug=${slug}`;
  revalidateTag(EXPERIMENTS_TAG, "max");
}

export async function createExperiment(r: Omit<ExperimentRow, "sort_order" | "published_at" | "created_at" | "published"> & { published?: boolean }): Promise<void> {
  const sql = getDb();
  await ensureSchema(sql);
  const stage: Stage = r.stage ?? "idea";
  const published = stage === "published";
  const [{ max }] = await sql`SELECT COALESCE(MAX(sort_order), -1) AS max FROM experiments` as { max: number }[];
  await sql`INSERT INTO experiments (slug, title_cs, title_en, desc_cs, desc_en, color, href, external, sort_order, published, stage)
    VALUES (${r.slug}, ${r.title_cs}, ${r.title_en}, ${r.desc_cs}, ${r.desc_en}, ${r.color}, ${r.href}, ${r.external}, ${max + 1}, ${published}, ${stage})
    ON CONFLICT (slug) DO NOTHING`;
  revalidateTag(EXPERIMENTS_TAG, "max");
}

/** Volný slug pro nový nápad — slugifikuje titul, při kolizi přidá příponu. */
export async function uniqueSlug(base: string): Promise<string> {
  const sql = getDb();
  await ensureSchema(sql);
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
  await ensureSchema(sql);
  await sql`UPDATE experiments SET deleted = TRUE, published = FALSE WHERE slug = ${slug}`;
  revalidateTag(EXPERIMENTS_TAG, "max");
}

export async function reorderExperiments(order: string[]): Promise<void> {
  const sql = getDb();
  await ensureSchema(sql);
  await sql.transaction(order.map((slug, i) => sql`UPDATE experiments SET sort_order = ${i} WHERE slug = ${slug}`));
  revalidateTag(EXPERIMENTS_TAG, "max");
}
