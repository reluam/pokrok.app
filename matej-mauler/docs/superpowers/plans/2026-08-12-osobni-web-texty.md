# Přepis textů osobního webu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přepsat texty všech pěti panelů osobního webu matejmauler.com do honest / humble / to-the-point hlasu a nahradit rotátor přesvědčení + kartotéku myšlenek jednou komponentou (trojúhelník tří přesvědčení + kruh pěti pravidel).

**Architecture:** Texty žijí v čistě datových modulech pod `lib/site/` a `lib/projects.ts`; komponenty je jen vykreslují. Proto je většina práce editace dat, krytá vitest testy na invarianty (oba jazyky vyplněné, žádné TODO, očekávané pořadí položek). Jediná nová komponenta je `components/site/HowISeeIt.tsx` — dva shluky uzlů se sdíleným disclosure panelem, geometrie čistě v CSS.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, vitest (node env, jen `lib/**/*.test.ts`), plain CSS v `app/globals.css`.

## Global Constraints

- **Spec je závazný:** `docs/superpowers/specs/2026-08-12-osobni-web-texty-design.md`. Všechny texty se kopírují **doslova** z něj — neparafrázovat, nevylepšovat.
- **Hlasové pravidlo 8:** web nesmí působit jako portfolio úspěšného člověka. Neúspěchy (`It ended badly.`, `It didn't make it.`) i přiznání rozdělanosti (`Plenty of them are unfinished…`) zůstávají přesně jak jsou. Neměkčit, nevyhazovat.
- **Dvojjazyčnost:** typ `Bi = { cs: string; en: string }`. Web běží EN-only (`getLang() → "en"`), ale cs se udržuje vyplněné — nikdy prázdný řetězec.
- **Žádný `Co-Authored-By` trailer v commitech** (rozbíjí Vercel deploy) — viz `CLAUDE.md`.
- Sentence case, ne lowercase (lowercase je hlas experimentů na Spaghetti, ne osobního webu).
- Ověřovací příkazy: `npm test`, `npm run lint`, `npm run build`.

---

## File Structure

| soubor | odpovědnost | zásah |
|---|---|---|
| `lib/site/copy.ts` | texty rozcestníku mimo sekce | přepis: `DESCRIPTION` (nový, pole odstavců), `metaDescription` (nový), `nowIntro`, `inPractice` (přejmenovaný `beliefsHeading`); mazání `thoughtsShort`, `thoughtsShortLead`, `prev`, `next` |
| `lib/site/sections.ts` | pět sekcí pásu | přepis `summary` u work / projects / thoughts / contact |
| `lib/projects.ts` | projekty do „Čemu se věnuju teď" | přepis tří blurbů |
| `lib/site/timeline.ts` | životopis | přepis všech šesti položek + doplnění `period` |
| `lib/site/beliefs.ts` | tři přesvědčení + sdílený typ `Conviction` | přepis `support`, export typu |
| `lib/site/thoughts.ts` | pět pravidel | 12 → 5, přejmenování `THOUGHTS` → `RULES`, změna tvaru |
| `components/site/HowISeeIt.tsx` | **nový** — trojúhelník + kruh | vytvořit |
| `components/site/decks.tsx` | starý rotátor + kartotéka | **smazat** |
| `components/site/panels.tsx` | obsah panelů | `HomePanel` (odstavce), `WorkPanel` (`period` vždy), `ThoughtsPanel` (nová komponenta) |
| `app/page.tsx` | metadata hlavní stránky | `metadata.description` + JSON-LD berou `metaDescription` |
| `app/globals.css` | styly | přidat `.mm-hisi*`, upravit `.mm-description`, odstranit mrtvé třídy |

---

## Task 1: Texty rozcestníku (home, sekce, projekty)

**Files:**
- Modify: `lib/site/copy.ts`
- Modify: `lib/site/sections.ts`
- Modify: `lib/projects.ts`
- Modify: `components/site/panels.tsx` (jen `HomePanel`)
- Modify: `app/page.tsx`
- Modify: `app/globals.css` (jen `.mm-description`)
- Test: `lib/site/copy.test.ts`

**Interfaces:**
- Produces: `DESCRIPTION: Bi[]` a `COPY.metaDescription: Bi` z `lib/site/copy.ts`. `COPY.inPractice: Bi` (spotřebuje Task 4). `COPY.nowIntro`, `COPY.contactLabel`, `COPY.goTo`, `COPY.timelineNow`, `COPY.langSwitch` zůstávají.
- Consumes: nic z dřívějších tasků.

**Pozor:** `COPY.description` byl jeden `Bi`, ale nový text má tři odstavce. Jeden `<p>` s `\n\n` by se v HTML slil do jednoho bloku, proto se z něj stává **pole odstavců** mimo `COPY` (aby `satisfies Record<string, Bi>` dál platilo).

**Pozor 2 — pořadí mazání.** `thoughtsShort`, `thoughtsShortLead`, `prev`, `next` a `beliefsHeading` pořád konzumuje `decks.tsx` a `ThoughtsPanel`, které tenhle task nesmí sahat. Smazat je teď by shodilo typovou kontrolu, a tím i `npm run build` v Kroku 10. **Zůstávají v `COPY` až do Tasku 5**, který `decks.tsx` maže — stejný odklad, jaký plán už používá pro `timelineNow`. `inPractice` se v tomhle tasku jen **přidává**; `beliefsHeading` tedy chvíli existuje vedle něj.

- [ ] **Step 1: Napiš padající test**

