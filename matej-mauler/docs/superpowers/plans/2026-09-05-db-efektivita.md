# Práce s databází — implementační plán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Snížit provoz do Neonu z ~393 dotazů na jednotky tím, že správa schématu zmizí z request cesty — a zařídit, aby výpadek databáze netrval deset minut a nebyl tichý.

**Architecture:** `lib/schema.ts` drží `SCHEMA_VERSION` a jednu levnou kontrolu (`SELECT v FROM schema_meta`); DDL všech modulů se spustí jen když verze nesedí, a to v jedné dávce. `catch` se přesune nad `unstable_cache`, aby se selhání neukládalo. Draft slugy a offline fallback přestanou záviset na databázi.

**Tech Stack:** Next.js 16 (App Router), `@neondatabase/serverless` ^1.1.0, TypeScript, vitest.

**Spec:** `docs/superpowers/specs/2026-09-05-db-efektivita-design.md`

## Global Constraints

- **Žádný migration runner, žádné `.sql` soubory, žádná nová závislost.**
- **Veřejné podpisy se nemění:** `getPublicExperiments`, `isPublished`, `guardExperiment`, `getTextOverrides`.
- **`42P01` (undefined_table) → migruj. Jakákoli jiná chyba → propadni ven.** Nikdy nespouštět DDL do nedostupné databáze.
- **Chyby se logují**, nikdy nepolykají potichu (`console.error` s kontextem).
- **Commit message bez `Co-Authored-By`** — shazuje Vercel deploy (viz CLAUDE.md).
- Po každém tasku musí projít `npx vitest run`, `npx tsc --noEmit` a `npm run build`.

## Pořadí oproti specu

Spec navrhoval schéma první. Tenhle plán obrací pořadí: **Tasky 1 a 2 jdou první**,
protože jsou malé, nezávislé na zbytku a zastaví to, co bolí teď — `/life-manual`
je při výpadku veřejně otevřený a jeden zádrhel drží špatný obsah deset minut.

---

### Task 1: Drafty a offline fallback bez databáze

Dnes `isPublished()` při výpadku vrací `true` (fail open), takže `/about`,
`/decision-maker` a `/life-manual` jdou otevřít. A `staticFallback` vrací všech
osm experimentů z kódu bez ohledu na to, co je publikované.

**Files:**
- Modify: `lib/experiments.ts` (typ `ExperimentMeta`, položka `milans-world`)
- Modify: `lib/experimentsDb.ts` (`DRAFT_SLUGS`, `staticFallback`, `guardExperiment`)
- Test: `lib/experimentsDb.test.ts` (nový)

**Interfaces:**
- Produces: `DRAFT_SLUGS: ReadonlySet<string>` — exportovaný z `lib/experimentsDb.ts`
- Produces: `ExperimentMeta.offline?: true`

- [ ] **Step 1: Napsat padající test**

