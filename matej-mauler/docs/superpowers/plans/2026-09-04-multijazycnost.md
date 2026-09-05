# Multijazyčnost Spaghetti.ltd — implementační plán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vrátit na web češtinu — jazyk drží cookie, `?lang=` ho umí přepnout odkazem, přepínač je zpátky v UI.

**Architecture:** `getLang()` se rozpadá na čistou `pickLang()` (testovatelnou) a tenký async obal nad `cookies()`/`headers()`. Query parametr `?lang=` odchytává `proxy.ts` a překlápí ho do cookie, takže funguje na všech routách bez zásahu do stránek. `lib/experiencePanel.ts` mění `string` na `Bi = {cs, en}` a dvě experience bez češtiny dostávají příznak `enOnly`.

**Tech Stack:** Next.js 16 (App Router), TypeScript, vitest, Playwright (jen na závěrečný průchod).

**Spec:** `docs/superpowers/specs/2026-09-04-multijazycnost-design.md`

## Global Constraints

- **Hlas českých textů:** malá písmena, hravě, pravdivě — jako zvědavý kamarád, ne jako překlad. Strojový překlad je zakázaný.
- **Žádné jazykové cesty.** Nikde nevzniká `/cs/*` ani segment `[lang]`.
- **`getLang()` si drží podpis** `(): Promise<Lang>` — volající stránky se nemění.
- **Admin zůstává anglicky.** Nic pod `app/admin/` ani `components/*Admin.tsx` se nepřekládá.
- **`lib/rewards/*` se nepřekládá** — spí s `ACCOUNTS_ENABLED = false`.
- **Commit message bez `Co-Authored-By`** — shazuje Vercel deploy (viz CLAUDE.md).
- Po každém tasku musí projít `npx vitest run` a `npm run build`.

---

### Task 1: `pickLang()` — čistá volba jazyka

Dnes `getLang()` vrací natvrdo `"en"`. Rozdělíme ji na čistou funkci (testovatelnou bez Next runtime) a async obal.

**Files:**
- Modify: `lib/getLang.ts` (celý soubor, 8 řádků)
- Test: `lib/getLang.test.ts` (nový)

**Interfaces:**
- Produces: `pickLang(input: { cookie?: string | null; host?: string | null; country?: string | null }): Lang`
- Produces: `getLang(): Promise<Lang>` — beze změny podpisu

- [ ] **Step 1: Napsat padající test**

```ts
// lib/getLang.test.ts
import { describe, expect, it } from "vitest";
import { pickLang } from "./getLang";

describe("pickLang", () => {
  it("výchozí jazyk je angličtina", () => {
    expect(pickLang({})).toBe("en");
  });

  it("cookie má přednost před vším ostatním", () => {
    expect(pickLang({ cookie: "cs", host: "spaghetti.ltd", country: "US" })).toBe("cs");
    expect(pickLang({ cookie: "en", host: "spaghetti.cz", country: "CZ" })).toBe("en");
  });

  it("nesmyslná cookie se ignoruje, nepadá se na ní", () => {
    expect(pickLang({ cookie: "de" })).toBe("en");
    expect(pickLang({ cookie: "" })).toBe("en");
  });

  it("česká doména znamená češtinu", () => {
    expect(pickLang({ host: "spaghetti.cz" })).toBe("cs");
    expect(pickLang({ host: "www.spaghetti.cz:3000" })).toBe("cs");
  });

  it("doména nepřebije cookie ani neplete .cz uvnitř názvu", () => {
    expect(pickLang({ host: "cz.example.com" })).toBe("en");
  });

  it("geo CZ a SK dostane češtinu", () => {
    expect(pickLang({ country: "CZ" })).toBe("cs");
    expect(pickLang({ country: "SK" })).toBe("cs");
    expect(pickLang({ country: "DE" })).toBe("en");
  });
});
```

- [ ] **Step 2: Spustit test, ověřit, že padá**

Run: `npx vitest run lib/getLang.test.ts`
Expected: FAIL — `pickLang is not a function` (export neexistuje)

- [ ] **Step 3: Implementovat**

