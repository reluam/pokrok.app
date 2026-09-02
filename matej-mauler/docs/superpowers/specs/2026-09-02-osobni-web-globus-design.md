# Osobní web jako glóbus (matejmauler.com)

Datum: 2026-09-02

## Cíl

Nahradit vodorovný pás pěti panelů **rotující koulí**. Sekce webu se stanou
**kontinenty** na jejím povrchu, otáčení koule je navigace. V sekci o práci padá
časová osa — nahradí ji **země uvnitř kontinentu Práce**, kde primární obsah je
*náplň práce*, ne pozice a roky. Sekce „Čemu se věnuju teď" se mění na
**„Nad čím přemýšlím"** (nápady, které podle Matěje stojí za to, aby je někdo
udělal). Sekce **„Jak to vidím" se ruší** bez náhrady.

Voice a texty se řídí beze změny specem `2026-08-12-osobni-web-texty-design.md` —
tenhle dokument mění strukturu a formu, ne hlas.

## Rozhodnutí, která jsou už udělaná

Padla v brainstormingu a nejsou v tomhle dokumentu znovu otevřená:

1. **Glóbus s kontinenty**, ne otočný kruh a ne „celý viewport je povrch koule".
2. **Dvě úrovně:** kontinent = sekce webu, země = firma uvnitř kontinentu Práce.
3. **„Začátek" je taky kontinent** — koule má čtyři kontinenty, úvodní text je
   obsah toho domovského.
4. **Nápady napíše Matěj.** Implementace dodá strukturu a tři jasně označené
   placeholdery.
5. **Projekty (Matt Mauler, Spaghetti.ltd, Stats & Facts) mizí ze stránky.**

## Architektura

### Vrstvy

```
app/{page,work,ideas,contact}/page.tsx     route → <SiteShell section="…" />
  └─ components/site/SiteShell.tsx          server: přečte jazykovou cookie
      └─ components/site/GlobeShell.tsx     client: stav (kontinent, zoom, rotace, jazyk)
          ├─ components/site/TopMenu.tsx    beze změny kromě seznamu sekcí
          ├─ components/site/Globe.tsx      SVG koule — čistě prezentační
          └─ components/site/panels.tsx     texty pod koulí
              (StartPanel, WorkPanel, IdeasPanel, ContactPanel)

lib/site/globe.ts        ortografická projekce + rotační matematika (pure, testovatelné)
lib/site/continents.ts   geometrie kontinentů (lat/lon), vazba na sekci
lib/site/countries.ts    země kontinentu Práce (firma + náplň + plocha)
lib/site/ideas.ts        obsah kontinentu Nápady
lib/site/sections.ts     čtyři sekce, routy, nadpisy (dnešní soubor, zúžený)
```

`Globe.tsx` **nesmí** znát obsah — dostane seznam tvarů, popisků a stav rotace,
vrací SVG a hlásí kliky nahoru. Díky tomu se dá stavět a testovat bez textů.
`GlobeShell.tsx` naopak nesmí kreslit — drží stav a URL.

### Proč SVG s ortografickou projekcí

Tři zvažované cesty: SVG + projekce, CSS 3D transformy, pixi.js.

- **SVG + ortografická projekce (zvoleno).** Kontinent je polygon v souřadnicích
  lat/lon; každý snímek se jeho body promítnou na kruh. Kontinenty se u okraje
  reálně smršťují a mizí za obzor, takže koule vypadá jako koule. Zůstává to DOM,
  takže čtečky, výběr textu i tisk fungují. Žádná nová závislost.
- **CSS 3D.** Levnější, ale každý kontinent zůstane plochá placka tečná ke kouli —
  u okraje to prozradí, že koule to není.
- **pixi.js** (je v repu). Nejhezčí, ale obsah přestane být text v DOMu. Web stojí
  na textu. Zamítnuto.

### Projekce (lib/site/globe.ts)

Ortografická projekce, střed koule v počátku, poloměr `R`. Rotace je dvojice
`{ lon0, lat0 }` — zeměpisná délka a šířka bodu, který je právě uprostřed
přivrácený k divákovi.

