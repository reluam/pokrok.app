# Práce s databází — schéma ven z request cesty

Datum: 2026-09-05

## Cíl

Přestat při každém studeném startu posílat do Neonu dvacet čtyři DDL příkazů,
které nic nedělají. Cílem je, aby běžný požadavek databázi buď nesáhl vůbec
(cache), nebo jí položil právě tolik otázek, kolik potřebuje na data.

Vedlejší, ale stejně důležité: **výpadek databáze nesmí trvat deset minut** a
nesmí být tichý.

## Východisko: co ukázala měření

Z Neon dashboardu (5. 9. 2026, provoz jednoho člověka procházejícího web):

| dotaz | volání | poznámka |
|---|---|---|
| `RESET ALL` | **393** | tolik dotazů celkem šlo do DB |
| `INSERT INTO experiments … ON CONFLICT DO NOTHING` | **72** | seed, který nic nemění |
| `CREATE TABLE IF NOT EXISTS experiments` | **12** | tabulka dávno existuje |
| `ALTER TABLE experiments ADD COLUMN … published_at` | 11 | sloupec dávno existuje |
| `ALTER TABLE brain_words ADD COLUMN … lang` | 6 | 1 s celkem — nejpomalejší dotaz webu |

**Naprostá většina provozu je správa schématu, ne data.**

Příčina: devět modulů (`accountsDb`, `brainDb`, `commentsDb`, `counterDb`,
`experimentsDb`, `metricsDb`, `ratingsDb`, `siteTextsDb`, `songsDb`) má každý
vlastní `ensure()` s vlastní DDL sérií a vlastním `let ready = false`. Ten
příznak žije **v paměti instance**, takže každá studená serverless instance
zaplatí za každý modul, kterého se dotkne. Samotný `experimentsDb.ensure()` má
21 příkazů, `siteTextsDb` tři.

K tomu se váže výpadek z 5. 9.: Neon endpoint je podle monitoringu většinu času
uspaný (autosuspend). Probuzení plus 24 sekvenčních round-tripů se občas nevejde
do timeoutu → `NeonDbError: fetch failed / ETIMEDOUT`.

**Kvóta ani suspendovaný projekt to nebyly** — 3,16 ze 100 CU-hrs, 0,03 z 0,5 GB.
Dřívější hypotéza o vyčerpaném limitu byla mylná.

## Rozhodnutí, která jsou už udělaná

1. **Mění se konvence z CLAUDE.md.** Dnes je tam „lazy `CREATE TABLE IF NOT EXISTS`
   uvnitř `lib/*Db.ts` přes `ensure(sql)` gate (žádný migration runner)". Lazy
   `ensure` na každém dotazu končí; verzované schéma zůstává bez migration
   runneru, jen se přestane ptát pořád dokola. CLAUDE.md se upraví.
2. **Fallback při výpadku = jen Milanův svět.** Publikované jsou dvě věci,
   Synapse bez databáze nefunguje. Radši jedna funkční karta než sedm mrtvých.
3. **Homepage zůstává dynamická.** Správný `<html lang>` má přednost; s opraveným
   schématem už dynamický render databázi netíží.

## Architektura

### `lib/schema.ts` — jedno místo, jedna otázka

```
ensureSchema(sql)
  ├─ checked (paměť instance)?        → hotovo
  ├─ SELECT v FROM schema_meta …      → 1 levný dotaz
  │    ├─ v === SCHEMA_VERSION        → hotovo          ← 99,9 % případů
  │    └─ jiné / tabulka chybí        → migrate()
  └─ migrate(): JEDNA dávková transakce se všemi DDL a seedy + zápis verze
```

`SCHEMA_VERSION` je konstanta v kódu. Kdo změní DDL nebo seed, zvedne ji;
první instance po deploy schéma dorovná, ostatní jen přečtou verzi.

**Rozlišení „tabulka chybí" od „databáze je dole" je podstatné.** Postgres vrací
`42P01` (undefined_table) — jen na ten se migruje. Chyba spojení musí propadnout
ven, ne spustit 24 příkazů do nedostupné databáze.

### Kde bydlí DDL

Každý `lib/*Db.ts` si své příkazy nechá u sebe a vyexportuje je jako pole:

```ts
export const schema: SchemaStatement[] = [ … ];   // DDL + seed toho modulu
```

`lib/schema.ts` je posbírá a spustí v jedné transakci. Dotazy a jejich schéma
tak zůstávají pohromadě, ale provádí se to na jednom místě a najednou.

**Neověřeno:** `@neondatabase/serverless` v1.1 má `sql.transaction([...])`, ale
jestli přes HTTP driver projde i DDL, jsem nezkoušel — lokálně databázi nemám.
První krok plánu to musí ověřit. Kdyby to neprošlo, náhradou je jeden
multi-statement řetězec; podstatné je, že to má být **jeden round-trip**, ne
jakým přesně API.

### `getDb()` — klient jednou za instanci

Dnes `neon(url)` při každém volání (`getDb()` se v repu volá 61×). Memoizovat
na modulové úrovni.

### Chyby a cache

Dnes:

```ts
async function loadPublicExperiments(lang) {
  try { … } catch { return staticFallback(lang); }   // ← uvnitř unstable_cache
}
getPublicExperiments = unstable_cache(loadPublicExperiments, …, { revalidate: 600 })
```

`catch` je **uvnitř** funkce, kterou cache obaluje, takže se do cache uloží
fallback a drží se tam 10 minut. Jeden zádrhel = deset minut špatného obsahu.
A protože se chyba spolkne, v logu po ní nezůstane stopa — proto byly ve
Vercelu vidět jen chyby `site-texts` (ty catch uvnitř nemají).

Nově: `catch` **až nad** cache. Chyba z cachované funkce probublá ven, nic se
neuloží, další požadavek to zkusí znovu. Nad cachí se chyba zaloguje
(`console.error`) a vrátí se fallback.

### Drafty bez databáze

`guardExperiment()` dnes při výpadku propouští (`isPublished` má
`catch { return true }`), takže `/about`, `/decision-maker` a `/life-manual`
jdou během výpadku otevřít. Draft slugy budou v kódu — na rozhodnutí „tohle
není ke zveřejnění" databáze potřeba není.

### Fallback feed

`ExperimentMeta` dostane `offline?: true`. `staticFallback` vrací jen ty.
Zatím jediný: `milans-world`.

## Co se NEMĚNÍ

- Žádný migration runner, žádné `.sql` soubory, žádná externí knihovna.
- Veřejné podpisy (`getPublicExperiments`, `isPublished`, `guardExperiment`…).
- Cachovací strategie jako taková — `unstable_cache` + `revalidateTag` zůstává,
  mění se jen to, co se smí uložit.
- Autosuspend v Neonu neřešíme kódem. S jedním dotazem místo dvaceti čtyř by
  probuzení mělo přežít; kdyby ne, je to nastavení na jejich straně.

## Testování

- **Jednotkové:** `ensureSchema` — verze sedí → žádná migrace; verze nesedí →
  migrace a zápis; `42P01` → migrace; chyba spojení → **propadne ven**, žádná
  migrace. Nad falešným `sql`, který počítá volání.
- **Datové:** každý modul, který exportuje `schema`, je zaregistrovaný
  v `lib/schema.ts`. Test to hlídá, aby nový modul nezůstal bez tabulek.
- **Regresní na cache:** selhání načtení se **neuloží** — dvě volání po sobě
  musí sáhnout do DB dvakrát, ne servírovat zapamatovaný fallback.
- **Ruční ověření po nasazení:** v Neonu se po pár návštěvách nesmí objevit
  `CREATE TABLE` ani seedovací `INSERT`. To je konečná kontrola, že se to
  povedlo — čísla z tabulky výše musí spadnout na jednotky.

## Pořadí prací

Jádro, přes které teče všechno, takže po krocích a každý ověřitelný zvlášť:

1. `lib/schema.ts` + testy (nic ještě nepoužívá)
2. Převod modulů na `export const schema` — po jednom, `experimentsDb` první
3. `getDb()` memoizace
4. Cache a logování chyb
5. Drafty z kódu + `offline` fallback

Body 4 a 5 jsou nezávislé na 1–3 a dají se udělat kdykoli.