Vytvoř `lib/site/copy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { COPY, DESCRIPTION } from "./copy";
import { SECTIONS } from "./sections";
import { projects } from "@/lib/projects";

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

  it("description je pryč z COPY a inPractice přibyl", () => {
    expect(COPY).not.toHaveProperty("description");
    expect(COPY.inPractice.en).toBe("so, in practice");
  });

  it("každá sekce kromě home má shrnutí v obou jazycích", () => {
    for (const s of SECTIONS.filter((x) => x.id !== "home")) {
      for (const l of langs) expect(s.summary[l].length).toBeGreaterThan(20);
    }
  });

  it("projekty přiznávají, v jakém jsou stavu — pravidlo 8", () => {
    const spaghetti = projects.find((p) => p.name === "Spaghetti.ltd")!;
    expect(spaghetti.blurb.en).toContain("unfinished");
    const stats = projects.find((p) => p.name === "Stats & Facts")!;
    expect(stats.url).toBeUndefined();
    expect(stats.blurb.en).toContain("early");
  });

  it("v žádném blurbu nezůstalo TODO", () => {
    for (const p of projects) {
      for (const l of langs) expect(p.blurb[l]).not.toContain("TODO");
    }
  });
});
```

- [ ] **Step 2: Spusť test a ověř, že padá**

Run: `npm test -- lib/site/copy.test.ts`
Expected: FAIL — `DESCRIPTION` z `./copy` neexistuje (import error).

- [ ] **Step 3: Přepiš `lib/site/copy.ts`**

Nahraď celý obsah souboru:

```ts
import type { Bi } from "@/lib/about";

/**
 * Texty osobních stránek. Záměrně mimo lib/dictionaries.ts — ten je svázaný
 * s admin overridy a experimenty; tohle je statický obsah rozcestníku.
 *
 * Hlas: honest, humble, to the point. Žádná pointa na konci odstavce, žádné
 * sebehodnocení, neúspěchy holé. Web popisuje člověka, co se snaží žít, jak umí —
 * ne portfolio. Viz docs/superpowers/specs/2026-08-12-osobni-web-texty-design.md.
 */

/**
 * Úvod na hlavní stránce. Každý prvek = jeden <p>; proto pole a ne jeden Bi.
 * „for me" / „pro mě" v první větě je záměrné — dělá z toho Matějovu zkušenost,
 * ne tvrzení o tom, jaký život je. Nevypouštět.
 */
export const DESCRIPTION: Bi[] = [
  {
    cs: "Jsem Matěj. Jsem z živočišného druhu člověk. Život a to, být člověkem, je pro mě fascinující, pokořující a úžasná zkušenost.",
    en: "I'm Matěj. I'm of the human species. Life, and being human, is a fascinating, humbling and awe-inspiring experience for me.",
  },
  {
    cs: "Svým malým dílem chci přispět k tomu, aby byl ještě fascinující. Tak se pořád učím — o světě, o lidech, o sobě.",
    en: "In my small way I want to make it more fascinating still. So I keep learning — about the world, about people, about myself.",
  },
  {
    cs: "Ať dělám cokoli, dělám to s tímhle cílem — jako projektový manažer, jako muzikant, jako člověk.",
    en: "Whatever I do, I do it with that end goal in mind — as a project manager, as a musician, as a human being.",
  },
];

export const COPY = {
  /**
   * Hlavní stránka záměrně nenese jediný konkrétní fakt, takže veškerou
   * faktickou váhu pro vyhledávače nese tenhle řádek. Držet pod 165 znaky.
   */
  metaDescription: {
    cs: "Matěj Mauler — obchod v Teyi, hudba jako Matt Mauler a malé webové experimenty po večerech. Pořád se učím o světě, o lidech a o sobě.",
    en: "Matěj Mauler — sales at Teya, music as Matt Mauler, and small web experiments in the evenings. Still learning about the world, people, and myself.",
  },
  /** Popisek nad kontakty. */
  contactLabel: { cs: "Ozvi se", en: "Say hi" },
  /** Aria popisek šipky na hlavní stránce. */
  goTo: { cs: "Přejít na", en: "Go to" },
  timelineNow: { cs: "teď", en: "now" },
  /** Dělič mezi trojúhelníkem přesvědčení a kruhem pravidel. */
  inPractice: { cs: "a v praxi", en: "so, in practice" },

  // ── Dožívá do Tasku 5 ──
  // Pořád to konzumuje decks.tsx a ThoughtsPanel. Maže se až s nimi,
  // jinak spadne typová kontrola. beliefsHeading nahradil inPractice výše.
  beliefsHeading: { cs: "Jsem přesvědčený, že…", en: "I believe that…" },
  thoughtsShort: { cs: "Myslím si", en: "I think" },
  thoughtsShortLead: {
    cs: "Věci, na které jsem za ta léta přišel. Nic z toho není originální — ale všechno mě to něco stálo.",
    en: "Things I've worked out over the years. None of it is original — but all of it cost me something.",
  },
  prev: { cs: "Předchozí", en: "Previous" },
  next: { cs: "Další", en: "Next" },
  /** Úvod sekce „Čemu se věnuju teď". */
  nowIntro: {
    cs: "Nic z toho není byznys. Dělám to, protože chci, aby to existovalo.",
    en: "None of this is a business. I make it because I want it to exist.",
  },
  langSwitch: {
    cs: "Switch to English",
    en: "Přepnout do češtiny",
  },
} satisfies Record<string, Bi>;
```

- [ ] **Step 4: Přepiš shrnutí v `lib/site/sections.ts`**

Ponech soubor beze změny kromě čtyř `summary` bloků (`nav` i `title` zůstávají):

```ts
// work
    summary: {
      cs: "Kde jsem pracoval, od nejnovějšího. Fintech, e-shopy, vlastní firma, herní weby a festival, u kterého jsem od roku 2015.",
      en: "Where I've worked, newest first. Fintech, e-commerce, a company of my own, gaming sites, and a festival I've been at since 2015.",
    },
// projects
    summary: {
      cs: "Tři věci, ke kterým se pořád vracím. Ani jedna nic nevydělává.",
      en: "Three things I keep coming back to. None of them pay for anything.",
    },
// thoughts
    summary: {
      cs: "Pár věcí, na kterých jsem zůstal. Nejsou to rady, je to jen to, kde jsem.",
      en: "A few things I've landed on. Not advice — just where I am.",
    },
// contact
    summary: {
      cs: "Nejrychleji Discord. Mail taky funguje. Důvod není potřeba.",
      en: "Discord is fastest. Email works too. No reason needed.",
    },
```

