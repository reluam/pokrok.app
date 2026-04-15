# Architecture: Jak se lekce zobrazují a jaké má uživatel interakce

> Reference pro každého, kdo edituje obsah lekcí. Když píšeš text, scénář nebo kvíz, měl bys vědět, jak to bude vypadat na obrazovce a jak na to bude moci uživatel reagovat.

## Hierarchie obsahu

```
Track  (např. "Kognitivní zkreslení")
 └── Course  (např. "Jak funguje mysl")
      └── Model  (mentální model nebo bias, např. "System 1 & System 2")
           └── Lesson  (intro / scenario / quiz / application / deep_dive / comparison)
                └── Step  (text / scenario / key_insight / quiz)
```

- **Track** = top-level kategorie, obrazovka „Library" (`app/(tabs)/library.tsx`).
- **Course** = sekce uvnitř tracku, vykreslená jako mapa nodů (`components/map/CourseMap.tsx`).
- **Model** = jeden node na mapě — reprezentuje jeden mentální koncept.
- **Lesson** = konkrétní průchod modelem. Jeden model má obvykle 2–4 lekce (intro → scenario → application).
- **Step** = jeden krok v lekci. Lekce má 3–6 kroků.

## UI tok (od tapnutí na model po dokončení lekce)

1. Uživatel je v `library.tsx`, vidí seznam tracků.
2. Klikne na track → otevře se [CourseMap](../components/map/CourseMap.tsx) s mapou nodů (modelů).
3. Klikne na node → otevře se [lesson/[id].tsx](../app/lesson/[id].tsx) (modální obrazovka přes celou výšku).
4. Tato obrazovka mountuje [LessonEngine](../components/lesson/LessonEngine.tsx), který drží stav celé lekce a renderuje aktuální krok.
5. Po dokončení posledního kroku se zobrazí XP odměna a uživatel zavře lekci tlačítkem „Pokračovat".

## Typy kroků (LessonStep)

Definované v [`types/index.ts`](../types/index.ts) a vykreslené komponenty žijí v [`components/lesson/`](../components/lesson/).

### 1. `text`

**Markdown:**
```markdown
### 1. Text

Honza jede autem po známé trase do práce. Řadí, brzdí, zatáčí — a přitom přemýšlí o schůzce.
```

**TS shape:** `{ type: 'text', content: string }`

**Renderování:** [TextStep.tsx](../components/lesson/TextStep.tsx) — text v kartě s dekorativní SVG ilustrací nahoře. Žádná interakce, uživatel jen čte a klikne „Pokračovat".

**Použij na:** úvodní expozici, příběh, vysvětlení konceptu, přechod mezi scénáři.

---

### 2. `scenario`

**Markdown:**
```markdown
### 2. Scénář

**Situace:** Najednou před Honzu vběhne pes. Honza šlápne na brzdu dřív, než si to stihne uvědomit.

**Otázka:** Co se právě stalo v Honzově mozku?

- **✅ Rychlá automatická část mozku zareagovala dřív, než stihla pomalejší analytická část**
  Přesně! Tvůj mozek má dva „režimy". Rychlý reaguje okamžitě.
- ❌ Honza má dobré reflexy díky řidičským zkušenostem
  Zkušenost pomáhá, ale hlavní je něco hlubšího.
- ❌ Adrenalin způsobil rychlou reakci
  Adrenalin přišel až po reakci.
```

**TS shape:**
```ts
{
  type: 'scenario',
  situation: string,    // krátký kontext, vykreslí se v karte s uvozovkami
  question: string,     // otázka, kterou se ptáme
  options: ScenarioOption[],
}
```

`ScenarioOption` = `{ text: string, correct: boolean, explanation: string }`. Právě jedna option musí být `correct: true` — sync to nevynucuje, ale UX předpokládá jednu správnou.

**Renderování:** [ScenarioStep.tsx](../components/lesson/ScenarioStep.tsx). Karta se situací nahoře (uvozovky SVG), otázka pod ní, options jako tlačítka s velkými písmeny A/B/C.

**Interakce uživatele:**
- **Klikne na option** → tap haptic, option se zvýrazní.
- **Pokud správně:** zelená barva, ikona ✅, zobrazí se vysvětlení, uživatel může jít dál (`Pokračovat` se odemkne).
- **Pokud špatně:** červená barva, ikona ❌, vibration error, vysvětlení se ukáže, **option se po 1.4s odznačí** a uživatel může zkusit znovu.
- **Atribuce „first try":** `LessonEngine` sleduje, jestli uživatel odpověděl správně napoprvé. Pokud ano u všech scenario/quiz kroků v lekci, dostane bonusové XP a 100% skóre.

**Použij na:** situaci, do které chceš uživatele vtáhnout. „Co bys udělal ty?" / „Co se právě stalo?" / „Jak to chápeš?"

---

### 3. `key_insight`

**Markdown:**
```markdown
### 4. Klíčový poznatek

Systém 1 je rychlý a efektivní — ale právě proto dělá chyby. Většina kognitivních zkreslení vzniká, když Systém 1 odpovídá zkratkou na složitou otázku.
```