```ts
// lib/getLang.ts
import { cookies, headers } from "next/headers";
import type { Lang } from "./dictionaries";

export const isLang = (v: unknown): v is Lang => v === "cs" || v === "en";

/**
 * Volba jazyka podle pořadí důležitosti. Čistá funkce — všechno chodí
 * parametrem, takže jde testovat bez Next runtime.
 *
 * cookie (co si uživatel zvolil) → .cz doména → geo CZ/SK → en
 */
export function pickLang(input: {
  cookie?: string | null;
  host?: string | null;
  country?: string | null;
}): Lang {
  if (isLang(input.cookie)) return input.cookie;

  // hostname bez portu; .cz musí být skutečná koncovka, ne kus názvu
  const host = (input.host ?? "").split(":")[0].toLowerCase();
  if (host.endsWith(".cz")) return "cs";

  const country = (input.country ?? "").toUpperCase();
  if (country === "CZ" || country === "SK") return "cs";

  return "en";
}

export async function getLang(): Promise<Lang> {
  const [jar, h] = await Promise.all([cookies(), headers()]);
  return pickLang({
    cookie: jar.get("lang")?.value,
    host: h.get("host"),
    country: h.get("x-vercel-ip-country") || h.get("cf-ipcountry"),
  });
}
```

- [ ] **Step 4: Spustit test, ověřit, že prochází**

Run: `npx vitest run lib/getLang.test.ts`
Expected: PASS (6 testů)

- [ ] **Step 5: Ověřit build**

Run: `npm run build`
Expected: projde. **Pozor — v outputu ubudou statické routy** (`/brain`, `/encyklopedie`, `/rules`, `/synapse`, `/driftbloom`): `getLang()` teď volá `cookies()`, což je dynamické API. Je to očekávaný důsledek popsaný ve specu, ne regrese.

- [ ] **Step 6: Odpojit `not-found.tsx` od `getLang()`** ⚠️ NALEZENO PŘI EXEKUCI

`app/not-found.tsx` volá `getLang()`. Not-found boundary je součástí stromu
**každé** routy, takže jakmile getLang sáhne na `cookies()`, zdynamičtí to celou
aplikaci — ne jen stránky, které jazyk potřebují. Ověřeno měřením: 12 statických
rout spadne na 2.

Řešení: 404 zůstává dvojjazyčná, ale jazyk si bere z cookie na klientovi.
`export const dynamic = "force-dynamic"` a import `getLang` pryč, soubor je
`"use client"`, a jazyk se čte přes `useSyncExternalStore` (ne `useState` +
`useEffect` — na to lint právem hlásí `set-state-in-effect`):

```tsx
const readCookieLang = (): Lang => {
  const m = document.cookie.match(/(?:^|;\s*)lang=(cs|en)\b/);
  return m ? (m[1] as Lang) : "en";
};
const noSubscribe = () => () => {};

export default function NotFound() {
  const lang = useSyncExternalStore(noSubscribe, readCookieLang, () => "en" as Lang);
  const t = COPY[lang];
  // …
}
```

Odkaz zpět je vždy `/` — jazyk nese cookie.

Ověření: `rm -rf .next && npm run build` → 12 statických rout zpět.
**Pozor na `.next` cache:** bez `rm -rf .next` dává měření nesmysly.

- [ ] **Step 7: Commit**

```bash
git add lib/getLang.ts lib/getLang.test.ts app/not-found.tsx
git commit -m "feat(i18n): odemknout getLang — cookie, .cz doména, geo CZ/SK"
```

---

### Task 2: `?lang=` v proxy

`getLang()` vidí jen cookies a hlavičky. Query parametr proto odchytí proxy a překlopí ho do cookie — tím `?lang=cs` funguje na všech routách naráz.

**Files:**
- Modify: `proxy.ts` (přidat do funkce `handle`, před admin blok)
- Test: `proxy.test.ts` (nový)

**Interfaces:**
- Consumes: `isLang` z Task 1
- Produces: `langFromQuery(raw: string | null): Lang | null`

- [ ] **Step 1: Napsat padající test**

```ts
// proxy.test.ts
import { describe, expect, it } from "vitest";
import { langFromQuery } from "./proxy";

describe("langFromQuery", () => {
  it("bere platné jazyky", () => {
    expect(langFromQuery("cs")).toBe("cs");
    expect(langFromQuery("en")).toBe("en");
  });

  it("nesmysl neprojde — cookie se pak nemá čím přepsat", () => {
    expect(langFromQuery("de")).toBeNull();
    expect(langFromQuery("")).toBeNull();
    expect(langFromQuery(null)).toBeNull();
    expect(langFromQuery("cs; drop table")).toBeNull();
  });
});
```

- [ ] **Step 2: Spustit test, ověřit, že padá**

Run: `npx vitest run proxy.test.ts`
Expected: FAIL — `langFromQuery is not a function`

- [ ] **Step 3: Implementovat**