- [ ] **Step 5: Přepiš blurby v `lib/projects.ts`**

Nahraď tři `blurb` bloky (`name`, `url`, `status`, `typeStyle` zůstávají; u `Stats & Facts` **smaž komentář `// TODO: doplnit URL…`**, `url` tam dál nepatří):

```ts
// Matt Mauler
    blurb: {
      cs: "Hudba. Nejstarší věc, co dělám. Nahrávky jsou na SoundCloudu.",
      en: "Music. The oldest thing I do. Tracks are on SoundCloud.",
    },
// Spaghetti.ltd
    blurb: {
      cs: "Interaktivní webové experimenty — zvuk, hudba, rádio běžící na serveru, encyklopedie, hry. Spousta z nich je nedodělaná a skoro nikdo je neviděl.",
      en: "Interactive web experiments — sound, music, a radio that runs on the server, an encyclopedia, games. Plenty of them are unfinished and hardly anyone has seen them.",
    },
// Stats & Facts
    blurb: {
      cs: "Interaktivní reporty, postavené tak, abys viděl, na čem ta čísla visí. Je to na začátku — pořád to běží na dočasné doméně, takže odkaz zatím není.",
      en: "Interactive reports, built so you can see what the numbers connect to. It's early — it still lives on a temporary domain, so there's no link yet.",
    },
```

- [ ] **Step 6: Spusť test a ověř, že prochází**

Run: `npm test -- lib/site/copy.test.ts`
Expected: PASS (7 testů).

- [ ] **Step 7: Vykresli odstavce v `HomePanel`**

V `components/site/panels.tsx` uprav import a `HomePanel`:

```tsx
import { COPY, DESCRIPTION } from "@/lib/site/copy";
```

a v `HomePanel` nahraď řádek `<p className="mm-description">{COPY.description[lang]}</p>`:

```tsx
        {DESCRIPTION.map((p, i) => (
          <p key={i} className="mm-description">{p[lang]}</p>
        ))}
```

- [ ] **Step 8: Uprav odsazení odstavců v `app/globals.css`**

Blok `.mm-description` (kolem řádku 366) měl `margin: 0 0 40px` pro jediný odstavec. Teď jich je víc:

```css
.mm-description {
  font-family: var(--font-sans); font-size: clamp(16px, 2.2vw, 18px); line-height: 1.65;
  color: var(--color-text); max-width: 58ch; margin: 0 0 18px;
}
/* poslední odstavec drží odstup od rozcestníku sekcí */
.mm-description:last-of-type { margin-bottom: 40px; }
```

- [ ] **Step 9: Přepni metadata v `app/page.tsx`**

Nahraď řádek `const positioning = COPY.description.en;`:

```ts
const positioning = COPY.metaDescription.en;
```

Zbytek souboru (metadata, openGraph, jsonLd) zůstává — všechny tři už `positioning` používají.

- [ ] **Step 10: Ověř build a lint**

Run: `npm run lint && npm run build`
Expected: oboje projde. Build by chytil zapomenutý `COPY.description` kdekoli jinde.

- [ ] **Step 11: Commit**

```bash
git add lib/site/copy.ts lib/site/copy.test.ts lib/site/sections.ts lib/projects.ts components/site/panels.tsx app/globals.css app/page.tsx
git commit -m "feat(site): přepsat texty rozcestníku — honest, humble, bez pointy na konci"
```

---

## Task 2: Historie (timeline)

**Files:**
- Modify: `lib/site/timeline.ts`
- Modify: `components/site/panels.tsx` (jen `WorkPanel`)
- Test: `lib/site/timeline.test.ts`

**Interfaces:**
- Consumes: `COPY.timelineNow` z Tasku 1 (zůstal beze změny).
- Produces: `TIMELINE: TimelineEntry[]` — `{ id, org, period, role: Bi, body: Bi, bullets?: Bi[], current?: boolean }`. Tvar typu se **nemění**.

**Pozor:** položky jsou dvě s `current: true` (Teya i Beats for Love). `WorkPanel` dnes u `current` vykresluje `COPY.timelineNow` **místo** `period` — u B4L by to zahodilo „2015 –". Proto se `period` bude vypisovat vždycky a `current` zůstane jen na vizuální zvýraznění (třída `is-current`, ta se nemění).

- [ ] **Step 1: Napiš padající test**

Vytvoř `lib/site/timeline.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TIMELINE } from "./timeline";

const langs = ["cs", "en"] as const;

describe("TIMELINE", () => {
  it("má šest položek od nejnovější po nejstarší", () => {
    expect(TIMELINE.map((t) => t.org)).toEqual([
      "Teya",
      "NetDirect (FLO)",
      "Kinder Fest",
      "MarketPUBG",
      "Mladá fronta",
      "Beats for Love",
    ]);
  });

  it("každá položka má vyplněné roky, žádné TODO", () => {
    for (const t of TIMELINE) {
      expect(t.period.length).toBeGreaterThan(3);
      expect(t.period).not.toContain("TODO");
      for (const l of langs) {
        expect(t.role[l]).not.toContain("TODO");
        expect(t.body[l].length).toBeGreaterThan(20);
      }
    }
  });

  it("běžící role jsou dvě — Teya i Beats for Love", () => {
    expect(TIMELINE.filter((t) => t.current).map((t) => t.org)).toEqual(["Teya", "Beats for Love"]);
  });

  it("neúspěchy zůstávají holé, bez přilepeného ponaučení — pravidlo 8", () => {
    const byId = (id: string) => TIMELINE.find((t) => t.id === id)!;
    expect(byId("kinder-fest").body.en).toContain("It ended badly.");
    expect(byId("marketpubg").body.en).toContain("It didn't make it.");
  });

  it("id jsou unikátní", () => {
    const ids = TIMELINE.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Spusť test a ověř, že padá**

Run: `npm test -- lib/site/timeline.test.ts`
Expected: FAIL — pořadí `org` nesedí (chybí Kinder Fest, jiné pořadí) a `period` je všude `"TODO"`.

- [ ] **Step 3: Přepiš `lib/site/timeline.ts`**

Nahraď celý obsah souboru:

```ts
import type { Bi } from "@/lib/about";