**TS shape:** `{ type: 'key_insight', content: string }`

**Renderování:** [KeyInsightStep.tsx](../components/lesson/KeyInsightStep.tsx) — žlutá karta s ikonou žárovky nahoře a labelem „KLÍČOVÝ POZNATEK". Vizuálně nejvýraznější krok lekce.

**Použij na:** závěrečnou pointu, která má utkvět. Jeden, max dva za lekci. Měl by být **memorable jednovětou** — to, co si uživatel odnese.

---

### 4. `quiz`

**Markdown:**
```markdown
### 2. Kvíz

**Otázka:** Kdy je Systém 1 nebezpečný?

- **✅ Když řeší složitý problém, ale odpověď „cítí" jednoduše**
  Přesně! Nebezpečí není v tom, že existuje, ale v tom, že je přesvědčivý.
- ❌ Vždy — Systém 1 je nespolehlivý
  Systém 1 je většinou skvělý.
```

**TS shape:** `{ type: 'quiz', question: string, options: ScenarioOption[] }` — stejné jako scenario, ale **bez** `situation`.

**Renderování:** Stejná komponenta jako scenario (`ScenarioStep`), jen bez karty se situací nahoře. Interakce identická.

**Použij na:** kontrolu porozumění. Krátká, abstraktnější otázka než scenario.

## Lesson types (vyšší úroveň, label v hlavičce obrazovky)

Definované v `types/index.ts` jako `LessonType`:

| Typ | Label v UI | Kdy použít |
|---|---|---|
| `intro` | Úvod | První lekce modelu — expozice konceptu |
| `scenario` | Scénář | Lekce postavená na konkrétní situaci |
| `quiz` | Kvíz | Test porozumění |
| `application` | Aplikace | Praktické použití v reálu |
| `deep_dive` | (custom) | Hlubší rozpracování (zatím nepoužito) |
| `comparison` | (custom) | Srovnání s jiným modelem (zatím nepoužito) |

`lesson_type` je metadata na úrovni lekce, ne kroku — ovlivňuje jen badge v hlavičce a XP. Jeden model může mít víc lekcí různých typů: typicky `intro → scenario → application`.

## XP a gamifikace

- Každá lekce má `xp_reward` — base XP za dokončení.
- `LessonEngine` volá [`calculateLessonXp`](../lib/xp-engine.ts), který přidává:
  - **First-try bonus** — pokud uživatel u všech scenario/quiz kroků odpověděl napoprvé správně.
  - **Streak bonus** — pokud má uživatel current streak ≥ 1.
- Po dokončení se zobrazí [`XpReward`](../components/gamification/XpReward.tsx) s breakdownem.
- XP se přičte do [`useUserStore`](../stores/user-store.ts) → updatuje level a streak.
- Lekce se označí jako completed v [`useLessonStore`](../stores/lesson-store.ts).

**Doporučené hodnoty:**
- intro: 10 XP
- scenario / quiz: 15 XP
- application: 20 XP

## Bilingvální obsah (CZ + EN)

Wiki umí udržovat český i anglický překlad vedle sebe. EN je vždy **volitelný** — pokud chybí, aplikace fallbackne na CZ. Uživatel si jazyk přepíná v profilu (viz [profile.tsx](../app/(tabs)/profile.tsx) → Languages segment).

### Model body sekce

Pod každou `## Sekci` můžeš přidat `### EN` subheading s anglickým překladem:

```markdown
## Krátký popis

Náš mozek má dva režimy myšlení.

### EN

Our brain has two modes of thinking.

## Plné vysvětlení
...
```

Sync ukládá EN do polí `short_description_en`, `full_explanation_en`, `real_world_example_en`, `common_mistakes_en` na `MentalModel`.

### Lesson steps — text / key_insight

Pod obsah kroku přidej `#### EN` subheading:

```markdown
### 1. Text

Honza jede autem po známé trase.

#### EN

Honza is driving along his usual route.
```

Ukládá se do `step.content_en`.

### Lesson steps — scenario / quiz

EN blok je **kompletní duplikát** struktury (situace + otázka + options ve stejném pořadí). Markery můžeš použít české (`**Situace:**`, `**Otázka:**`) nebo anglické (`**Situation:**`, `**Question:**`) — parser zvládne obojí.

```markdown
### 2. Scénář

**Situace:** Najednou před Honzu vběhne pes.

**Otázka:** Co se právě stalo?

- **✅ Rychlá automatická část mozku zareagovala**
  Přesně!
- ❌ Honza má dobré reflexy
  Zkušenost pomáhá, ale...

#### EN

**Situation:** Suddenly a dog runs in front of Honza.

**Question:** What just happened?

- **✅ The fast automatic part of the brain reacted**
  Exactly!
- ❌ Honza has good reflexes
  Experience helps, but...
```

