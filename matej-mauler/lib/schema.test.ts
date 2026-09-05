import { beforeEach, describe, expect, it } from "vitest";
import { SCHEMA_VERSION, ensureSchema, isUndefinedTable, registerSchema, resetSchemaMemo } from "./schema";

/** Falešné sql: tagged template, které počítá dotazy a umí transaction(). */
function fakeSql(opts: { version?: number; selectError?: unknown } = {}) {
  const calls: string[] = [];
  const tx: unknown[][] = [];
  const sql = ((strings: TemplateStringsArray) => {
    const text = strings.join("?");
    calls.push(text);
    // Odmítáme jen ČTENÍ verze. Zápisy do schema_meta uvnitř migrate() se
    // předávají do transaction() a nikdo je neawaituje — odmítnout je by
    // vyrobilo unhandled rejection a zašumělo celou sadu.
    if (text.includes("schema_meta") && text.includes("SELECT")) {
      if (opts.selectError) return Promise.reject(opts.selectError);
      return Promise.resolve(opts.version === undefined ? [] : [{ v: opts.version }]);
    }
    return Promise.resolve([]);
  }) as unknown as {
    (s: TemplateStringsArray, ...v: unknown[]): Promise<unknown[]>;
    transaction: (q: unknown[]) => Promise<unknown>;
  };
  sql.transaction = (q: unknown[]) => { tx.push(q); return Promise.resolve(null); };
  return { sql, calls, tx };
}

const undefinedTable = Object.assign(new Error('relation "schema_meta" does not exist'), { code: "42P01" });

beforeEach(() => {
  resetSchemaMemo();
  registerSchema({ name: "test", statements: (sql) => [sql`CREATE TABLE IF NOT EXISTS t (a INT)`] });
});

describe("ensureSchema", () => {
  it("když verze sedí, položí jedinou otázku a nemigruje", async () => {
    const { sql, calls, tx } = fakeSql({ version: SCHEMA_VERSION });
    await ensureSchema(sql as never);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("schema_meta");
    expect(tx).toHaveLength(0);
  });

  it("podruhé se už neptá vůbec (paměť instance)", async () => {
    const { sql, calls } = fakeSql({ version: SCHEMA_VERSION });
    await ensureSchema(sql as never);
    await ensureSchema(sql as never);
    expect(calls).toHaveLength(1);
  });

  it("když verze nesedí, migruje v JEDNÉ dávce", async () => {
    const { sql, tx } = fakeSql({ version: SCHEMA_VERSION - 1 });
    await ensureSchema(sql as never);
    expect(tx).toHaveLength(1);
  });

  it("chybějící schema_meta (42P01) znamená první běh → migrace", async () => {
    const { sql, tx } = fakeSql({ selectError: undefinedTable });
    await ensureSchema(sql as never);
    expect(tx).toHaveLength(1);
  });

  it("chyba spojení NEMIGRUJE a propadne ven", async () => {
    const boom = Object.assign(new Error("fetch failed"), { code: "ETIMEDOUT" });
    const { sql, tx } = fakeSql({ selectError: boom });
    await expect(ensureSchema(sql as never)).rejects.toThrow("fetch failed");
    expect(tx).toHaveLength(0);
  });

  it("po neúspěchu si nezapamatuje, že je hotovo", async () => {
    const boom = Object.assign(new Error("fetch failed"), { code: "ETIMEDOUT" });
    const a = fakeSql({ selectError: boom });
    await expect(ensureSchema(a.sql as never)).rejects.toThrow();
    const b = fakeSql({ version: SCHEMA_VERSION });
    await ensureSchema(b.sql as never);
    expect(b.calls).toHaveLength(1);
  });
});

describe("isUndefinedTable", () => {
  it("pozná 42P01 a nic jiného", () => {
    expect(isUndefinedTable(undefinedTable)).toBe(true);
    expect(isUndefinedTable(new Error("cokoli"))).toBe(false);
    expect(isUndefinedTable(null)).toBe(false);
    expect(isUndefinedTable({ code: "42703" })).toBe(false);
  });
});

describe("registrace modulů", () => {
  it("moduly s DDL jsou zaregistrované", async () => {
    resetSchemaMemo();
    await import("./experimentsDb");
    await import("./siteTextsDb");
    const { registeredSchemas } = await import("./schema");
    const names = registeredSchemas().map((m) => m.name);
    expect(names).toContain("experiments");
    expect(names).toContain("site-texts");
  });
});