/**
 * Životopis na časové ose, od nejnovějšího. Beats for Love běží průběžně od 2015
 * (dva roky z toho na plný úvazek), takže mezery mezi ostatními položkami nejsou
 * prázdné roky — timeline díry nemá a nemusí je vysvětlovat.
 *
 * Neúspěchy zůstávají holé, bez přilepeného ponaučení. Přilepené ponaučení
 * z průšvihu dělá životní moudro — a tohle není portfolio.
 */
export type TimelineEntry = {
  id: string;
  org: string;
  period: string;
  role: Bi;
  body: Bi;
  bullets?: Bi[];
  /** Jen vizuální zvýraznění. `period` se vypisuje vždycky. */
  current?: boolean;
};

export const TIMELINE: TimelineEntry[] = [
  {
    id: "teya",
    org: "Teya",
    period: "May 2025 – now",
    role: { cs: "Obchod", en: "Sales" },
    body: {
      cs: "Platební terminály pro malé podniky. Celý den mluvím s lidma, co nějaký provozují.",
      en: "Card payment terminals for small businesses. I spend the day talking to people who run one.",
    },
    current: true,
  },
  {
    id: "net-direct",
    org: "NetDirect (FLO)",
    period: "Sep 2023 – Nov 2024",
    role: { cs: "Projektový manažer", en: "Project manager" },
    body: {
      cs: "E-shopy od zadání po předání.",
      en: "E-commerce builds, brief to handover.",
    },
  },
  {
    id: "kinder-fest",
    org: "Kinder Fest",
    period: "2020 – 2021",
    role: { cs: "Festivaly pro děti", en: "Festivals for kids" },
    body: {
      cs: "Pořádání festivalů pro děti. Skončilo to ošklivě.",
      en: "Producing festivals for children. It ended badly.",
    },
  },
  {
    id: "marketpubg",
    org: "MarketPUBG",
    period: "2019 – 2020",
    role: { cs: "Zakladatel", en: "Founder" },
    body: {
      cs: "Tržiště se skiny do her. Vlastní firma. Nevyšlo to.",
      en: "A marketplace for game skins. My own company. It didn't make it.",
    },
  },
  {
    id: "mlada-fronta",
    org: "Mladá fronta",
    period: "Feb 2018 – Aug 2019",
    role: { cs: "Herní weby", en: "Gaming websites" },
    body: {
      cs: "Herní weby ve vydavatelském domě.",
      en: "Gaming sites at a publishing house.",
    },
  },
  {
    id: "b4l",
    org: "Beats for Love",
    period: "2015 – now",
    role: {
      cs: "Festival insights & visitor research",
      en: "Festival insights & visitor research",
    },
    body: {
      cs: "Začínal jsem v roce 2015 na produkci jako brigádník a už jsem neodešel. Produkce, projektové řízení, dva roky na plný úvazek mezi 2021 a 2023, dneska visitor research. K tomu projektový asistent na Sweetsen Festu. Je to jediná věc, u které jsem zůstal.",
      en: "Started as summer crew on production in 2015 and never left. Production, project management, two years full-time between 2021 and 2023, and now the visitor research. Also project assistant on Sweetsen Fest. It's the one thing I've stayed with.",
    },
    current: true,
  },
];
```

- [ ] **Step 4: Spusť test a ověř, že prochází**

Run: `npm test -- lib/site/timeline.test.ts`
Expected: PASS (5 testů).

- [ ] **Step 5: Vypisuj `period` vždycky**

V `components/site/panels.tsx`, ve `WorkPanel`, nahraď řádek
`<span className="mm-tl-period">{t.current ? COPY.timelineNow[lang] : t.period}</span>`:

```tsx
              <span className="mm-tl-period">{t.period}</span>
```

`COPY.timelineNow` tím ztrácí posledního konzumenta v tomhle souboru — **nech ho v `copy.ts`**, mažeme ho až v Tasku 5 po ověření, že ho nepoužívá nic jiného.

- [ ] **Step 6: Ověř build**

Run: `npm run lint && npm run build`
Expected: oboje projde.

- [ ] **Step 7: Commit**

```bash
git add lib/site/timeline.ts lib/site/timeline.test.ts components/site/panels.tsx
git commit -m "feat(site): historie s reálnými roky, dvě běžící role, faily bez ponaučení"
```

---

## Task 3: Data pro „Jak to vidím" (3 přesvědčení + 5 pravidel)

**Files:**
- Modify: `lib/site/beliefs.ts`
- Modify: `lib/site/thoughts.ts`
- Test: `lib/site/howISeeIt.test.ts`

**Interfaces:**
- Produces:
  - `lib/site/beliefs.ts` → `export type Conviction = { id: string; claim: Bi; support: Bi }` a `export const BELIEFS: Conviction[]` (3 položky).
  - `lib/site/thoughts.ts` → `export const RULES: Conviction[]` (5 položek), typ importuje z `beliefs.ts`.
  - Obě pole spotřebuje Task 4 (`HowISeeIt`).
- Consumes: nic. Starý `Belief` a `Thought` typ i export `THOUGHTS` **zanikají** — jediný konzument byl `decks.tsx`, který mizí v Tasku 5.

- [ ] **Step 1: Napiš padající test**

Vytvoř `lib/site/howISeeIt.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BELIEFS } from "./beliefs";
import { RULES } from "./thoughts";