Pravidla:
- **Počet options musí být stejný** v CZ i EN. Sync hodí chybu, pokud se liší.
- **Pořadí options musí být stejné.** Sync páruje podle indexu (1. CZ option = 1. EN option).
- **Markery `✅`/`❌` musí být na stejné pozici** — sync neporovnává `correct` mezi jazyky, bere ho jen z CZ.
- EN se ukládá do `situation_en`, `question_en`, `options[i].text_en`, `options[i].explanation_en`.

### Co se NEPŘEKLÁDÁ (zatím)

- Track titles + subtitles (`title`, `subtitle` na Track i Course)
- Lesson type labels (`intro`, `scenario`, ...) — překlad žije v `app/lesson/[id].tsx` `LESSON_TYPE_LABELS`
- Button labels (Pokračovat / Continue) — překlad v `LessonEngine.tsx` `BUTTON_LABELS`
- UI texty profilu, library, atd. — překládají se case-by-case přes `t(cs, en)` helper

Pokud chceš zbilingualizovat víc UI nebo titles tracků, dej vědět — bude to další kolo.

### Jak EN funguje za běhu

1. `useUserStore` drží `language: 'cs' | 'en'` (default `'cs'`).
2. `LessonEngine.tsx` čte `language` z store a před předáním do step komponent vybere CZ nebo EN field (`pickLocalized`, `localizeOptions`).
3. Step komponenty (`TextStep`, `KeyInsightStep`, `ScenarioStep`) jsou language-agnostic — dostávají už lokalizovaný text.
4. Pokud EN field neexistuje, fallback na CZ. Uživatel uvidí CZ i v EN módu, dokud EN obsah nedoplníš.

## Pravidla pro psaní obsahu

### Délka textových kroků

- Karta `text` má fixní výšku — text by se měl vejít bez scrollování (cca 4–6 vět nebo 250–400 znaků).
- Pokud potřebuješ delší expozici, rozděl ji na dva text kroky s scenario mezi nimi (drží to pozornost).

### Scenario options

- **3 options** je sweet spot. 2 jsou málo (snadné uhodnout), 4+ jsou kognitivní zátěž.
- **Špatné options musí být plausibilní.** Zjevně blbé odpovědi učení neotestují.
- **Vysvětlení u špatných odpovědí je důležité.** Není to trest, je to mikrolekce — vysvětli, *proč* je to past a jak to souvisí s konceptem.

### Tón

- Persona uživatele: Honza, Klára, Tomáš, Petra... Vytváří to známost.
- 2. osoba (`ty`, `tvůj mozek`) místo 3. osoby (`člověk`, `jeho mozek`) — působí osobněji.
- Konkrétní příklady > abstraktní popis. „V obchodě vidíš cenovku 999 Kč" > „Při nákupech se setkáváme s cenami".

### Komentáře v wiki

Použij `%% ... %%` (Obsidian native) pro:
- TODO si přepsat větu („%% tohle je moc dlouhé, zkrátit %%")
- poznámky pro sebe, které nepatří uživateli
- alternativní varianty znění

Sync je strippuje **před** zápisem do TS, takže do aplikace nikdy nedoletí.

## Gotchas

- **Nepoužívej HTML komentáře `<!-- -->`** — sync je nestrippuje, dostanou se do TS jako součást contentu.
- **Nemíchej `**Situace:**` a `**Otázka:**`** — parser je rozlišuje a špatné pořadí způsobí chybu.
- **`✅` a `❌` jsou povinné** — parser podle nich pozná správnou odpověď. Bez nich option ignoruje.
- **Indent vysvětlení o 2 mezery** pod položkou seznamu — jinak se přiloží k další option.
- **Změna ID lekce = změna identity.** Pokud přejmenuješ ID (`cb-l-f01a` → `cb-l-f01x`), uživatel ztratí progress té lekce. Zachovej původní ID, pokud edituješ obsah.
- **Zachovej `## Krátký popis`, `## Plné vysvětlení`, `## Příklad ze života`, `## Časté chyby`** v této formě — sync hledá tyto přesné nadpisy.

## Související soubory

| Co | Kde |
|---|---|
| Typy | [types/index.ts](../types/index.ts) |
| Lesson engine | [components/lesson/LessonEngine.tsx](../components/lesson/LessonEngine.tsx) |
| Step komponenty | [components/lesson/](../components/lesson/) |
| Lesson screen | [app/lesson/[id].tsx](../app/lesson/[id].tsx) |
| Course map | [components/map/CourseMap.tsx](../components/map/CourseMap.tsx) |
| Library | [app/(tabs)/library.tsx](../app/(tabs)/library.tsx) |
| XP engine | [lib/xp-engine.ts](../lib/xp-engine.ts) |
| Lesson store | [stores/lesson-store.ts](../stores/lesson-store.ts) |
| User store | [stores/user-store.ts](../stores/user-store.ts) |
| TS data (auto-gen) | [data/models/](../data/models/), [data/lessons/](../data/lessons/) |
| Wiki sync skripty | [scripts/wiki/](../scripts/wiki/) |