```
d      = lon − lon0
cosc   = sin(lat0)·sin(lat) + cos(lat0)·cos(lat)·cos(d)
x      = R · cos(lat)·sin(d)
y      = R · (cos(lat0)·sin(lat) − sin(lat0)·cos(lat)·cos(d))
viditelný ⟺ cosc > 0
```

SVG má y dolů, takže se vrací `-y`. Exportované funkce:

- `project(point, rotation, radius) → { x, y, cosc }`
- `isVisible(point, rotation) → boolean` (`cosc > 0`)
- `projectPolygon(points, rotation, radius) → { path, visibility }` — polygon
  celý za obzorem vrací `visibility: "hidden"`, částečně viditelný `"partial"`
  (body za obzorem se ořežou na okraj kotouče, aby tvar nepřeskočil).
- `shortestRotation(from, to) → to'` — cíl posunutý o násobek 360°, aby se koule
  točila kratší cestou (z 350° na 10° jde doprava o 20°, ne doleva o 340°).
- `rotationFor(continentId) → { lon0, lat0 }` — centroid kontinentu.

Všechno čisté funkce bez Reactu → přímo testovatelné.

### Geometrie kontinentů (lib/site/continents.ts)

Čtyři kontinenty, centroidy rozsazené po obvodu tak, aby mezi sousedy bylo vždy
~90° a při otáčení bylo vidět, že se projelo přes oceán:

| kontinent | sekce | centroid (lon, lat) |
|---|---|---|
| Začátek | `home` | 0°, +15° |
| Práce | `work` | 90°, −10° |
| Nápady | `ideas` | 180°, +20° |
| Kontakt | `contact` | 270°, −15° |

Tvar kontinentu je ručně napsaný uzavřený polygon 10–16 bodů v lat/lon kolem
centroidu — ne generovaný, aby měl každý kontinent zapamatovatelnou siluetu.
Souřadnice jsou data, ne magie v komponentě.

### Země kontinentu Práce (lib/site/countries.ts)

`lib/site/timeline.ts` končí. Nahradí ho `countries.ts` se stejnými šesti
záznamy, ale jiným tvarem položky:

```ts
export type Country = {
  id: string;
  org: string;          // Teya, Beats for Love, …
  /** Co jsem tam dělal. Náplň, ne pozice. */
  body: Bi;
  bullets?: Bi[];
  /** Měsíce působení — jediné, k čemu roky ještě slouží. Do textu se nepíšou. */
  months: number;
  /** Polygon země v lat/lon, uvnitř polygonu kontinentu Práce. */
  shape: [number, number][];
};
```

**`role` a `period` z datového modelu i ze stránky mizí.** Zadání znělo „firma a
tam popisek toho, co jsem dělal" — pozice ani roky se nikde nevypisují.

Délku působení nese **plocha země**: Beats for Love (2015 → dnes, ~130 měsíců) je
zdaleka největší pevnina, Kinder Fest a MarketPUBG malé ostrovy. Čas je tak vidět,
aniž by se psal. Plocha je monotónní funkcí `months` s podlahou, aby nejmenší země
pořád unesla popisek a dala se kliknout — konkrétně `sqrt(months)` škálované do
rozsahu, který drží nejmenší zemi nad ~1/5 plochy té největší.

Texty `body` se přebírají z dnešního `timeline.ts` beze změny; jen u Teyi a
Beats for Love se z těla vypustí zmínky, které fungovaly jen vedle data.

### Nápady (lib/site/ideas.ts)

```ts
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
```

Implementace naplní pole **třemi placeholdery**, jejichž `title` začíná
`PLACEHOLDER —` a text říká, co sem patří. Test hlídá, že si jich nikdo nevšimne
až v produkci (viz Testy). Matěj je přepíše.

`lib/projects.ts` **zůstává v repu**, ale přestane se renderovat — `app/page.tsx`
z něj bere URL projektů do JSON-LD `sameAs` a to je legitimní identita osoby, ne
sekce stránky. Komentář v hlavičce souboru se opraví, aby nelhal o tom, kam se
vykresluje.

## Interakce

