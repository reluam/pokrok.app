import type { getDb } from "./db";

export type Sql = ReturnType<typeof getDb>;

/**
 * Verze schématu. Kdo změní DDL nebo seed kteréhokoli modulu, zvedne tohle
 * číslo — první instance po deploy schéma dorovná, ostatní jen přečtou verzi.
 */
export const SCHEMA_VERSION = 1;

export type SchemaModule = {
  name: string;
  /** DDL a seed toho modulu. Vrací pole dotazů, které se pošlou v jedné dávce. */
  statements: (sql: Sql) => unknown[];
};

const modules: SchemaModule[] = [];

/** Registrace při importu modulu. Idempotentní podle jména (kvůli HMR a testům). */
export function registerSchema(m: SchemaModule): void {
  const i = modules.findIndex((x) => x.name === m.name);
  if (i >= 0) modules[i] = m;
  else modules.push(m);
}

export function registeredSchemas(): readonly SchemaModule[] {
  return modules;
}

const UNDEFINED_TABLE = "42P01";

/** Postgres: relace neexistuje. Jen tohle znamená „ještě nemigrováno". */
export function isUndefinedTable(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: unknown }).code === UNDEFINED_TABLE;
}

let checked = false;

/** Jen pro testy — vynuluje paměť instance. */
export function resetSchemaMemo(): void {
  checked = false;
}

async function upToDate(sql: Sql): Promise<boolean> {
  try {
    const rows = (await sql`SELECT v FROM schema_meta WHERE k = 'version'`) as { v: number }[];
    return rows[0]?.v === SCHEMA_VERSION;
  } catch (e) {
    // Tabulka ještě není → první běh, migrujeme. Cokoli jiného (typicky
    // nedostupná databáze) musí ven — pouštět DDL do zdi nemá smysl.
    if (isUndefinedTable(e)) return false;
    throw e;
  }
}

async function migrate(sql: Sql): Promise<void> {
  const statements = [
    sql`CREATE TABLE IF NOT EXISTS schema_meta (k TEXT PRIMARY KEY, v INT NOT NULL)`,
    ...modules.flatMap((m) => m.statements(sql)),
    sql`INSERT INTO schema_meta (k, v) VALUES ('version', ${SCHEMA_VERSION})
        ON CONFLICT (k) DO UPDATE SET v = ${SCHEMA_VERSION}`,
  ];
  await sql.transaction(statements as never);
}

/**
 * Zaručí, že schéma odpovídá kódu. Šťastná cesta je JEDEN levný dotaz;
 * teprve když verze nesedí, jde do DB jedna dávka se vším DDL.
 */
export async function ensureSchema(sql: Sql): Promise<void> {
  if (checked) return;
  if (!(await upToDate(sql))) await migrate(sql);
  checked = true;
}