V `proxy.ts` přidat import a export vedle stávajících:

```ts
import { isLang } from "./lib/getLang";
import type { Lang } from "./lib/dictionaries";

/** `?lang=` → jazyk, nebo null. Nesmysl vrací null, aby cookie zůstala, jak byla. */
export function langFromQuery(raw: string | null): Lang | null {
  return isLang(raw) ? raw : null;
}
```

A na začátek funkce `handle(request)`, **před** blok `// ── Admin protection`:

```ts
  // ── ?lang= → cookie ───────────────────────────────────────────
  // Jediné místo, kde se jazyk mění. Bez redirectu, aby sdílený odkaz
  // zůstal, jak byl poslán, a aby to fungovalo na každé routě naráz.
  const wanted = langFromQuery(request.nextUrl.searchParams.get("lang"));
  if (wanted) {
    const res = NextResponse.next();
    res.cookies.set("lang", wanted, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      // ne httpOnly: přepínač si jazyk čte i na klientovi
    });
    return res;
  }
```

- [ ] **Step 4: Spustit test, ověřit, že prochází**

Run: `npx vitest run proxy.test.ts`
Expected: PASS (2 testy)

- [ ] **Step 5: Ověřit ručně**

```bash
npm run dev &
sleep 8
curl -si "http://localhost:3000/?lang=cs" | grep -i "set-cookie"
```
Expected: `set-cookie: lang=cs; Path=/; Max-Age=31536000; SameSite=lax`

Pak: `curl -si "http://localhost:3000/?lang=de" | grep -ci "set-cookie: lang"` → `0`

- [ ] **Step 6: Commit**

```bash
git add proxy.ts proxy.test.ts
git commit -m "feat(i18n): ?lang= v proxy překlápí jazyk do cookie"
```

---

### Task 3: Homepage a layout čtou jazyk

`app/page.tsx` má dnes `"en"` natvrdo na čtyřech místech. `app/layout.tsx` má `<html lang="en">`.

**Files:**
- Modify: `app/page.tsx:11,24,29,30,35`
- Modify: `app/layout.tsx` (metadata + `<html lang>` + předání do `ExperiencePanelMount`)
- Modify: `components/ExperiencePanelMount.tsx` (přijmout `lang`)
- Modify: `components/ExperiencePanel.tsx` (`PanelBasic` i `Panel` přijmou `lang`)

**Interfaces:**
- Consumes: `getLang()` z Task 1
- Produces: `<ExperiencePanelMount lang={lang} />`, `ExperiencePanelProps` navíc s `lang: Lang`

- [ ] **Step 1: Homepage na getLang()**

V `app/page.tsx` nahradit tělo `Home()` a JSON-LD:

```tsx
export default async function Home() {
  const lang = await getLang();
  const [items, overrides] = await Promise.all([
    getPublicExperiments(lang),
    getTextOverrides(lang).catch(() => ({})),
  ]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Spaghetti.ltd",
    url: "https://www.spaghetti.ltd",
    description: dictionaries[lang].meta.description,
    inLanguage: lang,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeNetwork dict={applyTextOverrides(dictionaries[lang], overrides)} lang={lang} items={items} />
    </>
  );
}
```

Přidat import `import { getLang } from "@/lib/getLang";`. Modul-level `const jsonLd` a `metadata.description` s `dictionaries.en` smazat — `metadata` nahradit za `generateMetadata`:

```tsx
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: "Spaghetti.ltd",
    description: dictionaries[lang].meta.description,
    alternates: {
      canonical: "/",
      languages: { en: "/?lang=en", cs: "/?lang=cs", "x-default": "/" },
    },
  };
}
```

- [ ] **Step 2: Layout na getLang()**

V `app/layout.tsx` udělat `RootLayout` async a použít jazyk:

```tsx
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const inner = (
    <PostHogProvider>
      {children}
      <ExperiencePanelMount lang={lang} />
      <Analytics />
      <SpeedInsights />
    </PostHogProvider>
  );

  return (
    <html lang={lang} className={`${display.variable} ${sans.variable} ${mono.variable} h-full`}>
      <body className="min-h-full">
        {clerkEnabled ? <ClerkProvider appearance={clerkAppearance}>{inner}</ClerkProvider> : inner}
      </body>
    </html>
  );
}
```

Přidat `import { getLang } from "@/lib/getLang";`.

- [ ] **Step 3: Protáhnout `lang` do panelu**

`components/ExperiencePanelMount.tsx`:

```tsx
export function ExperiencePanelMount({ lang }: { lang: Lang }) {
  const info = experienceForPath(usePathname());
  if (!info) return null;
  return (
    <ExperiencePanel
      lang={lang}
      slug={info.slug}
      title={info.title}
      category={info.category}
      description={info.description}
      guide={info.guide}
    />
  );
}
```

Přidat `import type { Lang } from "@/lib/dictionaries";`.

V `components/ExperiencePanel.tsx` doplnit do `ExperiencePanelProps` jedinou položku:

```ts
  lang: Lang;
```

**Pozor:** `enOnly` sem NEPATŘÍ — vzniká až v Tasku 4 spolu s typem `Bi`. Kdyby
se přidalo teď, `tsc` v kroku 4 spadne na tom, že `ExperienceInfo` ho nemá.
Typy `description` a `guide` taky zůstávají `string` / `string[]` až do Tasku 4.

- [ ] **Step 4: Ověřit**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: vše projde. `/` je v outputu nově `ƒ` místo `○`.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/layout.tsx components/ExperiencePanelMount.tsx components/ExperiencePanel.tsx
git commit -m "feat(i18n): homepage a layout čtou jazyk z getLang()"
```

---

### Task 4: `experiencePanel` dvojjazyčně + příznak `enOnly`

15 záznamů × (title, description, 47 kroků návodu dohromady). Nese to celý rám každé experience, takže anglický ostrůvek by v české verzi bil do očí.

**Files:**
- Modify: `lib/experiencePanel.ts` (typ + všech 15 záznamů)
- Modify: `components/ExperiencePanel.tsx` (vybírat jazyk, vypsat poznámku u `enOnly`)
- Test: `lib/experiencePanel.test.ts` (nový)

**Interfaces:**
- Produces: `type Bi = { cs: string; en: string }`
- Produces: `ExperienceInfo` s `title: Bi`, `description?: Bi`, `guide?: Bi[]`, `enOnly?: true`

- [ ] **Step 1: Napsat padající test**

Test je pojistka, aby příští experiment nezapomněl na češtinu — stejně jako to hlídáme u `dictionaries.ts`.

```ts
// lib/experiencePanel.test.ts
import { describe, expect, it } from "vitest";
import { EXPERIENCES, experienceForPath } from "./experiencePanel";

const langs = ["cs", "en"] as const;