```ts
// lib/experimentsDb.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { experiments } from "./experiments";
import { DRAFT_SLUGS } from "./experimentsDb";

describe("drafty", () => {
  it("zná ty, které kód seeduje jako draft", () => {
    expect([...DRAFT_SLUGS].sort()).toEqual(["about", "decision-maker", "life-manual"]);
  });

  // Pojistka proti rozejití: seed je syrové SQL, DRAFT_SLUGS je konstanta.
  // Kdyby někdo přidal draft do seedu a zapomněl na konstantu, výpadek DB
  // by ho zveřejnil. Tenhle test to chytí.
  it("seznam sedí se seedem v SQL", () => {
    const src = readFileSync(new URL("./experimentsDb.ts", import.meta.url), "utf8");
    const seeded = [...src.matchAll(/VALUES \('([a-z0-9-]+)'/g)]
      .map((m) => m[1])
      .filter((slug) => {
        const at = src.indexOf(`VALUES ('${slug}'`);
        return src.slice(at, at + 900).includes("'draft'");
      });
    for (const slug of seeded) expect(DRAFT_SLUGS.has(slug)).toBe(true);
  });
});

describe("offline fallback", () => {
  it("označený je jen Milanův svět", () => {
    expect(experiments.filter((e) => e.offline).map((e) => e.slug)).toEqual(["milans-world"]);
  });

  it("každý offline experiment má href, není wip a má texty v obou jazycích", async () => {
    const { dictionaries } = await import("./dictionaries");
    for (const e of experiments.filter((x) => x.offline)) {
      expect(e.href).toBeTruthy();
      expect(e.wip).toBeFalsy();
      for (const l of ["cs", "en"] as const) {
        expect(dictionaries[l].experiments.find((x) => x.slug === e.slug)).toBeDefined();
      }
    }
  });
});
```

- [ ] **Step 2: Spustit test, ověřit, že padá**

Run: `npx vitest run lib/experimentsDb.test.ts`
Expected: FAIL — `DRAFT_SLUGS` neexistuje

- [ ] **Step 3: Přidat `offline` do katalogu**

V `lib/experiments.ts` do typu:

```ts
export type ExperimentMeta = {
  slug: string;
  emoji: string;
  color: string;
  href: string | null;
  size?: "wide";
  wip?: boolean;
  external?: boolean;
  /** Funguje i bez databáze → smí se ukázat, když je DB nedostupná. */
  offline?: true;
};
```

A k položce `milans-world` přidat `offline: true` (běží čistě v prohlížeči).

- [ ] **Step 4: Draft slugy a fallback v `lib/experimentsDb.ts`**

Nad `staticFallback` přidat:

```ts
/**
 * Experimenty, které se seedují jako draft. Musí sedět se seedem v ensure()
 * níž — hlídá to test. Je to v kódu schválně: na rozhodnutí „tohle není ke
 * zveřejnění" nesmí být potřeba databáze, jinak ji výpadek zveřejní.
 */
export const DRAFT_SLUGS: ReadonlySet<string> = new Set(["about", "decision-maker", "life-manual"]);
```

`staticFallback` filtrovat na `offline`:

```ts
// Náhradní feed, když je databáze nedostupná. Jen experimenty, které bez ní
// fungují — radši jedna živá karta než sedm mrtvých.
function staticFallback(lang: "cs" | "en"): PublicExperiment[] {
  return STATIC.filter((m) => m.href && !m.wip && m.offline).map((m, i) => {
    const c = dictionaries[lang].experiments.find((e) => e.slug === m.slug)!;
    return { slug: m.slug, title: c.title, description: c.description, color: m.color, href: m.href!, external: !!m.external, date: todayISO(), number: i + 1 };
  }).reverse();
}
```

A `guardExperiment` rozhodne o draftu bez DB:

```ts
/** Pro experiment routes: draft → 404 pro neadminy (na ostré). Na preview/lokálně projde. */
export async function guardExperiment(slug: string): Promise<void> {
  if (await isAdmin()) return;
  if (showDrafts()) return; // preview/dev: ukaž i drafty
  // Draft podle kódu → 404 i když je databáze dole (isPublished tam fail-open propouští).
  if (DRAFT_SLUGS.has(slug)) notFound();
  if (!(await isPublished(slug))) notFound();
}
```

- [ ] **Step 5: Spustit testy a build**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: vše projde

- [ ] **Step 6: Commit**

```bash
git add lib/experiments.ts lib/experimentsDb.ts lib/experimentsDb.test.ts
git commit -m "fix(db): drafty a offline fallback nezávisí na databázi"
```

---

### Task 2: Selhání se nesmí uložit do cache

`loadPublicExperiments` má `try/catch` **uvnitř** funkce, kterou obaluje
`unstable_cache`. Fallback se tím uloží na 10 minut a chyba zmizí beze stopy —
proto byly ve Vercelu vidět jen chyby `site-texts` (ty catch uvnitř nemají).

**Files:**
- Create: `lib/dbFallback.ts`
- Test: `lib/dbFallback.test.ts`
- Modify: `lib/experimentsDb.ts` (`loadPublicExperiments`, `getPublicExperiments`, `isPublished`, `getDeletedHrefs`)

**Interfaces:**
- Produces: `withFallback<T>(what: string, load: () => Promise<T>, fallback: () => T): Promise<T>`

- [ ] **Step 1: Napsat padající test**

```ts
// lib/dbFallback.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { withFallback } from "./dbFallback";

afterEach(() => vi.restoreAllMocks());

describe("withFallback", () => {
  it("vrací výsledek, když loader projde", async () => {
    expect(await withFallback("test", async () => "ok", () => "náhrada")).toBe("ok");
  });

  it("při selhání vrátí náhradu", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await withFallback("test", async () => { throw new Error("DB dole"); }, () => "náhrada");
    expect(r).toBe("náhrada");
  });

  it("selhání zaloguje i s kontextem — nesmí zmizet potichu", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await withFallback("public-experiments", async () => { throw new Error("DB dole"); }, () => null);
    expect(spy).toHaveBeenCalledOnce();
    expect(String(spy.mock.calls[0][0])).toContain("public-experiments");
  });

  it("náhradu volá až při selhání, ne dopředu", async () => {
    const fb = vi.fn(() => "náhrada");
    await withFallback("test", async () => "ok", fb);
    expect(fb).not.toHaveBeenCalled();
  });
});
```

Ke spec požadavku „selhání se neuloží" patří ještě jeden test — že `loadPublicExperiments`
chybu **vyhodí** místo aby vrátil náhradu. To je ta vlastnost, na které celá věc stojí:
kdyby náhradu vracel, uložila by se do cache. Do `lib/experimentsDb.test.ts` (z Tasku 1)
přidat:

```ts
import { loadPublicExperiments } from "./experimentsDb";

describe("načtení feedu", () => {
  it("při nedostupné DB chybu vyhodí, nevrací náhradu — jinak by se náhrada uložila do cache", async () => {
    const old = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgres://u:p@127.0.0.1:1/nope";
    const { resetDb } = await import("./db");
    resetDb?.();
    await expect(loadPublicExperiments("en")).rejects.toBeDefined();
    process.env.DATABASE_URL = old;
    resetDb?.();
  });
});
```

`loadPublicExperiments` je dnes modul-privátní — v Tasku 2 se u ní doplní `export`
(používá ji jen `getPublicExperiments`, takže je to bez dopadu na volající).
`resetDb` vzniká až v Tasku 6; do té doby volání přes `?.()` nic neudělá.

- [ ] **Step 2: Spustit test, ověřit, že padá**

Run: `npx vitest run lib/dbFallback.test.ts`
Expected: FAIL — modul neexistuje

- [ ] **Step 3: Implementovat**

```ts
// lib/dbFallback.ts
/**
 * Zavolá loader; když selže, zaloguje a vrátí náhradu.
 *
 * Volá se **až NAD** unstable_cache, nikdy uvnitř. Kdyby byl catch uvnitř
 * cachované funkce, uložila by se do cache náhrada a držela by se tam celý
 * revalidate interval — jeden zádrhel by znamenal deset minut špatného obsahu.
 * Takhle se chyba nikam neuloží a další požadavek to zkusí znovu.
 */
export async function withFallback<T>(
  what: string,
  load: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  try {
    return await load();
  } catch (e) {
    console.error(`[db] ${what} selhalo, servíruju náhradu:`, e);
    return fallback();
  }
}
```

- [ ] **Step 4: Spustit test, ověřit, že prochází**

Run: `npx vitest run lib/dbFallback.test.ts`
Expected: PASS (4 testy)

- [ ] **Step 5: Přesunout catch nad cache**

V `lib/experimentsDb.ts` z `loadPublicExperiments` **odstranit** `try`/`catch`
(tělo zůstává, jen bez obalu) a `getPublicExperiments` přepsat:

```ts
// Cacheovaná verze pro veřejné stránky (homepage, archiv). Chyba z cachované
// funkce probublá ven, takže se selhání NEULOŽÍ — náhradu řeší withFallback nad ní.
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
```

Přidat `import { withFallback } from "./dbFallback";`.

Zbylé tiché catche v témže souboru dostanou log (chování se nemění):

```ts
  } catch (e) {
    console.error("[db] isPublished selhalo, propouštím:", e);
    return true; // DB výpadek → nech projít (drafty chrání DRAFT_SLUGS)
  }
```

```ts
  } catch (e) {
    console.error("[db] getDeletedHrefs selhalo:", e);
    return [];
  }
```

- [ ] **Step 6: Ověřit**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: vše projde

- [ ] **Step 7: Commit**

```bash
git add lib/dbFallback.ts lib/dbFallback.test.ts lib/experimentsDb.ts
git commit -m "fix(db): selhání se neukládá do cache a přestalo být tiché"
```

---

### Task 3: `lib/schema.ts` — jedna otázka místo dvaceti čtyř

Zatím to nic nepoužívá; převod modulů je Task 4 a 5.

**Files:**
- Create: `lib/schema.ts`
- Test: `lib/schema.test.ts`

**Interfaces:**
- Produces: `SCHEMA_VERSION: number`
- Produces: `type Sql = ReturnType<typeof getDb>`
- Produces: `type SchemaModule = { name: string; statements: (sql: Sql) => unknown[] }`
- Produces: `registerSchema(m: SchemaModule): void`
- Produces: `ensureSchema(sql: Sql): Promise<void>`
- Produces: `isUndefinedTable(e: unknown): boolean`
- Produces: `resetSchemaMemo(): void` — jen pro testy

- [ ] **Step 1: Napsat padající test**

```ts
// lib/schema.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SCHEMA_VERSION, ensureSchema, isUndefinedTable, registerSchema, resetSchemaMemo } from "./schema";

/** Falešné sql: tagged template, které počítá dotazy a umí transaction(). */
function fakeSql(opts: { version?: number; selectError?: unknown } = {}) {
  const calls: string[] = [];
  const tx: unknown[][] = [];
  const sql = ((strings: TemplateStringsArray) => {
    const text = strings.join("?");
    calls.push(text);
    if (text.includes("schema_meta")) {
      if (opts.selectError) return Promise.reject(opts.selectError);
      return Promise.resolve(opts.version === undefined ? [] : [{ v: opts.version }]);
    }
    return Promise.resolve([]);
  }) as never as { (s: TemplateStringsArray): Promise<unknown[]>; transaction: (q: unknown[]) => Promise<unknown> };
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
```

- [ ] **Step 2: Spustit test, ověřit, že padá**

Run: `npx vitest run lib/schema.test.ts`
Expected: FAIL — modul neexistuje

- [ ] **Step 3: Implementovat**

```ts
// lib/schema.ts
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
```

- [ ] **Step 4: Spustit test, ověřit, že prochází**

Run: `npx vitest run lib/schema.test.ts`
Expected: PASS (8 testů)

- [ ] **Step 5: Ověřit, že driver zvládne DDL v `transaction()`**

Spec tuhle věc označuje jako neověřenou. Ověření proti skutečnému Neonu:

```bash
node --input-type=module -e '
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
await sql.transaction([
  sql`CREATE TABLE IF NOT EXISTS _tx_probe (a INT)`,
  sql`INSERT INTO _tx_probe (a) VALUES (1) ON CONFLICT DO NOTHING`,
  sql`DROP TABLE _tx_probe`,
]);
console.log("DDL v transaction() projde");
'
```

Expected: vypíše „DDL v transaction() projde".
**Pokud to selže:** `migrate()` místo `sql.transaction()` pošle jeden
multi-statement řetězec přes `sql.query(text)`. Podstatný je jeden round-trip,
ne konkrétní API — a testy z kroku 1 platí dál, jen `fakeSql` bude počítat
volání `query` místo `transaction`.

Pozn.: `DATABASE_URL` lokálně není. Krok se dá spustit až v prostředí, kde je —
nebo ho odložit a ověřit po nasazení podle Tasku 7.

- [ ] **Step 6: Commit**

```bash
git add lib/schema.ts lib/schema.test.ts
git commit -m "feat(db): verzované schéma — jedna levná kontrola místo DDL série"
```

---

### Task 4: Převést `experimentsDb` a `siteTextsDb`

Dva moduly, které se dotýkají homepage — a tedy skoro každého požadavku.
`experimentsDb.ensure()` má 21 příkazů, `siteTextsDb.ensure()` tři.

**Files:**
- Modify: `lib/experimentsDb.ts` (`ensure` → `export const schema` + `registerSchema`)
- Modify: `lib/siteTextsDb.ts` (totéž)
- Test: `lib/schema.test.ts` (doplnit registraci)

**Interfaces:**
- Consumes: `registerSchema`, `ensureSchema`, `Sql` z Tasku 3

- [ ] **Step 1: Doplnit test na registraci**

Do `lib/schema.test.ts` přidat:

```ts
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
```

- [ ] **Step 2: Spustit, ověřit, že padá**

Run: `npx vitest run lib/schema.test.ts`
Expected: FAIL — `experiments` mezi registrovanými není

- [ ] **Step 3: Převést `siteTextsDb` (ten menší první)**

Nahradit `let ready` a `async function ensure(sql)` za:

```ts
import { ensureSchema, registerSchema, type Sql } from "./schema";

registerSchema({
  name: "site-texts",
  statements: (sql) => [
    sql`CREATE TABLE IF NOT EXISTS site_texts (
      key TEXT NOT NULL,
      lang TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (key, lang)
    )`,
  ],
});
```

Všechna volání `await ensure(sql)` v souboru nahradit za `await ensureSchema(sql)`.
Lokální `type Sql = ReturnType<typeof getDb>` smazat — bere se z `./schema`.

- [ ] **Step 4: Převést `experimentsDb`**

Totéž: tělo `ensure()` (všech 21 příkazů, beze změny obsahu) se přesune do
`statements: (sql) => [ … ]` pod `registerSchema({ name: "experiments", … })`,
`let ready` zmizí a `await ensure(sql)` → `await ensureSchema(sql)` na všech
devíti místech.

**Pozor:** seed `life-manual` / `about` / `decision-maker` musí zůstat slovo od
slova stejný — `DRAFT_SLUGS` z Tasku 1 na něj spoléhá a test to hlídá.

- [ ] **Step 5: Ověřit**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: vše projde; test „seznam sedí se seedem v SQL" z Tasku 1 musí platit dál

- [ ] **Step 6: Commit**

```bash
git add lib/experimentsDb.ts lib/siteTextsDb.ts lib/schema.test.ts
git commit -m "refactor(db): experiments a site-texts přes verzované schéma"
```

---

### Task 5: Převést zbývajících sedm modulů

`accountsDb` (21 příkazů), `brainDb` (12), `commentsDb` (5), `counterDb` (3),
`metricsDb` (3), `ratingsDb` (3), `songsDb` (8) a `lib/vvvSchema.ts` (4).

**Files:**
- Modify: `lib/accountsDb.ts`, `lib/brainDb.ts`, `lib/commentsDb.ts`, `lib/counterDb.ts`, `lib/metricsDb.ts`, `lib/ratingsDb.ts`, `lib/songsDb.ts`, `lib/vvvSchema.ts`
- Test: `lib/schema.test.ts`

- [ ] **Step 1: Rozšířit test o všechny moduly**

V `lib/schema.test.ts` nahradit test z Tasku 4 za:

```ts
describe("registrace modulů", () => {
  it("všechny moduly s DDL jsou zaregistrované", async () => {
    resetSchemaMemo();
    for (const m of ["experimentsDb", "siteTextsDb", "accountsDb", "brainDb",
                     "commentsDb", "counterDb", "metricsDb", "ratingsDb",
                     "songsDb", "vvvSchema"]) {
      await import(`./${m}`);
    }
    const { registeredSchemas } = await import("./schema");
    expect(registeredSchemas().map((m) => m.name).sort()).toEqual([
      "accounts", "brain", "comments", "counter", "experiments",
      "metrics", "ratings", "site-texts", "songs", "vvv",
    ]);
  });

  it("žádný modul neregistruje prázdné schéma", async () => {
    const { registeredSchemas } = await import("./schema");
    const fake = (() => Promise.resolve([])) as never;
    for (const m of registeredSchemas()) expect(m.statements(fake).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Spustit, ověřit, že padá**

Run: `npx vitest run lib/schema.test.ts`
Expected: FAIL — chybí osm jmen

- [ ] **Step 3: Převést moduly po jednom**

Mechanická úprava, pro každý soubor stejná. Vzor na `lib/ratingsDb.ts` — ostatní
se liší jen jménem a obsahem DDL.

**Před:**

```ts
import { getDb } from "./db";
type Sql = ReturnType<typeof getDb>;

let ready = false;

async function ensure(sql: Sql) {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS ratings ( … )`;
  await sql`CREATE INDEX IF NOT EXISTS ratings_page_idx ON ratings (page)`;
  ready = true;
}

export async function getRatings(page: string, userId?: string) {
  const sql = getDb();
  await ensure(sql);
  …
}
```

**Po:**

```ts
import { getDb } from "./db";
import { ensureSchema, registerSchema } from "./schema";

registerSchema({
  name: "ratings",
  statements: (sql) => [
    sql`CREATE TABLE IF NOT EXISTS ratings ( … )`,
    sql`CREATE INDEX IF NOT EXISTS ratings_page_idx ON ratings (page)`,
  ],
});

export async function getRatings(page: string, userId?: string) {
  const sql = getDb();
  await ensureSchema(sql);
  …
}
```

Tedy: `let ready` a celá funkce `ensure` zmizí, její `await sql\`…\`` příkazy se
stanou položkami pole `statements` (beze změny obsahu, jen bez `await`), lokální
`type Sql` se smaže a každé `await ensure(sql)` se přepíše na `await ensureSchema(sql)`.

Jména modulů musí sedět s testem z kroku 1: `accounts`, `brain`, `comments`,
`counter`, `metrics`, `ratings`, `songs`, `vvv`.

`lib/vvvSchema.ts` exportuje `ensureVvvSchema(sql)`, kterou volá `app/vvv/page.tsx`.
Ta zůstane jako tenký obal, aby se volající nemusel měnit:

```ts
/** Zachováno kvůli app/vvv/page.tsx — schéma dnes řeší ensureSchema pro všechny naráz. */
export const ensureVvvSchema = (sql: Sql) => ensureSchema(sql);
```

- [ ] **Step 4: Ověřit**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: vše projde

- [ ] **Step 5: Commit**

```bash
git add lib/*.ts
git commit -m "refactor(db): zbylých osm modulů přes verzované schéma"
```

---

### Task 6: `getDb()` — klient jednou za instanci

`getDb()` se v repu volá 61× a pokaždé staví nový `neon()` klient.

**Files:**
- Modify: `lib/db.ts`
- Test: `lib/db.test.ts` (nový)

- [ ] **Step 1: Napsat padající test**

```ts
// lib/db.test.ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const OLD = process.env.DATABASE_URL;
beforeEach(() => { process.env.DATABASE_URL = "postgres://u:p@example.test/db"; });
afterEach(() => { process.env.DATABASE_URL = OLD; });

describe("getDb", () => {
  it("vrací tentýž klient, nestaví nový při každém volání", async () => {
    const { getDb } = await import("./db");
    expect(getDb()).toBe(getDb());
  });

  it("bez DATABASE_URL sroluje s jasnou hláškou", async () => {
    delete process.env.DATABASE_URL;
    const { getDb, resetDb } = await import("./db");
    resetDb();
    expect(() => getDb()).toThrow("DATABASE_URL");
  });
});
```

- [ ] **Step 2: Spustit, ověřit, že padá**

Run: `npx vitest run lib/db.test.ts`
Expected: FAIL — `getDb()` vrací pokaždé jiný objekt

- [ ] **Step 3: Implementovat**

```ts
// lib/db.ts
import { neon } from "@neondatabase/serverless";

// Klient se staví jednou za instanci. Driver jede přes HTTP, takže nedrží
// spojení — ale stavět ho při každém z 61 volání je zbytečná práce navíc.
let client: ReturnType<typeof neon> | null = null;
let builtFrom: string | null = null;

/** Jen pro testy — zahodí zapamatovaného klienta. */
export function resetDb(): void {
  client = null;
  builtFrom = null;
}

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!client || builtFrom !== url) {
    client = neon(url);
    builtFrom = url;
  }
  return client;
}
```

- [ ] **Step 4: Ověřit**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: vše projde

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts lib/db.test.ts
git commit -m "perf(db): neon klient jednou za instanci místo při každém volání"
```

---

### Task 7: Ověření na produkci a úprava CLAUDE.md

Testy neřeknou, jestli DDL z Neonu zmizelo. To řekne až Neon.

**Files:**
- Modify: `matej-mauler/CLAUDE.md`

- [ ] **Step 1: Upravit konvenci v CLAUDE.md**

Nahradit větu o přístupu k DB:

```diff
-DB access = lazy `CREATE TABLE IF NOT EXISTS` inside `lib/*Db.ts` via an
-`ensure(sql)` gate (no migration runner).
+DB access: každý `lib/*Db.ts` registruje své DDL přes `registerSchema()`
+a dotazy volají `ensureSchema(sql)`. Ta položí jeden levný dotaz na
+`schema_meta`; DDL se spustí jen když `SCHEMA_VERSION` v `lib/schema.ts`
+nesedí, a to v jedné dávce. **Kdo změní DDL nebo seed, zvedne
+`SCHEMA_VERSION`** — jinak se změna na produkci neprojeví.
+Pořád žádný migration runner.
```

- [ ] **Step 2: Nasadit a nechat pár minut běžet**

Po merge do `main` a deploy: otevřít homepage a dvě tři experience.

- [ ] **Step 3: Zkontrolovat Neon**

V Neon dashboardu → Monitoring → seznam dotazů. Kontrola:

| dotaz | před | musí být po |
|---|---|---|
| `CREATE TABLE IF NOT EXISTS experiments` | 12 | **0** |
| `INSERT INTO experiments … ON CONFLICT` | 72 | **0** |
| `ALTER TABLE … ADD COLUMN` | 6–11 | **0** |
| `RESET ALL` (dotazů celkem) | 393 | jednotky |

Musí naopak přibýt `SELECT v FROM schema_meta` — nejvýš pár volání.

**Když se DDL objevuje dál:** buď se nezvedla `SCHEMA_VERSION`, nebo `migrate()`
padá a `checked` se nenastaví. Runtime chyby ve Vercelu to po Tasku 2 ukážou.

- [ ] **Step 4: Commit**

```bash
git add matej-mauler/CLAUDE.md
git commit -m "docs: konvence přístupu k DB — verzované schéma místo lazy ensure"
```

---

## Co plán vědomě nedělá

- **Neřeší autosuspend Neonu.** S jedním dotazem místo dvaceti čtyř by probuzení
  mělo přežít; kdyby ne, je to nastavení na jejich straně, ne kód.
- **Nevrací homepage do statické cache.** Správný `<html lang>` má přednost.
- **Nemění cachovací strategii** — `unstable_cache` + `revalidateTag` zůstává,
  mění se jen to, co se do ní smí uložit.
