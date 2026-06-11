import { getDb } from "./db";

type Sql = ReturnType<typeof getDb>;

export type BrainWord = { id: number; display: string };
export type BrainStats = { words: number; edges: number; total: number; goal: number };
export type BrainMapData = {
  total: number;
  goal: number;
  nodes: { id: number; label: string; seed: boolean }[];
  edges: { a: number; b: number; count: number }[]; // a → b (směr asociace)
  truncated: boolean;
};

/** Kolik asociací mozek potřebuje, aby mapa pro Researchera začala dávat smysl. */
export const BRAIN_GOAL = 5000;

// Startovní slova — bez nich by Explorer neměl na co asociovat.
const SEEDS = [
  "špagety", "slunce", "hudba", "strach", "domov", "káva", "vesmír", "čas",
  "peníze", "láska", "les", "moře", "sen", "kniha", "pondělí", "léto",
  "zima", "pes", "kočka", "město", "noc", "světlo", "ticho", "barva",
  "jablko", "chleba", "voda", "oheň", "vítr", "hora", "cesta", "hra",
  "práce", "škola", "dětství", "budoucnost", "robot", "internet", "telefon", "hvězda",
  "měsíc", "smích", "tanec", "klíč", "zrcadlo", "vlak", "déšť", "svoboda",
];

/**
 * Normalizace slova: malá písmena, jedna mezera, ořez interpunkce na okrajích.
 * Vrací null, pokud vstup nedává smysl jako asociace (moc dlouhé, bez písmen, URL…).
 */
export function normalizeWord(raw: string): string | null {
  let s = raw.normalize("NFC").replace(/\s+/g, " ").trim().toLocaleLowerCase("cs");
  s = s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  if (!s || s.length > 40) return null;
  if (!/\p{L}/u.test(s)) return null;
  if (s.split(" ").length > 3) return null;
  if (/https?:|www\.|@/.test(s)) return null;
  return s;
}

let ready = false;