### Úroveň 1 — glóbus

- **Tažení** myší nebo prstem otáčí koulí volně (`lon0` i `lat0`; `lat0` se
  ořízne na ±60°, aby se koule nepřetočila přes pól).
- **Puštění** dojede setrvačností a **přichytí se k nejbližšímu kontinentu** —
  koule nikdy nezůstane stát na oceánu.
- **Klik na kontinent** (i ten napůl za obzorem) ho otočí dopředu.
- **Klik v menu** dělá totéž — menu je plnohodnotná náhrada za otáčení.
- Text kontinentu se čte **pod koulí**, prolne se při každé změně.
- Délka rotace roste s úhlovou vzdáleností, stejná logika jako dnešní
  `durationFor` v `SiteStrip` (min ~560 ms, strop ~1300 ms).

### Úroveň 2 — zoom do kontinentu

Jen kontinent **Práce**. Ostatní kontinenty zoom nemají — nemají co skrývat.

- Vstup: klik na kontinent, který už je vepředu, nebo tlačítko „otevřít" v panelu.
- Koule se zvětší (~2,5×) a posune tak, aby kontinent vyplnil scénu; ostatní
  kontinenty se odbarví a odplavou z výřezu.
- Uvnitř siluety kontinentu se objeví **země** — každá jako polygon s názvem firmy.
- Klik na zemi ji zvýrazní a vypíše její text pod scénou.
- Zpět: `Esc`, tlačítko „zpět na glóbus", nebo browser back.

### URL

Zoom **nemá vlastní URL** — je to detail v rámci `/work`, ne samostatná stránka.
Vybraná země také ne. Zůstávají čtyři routy:

| cesta | kontinent |
|---|---|
| `/` | Začátek |
| `/work` | Práce |
| `/ideas` | Nápady (nová route) |
| `/contact` | Kontakt |

Navigace mezi kontinenty přepisuje URL přes `history.pushState`, stejně jako dnes —
žádný router push, protože ten by komponenty odmountoval a zabil animaci.
`popstate` se mapuje zpět na kontinent.

`/projects` a `/thoughts` dostanou v `next.config.ts` **trvalý redirect na
`/ideas`**. Obsah „Jak to vidím" zaniká; redirect na nejbližší živou věc je lepší
než 404 na odkazu, který někde visí.

## Přístupnost a degradace

- **Bez JS** se vykreslí všechny čtyři panely jako text pod sebou (jako dnes jsou
  všechny panely v DOMu). Koule je `aria-hidden` dekorace; navigace jede přes menu,
  které je z pravých `<a href>`.
- **Klávesnice:** menu je plná náhrada. Kontinenty na kouli jsou navíc fokusovatelné
  (`<a>` uvnitř SVG), šipky ←/→ otáčejí na sousední kontinent.
- **`prefers-reduced-motion`:** rotace se nepřehrává, kontinent se přepne skokem;
  žádná setrvačnost, žádný zoom-animace (jen okamžitá změna).
- **Čtečky:** obsah panelů je normální HTML, `aria-live` na panelu ohlásí změnu
  kontinentu. Země jsou uvnitř SVG jako `<a>` s `aria-label` „firma".
- **SEO:** všechny čtyři sekce zůstávají v DOMu na každé routě, jako dnes. Titulek
  a `metadata` per route beze změny.

## Mobil

- Koule zmenšená, drží se nahoře, text pod ní.
- Otáčení švihnutím prstu; `touch-action: none` jen na kouli, ne na stránce, aby
  se dalo normálně scrollovat textem.
- Zoom do kontinentu Práce vykreslí kontinent na plnou šířku, země pod sebou
  s většími zásahovými plochami.

## Jazyk

Dvojjazyčná struktura `Bi { cs, en }` a přepínač v `TopMenu` se **nesahají**.
Nové soubory (`countries.ts`, `ideas.ts`) drží `Bi` u každého textu.

## Co se maže

