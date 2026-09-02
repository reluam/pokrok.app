# Osobní web jako glóbus — implementační plán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nahradit vodorovný pás pěti panelů na matejmauler.com rotující koulí, kde sekce jsou kontinenty a firmy v sekci Práce jsou země uvnitř kontinentu.

**Architecture:** SVG glóbus s ortografickou projekcí. Čistá matematika v `lib/site/globe.ts`, geometrie jako data v `lib/site/continents.ts` a `lib/site/countries.ts`, prezentační `components/site/Globe.tsx` (nezná obsah) a stavový `components/site/GlobeShell.tsx` (nekreslí). Navigace přes `history.pushState`, ne router push — router push by komponenty odmountoval a zabil animaci.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, vitest, čisté CSS v `app/globals.css`. **Žádná nová závislost.**

**Spec:** `docs/superpowers/specs/2026-09-02-osobni-web-globus-design.md`

## Global Constraints

- **Žádná nová npm závislost.** Ani three.js, ani d3-geo. pixi.js je v repu, ale nepoužívá se.
- **Žádný `Co-Authored-By` trailer v commitech** — rozbíjí Vercel deploy (viz `CLAUDE.md`).
- **Dvojjazyčnost se nesahá.** Každý text je `Bi { cs: string; en: string }` z `@/lib/about`. Přepínač v `TopMenu` zůstává.
- **URL zůstávají anglické v obou jazycích.** Jazyk drží cookie `mm_lang`, ne cesta.
- **Vitest běží jen na `lib/**/*.test.ts` v prostředí `node`** (viz `vitest.config.ts`). Komponenty se netestují unit testy — ověřují se buildem, lintem a okem.
- **Hlas textů** se řídí specem `docs/superpowers/specs/2026-08-12-osobni-web-texty-design.md`: sentence case, první osoba, žádná pointa na konci odstavce, neúspěchy holé bez poučení, max 2–3 věty na blok.
- **Barevné tokeny v `:root`** (`--color-bg`, `--color-text`, `--color-text-muted`, `--font-voice`, `--font-sans`, `--font-mono`) se nemění a nové barvy se nezavádějí — všechno nové CSS staví jen na nich a na `color-mix`.
- Po každé úloze musí projít `npm test`, `npm run lint` a `npm run build`. Jediná výjimka je test na `PLACEHOLDER` v úloze 8, který je červený záměrně.

---

### Task 1: Projekce koule (`lib/site/globe.ts`)

Čistá matematika. Nic o Reactu, nic o obsahu.

**Files:**
- Create: `lib/site/globe.ts`
- Test: `lib/site/globe.test.ts`

**Interfaces:**
- Consumes: nic.
- Produces:
  - `type GeoPoint = { lon: number; lat: number }`
  - `type Rotation = { lon0: number; lat0: number }`
  - `type Projected = { x: number; y: number; cosc: number }`
  - `project(p: GeoPoint, r: Rotation, radius: number): Projected`
  - `isVisible(p: GeoPoint, r: Rotation): boolean`
  - `projectPolygon(points: [number, number][], r: Rotation, radius: number): { path: string; visibility: "full" | "partial" | "hidden" }`
  - `shortestRotation(fromLon: number, toLon: number): number`
  - `angularDistance(a: Rotation, b: Rotation): number`

- [ ] **Step 1: Write the failing test**

Create `lib/site/globe.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { angularDistance, isVisible, project, projectPolygon, shortestRotation } from "./globe";

const R = 100;

describe("ortografická projekce", () => {
  it("bod uprostřed rotace padne do středu kotouče", () => {
    const p = project({ lon: 20, lat: 30 }, { lon0: 20, lat0: 30 }, R);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(0, 6);
    expect(p.cosc).toBeCloseTo(1, 6);
  });

  it("bod 90° na východ padne na pravý okraj kotouče", () => {
    const p = project({ lon: 90, lat: 0 }, { lon0: 0, lat0: 0 }, R);
    expect(p.x).toBeCloseTo(R, 6);
    expect(p.y).toBeCloseTo(0, 6);
    expect(p.cosc).toBeCloseTo(0, 6);
  });

  it("severní bod jde v SVG nahoru, tedy do záporného y", () => {
    const p = project({ lon: 0, lat: 30 }, { lon0: 0, lat0: 0 }, R);
    expect(p.y).toBeLessThan(0);
  });

  it("bod na odvrácené straně koule není vidět", () => {
    expect(isVisible({ lon: 180, lat: 0 }, { lon0: 0, lat0: 0 })).toBe(false);
    expect(isVisible({ lon: 0, lat: 0 }, { lon0: 0, lat0: 0 })).toBe(true);
  });

  it("projekce nikdy nevyjde mimo kotouč, ani za obzorem", () => {
    for (let lon = -180; lon <= 180; lon += 7) {
      for (let lat = -90; lat <= 90; lat += 7) {
        const p = project({ lon, lat }, { lon0: 33, lat0: -12 }, R);
        expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(R + 1e-9);
      }
    }
  });
});

describe("projectPolygon", () => {
  const square: [number, number][] = [[-10, -10], [10, -10], [10, 10], [-10, 10]];

  it("polygon vepředu je celý vidět a vrací uzavřenou cestu", () => {
    const out = projectPolygon(square, { lon0: 0, lat0: 0 }, R);
    expect(out.visibility).toBe("full");
    expect(out.path.startsWith("M ")).toBe(true);
    expect(out.path.endsWith(" Z")).toBe(true);
  });

  it("polygon za obzorem je schovaný", () => {
    const out = projectPolygon(square, { lon0: 180, lat0: 0 }, R);
    expect(out.visibility).toBe("hidden");
  });

  it("polygon na hraně obzoru je částečný a drží se uvnitř kotouče", () => {
    const out = projectPolygon(square, { lon0: 85, lat0: 0 }, R);
    expect(out.visibility).toBe("partial");
    const nums = out.path.match(/-?\d+(\.\d+)?/g)!.map(Number);
    for (let i = 0; i < nums.length; i += 2) {
      expect(Math.hypot(nums[i], nums[i + 1])).toBeLessThanOrEqual(R + 0.01);
    }
  });
});

describe("rotační pomocníci", () => {
  it("shortestRotation jde kratší cestou přes nulu", () => {
    expect(shortestRotation(350, 10)).toBe(370);
    expect(shortestRotation(10, 350)).toBe(-10);
    expect(shortestRotation(0, 90)).toBe(90);
    expect(shortestRotation(0, 180)).toBe(180);
  });

  it("angularDistance měří úhel mezi dvěma natočeními", () => {
    expect(angularDistance({ lon0: 0, lat0: 0 }, { lon0: 0, lat0: 0 })).toBeCloseTo(0, 6);
    expect(angularDistance({ lon0: 0, lat0: 0 }, { lon0: 90, lat0: 0 })).toBeCloseTo(90, 6);
    expect(angularDistance({ lon0: 0, lat0: 0 }, { lon0: 180, lat0: 0 })).toBeCloseTo(180, 6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/site/globe.test.ts`
Expected: FAIL — `Failed to resolve import "./globe"`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/site/globe.ts`:

```ts
/**
 * Ortografická projekce koule — matematika glóbusu na osobním webu.
 * Čisté funkce bez Reactu, takže se dají testovat samy o sobě.
 *
 * Rotace = bod, který je právě uprostřed přivrácený k divákovi. Body za obzorem
 * (cosc <= 0) se v ortografické projekci promítají do stejného kotouče jako
 * přední polokoule, proto se u polygonů tlačí na okraj — jinak by tvar
 * při zajíždění za obzor přeskočil na druhou stranu.
 */

export type GeoPoint = { lon: number; lat: number };
export type Rotation = { lon0: number; lat0: number };
export type Projected = { x: number; y: number; cosc: number };

const RAD = Math.PI / 180;
const round = (n: number) => Math.round(n * 100) / 100;

export function project(p: GeoPoint, r: Rotation, radius: number): Projected {
  const lat = p.lat * RAD;
  const lat0 = r.lat0 * RAD;
  const d = (p.lon - r.lon0) * RAD;

  const cosc = Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * Math.cos(lat) * Math.cos(d);
  const x = radius * Math.cos(lat) * Math.sin(d);
  const y = radius * (Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * Math.cos(lat) * Math.cos(d));

  // SVG má y dolů, zeměpisná šířka nahoru → znaménko se otáčí
  return { x, y: -y, cosc };
}

export function isVisible(p: GeoPoint, r: Rotation): boolean {
  return project(p, r, 1).cosc > 0;
}