async function ensure(sql: Sql) {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS brain_words (
    id SERIAL PRIMARY KEY,
    word TEXT UNIQUE NOT NULL,
    display TEXT NOT NULL,
    is_seed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS brain_edges (
    from_id INT NOT NULL REFERENCES brain_words(id) ON DELETE CASCADE,
    to_id INT NOT NULL REFERENCES brain_words(id) ON DELETE CASCADE,
    count INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (from_id, to_id)
  )`;
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM brain_words WHERE is_seed` as { n: number }[];
  if (n === 0) {
    for (const w of SEEDS) {
      const word = normalizeWord(w);
      if (!word) continue;
      await sql`INSERT INTO brain_words (word, display, is_seed) VALUES (${word}, ${word}, TRUE)
        ON CONFLICT (word) DO UPDATE SET is_seed = TRUE`;
    }
  }
  ready = true;
}

/** Náhodné slovo k asociování (volitelně jiné než `notId`). */
export async function randomWord(notId?: number): Promise<BrainWord | null> {
  const sql = getDb();
  await ensure(sql);
  const rows = await sql`SELECT id, display FROM brain_words WHERE id <> ${notId ?? -1} ORDER BY random() LIMIT 1` as BrainWord[];
  return rows[0] ?? null;
}

export type AssociateResult =
  | { ok: true; from: BrainWord; to: BrainWord; count: number; total: number }
  | { ok: false; error: "unknown-from" | "invalid" | "same" };

/** Uloží asociaci from → to. Existující synapsi posílí (count + 1). */
export async function associate(fromId: number, toRaw: string): Promise<AssociateResult> {
  const sql = getDb();
  await ensure(sql);

  const [from] = await sql`SELECT id, word, display FROM brain_words WHERE id = ${fromId}` as { id: number; word: string; display: string }[];
  if (!from) return { ok: false, error: "unknown-from" };

  const word = normalizeWord(toRaw);
  if (!word) return { ok: false, error: "invalid" };
  if (word === from.word) return { ok: false, error: "same" };

  // Display = vstup očištěný stejně jako word, ale se zachovanou velikostí písmen.
  const display = raw2display(toRaw) || word;

  const [to] = await sql`INSERT INTO brain_words (word, display) VALUES (${word}, ${display})
    ON CONFLICT (word) DO UPDATE SET word = EXCLUDED.word
    RETURNING id, display` as BrainWord[];

  const [edge] = await sql`INSERT INTO brain_edges (from_id, to_id) VALUES (${from.id}, ${to.id})
    ON CONFLICT (from_id, to_id) DO UPDATE SET count = brain_edges.count + 1, updated_at = NOW()
    RETURNING count` as { count: number }[];

  const [{ total }] = await sql`SELECT COALESCE(SUM(count), 0)::int AS total FROM brain_edges` as { total: number }[];

  return { ok: true, from: { id: from.id, display: from.display }, to, count: edge.count, total };
}

function raw2display(raw: string): string {
  return raw.normalize("NFC").replace(/\s+/g, " ").trim()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
    .slice(0, 40);
}

export async function getBrainStats(): Promise<BrainStats> {
  const sql = getDb();
  await ensure(sql);
  const [row] = await sql`SELECT
    (SELECT COUNT(*)::int FROM brain_words) AS words,
    (SELECT COUNT(*)::int FROM brain_edges) AS edges,
    (SELECT COALESCE(SUM(count), 0)::int FROM brain_edges) AS total` as { words: number; edges: number; total: number }[];
  return { ...row, goal: BRAIN_GOAL };
}

/** Mapa pro Researchera: nejsilnější synapse + jejich slova. */
export async function getBrainMap(maxEdges = 600): Promise<BrainMapData> {
  const sql = getDb();
  await ensure(sql);
  const edges = await sql`SELECT from_id AS a, to_id AS b, count FROM brain_edges
    ORDER BY count DESC, updated_at DESC LIMIT ${maxEdges + 1}` as { a: number; b: number; count: number }[];
  const truncated = edges.length > maxEdges;
  if (truncated) edges.pop();

  const ids = [...new Set(edges.flatMap((e) => [e.a, e.b]))];
  const nodes = ids.length
    ? await sql`SELECT id, display AS label, is_seed AS seed FROM brain_words WHERE id = ANY(${ids})` as { id: number; label: string; seed: boolean }[]
    : [];

  const [{ total }] = await sql`SELECT COALESCE(SUM(count), 0)::int AS total FROM brain_edges` as { total: number }[];
  return { total, goal: BRAIN_GOAL, nodes, edges, truncated };
}

/* ── Admin (moderace) ──────────────────────────────────────────── */
export type AdminBrainWord = {
  id: number; display: string; is_seed: boolean; created_at: string;
  out_n: number; in_n: number; strength: number;
};

export async function adminListWords(q = ""): Promise<AdminBrainWord[]> {
  const sql = getDb();
  await ensure(sql);
  const like = `%${q.trim().toLocaleLowerCase("cs")}%`;
  return await sql`SELECT w.id, w.display, w.is_seed, w.created_at::text AS created_at,
      COALESCE(o.n, 0)::int AS out_n, COALESCE(i.n, 0)::int AS in_n,
      (COALESCE(o.s, 0) + COALESCE(i.s, 0))::int AS strength
    FROM brain_words w
    LEFT JOIN (SELECT from_id, COUNT(*) AS n, SUM(count) AS s FROM brain_edges GROUP BY from_id) o ON o.from_id = w.id
    LEFT JOIN (SELECT to_id, COUNT(*) AS n, SUM(count) AS s FROM brain_edges GROUP BY to_id) i ON i.to_id = w.id
    WHERE w.word LIKE ${like}
    ORDER BY strength DESC, w.created_at DESC
    LIMIT 300` as AdminBrainWord[];
}

/** Smaže slovo i všechny jeho synapse (FK kaskáda). */
export async function adminDeleteWord(id: number): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  await sql`DELETE FROM brain_words WHERE id = ${id}`;
}