const langs = ["cs", "en"] as const;
const all = [...BELIEFS, ...RULES];

describe("Jak to vidím", () => {
  it("tři přesvědčení a pět pravidel", () => {
    expect(BELIEFS).toHaveLength(3);
    expect(RULES).toHaveLength(5);
  });

  it("žádné id se neopakuje napříč vrstvami", () => {
    const ids = all.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("každá položka má claim i support v obou jazycích", () => {
    for (const x of all) {
      for (const l of langs) {
        expect(x.claim[l].length).toBeGreaterThan(10);
        expect(x.support[l].length).toBeGreaterThan(30);
      }
    }
  });

  it("claim je jedna věta zakončená tečkou", () => {
    for (const x of all) {
      for (const l of langs) {
        expect(x.claim[l].endsWith(".")).toBe(true);
        expect(x.claim[l].length).toBeLessThan(60);
      }
    }
  });

  it("'Done beats perfect' si drží přiznání, že to Matějovi pořád nejde", () => {
    const done = RULES.find((r) => r.id === "hotove")!;
    expect(done.support.en).toContain("I'm still bad at this.");
  });

  it("všechno je v první osobě — nejsou to rady čtenáři", () => {
    for (const x of all) {
      expect(x.support.en).toMatch(/\b(I|my|me)\b/);
    }
  });
});
```

- [ ] **Step 2: Spusť test a ověř, že padá**

Run: `npm test -- lib/site/howISeeIt.test.ts`
Expected: FAIL — `RULES` z `./thoughts` neexistuje (import error).

- [ ] **Step 3: Přepiš `lib/site/beliefs.ts`**

Nahraď celý obsah souboru:

```ts
import type { Bi } from "@/lib/about";

/**
 * Sdílený tvar obou vrstev sekce „Jak to vidím": trojúhelníku přesvědčení
 * (tenhle soubor) i kruhu pravidel (lib/site/thoughts.ts).
 * Všechno v první osobě — nejsou to rady čtenáři, ale co si Matěj myslí o sobě.
 */
export type Conviction = {
  id: string;
  claim: Bi;
  support: Bi;
};

/** ▲ Jak to podle mě je. Nesmí se překrývat s RULES. */
export const BELIEFS: Conviction[] = [
  {
    id: "zodpovednost",
    claim: {
      cs: "Za svůj život jsem zodpovědný jenom já.",
      en: "I alone am responsible for my life.",
    },
    support: {
      cs: "Mám podporu. Ta rozhodnutí se stejně každé ráno objeví s mým jménem.",
      en: "I have support. The decisions still show up every morning with my name on them.",
    },
  },
  {
    id: "cernobile",
    claim: {
      cs: "Skoro nic není jenom černobílé.",
      en: "Almost nothing is only black and white.",
    },
    support: {
      cs: "Buď práce, nebo svoboda. Buď rodina, nebo kariéra. Roky jsem v tom byl zaseklý a ani jedna ta dvojice nebyla skutečná.",
      en: "Work or freedom. Family or career. I spent years stuck inside those, and neither pair was real.",
    },
  },
  {
    id: "mozek",
    claim: {
      cs: "Můj mozek je hloupější, než si myslím.",
      en: "My brain is dumber than I think.",
    },
    support: {
      cs: "Většinu času jedu na autopilota. Stavím kolem toho, místo abych se s ním hádal.",
      en: "Most of the time I run on autopilot. I build around that instead of arguing with it.",
    },
  },
];
```

- [ ] **Step 4: Přepiš `lib/site/thoughts.ts`**

Nahraď celý obsah souboru:

```ts
import type { Conviction } from "./beliefs";

/**
 * ● Jak se kvůli tomu chovám. Pod trojúhelníkem přesvědčení v sekci „Jak to vidím".
 * Vybráno z původního desatera — zbytek vypadl, protože se buď kryl s něčím jiným,
 * nebo to byl obsah, který najdeš na kterémkoli seberozvojovém webu.
 */
export const RULES: Conviction[] = [
  {
    id: "hotove",
    claim: { cs: "Hotové je lepší než dokonalé.", en: "Done beats perfect." },
    support: {
      cs: "Umím něco ladit měsíce. Dokud to není venku, nic mi neřekne, jestli jsem měl pravdu. Pořád mi to nejde.",
      en: "I can polish something for months. Until it's out, nothing tells me whether I was right. I'm still bad at this.",
    },
  },
  {
    id: "jedna-vec",
    claim: { cs: "Žádná jedna věc to nespraví.", en: "Nothing gets fixed in one move." },
    support: {
      cs: "Žádná kniha, žádný kurz, žádné jedno rozhodnutí to za mě neudělaly. Jenom hodně malých věcí naskládaných v čase.",
      en: "No book, no course, no single decision has ever done it for me. Only a lot of small things stacked over time.",
    },
  },
  {
    id: "sebevedomi",
    claim: {
      cs: "Sebevědomí přijde až potom, ne předtím.",
      en: "Confidence comes after, not before.",
    },
    support: {
      cs: "Nikdy jsem se do toho neupovídal. Vždycky jsem to jenom udělal a zjistil to až pak.",
      en: "I've never talked myself into it. I've only ever done the thing and found out afterwards.",
    },
  },
  {
    id: "intuice",
    claim: {
      cs: "Divný pocit beru vážně, pak si ho ověřím.",
      en: "I take the weird feeling seriously, then check it.",
    },
    support: {
      cs: "Není to magie, je to můj mozek, co si něčeho všiml dřív, než to umím pojmenovat. Dobrý první signál, špatná konečná odpověď.",
      en: "It's not magic, it's my brain noticing something before I can name it. Good first signal, bad final answer.",
    },
  },
  {
    id: "vazne-sebe",
    claim: { cs: "Neberu se tak vážně.", en: "I don't take myself that seriously." },
    support: {
      cs: "Když je všechno vážné, každá chyba je katastrofa. Je to jediná věc, co mě spolehlivě donutí zkusit něco veřejně.",
      en: "When everything is serious, every mistake is a disaster. It's the only thing that reliably gets me to try something in public.",
    },
  },
];
```

- [ ] **Step 5: Spusť test a ověř, že prochází**

Run: `npm test -- lib/site/howISeeIt.test.ts`
Expected: PASS (6 testů).

**Poznámka:** `npm run build` teď **selže** — `decks.tsx` pořád importuje `THOUGHTS` a `BELIEFS[].title`. To je čekané, opraví to Task 4. Build se ověřuje až tam.

- [ ] **Step 6: Commit**

```bash
git add lib/site/beliefs.ts lib/site/thoughts.ts lib/site/howISeeIt.test.ts
git commit -m "feat(site): jak to vidím — 3 přesvědčení + 5 pravidel místo desatera"
```

---

## Task 4: Komponenta HowISeeIt (trojúhelník + kruh)

**Files:**
- Create: `components/site/HowISeeIt.tsx`
- Modify: `components/site/panels.tsx` (jen `ThoughtsPanel` + importy)
- Modify: `app/globals.css` (přidat blok `.mm-hisi*`)

**Interfaces:**
- Consumes: `Conviction`, `BELIEFS` (Task 3), `RULES` (Task 3), `COPY.inPractice` (Task 1).
- Produces: `export function HowISeeIt({ lang }: { lang: Lang })`.

**Chování:** dva shluky uzlů. Klik na uzel rozbalí jeho `support` do panelu pod shlukem; klik na otevřený uzel ho zavře. Každý shluk má **vlastní nezávislý stav** — otevřené přesvědčení nezavírá otevřené pravidlo. Výchozí stav: nic otevřené. Žádný autoplay.

**Přístupnost:** uzly jsou `<button>`, vzor je disclosure (`aria-expanded` + `aria-controls`), ne tabs. Geometrie je čistě vizuální — pořadí v DOM = pořadí čtení = pořadí v poli.

**Responsivita:** nad 560 px platí geometrie, pod ním se oba shluky sesypou do prostého sloupce. Disclosure funguje stejně v obou režimech — mění se jen CSS, DOM je jeden.

- [ ] **Step 1: Vytvoř `components/site/HowISeeIt.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { Lang } from "@/lib/dictionaries";
import type { Conviction } from "@/lib/site/beliefs";
import { BELIEFS } from "@/lib/site/beliefs";
import { COPY } from "@/lib/site/copy";
import { RULES } from "@/lib/site/thoughts";

/**
 * Sekce „Jak to vidím": nahoře trojúhelník tří přesvědčení (jak to podle mě je),
 * pod ním kruh pěti pravidel (jak se kvůli tomu chovám). Geometrie je v CSS —
 * tady je jen pořadí a disclosure. Nic se nehýbe samo.
 */

/** Jeden shluk uzlů se sdíleným panelem na `support` otevřené položky. */
function Cluster({
  items,
  lang,
  shape,
  idPrefix,
}: {
  items: Conviction[];
  lang: Lang;
  shape: "triangle" | "circle";
  idPrefix: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const active = items.find((i) => i.id === open) ?? null;
  const panelId = `${idPrefix}-support`;

  return (
    <div className={`mm-cluster mm-cluster--${shape}`}>
      <ul className="mm-nodes">
        {items.map((item, i) => (
          <li key={item.id} className="mm-node" style={{ "--i": i } as CSSProperties}>
            <button
              type="button"
              className={`mm-node-btn${open === item.id ? " is-open" : ""}`}
              aria-expanded={open === item.id}
              aria-controls={panelId}
              onClick={() => setOpen((v) => (v === item.id ? null : item.id))}
            >
              {item.claim[lang]}
            </button>
          </li>
        ))}
      </ul>

      <div id={panelId} className="mm-cluster-support">
        {/* key → text se při přepnutí znovu vykreslí, takže naběhne animace */}
        {active && <p key={active.id} className="mm-support-text">{active.support[lang]}</p>}
      </div>
    </div>
  );
}

export function HowISeeIt({ lang }: { lang: Lang }) {
  return (
    <div className="mm-hisi">
      <Cluster items={BELIEFS} lang={lang} shape="triangle" idPrefix="belief" />
      <p className="mm-hisi-divider">{COPY.inPractice[lang]}</p>
      <Cluster items={RULES} lang={lang} shape="circle" idPrefix="rule" />
    </div>
  );
}
```

- [ ] **Step 2: Zapoj komponentu v `components/site/panels.tsx`**

Nahraď import `import { BeliefRotator, ThoughtDeck } from "./decks";`:

```tsx
import { HowISeeIt } from "./HowISeeIt";
```

a nahraď tělo `ThoughtsPanel` (řádky s `BeliefRotator`, `mm-block-heading`, `mm-block-lead`, `ThoughtDeck`):

```tsx
export function ThoughtsPanel({ lang }: { lang: Lang }) {
  const s = SECTIONS[3];
  return (
    <div className="mm-inner">
      <h2 className="mm-panel-title">{s.title[lang]}</h2>
      <p className="mm-panel-lead">{s.summary[lang]}</p>
      <HowISeeIt lang={lang} />
    </div>
  );
}
```

- [ ] **Step 3: Přidej geometrii do `app/globals.css`**

Vlož nový blok **za** `.mm-project-item.is-past` (kolem řádku 481, tedy před starý blok `/* ── „Jsem přesvědčený, že…" ── */`):

```css
/* ── „Jak to vidím": trojúhelník přesvědčení + kruh pravidel ──
   Mobil = prostý sloupec, geometrie naskočí až nad 560px. Rozbalování
   funguje stejně v obou režimech, DOM je jeden. */
.mm-hisi { margin-top: 4px; }

.mm-hisi-divider {
  font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--color-text-muted);
  margin: 40px 0 34px;
}

.mm-nodes { list-style: none; margin: 0; padding: 0; }
.mm-node { margin: 0 0 16px; }

.mm-node-btn {
  display: block; width: 100%; cursor: pointer; text-align: left;
  background: none; border: none; padding: 0;
  font-family: var(--font-voice); font-weight: 700; font-size: clamp(19px, 5vw, 23px);
  letter-spacing: -0.02em; line-height: 1.25;
  color: var(--color-text-muted);
  transition: color 160ms var(--transition);
}
.mm-node-btn:hover, .mm-node-btn.is-open { color: var(--color-text); }
.mm-node-btn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--color-text) 35%, transparent);
  outline-offset: 6px; border-radius: 4px;
}

