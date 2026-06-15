import { getDb } from "./db";

type Sql = ReturnType<typeof getDb>;

let ready = false;

async function ensure(sql: Sql) {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS site_counters (
    key TEXT PRIMARY KEY,
    value BIGINT NOT NULL DEFAULT 0
  )`;
  ready = true;
}

/** Atomicky +1 a vrátí novou hodnotu. První volání vrátí 1. Sdílené napříč experiences. */
export async function nextCount(key: string): Promise<number> {
  const sql = getDb();
  await ensure(sql);
  const rows = await sql`INSERT INTO site_counters (key, value) VALUES (${key}, 1)
    ON CONFLICT (key) DO UPDATE SET value = site_counters.value + 1
    RETURNING value` as { value: number | string }[];
  return Number(rows[0].value);
}

/** Aktuální stav počítadla (0, pokud ještě neexistuje). */
export async function getCount(key: string): Promise<number> {
  const sql = getDb();
  await ensure(sql);
  const rows = await sql`SELECT value FROM site_counters WHERE key = ${key}` as { value: number | string }[];
  return rows.length ? Number(rows[0].value) : 0;
}