describe("registr experiencí", () => {
  it("každá experience má titulek v obou jazycích", () => {
    for (const e of EXPERIENCES) {
      for (const l of langs) expect(e.title[l].length).toBeGreaterThan(0);
    }
  });

  it("popis i návod jsou v obou jazycích", () => {
    for (const e of EXPERIENCES) {
      for (const l of langs) {
        if (e.description) expect(e.description[l].length).toBeGreaterThan(20);
        for (const g of e.guide ?? []) expect(g[l].length).toBeGreaterThan(10);
      }
    }
  });

  it("routy a slugy jsou unikátní", () => {
    expect(new Set(EXPERIENCES.map((e) => e.route)).size).toBe(EXPERIENCES.length);
    expect(new Set(EXPERIENCES.map((e) => e.slug)).size).toBe(EXPERIENCES.length);
  });

  it("enOnly nesou jen ty dvě, co opravdu nemají českou verzi", () => {
    expect(EXPERIENCES.filter((e) => e.enOnly).map((e) => e.route).sort())
      .toEqual(["/life-manual", "/rules"]);
  });

  it("hledání podle cesty snese lomítko na konci", () => {
    expect(experienceForPath("/sound")?.slug).toBe("sound");
    expect(experienceForPath("/sound/")?.slug).toBe("sound");
    expect(experienceForPath("/neexistuje")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Spustit test, ověřit, že padá**

Run: `npx vitest run lib/experiencePanel.test.ts`
Expected: FAIL — `e.title[l]` je `undefined` (title je zatím `string`)

- [ ] **Step 3: Přepsat typ a záznamy**

Hlavička souboru:

```ts
export type Bi = { cs: string; en: string };

export type ExperienceInfo = {
  route: string; // přesný pathname, např. "/sound"
  slug: string; // klíč pro comments/ratings — stabilní, neměnit
  title: Bi;
  category?: string; // jazykově neutrální štítek, nepřekládá se
  description?: Bi;
  guide?: Bi[]; // volitelný návod, krok = položka
  /** Experience zatím nemá českou verzi — panel to v cs přizná. */
  enOnly?: true;
};
```

Vzor pro záznam (takhle vypadají všechny; `category` zůstává anglicky, je to štítek):

```ts
  {
    route: "/milans-world",
    slug: "milans-world",
    title: { cs: "Milanův svět", en: "Milan's World" },
    category: "game",
    description: {
      cs: "klikačka o představě, že se všechno dá vyřešit penězi. milan má odpověď na každý tvůj životní problém — stačí mít dost peněz. razítkuješ na úřadě a kupuješ se od popelnice až po vesmír.",
      en: "A clicker about the idea that money solves everything. Milan has an answer to any problem in your life — you just need enough money. Stamp forms at the city hall and buy your way up from a wheelie bin to the universe.",
    },
    guide: [
      { cs: "klikej na razítko. každé je minuta promarněná na úřadě — a za promarněný čas se platí.", en: "Click the stamp. Every stamp is a minute wasted at the office, and wasted time pays." },
      { cs: "co vyděláš, dej do nemovitostí. každá vydělává dál, i když nic neděláš.", en: "Spend what you earn on property — each one keeps earning while you do nothing." },
      { cs: "vylepšení se odemykají sama, jak roste tvá agenda. najeď na ně a uvidíš, co dělají.", en: "Upgrades unlock on their own as your paperwork grows. Hover one to see what it does." },
      { cs: "kolonka 4 se vybírá jednou a změnit ji jde jen novou žádostí.", en: "Box 4 (your category) is picked once and can only be changed by starting over." },
      { cs: "ukládá se to samo do prohlížeče. cíl je z principu nedosažitelný — v tom je ten vtip.", en: "It saves itself in your browser. The goal is unreachable by design — that's the joke." },
    ],
  },
```

`/life-manual` a `/rules` dostávají navíc `enOnly: true` (jejich `title`, `description` a `guide` se překládají normálně — anglicky zůstává jen *obsah* experience).

**Zbylých 14 záznamů se v tomhle kroku dopisuje stejným způsobem.** Českou verzi je nutné **napsat** v hlase Spaghetti (malá písmena, hravě, pravdivě), ne přeložit anglickou větu slovo od slova — popisy mají navnadit, ne popsat. Test ze Step 1 hlídá, že nezůstal ani jeden nedopsaný.

- [ ] **Step 4: Panel vybírá jazyk**

V `components/ExperiencePanel.tsx` v obou variantách (`PanelBasic` i `Panel`) nahradit přímé použití textů:

```tsx
  {category && <span className="xp-chip">{category}</span>}
  {description && <p className="xp-desc">{description[lang]}</p>}

  {guide && guide.length > 0 && (
    <>
      <div className="xp-h">{lang === "cs" ? "Jak to funguje" : "How it works"}</div>
      <ol className="xp-guide">
        {guide.map((g, i) => (<li key={i}>{g[lang]}</li>))}
      </ol>
    </>
  )}

  {enOnly && lang === "cs" && (
    <p className="xp-desc" style={{ opacity: 0.7 }}>
      pozn.: tahle experience je zatím jen anglicky. čeština k ní přijde.
    </p>
  )}
```

A v hlavičce panelu `{title}` → `{title[lang]}`.

- [ ] **Step 5: Spustit testy, ověřit**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: vše projde. Pokud `tsc` hlásí `title` jako `string` někde jinde, je to `app/me/page.tsx` (`titleForSlug`) — opravit na `?.title.en ?? slug`, profil je schovaný a anglický.

- [ ] **Step 6: Commit**

```bash
git add lib/experiencePanel.ts lib/experiencePanel.test.ts components/ExperiencePanel.tsx app/me/page.tsx
git commit -m "feat(i18n): panel experiencí dvojjazyčně, /life-manual a /rules označené jako en-only"
```

---

### Task 5: Přepínač jazyka zpět do UI

Bere se z historie (`0e6bb7a8c^:matej-mauler/components/LanguageSwitcher.tsx`), ale **zbavený psaní cookie** — tu nastavuje proxy, ať existuje jedna cesta, jak se jazyk mění.

**Files:**
- Create: `components/LanguageSwitcher.tsx`
- Modify: `components/HomeNetwork.tsx` (do hlavičky vedle `UserMenu`)
- Modify: `components/ExperiencePanel.tsx` (do patičky panelu, obě varianty)

**Pozn. proti specu:** spec zmiňoval i `encyclopedia/Shell.tsx` a `BrainApp.tsx`.
Ověřeno v historii — commit `0e6bb7a8c` z nich neodebral ani řádek, takže tam
žádný přepínač nebyl a není co vracet. Místo toho jde do `ExperiencePanel`,
který visí nad **každou** experiencí — kdo přijde přímo na `/sound`, má tak
jazyk po ruce, aniž by se vracel na homepage.

**Interfaces:**
- Consumes: `?lang=` z Task 2
- Produces: `<LanguageSwitcher lang={lang} />`

- [ ] **Step 1: Vytvořit komponentu**

```tsx
// components/LanguageSwitcher.tsx
"use client";

import type { Lang } from "@/lib/dictionaries";

/**
 * Přepínač jazyka. Sám nic neukládá — jen navede prohlížeč na `?lang=`
 * a cookie nastaví proxy.ts. Jedna cesta, jak se jazyk mění.
 */
export function LanguageSwitcher({ lang }: { lang: Lang }) {
  const go = (target: Lang) => {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", target);
    window.location.href = url.toString();
  };

  return (
    <div className="langsw" role="group" aria-label={lang === "cs" ? "Jazyk" : "Language"}>
      {(["cs", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => go(l)}
          aria-pressed={lang === l}
          aria-label={l === "cs" ? "Čeština" : "English"}
        >
          {l === "cs" ? "CZ" : "EN"}
        </button>
      ))}
    </div>
  );
}
```

Do `app/globals.css` k ostatním komponentovým stylům přidat:

```css
/* ── Přepínač jazyka ── */
.langsw { display: inline-flex; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; }
.langsw button {
  background: transparent; border: 0; border-left: 1.5px solid var(--border); cursor: pointer;
  padding: 5px 10px; font-family: var(--font-sans); font-size: 11px; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted);
}
.langsw button:first-child { border-left: 0; }
.langsw button:hover { color: var(--text-primary); }
.langsw button[aria-pressed="true"] { background: var(--text-primary); color: var(--bg); }
```

- [ ] **Step 2: Zapojit do homepage**

V `components/HomeNetwork.tsx` v hlavičce nahradit řádek s `UserMenu`:

```tsx
            <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
              <LanguageSwitcher lang={lang} />
              <UserMenu />
            </div>
```

Přidat `import { LanguageSwitcher } from "./LanguageSwitcher";`.

- [ ] **Step 3: Zapojit do panelu**

V `components/ExperiencePanel.tsx` na konec `<div className="xp-body">` v obou
variantách (`PanelBasic` i `Panel`) přidat:

```tsx
          <div className="xp-h">{lang === "cs" ? "Jazyk" : "Language"}</div>
          <LanguageSwitcher lang={lang} />
```

Přidat `import { LanguageSwitcher } from "./LanguageSwitcher";`.

- [ ] **Step 4: Ověřit ručně**

```bash
npm run dev &
sleep 8
curl -s "http://localhost:3000/?lang=cs" | grep -o "Mám blbé nápady" | head -1
```
Expected: `Mám blbé nápady` (česká tagline z `dictionaries.cs`)

A `curl -s "http://localhost:3000/?lang=en" | grep -o "I have bad ideas" | head -1` → `I have bad ideas`

- [ ] **Step 5: Commit**

```bash
git add components/LanguageSwitcher.tsx components/HomeNetwork.tsx components/ExperiencePanel.tsx app/globals.css
git commit -m "feat(i18n): přepínač jazyka na homepage i v panelu experiencí"
```

---

### Task 6: Metadata experiencí z registru

Spec chce dvojjazyčné titulky stránek. Ručně by to bylo 23 souborů — místo toho
je vezmeme z `EXPERIENCES`, který je po Tasku 4 dvojjazyčný. Tím zmizí i dnešní
duplicita: každý `page.tsx` dnes opisuje titulek a popis, které registr už má.

**Files:**
- Create: `lib/experienceMetadata.ts`
- Test: `lib/experienceMetadata.test.ts`
- Modify: `app/milans-world/page.tsx`, `app/sound/page.tsx`, `app/music/page.tsx`,
  `app/radio/page.tsx`, `app/synapsis/page.tsx`, `app/decision-maker/page.tsx`,
  `app/vvv/page.tsx`, `app/hymna/page.tsx`, `app/jak-to-zni/page.tsx`,
  `app/journey/page.tsx`, `app/time-remaining/page.tsx`,
  `app/what-are-the-odds/page.tsx`, `app/life-manual/page.tsx`,
  `app/rules/page.tsx`, `app/encyclopedia/page.tsx`

**Interfaces:**
- Consumes: `EXPERIENCES`, `experienceForPath` z Tasku 4; `getLang()` z Tasku 1
- Produces: `experienceMetadata(route: string): Promise<Metadata>`

- [ ] **Step 1: Napsat padající test**

```ts
// lib/experienceMetadata.test.ts
import { describe, expect, it } from "vitest";
import { buildExperienceMetadata } from "./experienceMetadata";

describe("metadata experiencí", () => {
  it("titulek nese jméno experience i značku", () => {
    const m = buildExperienceMetadata("/sound", "en");
    expect(m.title).toContain("Spaghetti.ltd");
    expect(m.description!.length).toBeGreaterThan(20);
  });

  it("čeština a angličtina se liší", () => {
    const cs = buildExperienceMetadata("/milans-world", "cs");
    const en = buildExperienceMetadata("/milans-world", "en");
    expect(cs.title).not.toBe(en.title);
    expect(cs.title).toContain("Milanův svět");
  });

  it("canonical ukazuje na routu a hreflang na obě varianty", () => {
    const m = buildExperienceMetadata("/radio", "en");
    expect(m.alternates!.canonical).toBe("/radio");
    expect(m.alternates!.languages).toEqual({
      en: "/radio?lang=en",
      cs: "/radio?lang=cs",
      "x-default": "/radio",
    });
  });

  it("neznámá routa nespadne, vrátí holou značku", () => {
    const m = buildExperienceMetadata("/neexistuje", "en");
    expect(m.title).toBe("Spaghetti.ltd");
  });
});
```

- [ ] **Step 2: Spustit test, ověřit, že padá**

Run: `npx vitest run lib/experienceMetadata.test.ts`
Expected: FAIL — modul neexistuje

- [ ] **Step 3: Implementovat**

```ts
// lib/experienceMetadata.ts
import type { Metadata } from "next";
import type { Lang } from "./dictionaries";
import { getLang } from "./getLang";
import { experienceForPath } from "./experiencePanel";

/** Čistá část — testovatelná bez Next runtime. */
export function buildExperienceMetadata(route: string, lang: Lang): Metadata {
  const e = experienceForPath(route);
  if (!e) return { title: "Spaghetti.ltd" };
  return {
    title: `${e.title[lang]} — Spaghetti.ltd`,
    description: e.description?.[lang],
    alternates: {
      canonical: route,
      languages: {
        en: `${route}?lang=en`,
        cs: `${route}?lang=cs`,
        "x-default": route,
      },
    },
  };
}

/** Pro `export const generateMetadata = () => experienceMetadata("/sound")`. */
export async function experienceMetadata(route: string): Promise<Metadata> {
  return buildExperienceMetadata(route, await getLang());
}
```

- [ ] **Step 4: Spustit test, ověřit, že prochází**

Run: `npx vitest run lib/experienceMetadata.test.ts`
Expected: PASS (4 testy)

- [ ] **Step 5: Zapojit do stránek**

V každé z 15 vyjmenovaných `page.tsx` nahradit `export const metadata = { … }` za:

```tsx
import { experienceMetadata } from "@/lib/experienceMetadata";

export const generateMetadata = () => experienceMetadata("/sound"); // ← vlastní routa
```

Routa musí přesně odpovídat `route` v `EXPERIENCES` (např. `/jak-to-zni` používá
`SonifyApp`, ale její routa je `/jak-to-zni`, ne `/sound`).

Stránky, které v registru nejsou (`/archiv`, `/mapa`, `/about`, `/songs`,
`/brain`, `/space`, `/matej`, admin), zůstávají, jak jsou.

- [ ] **Step 6: Ověřit**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: projde

```bash
curl -s "http://localhost:3000/milans-world?lang=cs" | grep -o "<title>[^<]*</title>"
```
Expected: `<title>Milanův svět — Spaghetti.ltd</title>`

- [ ] **Step 7: Commit**

```bash
git add lib/experienceMetadata.ts lib/experienceMetadata.test.ts app/*/page.tsx
git commit -m "feat(i18n): metadata experiencí z registru, dvojjazyčně a s hreflang"
```

---

### Task 7: `/cs`, hreflang a llms.txt

**Files:**
- Modify: `app/cs/page.tsx`
- Modify: `app/sitemap.ts`
- Modify: `app/llms.txt/route.ts`

- [ ] **Step 1: `/cs` vede na češtinu, ne na `/`**

```tsx
// app/cs/page.tsx
import { permanentRedirect } from "next/navigation";

// Historická česká adresa. Jazyk dnes drží cookie, takže /cs jen nastaví češtinu.
export default function CsRedirect() {
  permanentRedirect("/?lang=cs");
}
```

- [ ] **Step 2: hreflang do sitemapy**

V `app/sitemap.ts` u kořenové položky doplnit jazykové varianty:

```ts
    {
      url: `${SITE}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: { en: `${SITE}/?lang=en`, cs: `${SITE}/?lang=cs` } },
    },
```

- [ ] **Step 3: llms.txt — opravit větu, která tvrdí opak**

V `app/llms.txt/route.ts` úvodní odstavec **doslova tvrdí „In English"**, což
už nebude pravda. Nahradit:

```diff
-> Spaghetti.ltd is Matěj Mauler's playground of interactive web experiments plus an interactive encyclopedia connected by "knowledge noodles". In English, free, no accounts, no ads.
+> Spaghetti.ltd is Matěj Mauler's playground of interactive web experiments plus an interactive encyclopedia connected by "knowledge noodles". English by default, Czech at ?lang=cs, free, no accounts, no ads.
```

- [ ] **Step 4: Ověřit**

Run: `npm run build && npx vitest run`
Expected: projde

```bash
curl -s "http://localhost:3000/sitemap.xml" | grep -c "hreflang"
```
Expected: ≥ 2

- [ ] **Step 5: Commit**

```bash
git add app/cs/page.tsx app/sitemap.ts app/llms.txt/route.ts
git commit -m "feat(i18n): /cs na ?lang=cs, hreflang v sitemapě, llms.txt zmiňuje oba jazyky"
```

---

### Task 8: Průchod prohlížečem

Unit testy neověří, že se jazyk drží napříč navigací a reloadem. Tenhle průchod ano — a v portu Milanova světa přesně takový průchod našel chybu, kterou testy minuly.

**Files:**
- Create: `/tmp/i18n-e2e.mjs` (dočasné, do repa se necommituje)

- [ ] **Step 1: Nainstalovat playwright bez zápisu do package.json**

```bash
npm install --no-save playwright && npx playwright install chromium
```

- [ ] **Step 2: Napsat průchod**

```js
// /tmp/i18n-e2e.mjs
import { chromium } from "playwright";
const b = await chromium.launch();
const page = await b.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

const txt = async (s) => (await page.locator(s).first().textContent())?.trim();

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
console.log("1. výchozí jazyk:", await txt('[data-noodle="eat"]'));

await page.locator('.langsw button:has-text("CZ")').click();
await page.waitForLoadState("networkidle");
console.log("2. po přepnutí na CZ:", await txt('[data-noodle="eat"]'));

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
console.log("3. čeština drží po navigaci (cookie):", await txt('[data-noodle="eat"]'));

await page.goto("http://localhost:3000/milans-world", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
console.log("4. experience zdědila jazyk:", await txt(".msw-pick__n"));

await page.goto("http://localhost:3000/sound?lang=en", { waitUntil: "networkidle" });
console.log("5. ?lang=en přepne zpátky:", (await page.content()).includes("Your cursor is an ear") || "(zkontrolovat ručně)");

console.log(errors.length ? "CHYBY: " + errors.join("; ") : "✓ bez chyb v konzoli");
await b.close();
```

- [ ] **Step 3: Spustit**

```bash
npm run dev & sleep 10
node /tmp/i18n-e2e.mjs
```
Expected: krok 1 anglicky, krok 2 a 3 česky, krok 4 česky (`Běžný smrtelník`), krok 5 anglicky, bez chyb.

- [ ] **Step 4: Uklidit**

```bash
npm uninstall --no-save playwright
git checkout -- package.json package-lock.json
rm -f /tmp/i18n-e2e.mjs
git status --short   # musí být čisté
```

- [ ] **Step 5: Finální ověření a commit**

```bash
npx vitest run && npm run build && npx eslint app components lib proxy.ts
git add -A
git commit -m "feat(i18n): čeština zpět — cookie + ?lang=, 13 z 15 experiencí dvojjazyčně"
```

---

## Co plán vědomě nedělá

- **Nepřekládá `/life-manual` a `/rules`** — jsou označené `enOnly`, obsah zůstává anglický. Samostatný projekt (~350 textů, které se musí napsat).
- **Nepřekládá admin** ani `lib/rewards/*`.
- **Nezavádí `/cs/*` cesty.** Kdyby se to někdy chtělo, je to refactor 40+ rout pod `[lang]`.
- **Nevrací cachování homepage.** Ztráta plné route cache je ve specu popsaná a zaplacená vědomě; dotazy zůstávají cachované přes `unstable_cache`.