export function projectPolygon(
  points: [number, number][],
  r: Rotation,
  radius: number,
): { path: string; visibility: "full" | "partial" | "hidden" } {
  let seen = 0;
  const xy = points.map(([lon, lat]) => {
    const p = project({ lon, lat }, r, radius);
    if (p.cosc > 0) {
      seen += 1;
      return [p.x, p.y] as const;
    }
    // za obzorem: přitiskni bod na okraj kotouče, ať obrys neuteče přes kouli
    const len = Math.hypot(p.x, p.y) || 1;
    return [(p.x / len) * radius, (p.y / len) * radius] as const;
  });

  const visibility = seen === 0 ? "hidden" : seen === points.length ? "full" : "partial";
  const path =
    xy.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${round(x)} ${round(y)}`).join(" ") + " Z";

  return { path, visibility };
}

/** Cíl posunutý o násobek 360°, aby se koule točila kratší cestou. */
export function shortestRotation(fromLon: number, toLon: number): number {
  let delta = (toLon - fromLon) % 360;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return fromLon + delta;
}

/** Úhel mezi dvěma natočeními ve stupních — řídí délku animace. */
export function angularDistance(a: Rotation, b: Rotation): number {
  const cosc =
    Math.sin(a.lat0 * RAD) * Math.sin(b.lat0 * RAD) +
    Math.cos(a.lat0 * RAD) * Math.cos(b.lat0 * RAD) * Math.cos((b.lon0 - a.lon0) * RAD);
  return Math.acos(Math.min(1, Math.max(-1, cosc))) / RAD;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/site/globe.test.ts`
Expected: PASS, 9 testů.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: žádná chyba v `lib/site/globe.ts`.

- [ ] **Step 6: Commit**

```bash
git add lib/site/globe.ts lib/site/globe.test.ts
git commit -m "feat(site): ortografická projekce koule pro glóbus"
```

---

### Task 2: Geometrie kontinentů (`lib/site/continents.ts`)

Čtyři kontinenty jako data. Tvary jsou ručně napsané, aby měl každý kontinent zapamatovatelnou siluetu — negeneruj je.

**Files:**
- Create: `lib/site/continents.ts`
- Test: `lib/site/continents.test.ts`

**Interfaces:**
- Consumes: `angularDistance`, `Rotation` z `./globe` (Task 1).
- Produces:
  - `type ContinentId = "home" | "work" | "ideas" | "contact"`
  - `type Continent = { id: ContinentId; centroid: [number, number]; points: [number, number][] }`
  - `CONTINENTS: Continent[]`
  - `rotationFor(id: ContinentId): Rotation`
  - `nearestContinent(r: Rotation): Continent`

- [ ] **Step 1: Write the failing test**

Create `lib/site/continents.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CONTINENTS, nearestContinent, rotationFor } from "./continents";
import { angularDistance } from "./globe";

describe("kontinenty", () => {
  it("jsou čtyři a mají čekaná id", () => {
    expect(CONTINENTS.map((c) => c.id)).toEqual(["home", "work", "ideas", "contact"]);
  });

  it("každý má aspoň 8 bodů obrysu a rozumné souřadnice", () => {
    for (const c of CONTINENTS) {
      expect(c.points.length).toBeGreaterThanOrEqual(8);
      for (const [lon, lat] of c.points) {
        expect(lon).toBeGreaterThanOrEqual(-180);
        expect(lon).toBeLessThanOrEqual(360);
        expect(lat).toBeGreaterThan(-85);
        expect(lat).toBeLessThan(85);
      }
    }
  });

  it("žádné dva kontinenty neleží na sobě", () => {
    for (const a of CONTINENTS) {
      for (const b of CONTINENTS) {
        if (a.id === b.id) continue;
        expect(angularDistance(rotationFor(a.id), rotationFor(b.id))).toBeGreaterThan(60);
      }
    }
  });

  it("obrys leží kolem svého centroidu, ne někde jinde", () => {
    for (const c of CONTINENTS) {
      const [clon, clat] = c.centroid;
      for (const [lon, lat] of c.points) {
        expect(Math.abs(lon - clon)).toBeLessThan(50);
        expect(Math.abs(lat - clat)).toBeLessThan(50);
      }
    }
  });

  it("rotationFor vrací centroid kontinentu", () => {
    expect(rotationFor("work")).toEqual({ lon0: 90, lat0: -10 });
  });

  it("nearestContinent přichytí natočení k nejbližšímu kontinentu", () => {
    expect(nearestContinent({ lon0: 84, lat0: -4 }).id).toBe("work");
    expect(nearestContinent({ lon0: 355, lat0: 12 }).id).toBe("home");
    expect(nearestContinent({ lon0: 190, lat0: 18 }).id).toBe("ideas");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/site/continents.test.ts`
Expected: FAIL — `Failed to resolve import "./continents"`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/site/continents.ts`:

```ts
import { angularDistance, type Rotation } from "./globe";

/**
 * Čtyři kontinenty = čtyři sekce webu. Centroidy jsou rozsazené po ~90°, aby při
 * otáčení bylo znát, že se projelo přes oceán. Obrysy jsou psané rukou (ne
 * generované), aby měla každá pevnina svou siluetu — jsou to data, ne magie
 * v komponentě. Souřadnice jsou [lon, lat] ve stupních.
 */

export type ContinentId = "home" | "work" | "ideas" | "contact";

export type Continent = {
  id: ContinentId;
  centroid: [number, number];
  points: [number, number][];
};

export const CONTINENTS: Continent[] = [
  {
    id: "home",
    centroid: [0, 15],
    points: [
      [-34, 10], [-28, 26], [-14, 34], [2, 36], [16, 30], [26, 20],
      [30, 6], [22, -6], [8, -12], [-8, -10], [-20, -2], [-30, 2],
    ],
  },
  {
    // největší pevnina — musí unést šest zemí (viz lib/site/countries.ts)
    id: "work",
    centroid: [90, -10],
    points: [
      [52, -4], [58, 12], [70, 20], [84, 24], [98, 22], [112, 14], [124, 2],
      [126, -14], [118, -28], [102, -36], [86, -38], [70, -32], [58, -20],
    ],
  },
  {
    id: "ideas",
    centroid: [180, 20],
    points: [
      [150, 14], [154, 30], [166, 40], [180, 42], [194, 36], [206, 26],
      [210, 12], [202, 0], [188, -4], [172, -2], [158, 4],
    ],
  },
  {
    id: "contact",
    centroid: [270, -15],
    points: [
      [248, -6], [254, 4], [266, 8], [278, 4], [286, -8],
      [284, -22], [272, -28], [258, -24], [250, -16],
    ],
  },
];

export function rotationFor(id: ContinentId): Rotation {
  const c = CONTINENTS.find((x) => x.id === id) ?? CONTINENTS[0];
  return { lon0: c.centroid[0], lat0: c.centroid[1] };
}

/** Po puštění tažení koule dosedne sem — nikdy nezůstane stát na oceánu. */
export function nearestContinent(r: Rotation): Continent {
  let best = CONTINENTS[0];
  let bestDist = Infinity;
  for (const c of CONTINENTS) {
    const d = angularDistance(r, rotationFor(c.id));
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/site/continents.test.ts`
Expected: PASS, 6 testů.

- [ ] **Step 5: Commit**

```bash
git add lib/site/continents.ts lib/site/continents.test.ts
git commit -m "feat(site): geometrie čtyř kontinentů"
```

---

### Task 3: Čtyři sekce místo pěti — Nápady místo Jak to vidím

Struktura webu. Po téhle úloze je „Jak to vidím" pryč, `/ideas` existuje a web pořád jede jako vodorovný pás — kouli přinese až Task 5. Sekce Nápady zatím ukazuje jen svůj úvod.

**Files:**
- Modify: `lib/site/sections.ts` (celý soubor)
- Modify: `lib/site/copy.ts:44-52` (`inPractice` pryč, `nowIntro` → `ideasIntro`)
- Modify: `lib/site/copy.test.ts` (mrtvé klíče, sekce, testy na `projects` pryč)
- Modify: `components/site/panels.tsx` (`ThoughtsPanel` → `IdeasPanel`, `ProjectsPanel` pryč)
- Modify: `components/site/SiteStrip.tsx:105-110` (mapa panelů)
- Modify: `lib/projects.ts:3` (komentář v hlavičce)
- Modify: `next.config.ts` (redirecty)
- Create: `app/ideas/page.tsx`
- Delete: `app/thoughts/page.tsx`, `app/projects/page.tsx`, `components/site/HowISeeIt.tsx`, `lib/site/beliefs.ts`, `lib/site/thoughts.ts`, `lib/site/howISeeIt.test.ts`

**Interfaces:**
- Consumes: `Bi` z `@/lib/about`.
- Produces:
  - `Section["id"]` je nově `"home" | "work" | "ideas" | "contact"`
  - `SECTIONS`, `sectionIndex`, `indexForPath` beze změny signatury
  - `COPY.ideasIntro: Bi` (nahrazuje `COPY.nowIntro`); `COPY.inPractice` už neexistuje
  - `IdeasPanel({ lang }: { lang: Lang })` z `components/site/panels.tsx`

- [ ] **Step 1: Write the failing test**

V `lib/site/copy.test.ts` nahraď import a poslední tři `it` bloky. Výsledný soubor:

```ts
import { describe, expect, it } from "vitest";
import { COPY, DESCRIPTION } from "./copy";
import { SECTIONS, indexForPath } from "./sections";

const langs = ["cs", "en"] as const;

describe("texty rozcestníku", () => {
  it("úvod na hlavní stránce jsou tři odstavce v obou jazycích", () => {
    expect(DESCRIPTION).toHaveLength(3);
    for (const p of DESCRIPTION) {
      for (const l of langs) expect(p[l].length).toBeGreaterThan(20);
    }
  });

  it("první věta drží 'for me' / 'pro mě' — je to Matějova zkušenost, ne tvrzení o životě", () => {
    expect(DESCRIPTION[0].en).toContain("for me");
    expect(DESCRIPTION[0].cs).toContain("pro mě");
  });

  it("metaDescription se vejde do meta tagu a je věcný", () => {
    for (const l of langs) {
      expect(COPY.metaDescription[l].length).toBeGreaterThan(80);
      expect(COPY.metaDescription[l].length).toBeLessThanOrEqual(165);
    }
    expect(COPY.metaDescription.en).toContain("Teya");
  });

  it("mrtvé klíče po rotátoru, kartotéce a sekci „Jak to vidím\" jsou pryč", () => {
    const dead = [
      "description", "beliefsHeading", "thoughtsShort", "thoughtsShortLead",
      "prev", "next", "timelineNow", "inPractice", "nowIntro",
    ];
    for (const key of dead) expect(COPY).not.toHaveProperty(key);
  });

  it("sekce jsou čtyři, „jak to vidím\" mezi nimi není", () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(["home", "work", "ideas", "contact"]);
  });

  it("každá sekce kromě home má shrnutí i navigační popisek v obou jazycích", () => {
    for (const s of SECTIONS.filter((x) => x.id !== "home")) {
      for (const l of langs) {
        expect(s.summary[l].length).toBeGreaterThan(20);
        expect(s.nav[l].length).toBeGreaterThan(2);
      }
    }
  });

  it("cesty ukazují na správné sekce", () => {
    expect(indexForPath("/")).toBe(0);
    expect(indexForPath("/work")).toBe(1);
    expect(indexForPath("/ideas")).toBe(2);
    expect(indexForPath("/contact")).toBe(3);
    expect(indexForPath("/neexistuje")).toBe(0);
  });

  it("úvod sekce Nápady mluví o nápadech, ne o projektech", () => {
    for (const l of langs) expect(COPY.ideasIntro[l].length).toBeGreaterThan(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/site/copy.test.ts`
Expected: FAIL — `SECTIONS.map(...)` vrací pět id včetně `thoughts`, `COPY.ideasIntro` je `undefined`.

- [ ] **Step 3: Přepiš `lib/site/sections.ts`**

```ts
import type { Bi } from "@/lib/about";

/**
 * Čtyři sekce = čtyři routy = čtyři kontinenty na kouli.
 * Pořadí tady určuje pořadí v menu; kde kontinent leží na kouli, říká
 * lib/site/continents.ts. URL zůstávají anglické i v české verzi (jazyk drží
 * cookie, ne cesta) — jinak by každá stránka musela existovat dvakrát.
 */
export type Section = {
  id: "home" | "work" | "ideas" | "contact";
  href: string;
  /** Krátký popisek do menu. */
  nav: Bi;
  /** Nadpis panelu i řádku na hlavní stránce. */
  title: Bi;
  /** Shrnutí na hlavní stránce (řádek se šipkou). */
  summary: Bi;
};

export const SECTIONS: Section[] = [
  {
    id: "home",
    href: "/",
    nav: { cs: "Začátek", en: "Start" },
    title: { cs: "Matěj Mauler", en: "Matěj Mauler" },
    summary: { cs: "", en: "" },
  },
  {
    id: "work",
    href: "/work",
    nav: { cs: "Kousek historie", en: "A bit of history" },
    title: { cs: "Kousek historie", en: "A bit of history" },
    summary: {
      cs: "Firmy, kterými jsem prošel, a co jsem v nich dělal. Velikost země říká, jak dlouho jsem tam byl.",
      en: "The companies I've been through and what I did in them. A country's size says how long I stayed.",
    },
  },
  {
    id: "ideas",
    href: "/ideas",
    nav: { cs: "Nad čím přemýšlím", en: "What I'm thinking about" },
    title: { cs: "Nad čím přemýšlím", en: "What I'm thinking about" },
    summary: {
      cs: "Nápady, které nedělám a myslím si, že by měly existovat. Klidně si je vezmi.",
      en: "Ideas I'm not building that I think should exist. Take one if you want.",
    },
  },
  {
    id: "contact",
    href: "/contact",
    nav: { cs: "Zůstaňme ve spojení", en: "Let's stay in touch" },
    title: { cs: "Zůstaňme ve spojení", en: "Let's stay in touch" },
    summary: {
      cs: "Nejrychleji Discord. Mail taky funguje. Důvod není potřeba.",
      en: "Discord is fastest. Email works too. No reason needed.",
    },
  },
];

export const sectionIndex = (id: Section["id"]) => SECTIONS.findIndex((s) => s.id === id);

/** Pro popstate / přímý vstup: z cesty zjisti pozici sekce. */
export const indexForPath = (path: string) => {
  const clean = path.replace(/\/+$/, "") || "/";
  const found = SECTIONS.findIndex((s) => s.href === clean);
  return found === -1 ? 0 : found;
};
```

- [ ] **Step 4: Uprav `lib/site/copy.ts`**

Smaž klíč `inPractice` a nahraď `nowIntro` tímhle:

```ts
  /** Úvod sekce „Nad čím přemýšlím". */
  ideasIntro: {
    cs: "Věci, na které pořád myslím a nedělám je. Když si je někdo vezme, budu rád.",
    en: "Things I keep thinking about and don't build. If someone takes one, I'll be glad.",
  },
```

- [ ] **Step 5: Uprav `components/site/panels.tsx`**

- Smaž `import { HowISeeIt } from "./HowISeeIt";` a `import { projects } from "@/lib/projects";`.
- Smaž celou funkci `ProjectsPanel` a celou funkci `ThoughtsPanel` i s jejím doc-komentářem.
- Přidej na jejich místo:

```tsx
/**
 * „Nad čím přemýšlím" — nápady, které Matěj nedělá a myslí si, že by měly
 * existovat. Obsah dodá lib/site/ideas.ts (Task 8); zatím jen úvod sekce.
 */
export function IdeasPanel({ lang }: { lang: Lang }) {
  const s = SECTIONS[2];
  return (
    <div className="mm-inner">
      <h2 className="mm-panel-title">{s.title[lang]}</h2>
      <p className="mm-panel-lead">{COPY.ideasIntro[lang]}</p>
    </div>
  );
}
```

- V `ContactPanel` změň `SECTIONS[4]` na `SECTIONS[3]`.

- [ ] **Step 6: Uprav `components/site/SiteStrip.tsx`**

V mapování panelů nahraď dva řádky:

```tsx
            {s.id === "projects" && <ProjectsPanel lang={lang} />}
            {s.id === "thoughts" && <ThoughtsPanel lang={lang} />}
```

za jeden:

```tsx
            {s.id === "ideas" && <IdeasPanel lang={lang} />}
```

a oprav import na `import { ContactPanel, HomePanel, IdeasPanel, WorkPanel } from "./panels";`.

- [ ] **Step 7: Vytvoř `app/ideas/page.tsx`**

```tsx
import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { PERSON_NAME, PERSON_URL } from "@/lib/about";
import { SECTIONS } from "@/lib/site/sections";

const section = SECTIONS[2];

export const metadata: Metadata = {
  title: `${section.title.en} — ${PERSON_NAME}`,
  description: section.summary.en,
  alternates: { canonical: "/ideas" },
  openGraph: {
    type: "profile",
    title: `${section.title.en} — ${PERSON_NAME}`,
    description: section.summary.en,
    url: `${PERSON_URL}/ideas`,
    siteName: PERSON_NAME,
    images: [{ url: "/logo.svg" }],
  },
};

export default function IdeasPage() {
  return <SiteShell section="ideas" />;
}
```

Zkontroluj `app/work/page.tsx` a srovnej strukturu — pokud se liší, drž se té existující, ne téhle.

- [ ] **Step 8: Přidej redirecty do `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Sekce „Jak to vidím" zanikla a „Čemu se věnuju teď" se stalo „Nad čím
    // přemýšlím". Redirect na nejbližší živou věc je lepší než 404 na odkazu,
    // který někde visí.
    return [
      { source: "/thoughts", destination: "/ideas", permanent: true },
      { source: "/projects", destination: "/ideas", permanent: true },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 9: Smaž mrtvé soubory**

```bash
git rm app/thoughts/page.tsx app/projects/page.tsx \
       components/site/HowISeeIt.tsx \
       lib/site/beliefs.ts lib/site/thoughts.ts lib/site/howISeeIt.test.ts
```

V `lib/projects.ts` uprav komentář na prvním řádku, ať nelže:

```ts
// Projekty. Na stránce se od redesignu na glóbus nevykreslují — zůstávají jen jako
// zdroj URL pro JSON-LD `sameAs` v app/page.tsx (identita osoby pro vyhledávače).
```

- [ ] **Step 10: Run tests, lint, build**

```bash
npm test && npm run lint && npm run build
```
Expected: PASS. Build nesmí hlásit odkaz na `beliefs`, `thoughts`, `HowISeeIt` ani `ProjectsPanel`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(site): čtyři sekce — Nápady místo Jak to vidím a Čemu se věnuju teď"
```

---

### Task 4: SVG glóbus (`components/site/Globe.tsx`)

Čistě prezentační komponenta. **Nesmí znát obsah** — dostane tvary, popisky a natočení, vrací SVG a hlásí kliky nahoru. Díky tomu jde stavět bez textů.

**Files:**
- Create: `components/site/Globe.tsx`
- Modify: `app/globals.css` (nový blok `/* ── Glóbus ── */` za blokem `.mm-inner`, zatím jen kresba koule)

**Interfaces:**
- Consumes: `projectPolygon`, `project`, `type Rotation` z `@/lib/site/globe`.
- Produces:
  - `type GlobeShape = { id: string; label: string; points: [number, number][]; seat: [number, number]; href?: string }`
  - `Globe({ rotation, shapes, activeId, onSelect, zoom, className }): JSX.Element`
  - Konstanta `GLOBE_RADIUS = 100` (SVG jednotky; skutečnou velikost řídí CSS)

- [ ] **Step 1: Napiš komponentu**

Create `components/site/Globe.tsx`:

```tsx
"use client";

import { project, projectPolygon, type Rotation } from "@/lib/site/globe";

/**
 * Koule v SVG. Komponenta nezná obsah — dostane tvary a natočení, vrací kresbu
 * a hlásí kliky nahoru. Poloměr je v SVG jednotkách konstantní; skutečnou
 * velikost na stránce řídí CSS, takže mobil a desktop sdílí jednu geometrii.
 *
 * Tvary se kreslí od nejvzdálenějšího k nejbližšímu (podle cosc svého sídla),
 * aby se ty vepředu překryly přes ty u obzoru.
 */

export const GLOBE_RADIUS = 100;

export type GlobeShape = {
  id: string;
  label: string;
  points: [number, number][];
  /** Kam se sází popisek — obvykle centroid. */
  seat: [number, number];
  /** Cíl odkazu. Kontinenty ho mají (jsou to routy), země ne. */
  href?: string;
};

const PAD = 4;
const VIEW = GLOBE_RADIUS + PAD;

export function Globe({
  rotation,
  shapes,
  activeId,
  onSelect,
  zoom = 1,
  className,
  ariaLabel,
}: {
  rotation: Rotation;
  shapes: GlobeShape[];
  activeId: string | null;
  onSelect: (id: string) => void;
  /** 1 = celá koule, >1 = přiblížení na aktivní kontinent. */
  zoom?: number;
  className?: string;
  ariaLabel: string;
}) {
  const drawn = shapes
    .map((s) => {
      const poly = projectPolygon(s.points, rotation, GLOBE_RADIUS);
      const seat = project({ lon: s.seat[0], lat: s.seat[1] }, rotation, GLOBE_RADIUS);
      return { shape: s, poly, seat };
    })
    .filter((d) => d.poly.visibility !== "hidden")
    .sort((a, b) => a.seat.cosc - b.seat.cosc);

  return (
    <svg
      className={`mm-globe${className ? ` ${className}` : ""}`}
      viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
      role="group"
      aria-label={ariaLabel}
    >
      <g style={{ transform: `scale(${zoom})` }} className="mm-globe-world">
        <circle className="mm-globe-ocean" cx={0} cy={0} r={GLOBE_RADIUS} />

        {drawn.map(({ shape, poly, seat }) => {
          const isActive = shape.id === activeId;
          // popisek se vypisuje, jen když sídlo míří dost k divákovi — u obzoru
          // by se stlačil do čárky a překryl se sousedem
          const showLabel = seat.cosc > 0.42;
          return (
            // <a>, ne <g>: kontinent je fokusovatelný a bez JS vede na svou routu.
            // Klik odchytáváme, href zůstává kvůli „otevřít v novém tabu".
            <a
              key={shape.id}
              href={shape.href}
              className={`mm-continent${isActive ? " is-active" : ""}`}
              aria-label={shape.label}
              aria-current={isActive ? "page" : undefined}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                onSelect(shape.id);
              }}
            >
              <path className="mm-continent-land" d={poly.path} />
              {showLabel && (
                <text className="mm-continent-label" x={seat.x} y={seat.y} textAnchor="middle">
                  {shape.label}
                </text>
              )}
            </a>
          );
        })}

        <circle className="mm-globe-rim" cx={0} cy={0} r={GLOBE_RADIUS} />
      </g>
    </svg>
  );
}
```

- [ ] **Step 2: Přidej CSS**

Do `app/globals.css` hned za pravidlo `.mm-inner { … }` vlož:

```css
/* ── Glóbus: koule, kontinenty, popisky ── */
.mm-globe {
  display: block; width: 100%; height: auto;
  touch-action: none; user-select: none; -webkit-user-select: none;
  overflow: visible;
}
.mm-globe-world { transform-origin: 50% 50%; transition: transform 520ms cubic-bezier(0.76, 0, 0.24, 1); }
.mm-globe-ocean { fill: color-mix(in srgb, var(--color-text) 5%, transparent); }
.mm-globe-rim {
  fill: none; stroke: color-mix(in srgb, var(--color-text) 22%, transparent); stroke-width: 1;
}
.mm-continent { cursor: pointer; }
.mm-continent:focus-visible { outline: none; }
.mm-continent:focus-visible .mm-continent-land {
  stroke: var(--color-text); stroke-width: 2; stroke-dasharray: 3 2;
}
.mm-continent-land {
  fill: color-mix(in srgb, var(--color-text) 16%, transparent);
  stroke: color-mix(in srgb, var(--color-text) 30%, transparent); stroke-width: 0.8;
  transition: fill 200ms var(--transition);
}
.mm-continent:hover .mm-continent-land { fill: color-mix(in srgb, var(--color-text) 26%, transparent); }
.mm-continent.is-active .mm-continent-land { fill: color-mix(in srgb, var(--color-text) 38%, transparent); }
.mm-continent-label {
  font-family: var(--font-mono); font-size: 7px; letter-spacing: 0.08em;
  text-transform: uppercase; fill: var(--color-text); pointer-events: none;
  paint-order: stroke;
  stroke: var(--color-bg); stroke-width: 2.5; stroke-linejoin: round;
}
.mm-continent.is-active .mm-continent-label { font-weight: 700; }
@media (prefers-reduced-motion: reduce) {
  .mm-globe-world { transition: none; }
}
```

- [ ] **Step 3: Ověř build a lint**

```bash
npm run lint && npm run build
```
Expected: PASS. Komponenta zatím není nikde použitá — to je v pořádku, Task 5 ji zapojí.

- [ ] **Step 4: Commit**

```bash
git add components/site/Globe.tsx app/globals.css
git commit -m "feat(site): SVG glóbus — prezentační komponenta"
```

---

### Task 5: `GlobeShell` nahradí `SiteStrip`

Stav, rotace, tažení, URL. **Nekreslí** — kreslení je v `Globe.tsx`. Po téhle úloze je pás pryč a web se ovládá koulí.

**Files:**
- Create: `components/site/GlobeShell.tsx`
- Modify: `components/site/SiteShell.tsx`
- Modify: `app/globals.css` (blok `.mm-strip` / `.mm-panel` / `@keyframes mm-glide` na řádcích ~277–308 nahradit scénou)
- Delete: `components/site/SiteStrip.tsx`

**Interfaces:**
- Consumes: `Globe`, `type GlobeShape` (Task 4); `CONTINENTS`, `rotationFor`, `nearestContinent`, `type ContinentId` (Task 2); `angularDistance`, `shortestRotation`, `type Rotation` (Task 1); `SECTIONS`, `indexForPath` (Task 3).
- Produces: `GlobeShell({ initialIndex, initialLang }: { initialIndex: number; initialLang: Lang })`.

- [ ] **Step 1: Napiš `components/site/GlobeShell.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Globe, type GlobeShape } from "./Globe";
import { TopMenu } from "./TopMenu";
import { ContactPanel, HomePanel, IdeasPanel, WorkPanel } from "./panels";
import type { Lang } from "@/lib/dictionaries";
import { CONTINENTS, nearestContinent, rotationFor, type ContinentId } from "@/lib/site/continents";
import { angularDistance, shortestRotation, type Rotation } from "@/lib/site/globe";
import { SECTIONS, indexForPath } from "@/lib/site/sections";

const LANG_COOKIE = "mm_lang";

/** Delší otočka = delší animace, ať je znát, že se projelo přes oceán. */
function durationFor(degrees: number) {
  return Math.min(560 + degrees * 3, 1300);
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Koule jako navigace. Stav (natočení, aktivní kontinent, jazyk) drží tahle
 * komponenta, kreslí Globe. Navigace nemění stromy komponent — jen otočí kouli
 * a přepíše URL přes History API, takže přechod jde animovat. Přímý vstup na
 * /work vykreslí kouli rovnou natočenou na kontinent Práce.
 */
export function GlobeShell({
  initialIndex,
  initialLang,
}: {
  initialIndex: number;
  initialLang: Lang;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [lang, setLang] = useState<Lang>(initialLang);
  const [rotation, setRotation] = useState<Rotation>(() =>
    rotationFor(SECTIONS[initialIndex].id as ContinentId),
  );

  // index a rotace jedou i v refech: animační smyčka i pointer handlery musí
  // číst aktuální hodnotu, aniž by se kvůli tomu překreslovaly
  const indexRef = useRef(initialIndex);
  const rotationRef = useRef(rotation);
  const rafRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; x: number; y: number; moved: number } | null>(null);

  const applyRotation = useCallback((r: Rotation) => {
    rotationRef.current = r;
    setRotation(r);
  }, []);

  /** Plynule dojede na cílové natočení. Kratší cestou, s délkou podle úhlu. */
  const animateTo = useCallback(
    (target: Rotation) => {
      cancelAnimationFrame(rafRef.current);
      const from = rotationRef.current;
      const to = { lon0: shortestRotation(from.lon0, target.lon0), lat0: target.lat0 };
      const ms = reducedMotion() ? 0 : durationFor(angularDistance(from, to));
      if (ms === 0) {
        applyRotation(to);
        return;
      }
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        const e = easeInOut(t);
        applyRotation({
          lon0: from.lon0 + (to.lon0 - from.lon0) * e,
          lat0: from.lat0 + (to.lat0 - from.lat0) * e,
        });
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [applyRotation],
  );

  const goTo = useCallback(
    (next: number, push: boolean) => {
      indexRef.current = next;
      setIndex(next);
      if (push) window.history.pushState({ mmIndex: next }, "", SECTIONS[next].href);
      animateTo(rotationFor(SECTIONS[next].id as ContinentId));
    },
    [animateTo],
  );

  const navigate = useCallback((next: number) => goTo(next, next !== indexRef.current), [goTo]);

  const selectContinent = useCallback(
    (id: string) => {
      const next = SECTIONS.findIndex((s) => s.id === id);
      if (next >= 0) navigate(next);
    },
    [navigate],
  );

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Zpět/vpřed v prohlížeči → koule se otočí na kontinent podle URL (bez dalšího pushState).
  useEffect(() => {
    const onPop = () => goTo(indexForPath(window.location.pathname), false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [goTo]);

  // Titulek musí sledovat URL, protože skutečná navigace neproběhne.
  useEffect(() => {
    const s = SECTIONS[index];
    document.title = index === 0 ? s.title[lang] : `${s.title[lang]} — ${SECTIONS[0].title[lang]}`;
  }, [index, lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "cs" ? "en" : "cs";
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      return next;
    });
  }, []);

  /* ── tažení ── */

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    cancelAnimationFrame(rafRef.current);
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const width = stageRef.current?.clientWidth ?? 320;
    // půlka šířky scény ≈ poloměr koule ≈ 90° otočení
    const perPx = 90 / (width / 2);
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.moved += Math.abs(dx) + Math.abs(dy);
    d.x = e.clientX;
    d.y = e.clientY;
    const r = rotationRef.current;
    applyRotation({
      lon0: r.lon0 - dx * perPx,
      // strop ±60°, aby se koule nepřetočila přes pól
      lat0: Math.max(-60, Math.min(60, r.lat0 + dy * perPx)),
    });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    // krátký tah = klik, ten si řeší Globe sám
    if (d.moved < 6) return;
    const target = nearestContinent(rotationRef.current);
    const next = SECTIONS.findIndex((s) => s.id === target.id);
    goTo(next, next !== indexRef.current);
  };

  const shapes: GlobeShape[] = CONTINENTS.map((c) => {
    const section = SECTIONS.find((s) => s.id === c.id)!;
    return {
      id: c.id,
      label: section.nav[lang],
      points: c.points,
      seat: c.centroid,
      href: section.href,
    };
  });

  return (
    <div className="mm-viewport">
      <TopMenu lang={lang} index={index} onNavigate={navigate} onToggleLang={toggleLang} />

      <div className="mm-scene">
        <div
          ref={stageRef}
          className="mm-stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <Globe
            rotation={rotation}
            shapes={shapes}
            activeId={SECTIONS[index].id}
            onSelect={selectContinent}
            ariaLabel={lang === "cs" ? "Glóbus sekcí" : "Globe of sections"}
          />
        </div>

        {/* aria-live: skutečná navigace neproběhne, takže změnu sekce musí
            čtečce ohlásit tenhle region. */}
        <div aria-live="polite" className="mm-stack">
        {SECTIONS.map((s, i) => (
          <section key={s.id} className="mm-stack-panel" hidden={i !== index} inert={i !== index}>
            {s.id === "home" && <HomePanel lang={lang} onNavigate={navigate} />}
            {s.id === "work" && <WorkPanel lang={lang} />}
            {s.id === "ideas" && <IdeasPanel lang={lang} />}
            {s.id === "contact" && <ContactPanel lang={lang} />}
          </section>
        ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Přepoj `components/site/SiteShell.tsx`**

Nahraď import a návrat:

```tsx
import { cookies } from "next/headers";
import { GlobeShell } from "./GlobeShell";
import type { Lang } from "@/lib/dictionaries";
import type { Section } from "@/lib/site/sections";
import { sectionIndex } from "@/lib/site/sections";

/**
 * Serverový obal koule: každá ze čtyř rout ho vykreslí se svým `section`, takže
 * přímý vstup i sdílený odkaz fungují normálně. Jazyk drží cookie (URL zůstávají
 * anglické v obou jazycích), texty pro oba jazyky jedou v bundlu → přepnutí je okamžité.
 */
export async function SiteShell({ section }: { section: Section["id"] }) {
  const jar = await cookies();
  const lang: Lang = jar.get("mm_lang")?.value === "cs" ? "cs" : "en";

  return <GlobeShell initialIndex={sectionIndex(section)} initialLang={lang} />;
}
```

- [ ] **Step 3: Vyměň CSS pásu za scénu**

V `app/globals.css` nahraď blok od komentáře `/* ── Osobní stránky (matejmauler.com) — vodorovný pás pěti panelů ── */` po uzavření `@media (prefers-reduced-motion: reduce) { .mm-strip … }` (řádky ~277–308) tímhle:

```css
/* ── Osobní stránky (matejmauler.com) — koule a panel pod ní ──
   Ploché, bez dekorací: barvy a fonty jdou jen přes tokeny nahoře. */

.mm-viewport { position: fixed; inset: 0; overflow: hidden; background: var(--color-bg); }

/* Scéna scrolluje jako celek: koule odjede nahoru, když je text dlouhý. */
.mm-scene {
  height: 100%; overflow-y: auto; overscroll-behavior: contain;
  scrollbar-width: none; -ms-overflow-style: none;
}
.mm-scene::-webkit-scrollbar { width: 0; height: 0; display: none; }

.mm-stage {
  width: 100%; max-width: 760px;
  margin: clamp(78px, 12vh, 116px) auto 0;
  padding-inline: clamp(20px, 5vw, 32px);
  display: flex; justify-content: center;
  cursor: grab;
}
.mm-stage:active { cursor: grabbing; }
.mm-stage .mm-globe { width: clamp(230px, 46vw, 360px); }

.mm-inner {
  width: 100%; max-width: 760px; margin: 0 auto;
  padding: clamp(24px, 4vh, 40px) clamp(20px, 5vw, 32px) clamp(48px, 10vh, 96px);
}
/* mm-rise je sdílená animace náběhu; panel se po otočení koule vysune zespodu. */
.mm-stack-panel { animation: mm-rise 380ms cubic-bezier(0.16, 1, 0.3, 1) both; }

@media (prefers-reduced-motion: reduce) {
  .mm-stack-panel { animation: none !important; }
}
```

Zkontroluj, že `@keyframes mm-rise` v souboru pořád existuje (je u bloku „Jak to vidím", který mizí až v Tasku 9 — pokud jsi ho už smazal, přidej ho sem zpátky).

- [ ] **Step 4: Smaž pás**

```bash
git rm components/site/SiteStrip.tsx
```

- [ ] **Step 5: Ověř**

```bash
npm test && npm run lint && npm run build
```
Expected: PASS, žádný odkaz na `SiteStrip`.

Pak `npm run dev` a v prohlížeči zkontroluj: koule se kreslí, tažením se otáčí, po puštění dosedne na kontinent, klik na kontinent i položku v menu otočí kouli a změní URL, zpět v prohlížeči taky funguje, přímý vstup na `/work` vykreslí kouli natočenou na Práci.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(site): GlobeShell nahradil vodorovný pás"
```

---

### Task 6: Země místo časové osy (`lib/site/countries.ts`)

Firma a co jsem v ní dělal. **Bez pozice a bez let** — délku působení nese plocha země.

**Files:**
- Create: `lib/site/countries.ts`
- Test: `lib/site/countries.test.ts`
- Modify: `components/site/panels.tsx` (`WorkPanel`)
- Modify: `app/globals.css` (blok `/* ── Časová osa (životopis) ── */`, řádky ~433–457)
- Delete: `lib/site/timeline.ts`, `lib/site/timeline.test.ts`

**Interfaces:**
- Consumes: `Bi` z `@/lib/about`; `CONTINENTS` z `./continents`.
- Produces:
  - `type Country = { id: string; org: string; body: Bi; bullets?: Bi[]; months: number; seat: [number, number]; blob: number }`
  - `COUNTRIES: Country[]`
  - `countryScale(months: number): number` — lineární měřítko v ⟨0.45, 1⟩
  - `countryShape(c: Country): [number, number][]`
  - `polygonArea(points: [number, number][]): number`
  - `pointInPolygon(p: [number, number], poly: [number, number][]): boolean`

- [ ] **Step 1: Write the failing test**

Create `lib/site/countries.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CONTINENTS } from "./continents";
import { COUNTRIES, countryShape, pointInPolygon, polygonArea } from "./countries";

const langs = ["cs", "en"] as const;
const work = CONTINENTS.find((c) => c.id === "work")!;

describe("země kontinentu Práce", () => {
  it("je jich šest a mají unikátní id", () => {
    expect(COUNTRIES).toHaveLength(6);
    expect(new Set(COUNTRIES.map((c) => c.id)).size).toBe(6);
  });

  it("každá říká, co jsem tam dělal, v obou jazycích", () => {
    for (const c of COUNTRIES) {
      expect(c.org.length).toBeGreaterThan(2);
      for (const l of langs) expect(c.body[l].length).toBeGreaterThan(20);
    }
  });

  it("pozice ani roky v datovém modelu nejsou — náplň, ne pozice", () => {
    for (const c of COUNTRIES) {
      expect(c).not.toHaveProperty("role");
      expect(c).not.toHaveProperty("period");
      expect(c).not.toHaveProperty("current");
    }
  });

  it("plocha země roste s délkou působení", () => {
    const sorted = [...COUNTRIES].sort((a, b) => a.months - b.months);
    for (let i = 1; i < sorted.length; i += 1) {
      expect(polygonArea(countryShape(sorted[i]))).toBeGreaterThanOrEqual(
        polygonArea(countryShape(sorted[i - 1])) - 1e-9,
      );
    }
  });

  it("Beats for Love je největší pevnina", () => {
    const areas = COUNTRIES.map((c) => ({ id: c.id, a: polygonArea(countryShape(c)) }));
    areas.sort((x, y) => y.a - x.a);
    expect(areas[0].id).toBe("b4l");
  });

  it("i nejmenší země unese popisek — aspoň pětina plochy té největší", () => {
    const areas = COUNTRIES.map((c) => polygonArea(countryShape(c)));
    expect(Math.min(...areas) / Math.max(...areas)).toBeGreaterThan(0.19);
  });

  it("všechny země leží uvnitř kontinentu Práce", () => {
    for (const c of COUNTRIES) {
      for (const p of countryShape(c)) {
        expect(pointInPolygon(p, work.points), `${c.id} přetéká přes okraj`).toBe(true);
      }
    }
  });

  it("žádné dvě země se nepřekrývají v sídle té druhé", () => {
    for (const a of COUNTRIES) {
      for (const b of COUNTRIES) {
        if (a.id === b.id) continue;
        expect(pointInPolygon(b.seat, countryShape(a)), `${b.id} sedí v ${a.id}`).toBe(false);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/site/countries.test.ts`
Expected: FAIL — `Failed to resolve import "./countries"`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/site/countries.ts`:

```ts
import type { Bi } from "@/lib/about";

/**
 * Firmy jako země uvnitř kontinentu Práce. Nahradilo časovou osu.
 *
 * Pozice ani roky se nikde nevypisují — z životopisu zůstala jen náplň práce.
 * Délku působení nese plocha země: Beats for Love (2015 → dnes) je zdaleka
 * největší pevnina, Kinder Fest a MarketPUBG malé ostrovy. Čas je tak vidět,
 * aniž by se psal. `months` je jediné, k čemu roky ještě slouží.
 *
 * Neúspěchy zůstávají holé, bez přilepeného ponaučení. Přilepené ponaučení
 * z průšvihu dělá životní moudro — a tohle není portfolio.
 */

export type Country = {
  id: string;
  org: string;
  /** Co jsem tam dělal. Náplň, ne pozice. */
  body: Bi;
  bullets?: Bi[];
  /** Měsíce působení. Do textu se nepíšou, řídí jen velikost země. */
  months: number;
  /** Střed země v [lon, lat]. Musí ležet uvnitř obrysu kontinentu Práce. */
  seat: [number, number];
  /** Který jednotkový obrys použít — ať nejsou všechny země stejné. */
  blob: number;
};

/** Jednotkové obrysy zemí, poloměr ≈ 1. Ručně psané, ať mají siluetu. */
const BLOBS: [number, number][][] = [
  [[-1, 0.2], [-0.7, 0.85], [0, 1], [0.75, 0.8], [1, 0.1], [0.7, -0.7], [0, -1], [-0.75, -0.65]],
  [[-1, -0.1], [-0.8, 0.6], [-0.2, 1], [0.6, 0.9], [1, 0.3], [0.85, -0.5], [0.2, -1], [-0.6, -0.8]],
  [[-0.9, 0.4], [-0.4, 1], [0.4, 0.95], [1, 0.45], [0.9, -0.3], [0.35, -0.95], [-0.45, -0.9], [-1, -0.25]],
];

/** Největší země má poloměr 13°, ostatní se škálují dolů. */
const MAX_RADIUS = 13;

export const COUNTRIES: Country[] = [
  {
    id: "b4l",
    org: "Beats for Love",
    months: 130,
    seat: [88, -6],
    blob: 0,
    body: {
      cs: "Začínal jsem na produkci jako brigádník a už jsem neodešel. Produkce, projektové řízení, pak visitor research. K tomu projektový asistent na Sweetsen Festu. Je to jediná věc, u které jsem zůstal.",
      en: "Started as summer crew on production and never left. Production, project management, then the visitor research. Also project assistant on Sweetsen Fest. It's the one thing I've stayed with.",
    },
  },
  {
    id: "teya",
    org: "Teya",
    months: 16,
    seat: [106, 4],
    blob: 1,
    body: {
      cs: "Platební terminály pro malé podniky. Celý den mluvím s lidma, co nějaký provozují.",
      en: "Card payment terminals for small businesses. I spend the day talking to people who run one.",
    },
  },
  {
    id: "net-direct",
    org: "NetDirect (FLO)",
    months: 15,
    seat: [68, 2],
    blob: 2,
    body: {
      cs: "E-shopy od zadání po předání. Sbírání požadavků, hlídání rozpočtu, komunikace mezi klientem a vývojem.",
      en: "E-commerce builds, brief to handover. Gathering requirements, watching the budget, sitting between the client and the developers.",
    },
  },
  {
    id: "mlada-fronta",
    org: "Mladá fronta",
    months: 19,
    seat: [76, -24],
    blob: 1,
    body: {
      cs: "Herní weby ve vydavatelském domě. Obsah, redakce, provoz.",
      en: "Gaming sites at a publishing house. Content, editorial, running the thing day to day.",
    },
  },
  {
    id: "marketpubg",
    org: "MarketPUBG",
    months: 18,
    seat: [104, -18],
    blob: 2,
    body: {
      cs: "Tržiště se skiny do her. Vlastní firma. Nevyšlo to.",
      en: "A marketplace for game skins. My own company. It didn't make it.",
    },
  },
  {
    id: "kinder-fest",
    org: "Kinder Fest",
    months: 18,
    seat: [90, 15],
    blob: 0,
    body: {
      cs: "Pořádání festivalů pro děti. Skončilo to ošklivě.",
      en: "Producing festivals for children. It ended badly.",
    },
  },
];

/**
 * Lineární měřítko z délky působení. sqrt, protože plocha roste s druhou
 * mocninou — plocha pak roste lineárně s měsíci. Podlaha 0,45 drží nejmenší
 * zemi nad pětinou plochy té největší, aby unesla popisek a dala se kliknout.
 */
export function countryScale(months: number): number {
  const all = COUNTRIES.map((c) => Math.sqrt(c.months));
  const min = Math.min(...all);
  const max = Math.max(...all);
  if (max === min) return 1;
  return 0.45 + 0.55 * ((Math.sqrt(months) - min) / (max - min));
}

export function countryShape(c: Country): [number, number][] {
  const r = MAX_RADIUS * countryScale(c.months);
  return BLOBS[c.blob % BLOBS.length].map(
    ([x, y]) => [c.seat[0] + x * r, c.seat[1] + y * r] as [number, number],
  );
}

/** Plocha polygonu (shoelace). Jen pro testy a řazení, ne pro kreslení. */
export function polygonArea(points: [number, number][]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

/** Ray casting. Hlídá, že země nepřeteče přes okraj kontinentu. */
export function pointInPolygon(p: [number, number], poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const hits = yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi;
    if (hits) inside = !inside;
  }
  return inside;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/site/countries.test.ts`
Expected: PASS, 8 testů.

Pokud padne test „všechny země leží uvnitř kontinentu Práce" nebo „žádné dvě země se nepřekrývají", posuň `seat` té provinilé země o pár stupňů směrem k centroidu kontinentu Práce (`[90, -10]`) a spusť znovu. **Neupravuj kvůli tomu obrys kontinentu ani hodnoty `months`.**

- [ ] **Step 5: Přepiš `WorkPanel` v `components/site/panels.tsx`**

Nahraď import `import { TIMELINE } from "@/lib/site/timeline";` za `import { COUNTRIES } from "@/lib/site/countries";` a celou funkci `WorkPanel` za:

```tsx
export function WorkPanel({ lang }: { lang: Lang }) {
  const s = SECTIONS[1];
  return (
    <div className="mm-inner">
      <h2 className="mm-panel-title">{s.title[lang]}</h2>
      <p className="mm-panel-lead">{s.summary[lang]}</p>
      <ul className="mm-countries">
        {COUNTRIES.map((c) => (
          <li key={c.id} className="mm-country-item">
            <h3 className="mm-country-org">{c.org}</h3>
            <p className="mm-country-text">{c.body[lang]}</p>
            {c.bullets && c.bullets.length > 0 && (
              <ul className="mm-country-bullets">
                {c.bullets.map((b, i) => <li key={i}>{b[lang]}</li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6: Vyměň CSS časové osy**

V `app/globals.css` nahraď celý blok od `/* ── Časová osa (životopis) ── */` po konec jeho `@media (max-width: 560px) { … }` tímhle:

```css
/* ── Země (firmy) — firma a co jsem v ní dělal, bez pozic a bez let ── */
.mm-countries { list-style: none; margin: 0; padding: 0; }
.mm-country-item {
  padding: 20px 0;
  border-top: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
}
.mm-countries li:last-child {
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
}
.mm-country-org {
  font-family: var(--font-voice); font-weight: 700; font-size: 20px;
  letter-spacing: -0.02em; margin: 0 0 8px;
}
.mm-country-text {
  font-family: var(--font-sans); font-size: 15px; line-height: 1.65;
  color: var(--color-text); margin: 0; max-width: 60ch;
}
.mm-country-bullets {
  font-family: var(--font-sans); font-size: 14.5px; line-height: 1.6;
  color: var(--color-text-muted); margin: 10px 0 0; padding-left: 18px;
}
.mm-country-bullets li { margin-bottom: 4px; }
.mm-country-item.is-active .mm-country-org { text-decoration: underline; text-underline-offset: 4px; }
```

- [ ] **Step 7: Smaž časovou osu**

```bash
git rm lib/site/timeline.ts lib/site/timeline.test.ts
```

- [ ] **Step 8: Ověř**

```bash
npm test && npm run lint && npm run build
```
Expected: PASS. `grep -rn "TIMELINE\|mm-tl-" app components lib` nesmí nic najít.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(site): země místo časové osy — firma a náplň, velikost = délka"
```

---

### Task 7: Zoom do kontinentu Práce

Druhá úroveň. Jen Práce — ostatní kontinenty nemají co skrývat.

**Files:**
- Modify: `components/site/Globe.tsx` (vykreslení zemí)
- Modify: `components/site/GlobeShell.tsx` (stav zoomu, klávesnice)
- Modify: `components/site/panels.tsx` (`WorkPanel` dostane `activeCountryId` a tlačítko)
- Modify: `app/globals.css` (styl zemí na kouli)

**Interfaces:**
- Consumes: `COUNTRIES`, `countryShape` z `@/lib/site/countries` (Task 6); `GLOBE_RADIUS` z `./Globe` (Task 4).
- Produces:
  - `Globe` má nově props `regions?: GlobeShape[]` a `activeRegionId?: string | null`, `onSelectRegion?: (id: string) => void`
  - `WorkPanel({ lang, activeCountryId, onSelectCountry, zoomed, onToggleZoom })`

- [ ] **Step 1: Rozšiř `Globe.tsx` o země**

Do props `Globe` přidej:

```tsx
  /** Země uvnitř aktivního kontinentu. Kreslí se až v přiblížení. */
  regions?: GlobeShape[];
  activeRegionId?: string | null;
  onSelectRegion?: (id: string) => void;
```

a do defaultů `regions = []`, `activeRegionId = null`, `onSelectRegion`.

Uvnitř `<g className="mm-globe-world">`, hned **za** blok `drawn.map(...)` a **před** `mm-globe-rim`, přidej:

```tsx
        {regions.map((r) => {
          const poly = projectPolygon(r.points, rotation, GLOBE_RADIUS);
          if (poly.visibility === "hidden") return null;
          const seat = project({ lon: r.seat[0], lat: r.seat[1] }, rotation, GLOBE_RADIUS);
          return (
            // aria-hidden schválně: každá země má v panelu pod mapou svoje
            // <button> (viz WorkPanel), takže druhá sada tabstopů v SVG by jen
            // zdvojila cestu klávesnicí.
            <g
              key={r.id}
              aria-hidden="true"
              className={`mm-country${r.id === activeRegionId ? " is-active" : ""}`}
              onClick={(e) => {
                e.stopPropagation(); // klik na zemi nesmí probublat na kontinent pod ní
                onSelectRegion?.(r.id);
              }}
            >
              <path className="mm-country-land" d={poly.path} />
              {seat.cosc > 0.4 && (
                <text className="mm-country-label" x={seat.x} y={seat.y} textAnchor="middle">
                  {r.label}
                </text>
              )}
            </g>
          );
        })}
```

- [ ] **Step 2: Přidej stav zoomu do `GlobeShell.tsx`**

Přidej importy `import { COUNTRIES, countryShape } from "@/lib/site/countries";` a stav:

```tsx
  const [zoomed, setZoomed] = useState(false);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
```

Zoom se vždycky zavře, když se změní kontinent — přidej do `goTo` hned za `setIndex(next);`:

```tsx
      setZoomed(false);
      setActiveCountry(null);
```

Přidej odvozené hodnoty nad `return`:

```tsx
  const onWork = SECTIONS[index].id === "work";

  const regions: GlobeShape[] = zoomed && onWork
    ? COUNTRIES.map((c) => ({ id: c.id, label: c.org, points: countryShape(c), seat: c.seat }))
    : [];

  /** Klik na kontinent, který už je vepředu, otevře jeho země. */
  const onSelectShape = useCallback(
    (id: string) => {
      if (id === SECTIONS[indexRef.current].id) {
        if (id === "work") setZoomed((v) => !v);
        return;
      }
      selectContinent(id);
    },
    [selectContinent],
  );
```

V `<Globe>` předej:

```tsx
          <Globe
            rotation={rotation}
            shapes={shapes}
            activeId={SECTIONS[index].id}
            onSelect={onSelectShape}
            zoom={zoomed ? 2.5 : 1}
            regions={regions}
            activeRegionId={activeCountry}
            onSelectRegion={setActiveCountry}
          />
```

Přidej `className={zoomed ? "mm-stage is-zoomed" : "mm-stage"}` na `.mm-stage` a předej `WorkPanel` nové props:

```tsx
            {s.id === "work" && (
              <WorkPanel
                lang={lang}
                zoomed={zoomed}
                activeCountryId={activeCountry}
                onSelectCountry={setActiveCountry}
                onToggleZoom={() => setZoomed((v) => !v)}
              />
            )}
```

- [ ] **Step 3: Klávesnice**

Přidej do `GlobeShell` efekt:

```tsx
  // Šipky otáčejí na sousední kontinent, Esc zavře přiblížení. Menu zůstává
  // plnou náhradou za tažení, tohle je jen zrychlení.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") { setZoomed(false); return; }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const step = e.key === "ArrowRight" ? 1 : -1;
      const next = (indexRef.current + step + SECTIONS.length) % SECTIONS.length;
      goTo(next, true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo]);
```

- [ ] **Step 4: Uprav `WorkPanel`**

```tsx
export function WorkPanel({
  lang,
  zoomed,
  activeCountryId,
  onSelectCountry,
  onToggleZoom,
}: {
  lang: Lang;
  zoomed: boolean;
  activeCountryId: string | null;
  onSelectCountry: (id: string | null) => void;
  onToggleZoom: () => void;
}) {
  const s = SECTIONS[1];
  return (
    <div className="mm-inner">
      <h2 className="mm-panel-title">{s.title[lang]}</h2>
      <p className="mm-panel-lead">{s.summary[lang]}</p>

      <button type="button" className="mm-zoom-toggle" onClick={onToggleZoom}>
        {zoomed ? COPY.zoomOut[lang] : COPY.zoomIn[lang]}
      </button>

      <ul className="mm-countries">
        {COUNTRIES.map((c) => (
          <li
            key={c.id}
            className={`mm-country-item${c.id === activeCountryId ? " is-active" : ""}`}
          >
            <h3 className="mm-country-org">
              <button
                type="button"
                className="mm-country-btn"
                onClick={() => onSelectCountry(c.id === activeCountryId ? null : c.id)}
              >
                {c.org}
              </button>
            </h3>
            <p className="mm-country-text">{c.body[lang]}</p>
            {c.bullets && c.bullets.length > 0 && (
              <ul className="mm-country-bullets">
                {c.bullets.map((b, i) => <li key={i}>{b[lang]}</li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Do `lib/site/copy.ts` přidej dva klíče:

```ts
  /** Přepínač přiblížení na kontinent Práce. */
  zoomIn: { cs: "přiblížit na mapu", en: "zoom into the map" },
  zoomOut: { cs: "zpět na glóbus", en: "back to the globe" },
```

- [ ] **Step 5: CSS zemí a přepínače**

Do `app/globals.css` za blok `/* ── Glóbus ── */` přidej:

```css
.mm-country { cursor: pointer; }
.mm-country-land {
  fill: color-mix(in srgb, var(--color-text) 30%, transparent);
  stroke: var(--color-bg); stroke-width: 0.7;
  transition: fill 200ms var(--transition);
}
.mm-country:hover .mm-country-land { fill: color-mix(in srgb, var(--color-text) 45%, transparent); }
.mm-country.is-active .mm-country-land { fill: color-mix(in srgb, var(--color-text) 62%, transparent); }
.mm-country-label {
  font-family: var(--font-mono); font-size: 3.4px; letter-spacing: 0.06em;
  fill: var(--color-text); pointer-events: none; paint-order: stroke;
  stroke: var(--color-bg); stroke-width: 1.2; stroke-linejoin: round;
}
/* v přiblížení kontinenty kolem ustoupí, aby scéna patřila jedné pevnině */
.mm-stage.is-zoomed .mm-continent:not(.is-active) { opacity: 0.12; }
.mm-stage.is-zoomed .mm-continent.is-active .mm-continent-label { opacity: 0; }
.mm-continent, .mm-continent-label { transition: opacity 320ms var(--transition); }

.mm-zoom-toggle {
  display: inline-block; margin: 0 0 20px; padding: 6px 12px;
  background: none; cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--color-text) 22%, transparent);
  border-radius: 999px;
  font-family: var(--font-mono); font-size: 12px; color: var(--color-text-muted);
  transition: color 160ms var(--transition), border-color 160ms var(--transition);
}
.mm-zoom-toggle:hover { color: var(--color-text); border-color: color-mix(in srgb, var(--color-text) 45%, transparent); }

.mm-country-btn {
  background: none; border: none; padding: 0; cursor: pointer; text-align: left;
  font: inherit; color: inherit;
}
.mm-country-btn:hover { text-decoration: underline; text-underline-offset: 4px; }
.mm-country-btn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--color-text) 35%, transparent);
  outline-offset: 4px; border-radius: 4px;
}
```

- [ ] **Step 6: Ověř**

```bash
npm test && npm run lint && npm run build
```
Expected: PASS.

`npm run dev` a zkontroluj: na `/work` tlačítko „přiblížit na mapu" zvětší kouli a ukáže šest zemí; klik na zemi ji zvýrazní na mapě i v seznamu; `Esc` a „zpět na glóbus" přiblížení zavřou; otočení na jiný kontinent zoom taky zavře; šipky ←/→ přepínají kontinenty.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(site): přiblížení na kontinent Práce a země na mapě"
```

---

### Task 8: Nápady (`lib/site/ideas.ts`)

Struktura a tři placeholdery. **Test na `PLACEHOLDER` je záměrně červený**, dokud Matěj nedodá texty — je to pojistka i to-do. Do té doby se větev nemerguje.

**Files:**
- Create: `lib/site/ideas.ts`
- Test: `lib/site/ideas.test.ts`
- Modify: `components/site/panels.tsx` (`IdeasPanel`)
- Modify: `app/globals.css` (blok `/* ── Projekty ── */`, řádky ~472–491, nahradit nápady)

**Interfaces:**
- Consumes: `Bi` z `@/lib/about`.
- Produces: `type Idea = { id: string; title: Bi; what: Bi; why: Bi; hard?: Bi }`, `IDEAS: Idea[]`.

- [ ] **Step 1: Write the failing test**

Create `lib/site/ideas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { IDEAS } from "./ideas";

const langs = ["cs", "en"] as const;

describe("nápady", () => {
  it("jsou aspoň tři a mají unikátní id", () => {
    expect(IDEAS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(IDEAS.map((i) => i.id)).size).toBe(IDEAS.length);
  });

  it("každý nápad má název, co to je a proč by měl existovat — v obou jazycích", () => {
    for (const idea of IDEAS) {
      for (const l of langs) {
        expect(idea.title[l].length).toBeGreaterThan(3);
        expect(idea.what[l].length).toBeGreaterThan(20);
        expect(idea.why[l].length).toBeGreaterThan(40);
      }
    }
  });

  it("v datech nezůstal PLACEHOLDER", () => {
    // Záměrně červený, dokud Matěj nedodá texty. Nemergovat, dokud tenhle test padá.
    for (const idea of IDEAS) {
      const all = [idea.title, idea.what, idea.why, idea.hard ?? { cs: "", en: "" }];
      for (const bi of all) {
        for (const l of langs) expect(bi[l]).not.toContain("PLACEHOLDER");
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/site/ideas.test.ts`
Expected: FAIL — `Failed to resolve import "./ideas"`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/site/ideas.ts`:

```ts
import type { Bi } from "@/lib/about";

/**
 * „Nad čím přemýšlím" — nápady, které nedělám a myslím si, že by měly
 * existovat. Není to seznam projektů: tohle jsou věci k rozebrání. Kdo si
 * jeden vezme, dobře udělá.
 *
 * VŠECHNY TŘI POLOŽKY JSOU PLACEHOLDER — Matěj je přepíše. Test
 * „v datech nezůstal PLACEHOLDER" (lib/site/ideas.test.ts) padá, dokud tu
 * to slovo zůstává. To je záměr, ne rozbitý build.
 *
 * Hlas: sentence case, první osoba, žádná pointa na konci odstavce,
 * max 2–3 věty na blok (viz docs/superpowers/specs/2026-08-12-osobni-web-texty-design.md).
 */

export type Idea = {
  id: string;
  title: Bi;
  /** Jedna věta: co to je. */
  what: Bi;
  /** Odstavec: proč si myslím, že by to mělo existovat. */
  why: Bi;
  /** Volitelně: co by na tom bylo těžké. Bez tohohle je to jen přání. */
  hard?: Bi;
};

export const IDEAS: Idea[] = [
  {
    id: "napad-1",
    title: {
      cs: "PLACEHOLDER — název prvního nápadu",
      en: "PLACEHOLDER — first idea's name",
    },
    what: {
      cs: "PLACEHOLDER — jedna věta, co to je. Konkrétně, ne kategorie.",
      en: "PLACEHOLDER — one sentence on what it is. Concrete, not a category.",
    },
    why: {
      cs: "PLACEHOLDER — odstavec o tom, proč si myslím, že by to mělo existovat. Co dneska chybí a komu.",
      en: "PLACEHOLDER — a paragraph on why I think it should exist. What's missing today, and for whom.",
    },
    hard: {
      cs: "PLACEHOLDER — co by na tom bylo těžké. Volitelné, ale bez toho je to jen přání.",
      en: "PLACEHOLDER — what would be hard about it. Optional, but without it it's just a wish.",
    },
  },
  {
    id: "napad-2",
    title: { cs: "PLACEHOLDER — název druhého nápadu", en: "PLACEHOLDER — second idea's name" },
    what: {
      cs: "PLACEHOLDER — jedna věta, co to je. Konkrétně, ne kategorie.",
      en: "PLACEHOLDER — one sentence on what it is. Concrete, not a category.",
    },
    why: {
      cs: "PLACEHOLDER — odstavec o tom, proč si myslím, že by to mělo existovat. Co dneska chybí a komu.",
      en: "PLACEHOLDER — a paragraph on why I think it should exist. What's missing today, and for whom.",
    },
  },
  {
    id: "napad-3",
    title: { cs: "PLACEHOLDER — název třetího nápadu", en: "PLACEHOLDER — third idea's name" },
    what: {
      cs: "PLACEHOLDER — jedna věta, co to je. Konkrétně, ne kategorie.",
      en: "PLACEHOLDER — one sentence on what it is. Concrete, not a category.",
    },
    why: {
      cs: "PLACEHOLDER — odstavec o tom, proč si myslím, že by to mělo existovat. Co dneska chybí a komu.",
      en: "PLACEHOLDER — a paragraph on why I think it should exist. What's missing today, and for whom.",
    },
  },
];
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/site/ideas.test.ts`
Expected: 2 PASS, 1 FAIL — a to je ten „v datech nezůstal PLACEHOLDER". Přesně takhle to má být.

- [ ] **Step 5: Dopiš `IdeasPanel`**

V `components/site/panels.tsx` přidej `import { IDEAS } from "@/lib/site/ideas";` a rozšiř panel:

```tsx
export function IdeasPanel({ lang }: { lang: Lang }) {
  const s = SECTIONS[2];
  return (
    <div className="mm-inner">
      <h2 className="mm-panel-title">{s.title[lang]}</h2>
      <p className="mm-panel-lead">{COPY.ideasIntro[lang]}</p>
      <ul className="mm-ideas">
        {IDEAS.map((idea) => (
          <li key={idea.id} className="mm-idea">
            <h3 className="mm-idea-title">{idea.title[lang]}</h3>
            <p className="mm-idea-what">{idea.what[lang]}</p>
            <p className="mm-idea-why">{idea.why[lang]}</p>
            {idea.hard && <p className="mm-idea-hard">{idea.hard[lang]}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6: Vyměň CSS projektů za nápady**

V `app/globals.css` nahraď celý blok od `/* ── Projekty: název ve vlastní typografii + odstavec, co to je ── */` po `.mm-project-item.is-past .mm-project { … }` tímhle:

```css
/* ── Nápady: název, co to je, proč by to mělo existovat ── */
.mm-ideas { list-style: none; margin: 0; padding: 0; }
.mm-idea {
  padding: 22px 0;
  border-top: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
}
.mm-ideas li:last-child { border-bottom: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); }
.mm-idea-title {
  font-family: var(--font-voice); font-weight: 700; font-size: 22px;
  letter-spacing: -0.02em; line-height: 1.25; margin: 0 0 10px;
}
.mm-idea-what {
  font-family: var(--font-sans); font-size: 15.5px; line-height: 1.65;
  color: var(--color-text); margin: 0 0 10px; max-width: 60ch;
}
.mm-idea-why {
  font-family: var(--font-sans); font-size: 15px; line-height: 1.7;
  color: var(--color-text-muted); margin: 0; max-width: 62ch;
}
.mm-idea-hard {
  font-family: var(--font-mono); font-size: 13px; line-height: 1.6;
  color: var(--color-text-muted); margin: 12px 0 0; max-width: 58ch;
  padding-left: 14px;
  border-left: 2px solid color-mix(in srgb, var(--color-text) 18%, transparent);
}
```

- [ ] **Step 7: Ověř**

```bash
npm run lint && npm run build
```
Expected: PASS.

```bash
npm test
```
Expected: 1 FAIL — jen „v datech nezůstal PLACEHOLDER". Nic jiného padat nesmí.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(site): sekce Nápady — struktura a placeholdery k přepsání"
```

---

### Task 9: Úklid, mobil a přístupnost

Poslední úloha: pryč s mrtvým CSS, dořešit mobil, `prefers-reduced-motion` a chování bez JS.

**Files:**
- Modify: `app/globals.css` (mrtvé bloky pryč, mobilní pravidla)
- Modify: `components/site/GlobeShell.tsx` (respekt k `prefers-reduced-motion` u zoomu)

- [ ] **Step 1: Smaž mrtvé CSS**

V `app/globals.css` smaž tyhle bloky (žádná komponenta je nepoužívá — ověř `grep` níž):

- `/* ── „Jak to vidím": trojúhelník přesvědčení + kruh pravidel ── */` až `@keyframes mm-rise` **kromě samotného `@keyframes mm-rise`** — ten zůstává, používá ho `.mm-stack-panel`. Konkrétně pryč: `.mm-hisi`, `.mm-hisi-divider`, `.mm-nodes`, `.mm-node`, `.mm-node-btn` (+ `:hover`, `.is-open`, `:focus-visible`), `.mm-cluster-support`, `.mm-support-text`, celý `@media (min-width: 561px)` s trojúhelníkem a kruhem, a `@media (prefers-reduced-motion) { .mm-support-text … }`.
- `/* ── Texty ze Substacku ── */`: `.mm-posts`, `.mm-post*`.
- `/* ── Rozbalovací záznamy ── */`: `.mm-entries`, `.mm-entry*`.

Ověř, že nic z toho není v použití:

```bash
grep -rnE "mm-(hisi|node|cluster|support|post|entry|entries|project|tl-|strip|teaser)" app components lib --include="*.tsx" --include="*.ts"
```
Expected: nic kromě `.mm-teaser*` (ty používá `HomePanel` a zůstávají).

- [ ] **Step 2: Mobil**

Do `app/globals.css` na konec bloku glóbusu přidej:

```css
@media (max-width: 560px) {
  .mm-stage { margin-top: clamp(66px, 10vh, 92px); }
  .mm-stage .mm-globe { width: min(74vw, 300px); }
  /* v přiblížení se na malém displeji nevejdou popisky zemí — čte se seznam pod mapou */
  .mm-stage.is-zoomed .mm-country-label { display: none; }
  .mm-country-item { padding: 18px 0; }
  .mm-idea-title { font-size: 20px; }
}
```

- [ ] **Step 3: Reduced motion u zoomu**

V `GlobeShell.tsx` zabal změnu zoomu tak, aby při `prefers-reduced-motion` proběhla skokem. CSS už to řeší (`.mm-globe-world { transition: none }` v reduced-motion bloku z Tasku 4) — ověř, že to pravidlo v souboru pořád je, a pokud jsi ho smazal, vrať ho.

- [ ] **Step 4: Ověř chování bez JS**

Spusť `npm run build && npm start`, v DevTools vypni JavaScript a načti `/work`.
Expected: menu je z pravých `<a href>` a funguje jako navigace; obsah panelu se vykreslí. Koule je bez JS statická — to je v pořádku, je to dekorace.

Zkontroluj taky `/`, `/ideas`, `/contact`, `/thoughts` (→ redirect na `/ideas`) a `/projects` (→ redirect na `/ideas`).

- [ ] **Step 5: Celkové ověření**

```bash
npm test; npm run lint && npm run build
```
Expected: lint a build PASS. `npm test` hlásí jediný fail — `PLACEHOLDER` v nápadech.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(site): úklid mrtvého CSS, mobil a reduced-motion pro glóbus"
```

---

## Co zbývá na Matěje

Po dokončení plánu zůstávají otevřené dvě věci, které kód udělat nemůže:

1. **Napsat tři nápady** do `lib/site/ideas.ts` místo placeholderů. Dokud tam slovo `PLACEHOLDER` je, `npm test` padá — schválně.
2. **Projít texty zemí** v `lib/site/countries.ts`. Přebraly se z časové osy a u Teyi a Beats for Love se z nich vypustily zmínky navázané na roky, ale je to jeho hlas, ne můj.
