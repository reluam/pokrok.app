# Přepis textů osobního webu (matejmauler.com)

Datum: 2026-08-12

## Cíl

Texty na osobním webu mají být **honest, humble a to the point**. Popis člověka, který
se snaží být aktivním účastníkem světa — bez omáček, bez sebehodnocení, bez pointy na
konci každého odstavce.

Rozsah: všech pět panelů (`home`, `work`, `projects`, `thoughts`, `contact`).

## Diagnóza současného stavu

Texty jsou napsané dobře, ale mají jeden opakovaný tik: **skoro každý odstavec končí
aforismem**. „My favourite questions are the ones nobody has bothered to ask yet." /
„an idea without people who want it is an expensive hobby." / „sales isn't about talking
— it's about asking the right question and then shutting up."

Je to chytré, ale je to autor, co si dává góly. Vedlejší efekt: každá informace je
podřízená své pointě, takže se dá číst jako sebeprezentace.

Druhý problém je strukturální: sekce „Jak to vidím" je **3 přesvědčení + 12 myšlenek**,
kde tři z těch dvanácti jsou tatáž tři přesvědčení. Dvanáct životních pouček je formát,
který je neskromný bez ohledu na to, jak pokorně jsou jednotlivé věty napsané.

## Hlasová pravidla (platí pro každý řádek)

1. **Žádná pointa na konci odstavce.** Odstavec končí, když dojde informace.
2. **Žádné sebehodnocení.** Ne „things nobody asked for". Kdo věci dělá, nemusí o sobě
   říkat, že je dělá.
3. **Konkrétní jména místo kategorií.** „sales at Teya", ne „sales in fintech".
   Konkrétnost je ta skromnost.
4. **Neúspěchy holé, bez poučení.** „It ended badly." tečka. Přilepené ponaučení
   z průšvihu dělá životní moudro.
5. **Max 2–3 věty na blok.**
6. Sentence case (ne lowercase — to je hlas experimentů na Spaghetti, ne osobního webu).
7. První osoba všude. Nejsou to rady čtenáři.
8. **Web nesmí působit jako portfolio úspěšného člověka.** Je to popis člověka, který se
   snaží žít, jak nejlíp umí. Nedodělané zůstává nedodělaným, neúspěch neúspěchem —
   bez vysvětlení, bez omluvy a bez odstraňování „kvůli vyváženosti". Když se při
   redakci objeví nutkání nějaký fail vyhodit nebo změkčit, je to signál, že tam patří.

Angličtina je primární (web je EN-only, `getLang() → "en"`). Čeština se udržuje
paralelně, protože typ `Bi` ji vyžaduje — cs scaffolding zůstává zmražený, ne smazaný.

---

## 1 — Home (`lib/site/copy.ts` → `COPY.description`)

**en**

> I'm Matěj. I'm of the human species. Life, and being human, is a fascinating, humbling
> and awe-inspiring experience for me.
>
> In my small way I want to make it more fascinating still. So I keep learning — about
> the world, about people, about myself.
>
> Whatever I do, I do it with that end goal in mind — as a project manager, as a
> musician, as a human being.

**cs**

> Jsem Matěj. Jsem z živočišného druhu člověk. Život a to, být člověkem, je pro mě
> fascinující, pokořující a úžasná zkušenost.
>
> Svým malým dílem chci přispět k tomu, aby byl ještě fascinující. Tak se pořád učím —
> o světě, o lidech, o sobě.
>
> Ať dělám cokoli, dělám to s tímhle cílem — jako projektový manažer, jako muzikant,
> jako člověk.

Poznámky:
- „I'm of the human species" je záměrná zvláštnost — je mírně vtipná a sedí k tomu, co
  Spaghetti dělá jinde (inform, educate, entertain). Neuhlazovat do „I'm human".
- „for me" na konci první věty je záměrné: dělá z toho Matějovu zkušenost, ne tvrzení
  o tom, jaký život je. Nevypouštět — je to celý rozdíl mezi popisem a kázáním.
