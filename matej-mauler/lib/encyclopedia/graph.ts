import type { Lang } from "@/lib/dictionaries";
import type { Bilingual, NodeDef } from "./types";
import { NODES, SEEDS } from "./nodes";

export const getNode = (slug: string): NodeDef | null => NODES[slug] ?? null;

/** Všechny slugy, na které vede synapse, ale heslo neexistuje → červené odkazy. */
export function redLinks(): Set<string> {
  const refs = new Set<string>();
  for (const n of Object.values(NODES)) {
    if (n.up) refs.add(n.up);
    if (n.next) refs.add(n.next);
    for (const s of n.satellites ?? []) refs.add(s.to);
  }
  for (const s of Object.keys(SEEDS)) refs.add(s);
  return new Set([...refs].filter((s) => !NODES[s]));
}

export const isRedLink = (slug: string): boolean => !NODES[slug] && redLinks().has(slug);

const humanize = (slug: string) => {
  const t = slug.replace(/-/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Titul hesla — funguje i pro červené odkazy (SEEDS → popisek synapse → slug). */
export function titleOf(slug: string, lang: Lang): string {
  const n = NODES[slug];
  if (n) return n.title[lang];
  if (SEEDS[slug]) return SEEDS[slug][lang];
  for (const node of Object.values(NODES))
    for (const s of node.satellites ?? [])
      if (s.to === slug && s.label) return s.label[lang];
  return humanize(slug);
}

/* ── Hledání (klient-side, bez závislostí) ──────────────────────── */
export type SearchEntry = { slug: string; title: Bilingual; guide?: Bilingual; red: boolean };

export function searchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = Object.values(NODES).map((n) => ({ slug: n.slug, title: n.title, guide: n.guide, red: false }));
  for (const slug of redLinks()) {
    entries.push({ slug, title: { cs: titleOf(slug, "cs"), en: titleOf(slug, "en") }, red: true });
  }
  return entries;
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function searchNodes(query: string, lang: Lang, limit = 8): SearchEntry[] {
  const q = fold(query.trim());
  if (!q) return [];
  const scored: { e: SearchEntry; score: number }[] = [];
  for (const e of searchIndex()) {
    const title = fold(e.title[lang]), alt = fold(e.title[lang === "cs" ? "en" : "cs"]), slug = fold(e.slug);
    let score = -1;
    if (title.startsWith(q) || slug.startsWith(q)) score = 0;
    else if (title.includes(q) || alt.includes(q) || slug.includes(q)) score = 1;
    else if (e.guide && fold(e.guide[lang]).includes(q)) score = 2;
    if (score >= 0) scored.push({ e, score: score + (e.red ? 0.5 : 0) }); // hotová hesla před červenými
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.e).slice(0, limit);
}
