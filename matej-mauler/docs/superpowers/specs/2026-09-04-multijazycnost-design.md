# Multijazyčnost Spaghetti.ltd — odemknutí češtiny

Datum: 2026-09-04

## Cíl

Vrátit na web češtinu. Jazyk drží **cookie**, ne cesta — URL zůstávají jedny.
Nad rámec původního stavu přibývá `?lang=`, aby šlo poslat odkaz v konkrétním
jazyce a aby měl hreflang na co ukazovat.

Tenhle dokument řeší **mechaniku a plochy, které češtinu už mají**. Překlad
`/life-manual` a `/rules` je samostatný projekt (C2) a tady se jen označí.

## Východisko: co inventura ukázala

Web je dvojjazyčný z velké části — **13 z 15 experiencí má kompletní českou
větev**. Texty nejsou v komponentách, ale v `lib/*Ui` modulech (`lib/anthem.ts`,
`lib/sonify.ts`, `lib/space.ts`, `lib/journeyLife.ts`, `lib/music.ts`) a
v `cs: { … }` tabulkách.

Jen anglicky jsou:

| plocha | rozsah | v tomhle projektu |
|---|---|---|
| `lib/experiencePanel.ts` | ~62 textů | **ano** — napíše se česky |
| metadata stránek | ~15 titulků | **ano** |
| `/life-manual` | ~154 textů | ne (C2) |
| `/rules` | 1352 řádků, bez `lang` propu | ne (C2) |
| `lib/rewards/*` | badge | ne — spí s účty (`ACCOUNTS_ENABLED`) |
| admin | celý | ne — je jen pro Matěje, zůstává anglicky |

