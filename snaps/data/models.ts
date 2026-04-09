import type { MentalModel, Lesson } from '@/types';

export const mentalModels: MentalModel[] = [
  {
    id: 'mm-01',
    name: 'First Principles Thinking',
    name_cz: 'Myšlení z prvních principů',
    slug: 'first-principles',
    category: 'general_thinking',
    difficulty: 2,
    short_description: 'Rozlož problém na základní pravdy a postav řešení od nuly.',
    full_explanation:
      'Myšlení z prvních principů znamená rozložit problém na nejzákladnější pravdy — věci, které víš s jistotou — a poté sestavit řešení od základů. Místo analogie ("jak to dělají ostatní") se ptáš: "Co je fundamentálně pravda?" Elon Musk tímto způsobem přistoupil k ceně baterií pro Tesla — místo akceptování tržní ceny rozložil baterii na suroviny a zjistil, že materiály stojí zlomek finální ceny.',
    real_world_example:
      'Startup má vysoké náklady na zákaznickou podporu. Místo "najmeme víc lidí" (analogie) se ptáš: Co přesně generuje tikety? Zjistíš, že 60 % tiketů je o jedné funkci s špatným UX. Opravíš UX a tikety klesnou o polovinu.',
    common_mistakes:
      'Lidé si myslí, že myslí z prvních principů, ale ve skutečnosti jen kopírují řešení z jiného kontextu. Další chyba: rozložit problém na části, ale pak sestavit řešení stejným starým způsobem.',
    related_models: ['mm-04', 'mm-02'],
    icon_name: 'Lightbulb',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-02',
    name: "Occam's Razor",
    name_cz: 'Occamova břitva',
    slug: 'occams-razor',
    category: 'general_thinking',
    difficulty: 1,
    short_description: 'Nejjednodušší vysvětlení je obvykle to správné.',
    full_explanation:
      'Occamova břitva říká: když máš dvě vysvětlení, která stejně dobře popisují realitu, preferuj to jednodušší. Nejde o to, že jednoduché je vždy pravda — ale že zbytečná složitost zvyšuje šanci na chybu. V praxi to znamená: než vytvoříš komplexní teorii, zkus nejdřív tu nejpřímočařejší.',
    real_world_example:
      'Tvůj e-shop má nízkou konverzi. Komplikovaná teorie: zákazníci nemají důvěru v brand, potřebuješ influencer kampaň. Jednodušší: tlačítko "Koupit" je schované pod foldem. Začni tím jednodušším.',
    common_mistakes:
      'Zaměňovat jednoduchost s povrchností. Occamova břitva neznamená ignorovat složité problémy — znamená nepřidávat zbytečnou složitost do vysvětlení.',
    related_models: ['mm-01', 'mm-09'],
    icon_name: 'Scissors',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-03',
    name: 'Second-Order Thinking',
    name_cz: 'Myšlení druhého řádu',
    slug: 'second-order-thinking',
    category: 'general_thinking',
    difficulty: 3,
    short_description: 'Neptej se jen "co se stane", ale "a co pak?"',
    full_explanation:
      'Většina lidí přemýšlí jen o bezprostředních důsledcích svých rozhodnutí (první řád). Myšlení druhého řádu jde dál: "A co se stane poté? Jaké budou důsledky těch důsledků?" Tím odhalíš vedlejší efekty, které ostatní přehlíží. Howard Marks to popisuje jako rozdíl mezi průměrným a výjimečným investorem.',
    real_world_example:
      'Firma sníží ceny o 30 % pro zvýšení prodeje (1. řád: více zákazníků). 2. řád: konkurence sníží ceny taky → cenová válka. 3. řád: marže celého odvětví klesnou, menší hráči zkrachují.',
    common_mistakes:
      'Paralýza analýzou — přemýšlení do nekonečna. Cíl není předvídat vše, ale zvážit alespoň 2-3 úrovně důsledků u důležitých rozhodnutí.',
    related_models: ['mm-14', 'mm-04'],
    icon_name: 'Layers',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-04',
    name: 'Inversion',
    name_cz: 'Inverze',
    slug: 'inversion',
    category: 'general_thinking',
    difficulty: 2,
    short_description: 'Místo "jak uspět" se ptej "jak zaručeně selhat" — a tomu se vyhni.',
    full_explanation:
      'Inverze je mentální trik: místo přemýšlení o tom, jak dosáhnout cíle, přemýšlej o tom, co by zaručeně vedlo k neúspěchu — a pak se tomu vyhni. Charlie Munger říká: "Řekni mi, kde zemřu, a já tam nepůjdu." Často je snazší identifikovat, co nedělat, než co dělat.',
    real_world_example:
      'Chceš mít spokojené zaměstnance. Místo "co je udělá šťastnými" se ptej: "Co je zaručeně otráví?" Odpověď: mikromanagement, nejasné cíle, nefér odměňování. Odstraň tyto věci první.',
    common_mistakes:
      'Používat inverzi jako jedinou metodu. Inverze je doplněk, ne náhrada za pozitivní strategii. Pomůže ti vyhnout se chybám, ale sama o sobě nevytvoří vizi.',
    related_models: ['mm-01', 'mm-03'],
    icon_name: 'RotateCcw',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-05',
    name: 'Circle of Competence',
    name_cz: 'Kruh kompetencí',
    slug: 'circle-of-competence',
    category: 'economics',
    difficulty: 2,
    short_description: 'Znaj hranice svých znalostí a operuj hlavně uvnitř nich.',
    full_explanation:
      'Warren Buffett investuje jen do firem, kterým rozumí — to je jeho kruh kompetencí. Klíčové není mít velký kruh, ale znát jeho hranice. Tři kroky: 1) Identifikuj, v čem jsi opravdu dobrý. 2) Operuj primárně uvnitř tohoto kruhu. 3) Postupně ho rozšiřuj, ale vědomě.',
    real_world_example:
      'Jsi skvělý backend vývojář. Startup ti nabídne roli CTO, kde budeš dělat hlavně sales a fundraising. To je mimo tvůj kruh. Buď to odmítni, nebo si najdi mentora a vědomě se v tom vzdělávej, než přijmeš roli.',
    common_mistakes:
      'Přeceňování svého kruhu (Dunning-Kruger efekt) nebo naopak strach z jeho rozšiřování. Kruh kompetencí není statický — můžeš ho růst, ale musíš vědět, kdy jsi na hranici.',
    related_models: ['mm-08', 'mm-13'],
    icon_name: 'Target',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-06',
    name: 'Map is Not the Territory',
    name_cz: 'Mapa není území',
    slug: 'map-not-territory',
    category: 'general_thinking',
    difficulty: 2,
    short_description: 'Modely a plány jsou zjednodušení reality — ne realita samotná.',
    full_explanation:
      'Každý model, plán nebo mapa je zjednodušení reality. To je jejich síla (zjednodušují), ale i slabina (vynechávají detaily). Alfred Korzybski to shrnul: "Mapa není území." V praxi: byznys plán není byznys, finanční model není ekonomika, a váš mentální obraz člověka není ten člověk.',
    real_world_example:
      'Startup má detailní byznys plán na 5 let. Po 3 měsících zjistí, že zákazníci chtějí úplně jiný produkt. Plán (mapa) neodpovídal realitě (území). Ti, kdo lpí na mapě místo na území, selhávají.',
    common_mistakes:
      'Dva extrémy: 1) Slepě důvěřovat modelům a ignorovat realitu. 2) Odmítat modely úplně, protože nejsou dokonalé. Modely jsou užitečné — jen si pamatuj jejich limity.',
    related_models: ['mm-11', 'mm-08'],
    icon_name: 'Map',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-07',
    name: "Hanlon's Razor",
    name_cz: 'Hanlonova břitva',
    slug: 'hanlons-razor',
    category: 'psychology',
    difficulty: 1,
    short_description: 'Nepřisuzuj zlému úmyslu to, co lze vysvětlit hloupostí nebo nepozorností.',
    full_explanation:
      'Když se něco pokazí, naše první reakce je často: "Udělali to schválně!" Hanlonova břitva říká: pravděpodobnější je nekompetence, nepozornost nebo neznalost. To neznamená, že zlý úmysl neexistuje — ale že bys měl nejdřív zvážit jednodušší vysvětlení.',
    real_world_example:
      'Kolega ti neodpověděl na důležitý e-mail. Tvoje první reakce: "Ignoruje mě!" Pravděpodobnější: e-mail se ztratil ve spamu, zapomněl, nebo měl hektický den. Začni otázkou, ne obviněním.',
    common_mistakes:
      'Používat Hanlonovu břitvu k omluvě opakovaného špatného chování. Jednou je to nehoda, třikrát je to vzorec. A v situacích s vysokými stakes (podvod, bezpečnost) bys měl být ostražitější.',
    related_models: ['mm-02', 'mm-08'],
    icon_name: 'Heart',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-08',
    name: 'Confirmation Bias',
    name_cz: 'Konfirmační zkreslení',
    slug: 'confirmation-bias',
    category: 'psychology',
    difficulty: 2,
    short_description: 'Tendence hledat informace, které potvrzují to, čemu už věříš.',
    full_explanation:
      'Konfirmační zkreslení je tendence vyhledávat, interpretovat a pamatovat si informace způsobem, který potvrzuje tvoje stávající přesvědčení. Je to jeden z nejsilnějších kognitivních zkreslení. Ovlivňuje vše — od investičních rozhodnutí po vztahy. Aktivně hledej informace, které by tvoji tezi mohly vyvrátit.',
    real_world_example:
      'Věříš, že tvůj nový produkt je skvělý. Děláš zákaznický průzkum, ale nevědomě kladáš sugestivní otázky ("Líbí se vám nový design?") místo neutrálních ("Co si myslíte o novém designu?"). Vidíš jen pozitivní feedback a ignoruješ varovné signály.',
    common_mistakes:
      'Myslet si, že jsi proti konfirmačnímu zkreslení imunní. Nikdo není. Řešení: aktivně hledej disconfirming evidence — důkazy proti tvé tezi.',
    related_models: ['mm-11', 'mm-07'],
    icon_name: 'Search',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-09',
    name: 'Pareto Principle (80/20)',
    name_cz: 'Paretův princip',
    slug: 'pareto-principle',
    category: 'numeracy',
    difficulty: 1,
    short_description: '80 % výsledků přichází z 20 % úsilí.',
    full_explanation:
      'Paretův princip říká, že v mnoha situacích přibližně 80 % výstupů pochází z 20 % vstupů. Není to přesný zákon, ale silný vzorec: 20 % zákazníků generuje 80 % tržeb, 20 % bugů způsobuje 80 % crashů, 20 % tvých aktivit přináší 80 % výsledků. Klíč: identifikuj ty kritické 20 %.',
    real_world_example:
      'Máš 10 klientů. Analýza ukáže, že 2 z nich generují 80 % tvého příjmu. Logický krok: věnuj těm dvěma víc pozornosti, najdi podobné klienty, a zvaž, zda ti zbytečně neperspektivní klienti nestojí za energii.',
    common_mistakes:
      'Brát 80/20 doslova (čísla se liší) nebo ho používat jako výmluvu pro nedokončení práce. Také: zapomínat, že Pareto funguje fraktálně — v rámci těch 20 % je dalších 20 % ještě důležitějších.',
    related_models: ['mm-15', 'mm-12'],
    icon_name: 'BarChart3',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-10',
    name: 'Sunk Cost Fallacy',
    name_cz: 'Klam utopených nákladů',
    slug: 'sunk-cost-fallacy',
    category: 'economics',
    difficulty: 1,
    short_description: 'To, co už jsi investoval, by nemělo ovlivňovat budoucí rozhodnutí.',
    full_explanation:
      'Klam utopených nákladů je tendence pokračovat v něčem jen proto, že jsi do toho už investoval čas, peníze nebo úsilí — i když to nedává smysl. "Už jsem do toho dal tolik..." Racionální rozhodnutí by mělo záviset jen na budoucích nákladech a přínosech, ne na tom, co je nenávratně pryč.',
    real_world_example:
      'Pracuješ 6 měsíců na funkci, kterou nikdo nepoužívá. Správná reakce: zahoď ji a pracuj na tom, co zákazníci chtějí. Špatná reakce: "Už jsem na tom strávil půl roku, musím to dokončit."',
    common_mistakes:
      'Zaměňovat vytrvání s iracionálním lpěním. Někdy je správné pokračovat — ale důvod by měl být budoucí potenciál, ne minulá investice.',
    related_models: ['mm-12', 'mm-04'],
    icon_name: 'Anchor',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-11',
    name: 'Survivorship Bias',
    name_cz: 'Zkreslení přeživších',
    slug: 'survivorship-bias',
    category: 'psychology',
    difficulty: 2,
    short_description: 'Vidíš jen vítěze a ignoruješ tisíce těch, kteří selhali stejnou cestou.',
    full_explanation:
      'Zkreslení přeživších nastává, když se soustředíš na úspěšné příklady a ignoruješ ty, kteří selhali. Bill Gates odešel z Harvardu a uspěl — ale tisíce dalších odešli a neuspěli. Vidíš jen ty, kteří přežili. Slavný příklad z WW2: Abraham Wald navrhl pancéřovat místa na letadlech, kde NEBYLY díry — protože letadla s dírami na jiných místech se nevrátila.',
    real_world_example:
      'Čteš příběhy úspěšných startupů a myslíš si: "Stačí mít vášeň a tvrdě pracovat." Ale nevidíš tisíce startupů se stejnou vášní a prací, které zkrachovaly. Musíš studovat i neúspěchy.',
    common_mistakes:
      'Ignorovat survivorship bias v datech. Když analyzuješ jen existující firmy, zákazníky, nebo investice, chybí ti celý dataset těch, kteří zmizeli.',
    related_models: ['mm-08', 'mm-06'],
    icon_name: 'Eye',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-12',
    name: 'Opportunity Cost',
    name_cz: 'Náklady obětované příležitosti',
    slug: 'opportunity-cost',
    category: 'economics',
    difficulty: 2,
    short_description: 'Cena každého rozhodnutí zahrnuje to, čeho se vzdáváš.',
    full_explanation:
      'Každé rozhodnutí má skrytou cenu: hodnotu nejlepší alternativy, které ses vzdal. Když strávíš sobotu prací, opportunity cost je relaxace, sport nebo čas s rodinou. Když investuješ do projektu A, opportunity cost je výnos z projektu B. Většina lidí počítá jen přímé náklady a přínosy, ale zapomíná na to, co obětovala.',
    real_world_example:
      'Rozhoduješ se, jestli strávit 3 měsíce budováním vlastního CMS nebo použít existující. Přímý pohled: vlastní CMS je "zdarma". Opportunity cost: 3 měsíce, které jsi mohl věnovat produktu, který vydělává.',
    common_mistakes:
      'Zapomínat, že i "nic nedělání" má opportunity cost. A naopak: paralýza analýzou, kdy neustále porovnáváš alternativy místo toho, abys jednal.',
    related_models: ['mm-10', 'mm-09'],
    icon_name: 'GitBranch',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-13',
    name: 'Margin of Safety',
    name_cz: 'Bezpečnostní rezerva',
    slug: 'margin-of-safety',
    category: 'systems',
    difficulty: 2,
    short_description: 'Plánuj s rezervou — věci se vždy pokazí víc, než čekáš.',
    full_explanation:
      'Koncept z inženýrství a investování: vždy si nech bezpečnostní rezervu. Most je navržen na 3× větší zátěž, než se očekává. Warren Buffett kupuje akcie jen s výraznou slevou oproti vnitřní hodnotě. Proč? Protože odhady jsou vždy nepřesné a svět je nepředvídatelný.',
    real_world_example:
      'Plánuješ launch produktu za 2 měsíce. S bezpečnostní rezervou počítáš 3. Zákazníkovi řekneš 3 měsíce. Když se něco pokazí (a vždy se něco pokazí), máš prostor. Bez rezervy jsi v neustálém stresu.',
    common_mistakes:
      'Mít příliš velkou rezervu (nikdy nic nedodáš) nebo ji nemít vůbec ("tentokrát to vyjde na čas"). Správná rezerva závisí na míře nejistoty.',
    related_models: ['mm-03', 'mm-05'],
    icon_name: 'Shield',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-14',
    name: 'Feedback Loops',
    name_cz: 'Zpětnovazební smyčky',
    slug: 'feedback-loops',
    category: 'systems',
    difficulty: 3,
    short_description: 'Výstup systému ovlivňuje jeho vstup — pozitivně nebo negativně.',
    full_explanation:
      'Zpětnovazební smyčka nastává, když výstup systému ovlivňuje jeho vstup. Pozitivní zpětná vazba zesiluje (víc uživatelů → víc obsahu → ještě víc uživatelů). Negativní zpětná vazba stabilizuje (termostat: je horko → vypne topení → ochladí se → zapne topení). Pochopení smyček ti pomůže vidět, proč některé věci rostou exponenciálně a jiné se stabilizují.',
    real_world_example:
      'Sociální síť: více uživatelů → více obsahu → více nových uživatelů (pozitivní smyčka). Ale také: více uživatelů → více spamu → méně kvality → odchod uživatelů (negativní smyčka). Úspěch závisí na tom, která smyčka dominuje.',
    common_mistakes:
      'Ignorovat zpožděné efekty (smyčka se neprojeví hned) a nelineární dynamiku (malá změna může spustit velkou smyčku).',
    related_models: ['mm-03', 'mm-13'],
    icon_name: 'RefreshCw',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mm-15',
    name: 'The Eisenhower Matrix',
    name_cz: 'Eisenhowerova matice',
    slug: 'eisenhower-matrix',
    category: 'general_thinking',
    difficulty: 1,
    short_description: 'Rozděl úkoly podle důležitosti a naléhavosti do 4 kvadrantů.',
    full_explanation:
      'Eisenhowerova matice třídí úkoly do 4 kvadrantů: 1) Důležité + Naléhavé → udělej hned, 2) Důležité + Nenaléhavé → naplánuj, 3) Nedůležité + Naléhavé → deleguj, 4) Nedůležité + Nenaléhavé → odstraň. Většina lidí tráví čas v Q1 a Q3, ale skutečný progres je v Q2 — strategické plánování, vztahy, vzdělávání.',
    real_world_example:
      'Tvůj den: hašení bugů (Q1), odpovídání na Slack (Q3), scrollování sociálních sítí (Q4). Ale refaktoring kódu (Q2), který by bugům předešel, odkládáš. Eisenhower ti ukáže, že Q2 je klíč k dlouhodobému úspěchu.',
    common_mistakes:
      'Označit všechno jako "důležité a naléhavé". Pokud je všechno urgentní, nic není. Buď upřímný při třídění. Další chyba: ignorovat Q2, dokud se nestane Q1.',
    related_models: ['mm-09', 'mm-12'],
    icon_name: 'Grid3x3',
    created_at: '2024-01-01T00:00:00Z',
  },
];

