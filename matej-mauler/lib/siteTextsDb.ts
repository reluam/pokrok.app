import { getDb } from "./db";
import type { Dictionary, Lang } from "./dictionaries";
import { unstable_cache, revalidateTag } from "next/cache";
import { TEXT_GROUPS } from "./siteTextsShared";

type Sql = ReturnType<typeof getDb>;

// Cache textových overridů homepage. setTexts ji shodí → změny v adminu hned, jinak instant.
const TEXTS_TAG = "site-texts";

// Re-export pro serverové konzumenty; klient ať importuje rovnou ze siteTextsShared.
export { TEXT_GROUPS };

let ready = false;

async function ensure(sql: Sql) {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS site_texts (
    key TEXT NOT NULL,
    lang TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (key, lang)
  )`;
  ready = true;
}

async function loadTextOverrides(lang: Lang): Promise<Record<string, string>> {
  const sql = getDb();
  await ensure(sql);
  const rows = await sql`SELECT key, value FROM site_texts WHERE lang = ${lang}` as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getTextOverrides(lang: Lang): Promise<Record<string, string>> {
  return unstable_cache(
    () => loadTextOverrides(lang),
    ["site-texts", lang],
    { tags: [TEXTS_TAG], revalidate: 600 },
  )();
}

/** value = null/prázdné → smazat override (vrátí se default ze slovníku). */
export async function setTexts(items: { key: string; lang: Lang; value: string | null }[]): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  const allowed = new Set(TEXT_GROUPS.flatMap((g) => g.keys));
  for (const it of items) {
    if (!allowed.has(it.key) || (it.lang !== "cs" && it.lang !== "en")) continue;
    const v = (it.value ?? "").trim();
    if (!v) await sql`DELETE FROM site_texts WHERE key = ${it.key} AND lang = ${it.lang}`;
    else await sql`INSERT INTO site_texts (key, lang, value) VALUES (${it.key}, ${it.lang}, ${v})
      ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
  }
  revalidateTag(TEXTS_TAG, "max");
}

/** Naroubuje overridy na slovník (deep copy, tečková cesta klíče). */
export function applyTextOverrides(dict: Dictionary, overrides: Record<string, string>): Dictionary {
  const entries = Object.entries(overrides);
  if (entries.length === 0) return dict;
  const out = structuredClone(dict) as unknown as Record<string, unknown>;
  for (const [path, value] of entries) {
    const parts = path.split(".");
    let cur: Record<string, unknown> = out;
    let okPath = true;
    for (let i = 0; i < parts.length - 1; i++) {
      const next = cur[parts[i]];
      if (typeof next !== "object" || next === null) { okPath = false; break; }
      cur = next as Record<string, unknown>;
    }
    if (okPath) cur[parts[parts.length - 1]] = value;
  }
  return out as unknown as Dictionary;
}