Mechanika se nevymýšlí, existovala. Commit `0e6bb7a8c` („web pouze v
anglictine") je přesná mapa toho, co se vypnulo: 35 souborů. Z nich dnes chybí
tři — `LanguageSwitcher.tsx` (vezme se z historie), `middleware.ts` (dnes
`proxy.ts`), `HomeContent.tsx` (byl mrtvý, nevrací se).

## Rozhodnutí, která jsou už udělaná

Padla v brainstormingu, tenhle dokument je neotevírá:

1. **Cookie + geo, plus `?lang=`.** Ne cesty `/cs/*` — ty by znamenaly přestavět
   40+ rout pod segment `[lang]`, což je samostatný projekt.
2. **Přepínač se pouští hned**, i když dvě experience zůstanou anglické.
   13 funkčních teď je lepší než 15 za tři dny.
3. **Nezakrývat to** — `/life-manual` a `/rules` dostanou v české verzi
   poznámku „zatím jen anglicky". Ne skrývat z feedu.
4. **Admin zůstává anglicky.**
5. **České legacy routy** (`/encyklopedie`, `/hymna`, `/mapa`, `/archiv`,
   `/jak-to-zni`) zůstávají, jak jsou. Nejsou to jazykové varianty, jsou to
   jména experimentů.

## Architektura

### Jak se jazyk dostane dovnitř

`getLang()` je server-side a vidí jen cookies a hlavičky — query parametr ne.
Proto `?lang=` odchytává **proxy**, ne stránky:

```
požadavek s ?lang=cs
  └─ proxy.ts  → ověří hodnotu, nastaví cookie "lang", pustí dál
                 (žádný redirect — sdílený odkaz zůstane, jak byl poslán)

kterákoli stránka
  └─ getLang()  cookie "lang"          … co si uživatel zvolil
                → host končí na .cz    … česká doména
                → geo CZ / SK          … x-vercel-ip-country
                → "en"                 … výchozí
```

Díky tomu funguje `?lang=cs` na všech routách naráz a **nesahá se na jedinou
stránku** — všechny už `getLang()` volají.

### Dotčené soubory

```
lib/getLang.ts          odemknout na verzi z 0e6bb7a8c^ (cookie → host → geo → en)
proxy.ts                odchyt ?lang= → cookie
components/LanguageSwitcher.tsx   z historie zpět (bez psaní cookie); vrací se do:
  components/HomeNetwork.tsx        hlavička homepage
  components/encyclopedia/Shell.tsx
  components/BrainApp.tsx           (Synapse)
app/layout.tsx          <html lang> podle getLang() → layout se stává async
app/page.tsx            "en" natvrdo → getLang() (a tím i celý feed dvojjazyčně)
app/cs/page.tsx         redirect na /?lang=cs místo na /
app/sitemap.ts          hreflang alternates na ?lang= varianty
app/llms.txt/route.ts   zmínit oba jazyky
lib/experiencePanel.ts  description + guide dvojjazyčně (typ Bi místo string)
app/*/page.tsx          metadata titulky dvojjazyčně (generateMetadata)
```

### `lib/experiencePanel.ts` — změna tvaru

Dnes `description: string`. Nově `Bi = { cs: string; en: string }`, stejně jako
to má `lib/about.ts` a `lib/milans-world/data.ts`. `ExperiencePanelMount` je
klientský, jazyk mu tedy musí přijít propem z layoutu.

Dvě experience dostanou navíc příznak:

```ts
/** Experience zatím nemá českou verzi — v cs se v panelu ukáže poznámka. */
enOnly?: true;
```

`/life-manual` a `/rules` ho mají. Panel podle něj v české verzi vypíše jeden
řádek; obsah experience zůstane anglický.

## Důsledek pro cache — vědomě zaplacená daň

Homepage je dnes staticky cachovaná (`revalidate 10m`) **právě proto**, že má
jazyk natvrdo: `app/page.tsx` nevolá `getLang()`, ale píše `"en"`. Totéž platí
pro `/brain`, `/encyklopedie`, `/rules`, `/synapse` a `/driftbloom`.

Jakmile začnou volat `getLang()`, Next je z plné route cache vyřadí sám —
`cookies()` je dynamické API a přepne routu na render při requestu. Nikde se
tedy nepíše `force-dynamic` ručně, stačí zavolat `getLang()`.

**Co to stojí:** HTML se skládá při každém požadavku místo servírování z cache.
**Co to nestojí:** databázi. `getPublicExperiments()` je zabalený
v `unstable_cache` (`revalidate: 600` + `EXPERIMENTS_TAG`), takže dotazy se
dál cachují nezávisle na routě. Platíme render, ne dotazy.

Před zámkem angličtiny měla homepage `export const dynamic = "force-dynamic"` —
tenhle stav se tedy jen vrací tam, kde byl, a cachování bylo dočasný bonus
plynoucí z jednojazyčnosti.

## Přepínač: jediný zdroj pravdy

Starý `LanguageSwitcher` si cookie nastavoval sám (`document.cookie`) a pak
navigoval na `/cs` nebo `/`. Nově dělá jen to druhé — naviguje na `?lang=`
a **cookie nastaví proxy**. Důvod: aby existovala jedna cesta, jak se jazyk
mění, ne dvě, které se můžou rozejít.

## Co se NEMĚNÍ

- Žádné jazykové cesty, žádný `[lang]` segment, žádné duplikované routy.
- `getLang()` volají stránky beze změny — podpis zůstává `Promise<Lang>`.
- Databáze: sloupce `title_cs` / `title_en` už existují a používají se.
- Voice: české texty píšeme v hlase Spaghetti (malá písmena, hravě, pravdivě),
  ne jako překlad angličtiny. Strojový překlad je zakázaný — u `experiencePanel`
  jde o popisy, které mají člověka navnadit, ne popsat.

## Testování

- **Jednotkové:** `getLang()` s různými kombinacemi cookie / host / geo hlaviček;
  že `?lang=` v proxy odmítne nesmysl (`?lang=de` → beze změny).
- **Datové:** každý záznam v `EXPERIENCES` má `description` i `guide` v obou
  jazycích, kromě těch s `enOnly`. Test to hlídá, aby příští experiment
  nezapomněl na češtinu (stejná pojistka jako u `dictionaries.ts`).
- **Průchod prohlížečem:** přepnutí na CZ na homepage, kontrola, že se přeloží
  feed i panel, že to přežije reload (cookie) a že `?lang=cs` funguje na přímém
  odkazu do experience.

## Otevřené na potom (C2)

Překlad `/life-manual` (~154 textů, parodie na IKEA manuál) a `/rules`
(1352 řádků, stojí na slovních hříčkách). Obojí se musí **napsat**, ne přeložit
— proto samostatný projekt s vlastním kolem revizí.