.mm-cluster-support { margin-top: 10px; }
.mm-support-text {
  font-family: var(--font-sans); font-size: 15.5px; line-height: 1.7;
  color: var(--color-text-muted); max-width: 54ch; margin: 0;
  animation: mm-rise 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@media (min-width: 561px) {
  .mm-nodes { position: relative; height: 300px; }
  .mm-node {
    position: absolute; margin: 0;
    left: 50%; top: 50%; width: 16ch;
  }
  .mm-node-btn { text-align: center; font-size: clamp(17px, 2.4vw, 21px); }

  /* trojúhelník: vrchol nahoře, dva dole */
  .mm-cluster--triangle .mm-node { transform: translate(-50%, -50%) translate(var(--x), var(--y)); }
  .mm-cluster--triangle .mm-node:nth-child(1) { --x: 0;      --y: -104px; }
  .mm-cluster--triangle .mm-node:nth-child(2) { --x: -164px; --y:   86px; }
  .mm-cluster--triangle .mm-node:nth-child(3) { --x:  164px; --y:   86px; }

  /* kruh: pět uzlů po 72°, první nahoře. Druhá rotace text zase narovná. */
  .mm-cluster--circle .mm-nodes { height: 340px; }
  .mm-cluster--circle .mm-node {
    transform: translate(-50%, -50%)
               rotate(calc(var(--i) * 72deg)) translateY(-132px)
               rotate(calc(var(--i) * -72deg));
  }

  /* pevná výška → panel neposkakuje layoutem při přepínání uzlů */
  .mm-cluster-support { min-height: 5.5em; margin-top: 0; text-align: center; }
  .mm-support-text { margin: 0 auto; }
  .mm-hisi-divider { text-align: center; }
}

@media (prefers-reduced-motion: reduce) {
  .mm-support-text { animation: none !important; }
}
```

- [ ] **Step 4: Ověř, že testy i build projdou**

Run: `npm test && npm run lint && npm run build`
Expected: všechny testy PASS, lint i build projdou. `decks.tsx` už nikdo neimportuje, ale pořád je v repu a **build na něm spadne**, protože sahá na `BELIEFS[].title` a `THOUGHTS`. Pokud spadne, přejdi rovnou na Task 5 Step 1 (smazání) a vrať se sem.

- [ ] **Step 5: Vizuální kontrola**

Run: `npm run dev`, otevři `http://localhost:3000/thoughts`.
Zkontroluj:
- Trojúhelník má vrchol nahoře a dva uzly dole; kruh má pět uzlů, první nahoře.
- Klik na uzel rozbalí text pod shlukem, klik na tentýž uzel ho zavře.
- Otevřené přesvědčení **nezavře** otevřené pravidlo.
- Tab prochází uzly v pořadí, v jakém jsou v poli; focus je vidět.
- Zúž okno pod 560 px: geometrie zmizí, uzly jsou pod sebou, **nic nepřetéká do stran**.

- [ ] **Step 6: Commit**

```bash
git add components/site/HowISeeIt.tsx components/site/panels.tsx app/globals.css
git commit -m "feat(site): trojúhelník přesvědčení a kruh pravidel místo rotátoru a kartotéky"
```

---

## Task 5: Úklid (smazat decks.tsx a mrtvé CSS)

**Files:**
- Delete: `components/site/decks.tsx`
- Modify: `app/globals.css`
- Modify: `lib/site/copy.ts` (případné mazání `timelineNow`)

**Interfaces:**
- Consumes: vše z Tasků 1–4. Nic neprodukuje.

**Pozor:** `@keyframes mm-rise` je definovaný **uvnitř** mazaného bloku `.mm-belief*`, ale nová komponenta ho používá (`.mm-support-text`). Musí zůstat.

- [ ] **Step 1: Smaž `decks.tsx`**

```bash
git rm components/site/decks.tsx
```

- [ ] **Step 2: Ověř, co je opravdu mrtvé**

Run:
```bash
grep -rn "mm-beliefs\|mm-belief\|mm-dot\|mm-deck\|mm-card\|mm-block-heading\|mm-block-lead\|mm-slide-from\|mm-rise\|timelineNow" app components lib --include=*.tsx --include=*.ts
```
Expected: jediné zásahy jsou `mm-rise` v `app/globals.css` (definice + použití v `.mm-support-text`). Pokud se objeví `timelineNow` mimo `copy.ts`, **nemaž ho** v Kroku 4. Cokoli dalšího v seznamu znamená, že třídu ještě někdo používá — takovou v Kroku 3 nemaž.

- [ ] **Step 3: Odstraň mrtvé CSS z `app/globals.css`**

Smaž tyto bloky (jsou souvisle za sebou, zhruba řádky 483–560 před úpravou):
- komentář `/* ── „Jsem přesvědčený, že…" … ── */` a pravidla `.mm-beliefs`, `.mm-beliefs-heading`, `.mm-belief`, `.mm-belief-claim`, `.mm-belief-support`
- `.mm-dots`, `.mm-dot`, `.mm-dot:hover`, `.mm-dot.is-active`
- komentář `/* ── Řada myšlenek … ── */` a pravidla `.mm-deck`, `.mm-deck:focus-visible`, `.mm-card`, `.mm-card-title`, `.mm-card-lead`, `.mm-card-text`, `.mm-card--next`, `.mm-card--prev`
- `@keyframes mm-slide-from-right`, `@keyframes mm-slide-from-left`
- `.mm-deck-nav`, `.mm-deck-btn`, `.mm-deck-btn:hover`, `.mm-deck-count`
- `.mm-block-heading`, `.mm-block-lead`

**Zachovej** `@keyframes mm-rise` — přesuň ho k novému bloku `.mm-hisi*`:

```css
@keyframes mm-rise {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
}
```

Ve starém `@media (prefers-reduced-motion: reduce)` bloku, který zmiňoval `.mm-belief-claim, .mm-belief-support, .mm-card`, smaž celý blok — nový ekvivalent už je součástí `.mm-hisi*` z Tasku 4.

`.mm-entries` / `.mm-entry` **nech být** — je to samostatný nepoužitý blok, který s touhle změnou nesouvisí.

- [ ] **Step 4: Smaž dožívající klíče z `COPY`**

Teď, když je `decks.tsx` pryč a `ThoughtsPanel` používá `HowISeeIt`, ztratilo šest klíčů posledního konzumenta. Smaž z `lib/site/copy.ts` celý blok `// ── Dožívá do Tasku 5 ──` (tedy `beliefsHeading`, `thoughtsShort`, `thoughtsShortLead`, `prev`, `next`) a k tomu `timelineNow` — **ale jen ty, které grep v Kroku 2 nenašel nikde jinde**. Cokoli, co ještě někdo používá, nech být.

Pak v `lib/site/copy.test.ts` nahraď test `description je pryč z COPY a inPractice přibyl`:

```ts
  it("mrtvé klíče po rotátoru a kartotéce jsou pryč", () => {
    for (const dead of ["description", "beliefsHeading", "thoughtsShort", "thoughtsShortLead", "prev", "next", "timelineNow"]) {
      expect(COPY).not.toHaveProperty(dead);
    }
    expect(COPY.inPractice.en).toBe("so, in practice");
  });
```

Pokud jsi některý klíč v předchozím odstavci nechal naživu, vyhoď ho i z pole `dead` — test má popisovat skutečnost, ne přání.

- [ ] **Step 5: Ověř všechno**

Run: `npm test && npm run lint && npm run build`
Expected: všechny testy PASS, lint bez chyb, build projde.

- [ ] **Step 6: Vizuální kontrola všech pěti panelů**

Run: `npm run dev`, projdi `/`, `/work`, `/projects`, `/thoughts`, `/contact`.
Zkontroluj:
- Hlavní stránka: tři odstavce úvodu s rozumnými mezerami, pak rozcestník sekcí.
- `/work`: u Teya i u Beats for Love jsou vidět roky (`May 2025 – now`, `2015 – now`), ne slovo „now".
- `/thoughts`: trojúhelník i kruh vypadají jako v Tasku 4, nic se nerozbilo úklidem CSS.
- Žádný panel nescrolluje vodorovně.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(site): odstranit rotátor přesvědčení, kartotéku myšlenek a mrtvé CSS"
```

---

## Self-Review

**Pokrytí specu** — každá sekce specu má task:

| sekce specu | task |
|---|---|
| Hlasová pravidla 1–8 | Global Constraints + doslovné texty ve všech tascích |
| 1 — Home | Task 1 (kroky 3, 7, 8, 9) |
| 2 — Sekce | Task 1 (krok 4) |
| 3 — Kousek historie | Task 2 |
| 4 — Čemu se věnuju teď | Task 1 (kroky 3, 5) — `nowIntro` i blurby |
| 5 — Jak to vidím: obsah | Task 3 |
| 5 — Jak to vidím: datový tvar | Task 3 (`Conviction` v `beliefs.ts`) |
| 5 — Jak to vidím: layout | Task 4 |
| 5 — Texty okolo (`inPractice`, mazání klíčů) | Task 1 (krok 3) + Task 5 (krok 4) |
| 6 — Kontakt | Task 1 (krok 4) |
| Soubory | pokryto tabulkou File Structure |
| Ověření | Task 5 kroky 5–6 |

**Odchylka od specu (vědomá):** spec u responsivity psal, že pod 560 px se `support` texty zobrazí všechny naráz „bez rozbalování". To by znamenalo vykreslit každý `support` dvakrát (jednou inline, jednou ve sdíleném panelu) — duplicitní DOM a duplicitní čtení pro odečítač obrazovky. Plán místo toho **drží stejné rozbalování i na mobilu**, mění se jen CSS. Jeden DOM, stejná přístupnost, méně kódu.

**Kontrola typů napříč tasky:** `Conviction` definován v Tasku 3 (`beliefs.ts`), importován v Tasku 3 (`thoughts.ts`) a Tasku 4 (`HowISeeIt.tsx`) — stejný název, stejný tvar. `DESCRIPTION` a `COPY.metaDescription` z Tasku 1 se spotřebovávají v témže tasku. `COPY.inPractice` z Tasku 1 se spotřebuje v Tasku 4. `RULES` (ne `THOUGHTS`) použit konzistentně v Tasku 3 i 4.

**Pořadí tasků:** Task 3 nechá repo dočasně nebuildovatelné (`decks.tsx` odkazuje na zaniklé exporty), Task 4 to opraví. Je to zaznamenáno u Tasku 3 Step 5 i Tasku 4 Step 4, aby to implementátora nepřekvapilo.