- **Hlavní stránka nenese žádný konkrétní fakt.** Je to vědomé rozhodnutí: co Matěj
  dělá, říkají až shrnutí sekcí pod tím („A bit of history", „What I do now"). Důsledek
  je, že veškerou faktickou váhu pro vyhledávače nese `metaDescription` — viz níže.
- `description` se používá i jako `<meta description>` a v JSON-LD. Tři odstavce jsou
  pro meta tag moc dlouhé → **implementace musí zavést oddělený `COPY.metaDescription`**
  (jedna věta, ~155 znaků) a `app/page.tsx` použije ten.
  - en: „Matěj Mauler — sales at Teya, music as Matt Mauler, and small web experiments in
    the evenings. Still learning about the world, people, and myself."

## 2 — Sekce (`lib/site/sections.ts`)

| id | title en | summary en |
|---|---|---|
| work | A bit of history | Where I've worked, newest first. Fintech, e-commerce, a company of my own, gaming sites, and a festival I've been at since 2015. |
| projects | What I do now | Three things I keep coming back to. None of them pay for anything. |
| thoughts | How I see it | A few things I've landed on. Not advice — just where I am. |
| contact | Let's stay in touch | Discord is fastest. Email works too. No reason needed. |

| id | title cs | summary cs |
|---|---|---|
| work | Kousek historie | Kde jsem pracoval, od nejnovějšího. Fintech, e-shopy, vlastní firma, herní weby a festival, u kterého jsem od roku 2015. |
| projects | Čemu se věnuju teď | Tři věci, ke kterým se pořád vracím. Ani jedna nic nevydělává. |
| thoughts | Jak to vidím | Pár věcí, na kterých jsem zůstal. Nejsou to rady, je to jen to, kde jsem. |
| contact | Zůstaňme ve spojení | Nejrychleji Discord. Mail taky funguje. Důvod není potřeba. |