| soubor | důvod |
|---|---|
| `components/site/SiteStrip.tsx` | nahrazuje `GlobeShell.tsx` |
| `components/site/HowISeeIt.tsx` | sekce „Jak to vidím" končí |
| `lib/site/beliefs.ts` | tři přesvědčení — obsah zrušené sekce |
| `lib/site/thoughts.ts` | pět pravidel — obsah zrušené sekce |
| `lib/site/timeline.ts` | nahrazuje `countries.ts` |
| `lib/site/howISeeIt.test.ts` | testuje mazaný obsah |
| `lib/site/timeline.test.ts` | testuje mazaný soubor |
| `app/thoughts/page.tsx` | route → redirect |
| `app/projects/page.tsx` | route → redirect |

V `app/globals.css` padají bloky `.mm-strip`, `.mm-panel`, `@keyframes mm-glide`,
`.mm-timeline` / `.mm-tl-*`, `.mm-hisi` / `.mm-cluster` / `.mm-node*`,
`.mm-projects` / `.mm-project*`. Přibývají `.mm-globe*`, `.mm-continent*`,
`.mm-country*`, `.mm-ideas*`. Barevné tokeny v `:root` se nemění.

V `lib/site/copy.ts` padá `inPractice` (dělič zrušené sekce), `nowIntro` se
přejmenuje na `ideasIntro` a dostane nový text. `copy.test.ts` se upraví: test
„mrtvé klíče" přidá `inPractice` a `nowIntro` mezi mrtvé a přestane kontrolovat
`projects` blurby (ty už nejsou obsah stránky).

## Testy (vitest, `npm test`)

Testuje se to, co má jedinou správnou odpověď — ne vzhled.

1. **`globe.test.ts`** — projekce: bod v centru rotace padne na `(0,0)`; bod
   90° stranou padne na okraj kotouče; bod na odvrácené straně má `cosc < 0`;
   `shortestRotation(350°, 10°)` vrátí `370°`, ne `10°`.
2. **`continents.test.ts`** — čtyři kontinenty, ID odpovídají sekcím, centroidy
   jsou navzájem vzdálené (žádné dva kontinenty na sobě), každý polygon je
   uzavřený a má aspoň 8 bodů.
3. **`countries.test.ts`** — každá země má `body` v obou jazycích delší než 20
   znaků; `months` je kladné; plocha roste s `months`; Beats for Love je největší;
   v datovém modelu **není** `role` ani `period` (hlídá, aby se pozice nevrátily);
   všechny polygony zemí leží uvnitř polygonu kontinentu Práce.
4. **`ideas.test.ts`** — každý nápad má `title`, `what`, `why` v obou jazycích.
   Samostatný test **selže, dokud v datech zůstává `PLACEHOLDER`** — je to
   pojistka, aby placeholdery nedojely do produkce, a zároveň Matějův to-do.
5. **`copy.test.ts`** (dnešní soubor, rozšířený — nový testovací soubor nevzniká) — čtyři sekce,
   `thoughts` mezi nimi není, `indexForPath("/ideas")` ukazuje na nápady.

Test č. 4 je záměrně červený až do doplnění textů. Do té doby se nemerguje.

## Pořadí implementace

1. `globe.ts` + testy projekce (nic to nerozbije, dá se dělat vedle běžícího webu).
2. `continents.ts` + `Globe.tsx` — koule se čtyřmi kontinenty, zatím bez obsahu.
3. `GlobeShell.tsx` — rotace, URL, menu; `SiteStrip` odpojit.
4. `countries.ts` + zoom do Práce.
5. `ideas.ts` + `IdeasPanel`, route `/ideas`, redirecty.
6. Mazání zrušené sekce a mrtvého CSS.
7. Mobil, `prefers-reduced-motion`, klávesnice.

Kroky 1–3 dávají funkční web se čtyřmi kontinenty; teprve pak se sahá na obsah.

## Co tenhle spec nedělá

- Nemění hlas ani znění existujících textů (kromě vypuštění dat z `body`).
- Nesahá na Clerk, DB, ani na cokoli mimo `app/{,work,ideas,contact,thoughts,projects}`,
  `components/site/`, `lib/site/`.
- Nepřidává závislost.
- Nedělá zoom u jiných kontinentů než Práce.