export const lessons: Lesson[] = [
  // ──────────────── 1. First Principles Thinking ────────────────
  {
    id: 'les-01a',
    model_id: 'mm-01',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Většina lidí řeší problémy analogií: "Jak to dělají ostatní?" To je rychlé, ale omezující. First Principles Thinking jde hlouběji — rozloží problém na základní pravdy a sestaví řešení od nuly.',
        },
        {
          type: 'text',
          content:
            'Elon Musk chtěl stavět rakety. Tradiční přístup: koupit raketu za 65 milionů dolarů. First Principles: Z čeho se raketa skládá? Hliník, titan, měď, uhlíkové vlákno. Kolik stojí suroviny? Zlomek ceny. Řešení: postavit vlastní.',
        },
        {
          type: 'key_insight',
          content:
            'Klíč: Neptej se "jak to dělají ostatní", ale "co je fundamentálně pravda o tomhle problému?" Rozlož, pochop, sestav znovu.',
        },
      ],
    },
  },
  {
    id: 'les-01b',
    model_id: 'mm-01',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Tvůj startup má vysoké náklady na zákaznickou podporu. Tým navrhuje najmout více lidí.',
          question: 'Jak bys přistoupil k problému pomocí First Principles?',
          options: [
            {
              text: 'Analyzovat, co přesně generuje tikety',
              correct: true,
              explanation:
                'Správně! Rozložíš problém na základní části — co přesně způsobuje tikety? Možná je to špatné UX jedné funkce.',
            },
            {
              text: 'Porovnat s konkurencí, kolik mají agentů',
              correct: false,
              explanation:
                'To je reasoning by analogy — přesně to, čemu se chceme vyhnout. Počet agentů konkurence neřeší tvou příčinu.',
            },
            {
              text: 'Automatizovat odpovědi AI chatbotem',
              correct: false,
              explanation:
                'Řešení bez pochopení příčiny. Nejdřív rozlož problém, pak teprve hledej řešení.',
            },
          ],
        },
        {
          type: 'key_insight',
          content:
            'Pamatuj: 3 kroky First Principles — 1) Identifikuj předpoklady, 2) Rozlož na základní pravdy, 3) Sestav nové řešení.',
        },
      ],
    },
  },
  // ──────────────── 2. Occam's Razor ────────────────
  {
    id: 'les-02a',
    model_id: 'mm-02',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Occamova břitva je starý princip: když máš dvě vysvětlení, která stejně dobře popisují situaci, preferuj to jednodušší. Pojmenovaná po Williamu z Ockhamu (14. století).',
        },
        {
          type: 'text',
          content:
            'Proč? Protože každý přidaný předpoklad je místo, kde se můžeš mýlit. Čím víc částí má teorie, tím víc způsobů, jak může selhat. Jednoduchost není lenost — je to disciplína.',
        },
        {
          type: 'key_insight',
          content:
            'Než vytvoříš složitou teorii, zeptej se: existuje jednodušší vysvětlení, které stejně dobře odpovídá faktům?',
        },
      ],
    },
  },
  {
    id: 'les-02b',
    model_id: 'mm-02',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Tvůj e-shop má nízkou konverzi. Marketingový tým přišel s teorií: zákazníci nemají důvěru v brand a je potřeba influencer kampaň za 500 000 Kč.',
          question: 'Co bys zkontroloval jako první?',
          options: [
            {
              text: 'Jestli je checkout proces jednoduchý a tlačítko "Koupit" viditelné',
              correct: true,
              explanation:
                'Occamova břitva! Nejjednodušší vysvětlení: UX problém. Zkontroluj základy, než investuješ do komplexních řešení.',
            },
            {
              text: 'Spustit průzkum důvěryhodnosti brandu',
              correct: false,
              explanation:
                'To přeskakuje jednodušší vysvětlení. Průzkum je drahý a pomalý. Začni tím, co můžeš ověřit za hodinu.',
            },
            {
              text: 'Investovat do influencer kampaně',
              correct: false,
              explanation:
                'Vyhazuješ peníze na složité řešení, aniž bys vyloučil jednoduché příčiny. Co když je problém jen v UX?',
            },
          ],
        },
      ],
    },
  },
  // ──────────────── 3. Second-Order Thinking ────────────────
  {
    id: 'les-03a',
    model_id: 'mm-03',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Většina lidí se ptá: "Co se stane, když tohle udělám?" To je myšlení prvního řádu. Chytřejší otázka: "A co se stane potom? A potom?"',
        },
        {
          type: 'text',
          content:
            'Příklad z historie: Prohibice v USA (1920). 1. řád: lidé přestanou pít → zdravější populace. 2. řád: vznikne černý trh → mafie zbohatne. 3. řád: korupce policie, organizovaný zločin roste. Výsledek: prohibice způsobila víc škody než alkohol.',
        },
        {
          type: 'key_insight',
          content:
            'U každého důležitého rozhodnutí se zeptej minimálně třikrát: "A co se stane pak?" Často odhalíš vedlejší efekty, které změní celé rozhodnutí.',
        },
      ],
    },
  },
  {
    id: 'les-03b',
    model_id: 'mm-03',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Tvá firma chce snížit ceny o 30 %, aby získala více zákazníků. CEO je nadšený z projekcí.',
          question: 'Jaký je nejdůležitější second-order efekt, na který bys upozornil?',
          options: [
            {
              text: 'Konkurence pravděpodobně sníží ceny taky → cenová válka sníží marže celého odvětví',
              correct: true,
              explanation:
                'Přesně! 2. řád: konkurence reaguje. 3. řád: marže padají, menší firmy umírají, kvalita klesá.',
            },
            {
              text: 'Zákazníci budou šťastnější',
              correct: false,
              explanation:
                'To je myšlení 1. řádu. Co se stane POTOM? Zákazníci si zvyknou na nízkou cenu a nebudou chtít platit víc.',
            },
            {
              text: 'Budeme potřebovat více zaměstnanců na obsluhu nových zákazníků',
              correct: false,
              explanation:
                'To je relevantní, ale ne hlavní riziko. Největší second-order efekt je reakce konkurence.',
            },
          ],
        },
      ],
    },
  },
  // ──────────────── 4. Inversion ────────────────
  {
    id: 'les-04a',
    model_id: 'mm-04',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Charlie Munger, partner Warrena Buffetta, říká: "Řekni mi, kde zemřu, a já tam nepůjdu." To je inverze — místo přemýšlení o cestě k úspěchu přemýšlej o tom, co zaručeně vede k neúspěchu.',
        },
        {
          type: 'text',
          content:
            'Chceš být zdravý? Místo "co mám jíst" se zeptej: "Co by mě zaručeně zabilo?" Sedavý životní styl, alkohol, nedostatek spánku. Vyhni se těm věcem a jsi na 80 % cesty.',
        },
        {
          type: 'key_insight',
          content:
            'Inverze není pesimismus. Je to strategický nástroj: je často snazší identifikovat co NEDĚLAT, než co dělat. Vyhni se hlouposti a zbytek se vyřeší.',
        },
      ],
    },
  },
  {
    id: 'les-04b',
    model_id: 'mm-04',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Jsi team lead a chceš mít produktivní a spokojený tým. Přemýšlíš, co dělat.',
          question: 'Jak bys použil inverzi?',
          options: [
            {
              text: 'Zeptej se: "Co by zaručeně zničilo morálku týmu?" a tomu se vyhni',
              correct: true,
              explanation:
                'Inverze v akci! Odpovědi: mikromanagement, nejasné cíle, neférové odměny, ignorování feedbacku. Odstraň tyhle věci první.',
            },
            {
              text: 'Studovat best practices nejlepších tech firem',
              correct: false,
              explanation:
                'To je analogie, ne inverze. Kopírovat Google nemusí fungovat ve tvém kontextu.',
            },
            {
              text: 'Uspořádat team building',
              correct: false,
              explanation:
                'Team building je fajn, ale neřeší systémové problémy. Inverze ti pomůže najít a odstranit to, co tým aktivně demotivuje.',
            },
          ],
        },
      ],
    },
  },
  // ──────────────── 5. Circle of Competence ────────────────
  {
    id: 'les-05a',
    model_id: 'mm-05',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Warren Buffett investuje jen do firem, kterým rozumí. Nikdy nekoupil tech akcie v 90. letech — ne proto, že by nebyly dobré, ale proto, že byly mimo jeho kruh kompetencí.',
        },
        {
          type: 'text',
          content:
            'Tři klíče: 1) Znaj svůj kruh — v čem jsi opravdu dobrý? 2) Operuj uvnitř — dělej rozhodnutí v oblastech, kde máš expertízu. 3) Rozšiřuj ho — ale vědomě a postupně, ne skokem do neznáma.',
        },
        {
          type: 'key_insight',
          content:
            'Nejdůležitější není velikost tvého kruhu, ale to, jak přesně znáš jeho hranice. Vědět, co NEVÍŠ, je stejně cenné jako vědět, co víš.',
        },
      ],
    },
  },
  {
    id: 'les-05b',
    model_id: 'mm-05',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Jsi senior backend vývojář. Kamarád ti nabízí partnerství ve startupu, kde budeš dělat hlavně sales, marketing a fundraising.',
          question: 'Co je nejrozumnější přístup?',
          options: [
            {
              text: 'Přijmout, ale najít si mentora na sales a marketing a aktivně se učit',
              correct: true,
              explanation:
                'Rozšiřuješ kruh kompetencí vědomě. Víš, že jsi na hranici, a plánuješ to řešit.',
            },
            {
              text: 'Odmítnout — sales není tvá silná stránka',
              correct: false,
              explanation:
                'Opatrnost je dobrá, ale příliš rigidní. Kruh kompetencí se dá rozšiřovat — s vědomým úsilím.',
            },
            {
              text: 'Přijmout — jak těžký může být sales?',
              correct: false,
              explanation:
                'Klasický Dunning-Kruger. Podcenění toho, co nevíš, je přesně to, před čím kruh kompetencí varuje.',
            },
          ],
        },
      ],
    },
  },
  // ──────────────── 6. Map is Not the Territory ────────────────
  {
    id: 'les-06a',
    model_id: 'mm-06',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Každý model, plán nebo teorie je mapa — zjednodušení reality. Byznys plán není byznys. Finanční model není ekonomika. Tvůj mentální obraz člověka není ten člověk.',
        },
        {
          type: 'text',
          content:
            'Mapy jsou nezbytné — bez nich bys nemohl navigovat složitý svět. Ale mají limity. Problém nastává, když zapomeneš, že mapa má slepá místa. GPS ti řekne nejkratší cestu, ale neřekne ti o uzavírce, která začala před 5 minutami.',
        },
        {
          type: 'key_insight',
          content:
            'Používej mapy, ale pravidelně kontroluj, jestli odpovídají území. Když se mapa a realita rozejdou, věř realitě.',
        },
      ],
    },
  },
  {
    id: 'les-06b',
    model_id: 'mm-06',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Tvůj startup má detailní byznys plán na 3 roky. Po 4 měsících zákazníci jasně říkají, že chtějí jiný produkt, než plánuješ. Investor ale chce vidět plnění plánu.',
          question: 'Co uděláš?',
          options: [
            {
              text: 'Upravíš plán podle reality zákazníků a vysvětlíš investorovi proč',
              correct: true,
              explanation:
                'Mapa (plán) neodpovídá území (trh). Chytří investoři ocení, že reaguješ na realitu místo slepého plnění plánu.',
            },
            {
              text: 'Budeš plnit plán — investor v něj věří a dal ti peníze na základě něj',
              correct: false,
              explanation:
                'Lpíš na mapě místo na území. To je přesně chyba, před kterou tento model varuje.',
            },
            {
              text: 'Ignoruješ zákazníky — vzorek 4 měsíců je příliš malý',
              correct: false,
              explanation:
                'Možná, ale jasný signál od zákazníků bys neměl ignorovat. Ověř ho víc, ale neignoruj ho.',
            },
          ],
        },
      ],
    },
  },
  // ──────────────── 7. Hanlon's Razor ────────────────
  {
    id: 'les-07a',
    model_id: 'mm-07',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            '"Nikdy nepřisuzuj zlému úmyslu to, co lze dostatečně vysvětlit hloupostí." Tento princip ti ušetří spoustu zbytečného stresu a konfliktů.',
        },
        {
          type: 'text',
          content:
            'Naše mysl má tendenci vidět zlé úmysly tam, kde jsou jen nedorozumění, zapomenutí nebo nekompetence. Kolega "ignoruje" tvůj e-mail? Pravděpodobněji: má přeplněnou schránku. Zákazník "útočí"? Pravděpodobněji: měl špatný den.',
        },
        {
          type: 'key_insight',
          content:
            'Než si řekneš "udělali to schválně", zeptej se: "Dá se to vysvětlit nepozorností, neznalostí nebo špatnou komunikací?" Většinou ano.',
        },
      ],
    },
  },
  {
    id: 'les-07b',
    model_id: 'mm-07',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Posíláš kolegovi důležitý e-mail s prosbou o review kódu. Po 3 dnech žádná odpověď. Blíží se deadline.',
          question: 'Jaká je nejlepší reakce podle Hanlonovy břitvy?',
          options: [
            {
              text: 'Napíšeš mu přátelský follow-up: "Hej, viděl jsi ten e-mail? Potřebuji review do pátku."',
              correct: true,
              explanation:
                'Správně! Nejpravděpodobnější vysvětlení: e-mail se ztratil, zapomněl, nebo měl hektický týden. Přátelský follow-up je nejefektivnější.',
            },
            {
              text: 'Stěžuješ si manažerovi, že kolega sabotuje tvou práci',
              correct: false,
              explanation:
                'Hanlonova břitva: nepřisuzuj zlý úmysl. Eskalace před přímou komunikací je zbytečná a poškodí vztah.',
            },
            {
              text: 'Počkáš — nechceš být otravný',
              correct: false,
              explanation:
                'Hanlonova břitva neznamená pasivitu. Znamená předpokládat dobré úmysly a komunikovat přímo.',
            },
          ],
        },
      ],
    },
  },
  // ──────────────── 8. Confirmation Bias ────────────────
  {
    id: 'les-08a',
    model_id: 'mm-08',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Konfirmační zkreslení je jeden z nejsilnějších kognitivních zkreslení. Tvůj mozek aktivně hledá informace, které potvrzují to, čemu už věříš — a ignoruje ty, které tomu odporují.',
        },
        {
          type: 'text',
          content:
            'Věříš, že Apple je nejlepší? Budeš si všímat článků, které to potvrzují, a přeskočíš kritiky. Věříš, že tvůj nápad je geniální? Budeš klást zákazníkům sugestivní otázky a slyšet jen pozitivní feedback.',
        },
        {
          type: 'key_insight',
          content:
            'Protilék: aktivně hledej "disconfirming evidence" — důkazy, které by tvoji tezi mohly vyvrátit. Pokud tvůj nápad přežije i to, je pravděpodobně dobrý.',
        },
      ],
    },
  },
  {
    id: 'les-08b',
    model_id: 'mm-08',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Věříš, že tvůj nový produkt je skvělý. Děláš zákaznický průzkum, abys to potvrdil.',
          question: 'Která otázka v průzkumu nejméně podléhá konfirmačnímu zkreslení?',
          options: [
            {
              text: '"Popiš mi svůj poslední problém v této oblasti a jak jsi ho řešil."',
              correct: true,
              explanation:
                'Otevřená, neutrální otázka. Necháváš zákazníka mluvit bez navádění. Možná zjistíš, že tvůj produkt neřeší skutečný problém.',
            },
            {
              text: '"Líbil by se ti produkt, který umí X, Y a Z?"',
              correct: false,
              explanation:
                'Sugestivní otázka! Popisuješ řešení a ptáš se, jestli se líbí. Většina lidí řekne ano, aniž by to znamenalo, že si ho koupí.',
            },
            {
              text: '"Zaplatil bys za náš produkt 499 Kč měsíčně?"',
              correct: false,
              explanation:
                'Příliš specifická a navádějící. Lepší: "Kolik bys byl ochoten zaplatit za řešení tohoto problému?" — bez specifikace tvého produktu.',
            },
          ],
        },
      ],
    },
  },
  // ──────────────── 9. Pareto Principle ────────────────
  {
    id: 'les-09a',
    model_id: 'mm-09',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Vilfredo Pareto si v roce 1896 všiml, že 80 % půdy v Itálii vlastní 20 % obyvatel. Od té doby se tento vzorec objevuje všude: 80/20.',
        },
        {
          type: 'text',
          content:
            '20 % tvých zákazníků generuje 80 % tržeb. 20 % bugů způsobuje 80 % stížností. 20 % tvých návyků má 80 % vliv na tvoje zdraví. Klíč: identifikuj těch kritických 20 % a zaměř na ně svou energii.',
        },
        {
          type: 'key_insight',
          content:
            'Pareto není jen o efektivitě — je to o prioritizaci. Nejdřív zjisti, CO má největší dopad, a pak tomu věnuj neproporcio­nálně hodně pozornosti.',
        },
      ],
    },
  },
  {
    id: 'les-09b',
    model_id: 'mm-09',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Jsi product manager. Tvůj tým má 10 feature requestů od zákazníků. Máš kapacitu udělat 3 tento kvartál.',
          question: 'Jak použiješ Paretův princip pro výběr?',
          options: [
            {
              text: 'Analyzuj, které 2-3 features požaduje nejvíce zákazníků, kteří generují nejvíce revenue',
              correct: true,
              explanation:
                'Pareto v praxi! Zaměř se na features, které ovlivní těch 20 % zákazníků s 80 % impaktem na byznys.',
            },
            {
              text: 'Udělej ty 3 nejrychlejší — ať máme co nejvíc hotového',
              correct: false,
              explanation:
                'Kvantita ≠ kvalita. 3 rychlé, ale nedůležité features mají menší dopad než 1 klíčová.',
            },
            {
              text: 'Vyber demokraticky — nech tým hlasovat',
              correct: false,
              explanation:
                'Hlasování zprůměruje preference a ignoruje, že ne všichni zákazníci mají stejnou hodnotu. Pareto vyžaduje data, ne hlasy.',
            },
          ],
        },
      ],
    },
  },
  // ──────────────── 10. Sunk Cost Fallacy ────────────────
  {
    id: 'les-10a',
    model_id: 'mm-10',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Koupil jsi lístek na koncert za 1 500 Kč. V den koncertu máš chřipku. Jdeš? Většina lidí jde — "vždyť jsem za to zaplatil!" Ale těch 1 500 Kč je pryč, ať půjdeš nebo ne. To je sunk cost — utopený náklad.',
        },
        {
          type: 'text',
          content:
            'Racionální rozhodnutí by mělo záviset jen na budoucím přínosu vs. budoucích nákladech. "Bude mi na koncertu dobře?" Ne, jsem nemocný. Správná odpověď: zůstat doma. Minulá investice je irelevantní.',
        },
        {
          type: 'key_insight',
          content:
            'Když se chytíš při myšlence "ale už jsem do toho investoval tolik...", zastav se. Zeptej se: "Kdybych dnes začínal od nuly, investoval bych do toho znovu?" Pokud ne, přestaň.',
        },
      ],
    },
  },
  {
    id: 'les-10b',
    model_id: 'mm-10',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Tvůj tým pracuje 8 měsíců na feature, do které jste investovali 2 miliony Kč. Data ukazují, že ji aktivně používá jen 2 % uživatelů a čísla neklesají. Šéf říká: "Nemůžeme to zahodit po 8 měsících práce."',
          question: 'Co je správný argument?',
          options: [
            {
              text: '"Těch 8 měsíců je pryč. Otázka je: má smysl investovat DALŠÍ zdroje do feature s 2 % adopcí?"',
              correct: true,
              explanation:
                'Přesně! Oddělíš minulou investici (sunk cost) od budoucího rozhodnutí. Pokud budoucí ROI nedává smysl, přestaň investovat.',
            },
            {
              text: '"Musíme to dokončit, jinak to bude plýtvání."',
              correct: false,
              explanation:
                'Klasický sunk cost fallacy. Pokračování ve špatné investici ji nezlepší — jen přidá další ztrátu.',
            },
            {
              text: '"Dáme tomu ještě 3 měsíce a uvidíme."',
              correct: false,
              explanation:
                'Kompromis, který jen oddaluje rozhodnutí. Co se změní za 3 měsíce, pokud nemáš konkrétní plán na zvýšení adopce?',
            },
          ],
        },
      ],
    },
  },
  // ──────────────── 11. Survivorship Bias ────────────────
  {
    id: 'les-11a',
    model_id: 'mm-11',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Za 2. světové války chtěla armáda pancéřovat letadla. Analyzovali díry po kulkách na letadlech, která se vrátila. Statistik Abraham Wald řekl: "Pancéřujte místa, kde díry NEJSOU."',
        },
        {
          type: 'text',
          content:
            'Proč? Letadla s dírami na jiných místech se nevrátila — neexistovala v datasetu. To je survivorship bias: vidíš jen přeživší a vyvozuješ závěry jen z nich, čímž ignoruješ klíčové informace o těch, kteří nepřežili.',
        },
        {
          type: 'key_insight',
          content:
            'Když studuješ úspěch, ptej se: "Kde jsou ti, kteří dělali to samé a neuspěli?" Pokud je nemůžeš najít, pravděpodobně trpíš survivorship biasem.',
        },
      ],
    },
  },
  {
    id: 'les-11b',
    model_id: 'mm-11',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Čteš článek "5 věcí, které mají společné všichni úspěšní podnikatelé: vášeň, riziko, odchod z práce, self-funding, a ignorování kritiků."',
          question: 'Co je problém s tímto článkem?',
          options: [
            {
              text: 'Ignoruje tisíce podnikatelů se stejnými vlastnostmi, kteří zkrachovali',
              correct: true,
              explanation:
                'Survivorship bias! Článek studuje jen přeživší. Tisíce lidí mělo stejnou vášeň, riskovali, odešli z práce — a neuspěli. Tyto vlastnosti nejsou garancí úspěchu.',
            },
            {
              text: 'Nemá dost velký vzorek — 5 podnikatelů je málo',
              correct: false,
              explanation:
                'I s 500 podnikateli by problém přetrvával, pokud všichni jsou úspěšní. Chybí data o neúspěšných.',
            },
            {
              text: 'Korelace neznamená kauzalitu',
              correct: false,
              explanation:
                'Částečně pravda, ale hlavní problém je survivorship bias — chybí celá polovina datasetu.',
            },
          ],
        },
      ],
    },
  },
  // ──────────────── 12. Opportunity Cost ────────────────
  {
    id: 'les-12a',
    model_id: 'mm-12',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Každé rozhodnutí má skrytou cenu: hodnotu toho, čeho ses vzdal. Ekonomové tomu říkají opportunity cost — náklady obětované příležitosti.',
        },
        {
          type: 'text',
          content:
            'Když jdeš na večírek, opportunity cost je práce na side projektu, čas s rodinou, nebo spánek. Když firma investuje milion do marketing, opportunity cost je milion, který mohl jít do produktu. Většina lidí počítá jen přímé náklady — ale zapomíná, co obětovala.',
        },
        {
          type: 'key_insight',
          content:
            'U každého rozhodnutí se zeptej: "Co JINÉHO bych mohl dělat s tímto časem / penězi / energií?" Nejlepší alternativa, které se vzdáváš, je skutečná cena.',
        },
      ],
    },
  },
  {
    id: 'les-12b',
    model_id: 'mm-12',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Rozhoduješ se: strávit 3 měsíce budováním vlastního analytického dashboardu, nebo použít existující SaaS za 200 $/měsíc.',
          question: 'Jak zohledníš opportunity cost?',
          options: [
            {
              text: 'Spočítej, kolik bys za 3 měsíce vydělal na jiné práci — to je skutečná cena vlastního řešení',
              correct: true,
              explanation:
                'Správně! Pokud tvůj čas = 5 000 $/měsíc, vlastní dashboard stojí 15 000 $ + 3 měsíce zpoždění produktu. SaaS stojí 200 $/měsíc. Jasná volba.',
            },
            {
              text: 'Vlastní dashboard je "zdarma" — neplatíš žádnou SaaS fakturu',
              correct: false,
              explanation:
                'Iluze! Tvůj čas má hodnotu. 3 měsíce práce nejsou zdarma — mají obrovský opportunity cost.',
            },
            {
              text: 'Vyber SaaS, protože je jednodušší',
              correct: false,
              explanation:
                'Správný závěr, ale špatné zdůvodnění. Neříkej "je to jednodušší" — spočítej opportunity cost a ukaž čísla.',
            },
          ],
        },
      ],
    },
  },
  // ──────────────── 13. Margin of Safety ────────────────
  {
    id: 'les-13a',
    model_id: 'mm-13',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Inženýr, který navrhuje most, počítá s maximální zátěží — a pak přidá 200-300 % bezpečnostní rezervu. Proč? Protože odhady jsou vždy nepřesné a svět je nepředvídatelný.',
        },
        {
          type: 'text',
          content:
            'Warren Buffett používá stejný princip při investování: kupuje akcie, jen pokud jsou výrazně levnější než jejich skutečná hodnota. Ten rozdíl je jeho "margin of safety" — chrání ho před chybami v odhadu.',
        },
        {
          type: 'key_insight',
          content:
            'Margin of Safety = pokora. Připouštíš, že se můžeš mýlit, a plánuješ s rezervou. Paradoxně tě to nevede k pasivitě, ale k větší odvaze — protože víš, že chyba tě nezabije.',
        },
      ],
    },
  },
  {
    id: 'les-13b',
    model_id: 'mm-13',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Tvůj tým odhaduje, že nový feature bude hotový za 6 týdnů. Klient se ptá na termín dodání.',
          question: 'Jak aplikuješ Margin of Safety?',
          options: [
            {
              text: 'Řekneš klientovi 8-9 týdnů a interně cílíš na 6',
              correct: true,
              explanation:
                'Margin of Safety! Počítáš s tím, že se něco pokazí (a vždy se něco pokazí). Dodáš dřív → klient je šťastný. Dodáš včas → vše OK.',
            },
            {
              text: 'Řekneš 6 týdnů — chceš být transparentní',
              correct: false,
              explanation:
                'Transparentnost je dobrá, ale odhad 6 týdnů je "best case". Realita je téměř vždy horší než odhad.',
            },
            {
              text: 'Řekneš 12 týdnů — velká rezerva',
              correct: false,
              explanation:
                'Příliš velká rezerva podrývá důvěru a zpomaluje byznys. Margin of Safety by měl být úměrný míře nejistoty.',
            },
          ],
        },
      ],
    },
  },
  // ──────────────── 14. Feedback Loops ────────────────
  {
    id: 'les-14a',
    model_id: 'mm-14',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Zpětnovazební smyčka nastává, když výstup systému ovlivňuje jeho vstup. Existují dva typy: Pozitivní — zesiluje (sněhová koule). Negativní — stabilizuje (termostat).',
        },
        {
          type: 'text',
          content:
            'Pozitivní smyčka: Víc uživatelů → víc obsahu → víc nových uživatelů → ještě víc obsahu. To je síla sociálních sítí. Negativní smyčka: Je v místnosti horko → termostat vypne topení → ochladí se → termostat zapne topení. Stabilita.',
        },
        {
          type: 'key_insight',
          content:
            'Hledej smyčky kolem sebe. Který z tvých návyků má pozitivní smyčku (cvičení → více energie → víc cvičení)? Který negativní (stres → špatný spánek → víc stresu)?',
        },
      ],
    },
  },
  {
    id: 'les-14b',
    model_id: 'mm-14',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Tvá app má problém: uživatelé odcházejí → méně obsahu → další uživatelé odcházejí. Je to negativní spirála.',
          question: 'Jak přerušíš tuto smyčku?',
          options: [
            {
              text: 'Identifikuj nejslabší článek smyčky a tam zasáhni — např. vytvoř kvalitní obsah sám, abys nahradil chybějící',
              correct: true,
              explanation:
                'Správně! Přerušíš smyčku tím, že vložíš energii do nejslabšího místa. Dobrý obsah → uživatelé zůstanou → vytvoří další obsah.',
            },
            {
              text: 'Investuj do reklamy pro nové uživatele',
              correct: false,
              explanation:
                'Přivedeš uživatele do prostředí bez obsahu → odejdou. Nevyřešil jsi smyčku, jen jsi do ní vpustil víc lidí.',
            },
            {
              text: 'Přidej gamifikaci — bodíky a odznaky',
              correct: false,
              explanation:
                'Gamifikace je doplněk, ne řešení. Pokud chybí obsah, body za "nic" uživatele neudrží.',
            },
          ],
        },
      ],
    },
  },
  // ──────────────── 15. Eisenhower Matrix ────────────────
  {
    id: 'les-15a',
    model_id: 'mm-15',
    lesson_type: 'intro',
    order_index: 0,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'text',
          content:
            'Dwight Eisenhower, 34. prezident USA, řekl: "To, co je důležité, je zřídka naléhavé, a to, co je naléhavé, je zřídka důležité."',
        },
        {
          type: 'text',
          content:
            'Jeho matice má 4 kvadranty:\n\nQ1 (Důležité + Naléhavé) → Udělej hned\nQ2 (Důležité + NEnáléhavé) → Naplánuj\nQ3 (NEdůležité + Naléhavé) → Deleguj\nQ4 (NEdůležité + NEnáléhavé) → Odstraň\n\nKlíč: Q2 je místo, kde se děje skutečný progres — strategické plánování, vzdělávání, budování vztahů.',
        },
        {
          type: 'key_insight',
          content:
            'Většina lidí žije v Q1 (hašení požárů) a Q3 (odpovídání na e-maily). Ale čas investovaný do Q2 předchází budoucím Q1 krizím. Plánuj Q2 jako schůzku — s konkrétním časem v kalendáři.',
        },
      ],
    },
  },
  {
    id: 'les-15b',
    model_id: 'mm-15',
    lesson_type: 'scenario',
    order_index: 1,
    xp_reward: 10,
    content: {
      steps: [
        {
          type: 'scenario',
          situation:
            'Je pondělí ráno. Na stole máš: 1) Bug v produkci (zákazníci reportují), 2) Refaktoring kódu (technický dluh), 3) 47 nepřečtených Slack zpráv, 4) Scrollování tech Twitteru.',
          question: 'Jak správně roztřídíš tyto úkoly podle Eisenhowerovy matice?',
          options: [
            {
              text: 'Q1: Bug. Q2: Refaktoring. Q3: Slack. Q4: Twitter.',
              correct: true,
              explanation:
                'Přesně! Bug je Q1 (udělej hned). Refaktoring je Q2 (naplánuj — předejde budoucím bugům). Slack je Q3 (většina zpráv může počkat nebo být delegována). Twitter je Q4 (odstraň).',
            },
            {
              text: 'Q1: Bug + Slack. Q2: Refaktoring + Twitter.',
              correct: false,
              explanation:
                'Slack zprávy nejsou většinou důležité — jsou naléhavé, ale ne důležité (Q3). A Twitter rozhodně není důležitý.',
            },
            {
              text: 'Všechno je Q1 — všechno je naléhavé',
              correct: false,
              explanation:
                'Pokud je všechno urgentní, nic není. Eisenhowerova matice tě nutí být upřímný o prioritách.',
            },
          ],
        },
      ],
    },
  },
];