Nadpisy sekcí a `nav` popisky zůstávají beze změny — „Zůstaňme ve spojení" se ponechává
(zvažovalo se zkrácení na „Kontakt", zamítnuto).

## 3 — Kousek historie (`lib/site/timeline.ts`)

Řazeno podle data začátku sestupně. `period` už není TODO. Pole `bullets` se v tomto
přepisu nepoužívá (zůstává v typu jako volitelné).

**Pozor: dvě položky jsou `current`** (Teya a Beats for Love). Komponenta
`WorkPanel` dnes u `current` vykresluje `COPY.timelineNow` místo `period` — to by u
B4L zahodilo informaci „2015 –". **Implementace musí `WorkPanel` upravit tak, aby
`period` vypisovala vždy**, a `current` používala jen pro vizuální zvýraznění.

Beats for Love běží celou dobu (2015 – teď), takže mezery mezi ostatními položkami
nejsou prázdné roky — jen roky, kdy Matěj nedělal nic dalšího. Timeline díry nemá
a nemusí je vysvětlovat.

| pořadí | org | period | role en | role cs |
|---|---|---|---|---|
| 1 | Teya | May 2025 – now | Sales | Obchod |
| 2 | NetDirect (FLO) | Sep 2023 – Nov 2024 | Project manager | Projektový manažer |
| 3 | Kinder Fest | 2020 – 2021 | Festivals for kids | Festivaly pro děti |
| 4 | MarketPUBG | 2019 – 2020 | Founder | Zakladatel |
| 5 | Mladá fronta | Feb 2018 – Aug 2019 | Gaming websites | Herní weby |
| 6 | Beats for Love | 2015 – now | Festival insights & visitor research | Festival insights & visitor research |

Kinder Fest byl 2026-08-12 nejdřív vypuštěn a **hned vrácen zpátky** — patří tam podle
hlasového pravidla 8.

Texty (en):

1. **Teya** — Card payment terminals for small businesses. I spend the day talking to
   people who run one.
2. **NetDirect (FLO)** — E-commerce builds, brief to handover.
3. **Kinder Fest** — Producing festivals for children. It ended badly.
4. **MarketPUBG** — A marketplace for game skins. My own company. It didn't make it.
5. **Mladá fronta** — Gaming sites at a publishing house.
6. **Beats for Love** — Started as summer crew on production in 2015 and never left.
   Production, project management, two years full-time between 2021 and 2023, and now
   the visitor research. Also project assistant on Sweetsen Fest. It's the one thing
   I've stayed with.

Texty (cs):

1. **Teya** — Platební terminály pro malé podniky. Celý den mluvím s lidma, co nějaký
   provozují.
2. **NetDirect (FLO)** — E-shopy od zadání po předání.
3. **Kinder Fest** — Pořádání festivalů pro děti. Skončilo to ošklivě.
4. **MarketPUBG** — Tržiště se skiny do her. Vlastní firma. Nevyšlo to.
5. **Mladá fronta** — Herní weby ve vydavatelském domě.
6. **Beats for Love** — Začínal jsem v roce 2015 na produkci jako brigádník a už jsem
   neodešel. Produkce, projektové řízení, dva roky na plný úvazek mezi 2021 a 2023,
   dneska visitor research. K tomu projektový asistent na Sweetsen Festu. Je to jediná
   věc, u které jsem zůstal.

## 4 — Čemu se věnuju teď (`lib/projects.ts`, `COPY.nowIntro`)

Úvod (`nowIntro`):
- en: None of this is a business. I make it because I want it to exist.
- cs: Nic z toho není byznys. Dělám to, protože chci, aby to existovalo.

| projekt | en |
|---|---|
| Matt Mauler | Music. The oldest thing I do. Tracks are on SoundCloud. |
| Spaghetti.ltd | Interactive web experiments — sound, music, a radio that runs on the server, an encyclopedia, games. Plenty of them are unfinished and hardly anyone has seen them. |
| Stats & Facts | Interactive reports, built so you can see what the numbers connect to. It's early — it still lives on a temporary domain, so there's no link yet. |

| projekt | cs |
|---|---|
| Matt Mauler | Hudba. Nejstarší věc, co dělám. Nahrávky jsou na SoundCloudu. |
| Spaghetti.ltd | Interaktivní webové experimenty — zvuk, hudba, rádio běžící na serveru, encyklopedie, hry. Spousta z nich je nedodělaná a skoro nikdo je neviděl. |
| Stats & Facts | Interaktivní reporty, postavené tak, abys viděl, na čem ta čísla visí. Je to na začátku — pořád to běží na dočasné doméně, takže odkaz zatím není. |

Stats & Facts zůstává bez `url` (běží na dočasné doméně) — komponenta už umí vykreslit
projekt bez odkazu.

## 5 — Jak to vidím: 3 + 5

### Obsah

Dělící čára: **trojúhelník = jak to podle mě je** (svět), **kruh = jak se kvůli tomu
chovám** (já). Osm různých položek, žádný duplikát mezi vrstvami.

**▲ Tři přesvědčení** (`lib/site/beliefs.ts`)

| id | claim en | support en |
|---|---|---|
| zodpovednost | I alone am responsible for my life. | I have support. The decisions still show up every morning with my name on them. |
| cernobile | Almost nothing is only black and white. | Work or freedom. Family or career. I spent years stuck inside those, and neither pair was real. |
| mozek | My brain is dumber than I think. | Most of the time I run on autopilot. I build around that instead of arguing with it. |

| id | claim cs | support cs |
|---|---|---|
| zodpovednost | Za svůj život jsem zodpovědný jenom já. | Mám podporu. Ta rozhodnutí se stejně každé ráno objeví s mým jménem. |
| cernobile | Skoro nic není jenom černobílé. | Buď práce, nebo svoboda. Buď rodina, nebo kariéra. Roky jsem v tom byl zaseklý a ani jedna ta dvojice nebyla skutečná. |
| mozek | Můj mozek je hloupější, než si myslím. | Většinu času jedu na autopilota. Stavím kolem toho, místo abych se s ním hádal. |

**● Pět pravidel** (`lib/site/thoughts.ts`)

| id | claim en | support en |
|---|---|---|
| hotove | Done beats perfect. | I can polish something for months. Until it's out, nothing tells me whether I was right. I'm still bad at this. |
| jedna-vec | Nothing gets fixed in one move. | No book, no course, no single decision has ever done it for me. Only a lot of small things stacked over time. |
| sebevedomi | Confidence comes after, not before. | I've never talked myself into it. I've only ever done the thing and found out afterwards. |
| intuice | I take the weird feeling seriously, then check it. | It's not magic, it's my brain noticing something before I can name it. Good first signal, bad final answer. |
| vazne-sebe | I don't take myself that seriously. | When everything is serious, every mistake is a disaster. It's the only thing that reliably gets me to try something in public. |

| id | claim cs | support cs |
|---|---|---|
| hotove | Hotové je lepší než dokonalé. | Umím něco ladit měsíce. Dokud to není venku, nic mi neřekne, jestli jsem měl pravdu. Pořád mi to nejde. |
| jedna-vec | Žádná jedna věc to nespraví. | Žádná kniha, žádný kurz, žádné jedno rozhodnutí to za mě neudělaly. Jenom hodně malých věcí naskládaných v čase. |
| sebevedomi | Sebevědomí přijde až potom, ne předtím. | Nikdy jsem se do toho neupovídal. Vždycky jsem to jenom udělal a zjistil to až pak. |
| intuice | Divný pocit beru vážně, pak si ho ověřím. | Není to magie, je to můj mozek, co si něčeho všiml dřív, než to umím pojmenovat. Dobrý první signál, špatná konečná odpověď. |
| vazne-sebe | Neberu se tak vážně. | Když je všechno vážné, každá chyba je katastrofa. Je to jediná věc, co mě spolehlivě donutí zkusit něco veřejně. |

Vyřazeno z původních dvanácti: `skola` (svaluje vinu), `smysl` (obecné),
`vazne-svet` (splývá s `vazne-sebe`), `zvirata` (obecné).

### Datový tvar

Obě pole sdílí jeden tvar `{ id, claim: Bi, support: Bi }`. `Thought` tedy ztrácí
`title` / `lead` / `body: Bi[]` a zarovnává se na `Belief`.

Typ se definuje jednou a sdílí — implementace ho umístí do `lib/site/beliefs.ts`
a `thoughts.ts` ho importuje (soubory zůstávají oddělené, protože rozdělení
přesvědčení / pravidla je obsahové, ne technické).

### Layout

Nová komponenta `components/site/HowISeeIt.tsx` nahrazuje `BeliefRotator` i
`ThoughtDeck`. Soubor `components/site/decks.tsx` se smaže (nemá jiné použití než
`panels.tsx`).

Chování:

- **Trojúhelník** — tři uzly `claim`, rozmístěné do vrcholů (jeden nahoře uprostřed,
  dva dole po stranách). Klik na uzel rozbalí jeho `support` do jednoho společného
  panelu pod trojúhelníkem. Aktivní uzel je vizuálně zvýrazněný.
- **Dělič** — tichý řádek „so, in practice" / „a v praxi".
- **Kruh** — pět uzlů `claim` rozmístěných po kružnici. Stejné chování: klik rozbalí
  `support` do panelu pod kruhem.
- Obě vrstvy mají **vlastní nezávislý stav** — otevřené přesvědčení nezavírá otevřené
  pravidlo.
- Výchozí stav: nic není otevřené. Nic se nehýbe samo (žádný autoplay) — drží se
  stávající zvyklost z `BeliefRotator`.

Přístupnost:

- Uzly jsou `<button>`, ne divy. Klávesnice funguje bez extra kódu.
- Vzor je disclosure, ne tabs: `aria-expanded` na tlačítku, `aria-controls` na panel,
  panel má `id`. Žádné `role="tab"`.
- Geometrie je čistě vizuální — pořadí v DOM je pořadí čtení a musí odpovídat pořadí
  v poli.
- `@media (prefers-reduced-motion: reduce)` vypíná animaci rozbalení (globals.css už
  takový blok má, stačí rozšířit).

Responsivita:

- Geometrie platí nad `560px` — stejný breakpoint, na kterém se už láme
  `.mm-tl-item` v `globals.css`. Pod ním se trojúhelník i kruh sesypou do prostého
  sloupce.
- **Rozbalování funguje stejně v obou režimech, mění se jen CSS.** (Původně tu stálo,
  že na mobilu bude všech osm `support` textů rovnou vidět — to by znamenalo vykreslit
  každý dvakrát, jednou inline a jednou ve sdíleném panelu. Duplicitní DOM a duplicitní
  čtení pro odečítač obrazovky nestojí za to.)
- Panel je uvnitř vodorovného pásu (`.mm-inner`), takže **nesmí přetéct do stran** —
  šířka geometrie se odvozuje od kontejneru, ne od viewportu.

### Texty okolo (`lib/site/copy.ts`)

- `beliefsHeading` se **přejmenovává** na `inPractice` (starý název by po změně významu
  lhal) a text je dělič mezi vrstvami:
  - en: so, in practice / cs: a v praxi
- `thoughtsShort` a `thoughtsShortLead` se **ruší** — nová komponenta je nepoužívá.
- `prev` / `next` se **ruší** — v nové komponentě není listování.

## 6 — Kontakt

Beze změny kromě `summary` (viz sekce 2). `contactLabel` („Say hi" / „Ozvi se")
zůstává.

---

## Soubory

| soubor | zásah |
|---|---|
| `lib/site/copy.ts` | přepis `description`, `nowIntro`; nový `metaDescription`; přepis `beliefsHeading`; smazat `thoughtsShort`, `thoughtsShortLead`, `prev`, `next` |
| `lib/site/sections.ts` | přepis `summary` u work / projects / thoughts / contact |
| `lib/site/timeline.ts` | přepis všech šesti položek, doplnit `period`, `current` i u B4L |
| `lib/projects.ts` | přepis tří blurbů |
| `lib/site/beliefs.ts` | přepis tří `support`; export sdíleného typu |
| `lib/site/thoughts.ts` | 12 → 5, změna tvaru na `{ id, claim, support }` |
| `components/site/HowISeeIt.tsx` | **nový** — trojúhelník + kruh |
| `components/site/decks.tsx` | **smazat** |
| `components/site/panels.tsx` | `ThoughtsPanel` používá `HowISeeIt`; `WorkPanel` vypisuje `period` i u `current` |
| `app/page.tsx` | `metadata.description` a JSON-LD berou `metaDescription` |
| `app/globals.css` | nové třídy pro geometrii; odstranit `.mm-beliefs*`, `.mm-dot*`, `.mm-deck*`, `.mm-card*`, `.mm-block-*` |

## Ověření

- `npm run build` projde (typy: změna tvaru `Thought` se propíše).
- `npm run lint` projde.
- Vizuální kontrola panelu „Jak to vidím" v širokém i úzkém okně: geometrie
  nepřetéká `.mm-inner` do stran.
- Panel „Kousek historie" ukazuje u Teya i u Beats for Love rok, ne jen „teď".

## Otevřené otázky

Žádné. Spec je kompletní, implementace může začít.

Vyřešeno 2026-08-12: MarketPUBG = 2019 – 2020 (rok hned po Mladé frontě); Kinder Fest =
2020 – 2021, nejdřív vypuštěn, pak vrácen zpátky (hlasové pravidlo 8); Beats for Love
běží průběžně od 2015 a mezi 2021 a 2023 byl na plný úvazek — tím jsou pokryté všechny
roky a timeline nemá díry, které by musela vysvětlovat.
