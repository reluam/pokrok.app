export type Slot = "morning" | "daily" | "evening";

export interface Ritual {
  id: string;
  name: string;
  duration_min: number;
  difficulty: 1 | 2 | 3;
  slots: Slot[];
  why: string;
  tip: string;
  categoryId: string;
  categoryColor: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  rituals: Ritual[];
}

export interface FeaturedBuild {
  name: string;
  description: string;
  morning: string[];
  daily: string[];
  evening: string[];
}

export const categories: Category[] = [
  {
    id: "body",
    name: "Tělo a energie",
    color: "#1D9E75",
    rituals: [
      {
        id: "cold-shower",
        name: "Ledová sprcha / otužování",
        duration_min: 5,
        difficulty: 3,
        slots: ["morning"],
        why: "Studená voda zvyšuje norepinefrin o 200-300%. To je neurotransmiter, který přímo zlepšuje pozornost a soustředění — přesně to, co ADHD mozek potřebuje.",
        tip: "Začni 30 vteřinami na konci sprchy. Nemusíš hned do ledové.",
        categoryId: "body",
        categoryColor: "#1D9E75",
      },
      {
        id: "yoga",
        name: "Jóga / protažení",
        duration_min: 20,
        difficulty: 1,
        slots: ["morning", "evening"],
        why: "Jóga aktivuje parasympatický nervový systém a zvyšuje GABA — inhibiční neurotransmiter, který zklidňuje přebuzelý ADHD mozek. Zároveň zlepšuje propriocepci (vnímání těla).",
        tip: "Stačí 10 minut. YouTube kanál 'Yoga With Adriene' má skvělé krátké rutiny.",
        categoryId: "body",
        categoryColor: "#1D9E75",
      },
      {
        id: "exercise",
        name: "Cvičení (síla / kardio)",
        duration_min: 30,
        difficulty: 2,
        slots: ["morning", "daily"],
        why: "Cvičení zvyšuje dopamin a norepinefrin — dva neurotransmitery, které jsou u ADHD chronicky nízké. 30 minut pohybu má podobný efekt jako nízká dávka stimulantů.",
        tip: "Nemusí být gym. Kliky, dřepy, procházka do kopce — cokoliv, co ti zvedne tep.",
        categoryId: "body",
        categoryColor: "#1D9E75",
      },
      {
        id: "walk",
        name: "Procházka (min 20 min)",
        duration_min: 20,
        difficulty: 1,
        slots: ["morning", "daily", "evening"],
        why: "Chůze v přírodě snižuje kortizol a aktivuje default mode network — část mozku zodpovědnou za kreativitu a propojování myšlenek. Studie ukazují zlepšení pozornosti u ADHD po 20 min v zeleni.",
        tip: "Bez sluchátek. Nech mozek bloumat.",
        categoryId: "body",
        categoryColor: "#1D9E75",
      },
      {
        id: "breathing",
        name: "Dýchání (box breathing / Wim Hof)",
        duration_min: 5,
        difficulty: 1,
        slots: ["morning", "daily", "evening"],
        why: "Řízené dýchání přímo ovlivňuje vagový nerv a přepíná nervový systém z fight-or-flight do rest-and-digest. Box breathing (4-4-4-4) prokazatelně snižuje úzkost během minut.",
        tip: "Box breathing: 4s nádech, 4s pauza, 4s výdech, 4s pauza. Opakuj 5x.",
        categoryId: "body",
        categoryColor: "#1D9E75",
      },
    ],
  },
  {
    id: "mind",
    name: "Mysl a klid",
    color: "#7F77DD",
    rituals: [
      {
        id: "meditation",
        name: "Meditace (řízená / tichá)",
        duration_min: 15,
        difficulty: 2,
        slots: ["morning", "evening"],
        why: "Meditace prokazatelně zesiluje prefrontální kortex — část mozku zodpovědnou za exekutivní funkce, které jsou u ADHD oslabené. Už 10 minut denně mění strukturu mozku po 8 týdnech.",
        tip: "Řízená meditace je snazší než tichá. Appky jako Insight Timer mají české meditace zdarma.",
        categoryId: "mind",
        categoryColor: "#7F77DD",
      },
      {
        id: "boredom",
        name: "Cílená nuda (žádný input)",
        duration_min: 15,
        difficulty: 3,
        slots: ["daily"],
        why: "ADHD mozek je závislý na stimulaci. Cílená nuda trénuje toleranci k nízké stimulaci a aktivuje default mode network — mozek se učí fungovat bez konstantního dopaminového přísunu.",
        tip: "Sedni si, nedělej nic, nekoukej na nic, neposlouchej nic. 15 minut. Bude to nepříjemné — to je celý point.",
        categoryId: "mind",
        categoryColor: "#7F77DD",
      },
      {
        id: "journaling",
        name: "Journaling",
        duration_min: 10,
        difficulty: 1,
        slots: ["daily", "evening"],
        why: "Psaní rukou zapojuje jiné neuronové okruhy než psaní na klávesnici. Externalizace myšlenek na papír snižuje kognitivní zátěž pracovní paměti — které je u ADHD méně.",
        tip: "Nemusí být esej. 3 věty o tom, co se dnes stalo a jak ses cítil, stačí.",
        categoryId: "mind",
        categoryColor: "#7F77DD",
      },
      {
        id: "gratitude",
        name: "3 věci za které jsem vděčný",
        duration_min: 3,
        difficulty: 1,
        slots: ["evening"],
        why: "Praxe vděčnosti zvyšuje produkci dopaminu a serotoninu. U ADHD, kde je dopamin chronicky nízký, je to jednoduchý hack na zlepšení nálady a motivace bez externí stimulace.",
        tip: "Zapiš 3 konkrétní věci. Ne 'rodina' ale 'ten moment, kdy mi syn řekl vtip u večeře'.",
        categoryId: "mind",
        categoryColor: "#7F77DD",
      },
      {
        id: "reading",
        name: "Čtení (bez obrazovky)",
        duration_min: 30,
        difficulty: 2,
        slots: ["daily", "evening"],
        why: "Čtení fyzické knihy trénuje sustained attention — schopnost udržet pozornost na jedné věci, která je u ADHD oslabená. Navíc bez modré obrazovky nenarušuje melatonin.",
        tip: "Kindle je OK (e-ink nemá modré světlo). Začni 15 minutami a pomalu přidávej.",
        categoryId: "mind",
        categoryColor: "#7F77DD",
      },
    ],
  },
  {
    id: "nutrition",
    name: "Výživa a spánek",
    color: "#BA7517",
    rituals: [
      {
        id: "mindful-eating",
        name: "Vědomé jídlo (bez telefonu)",
        duration_min: 20,
        difficulty: 2,
        slots: ["daily"],
        why: "Jídlo u obrazovky odpojuje interoceptivní signály — nevnímáš sytost, chuť ani trávení. ADHD mozek má i tak oslabenou interorecepci. Vědomé jídlo ji trénuje zpět.",
        tip: "Prostě odlož telefon, než začneš jíst. Jen to.",
        categoryId: "nutrition",
        categoryColor: "#BA7517",
      },
      {
        id: "neti-pot",
        name: "Výplach nosu (neti pot)",
        duration_min: 5,
        difficulty: 1,
        slots: ["morning"],
        why: "Nosní dýchání je klíčové pro optimální okysličení mozku. Výplach odstraňuje alergeny a zánět, které zhoršují brain fog. Zlepšuje kvalitu spánku přes nosní dýchání v noci.",
        tip: "Vlažná voda + sůl. Ráno po sprše, stane se to automatické.",
        categoryId: "nutrition",
        categoryColor: "#BA7517",
      },
      {
        id: "screen-curfew",
        name: "Žádné displeje po večerce",
        duration_min: 60,
        difficulty: 3,
        slots: ["evening"],
        why: "Modré světlo potlačuje melatonin o 50-90 minut. Pro ADHD mozek, který má i tak posunutý cirkadiánní rytmus, je to katastrofa. Hodina bez displeje před spaním dramaticky zlepší kvalitu spánku.",
        tip: "Nastav si alarm na 22:00 jako 'večerku'. Telefon do jiné místnosti.",
        categoryId: "nutrition",
        categoryColor: "#BA7517",
      },
      {
        id: "keto",
        name: "Keto / low-carb protokol",
        duration_min: 0,
        difficulty: 3,
        slots: ["daily"],
        why: "Ketony jsou efektivnější palivo pro mozek než glukóza. Stabilní hladina cukru v krvi eliminuje energetické výkyvy, brain fog a crash po jídle — všechno, co ADHD zhoršuje.",
        tip: "Nemusíš jít full keto. Začni tím, že vynecháš cukr a bílé pečivo.",
        categoryId: "nutrition",
        categoryColor: "#BA7517",
      },
      {
        id: "hydration",
        name: "Hydratace první hodinu",
        duration_min: 5,
        difficulty: 1,
        slots: ["morning"],
        why: "Mozek je z 75% voda. Už 1-2% dehydratace snižuje kognitivní výkon o 10-20%. Po noci je tělo dehydrované — sklenice vody ráno je nejjednodušší cognitive booster.",
        tip: "Sklenice vody hned po probuzení, ještě před kávou.",
        categoryId: "nutrition",
        categoryColor: "#BA7517",
      },
    ],
  },
  {
    id: "structure",
    name: "Struktura a fokus",
    color: "#D85A30",
    rituals: [
      {
        id: "3-priorities",
        name: "3 priority dne (ne víc)",
        duration_min: 5,
        difficulty: 1,
        slots: ["morning", "daily"],
        why: "ADHD mozek se paralyzuje při pohledu na dlouhý to-do list. 3 priority snižují paradox volby a zapojují prefrontální kortex do rozhodování místo amygdaly (paniky).",
        tip: "Ráno si řekni: 'Kdybych dneska stihl jen 3 věci, které by to byly?' Zbytek je bonus.",
        categoryId: "structure",
        categoryColor: "#D85A30",
      },
      {
        id: "brain-dump",
        name: "Brain dump",
        duration_min: 10,
        difficulty: 1,
        slots: ["morning", "daily"],
        why: "Pracovní paměť u ADHD pojme méně položek. Brain dump externalizuje myšlenky na papír/obrazovku a uvolňuje mentální RAM. Snižuje úzkost z 'musím si to pamatovat'.",
        tip: "Zapiš všechno co ti chodí hlavou. Bez kategorizace, bez priorit. Jen ven z hlavy.",
        categoryId: "structure",
        categoryColor: "#D85A30",
      },
      {
        id: "pomodoro",
        name: "Pomodoro bloky",
        duration_min: 25,
        difficulty: 2,
        slots: ["daily"],
        why: "ADHD mozek má problém s time blindness — nevnímá plynutí času. Pomodoro vytváří umělé deadline, které aktivují urgency a tím dopamin. 25 minut je dost krátké na to, aby se mozek nebouřil.",
        tip: "25 min práce, 5 min pauza. Po 4 cyklech delší pauza 15-20 min.",
        categoryId: "structure",
        categoryColor: "#D85A30",
      },
      {
        id: "weekly-review",
        name: "Týdenní reflexe",
        duration_min: 15,
        difficulty: 1,
        slots: ["daily"],
        why: "Bez reflexe nevidíš vzorce. ADHD mozek žije v přítomnosti — týdenní review ti ukazuje, co funguje a co ne, a dává smysl celému systému. Bez ní je systém jen seznam.",
        tip: "Neděle večer, 15 minut. Co fungovalo? Co ne? Co změním?",
        categoryId: "structure",
        categoryColor: "#D85A30",
      },
      {
        id: "tomorrow-prep",
        name: "Příprava na zítřek (večer)",
        duration_min: 10,
        difficulty: 1,
        slots: ["evening"],
        why: "Rozhodování ráno spotřebovává willpower, kterou ADHD mozek nemá nazbyt. Příprava večer (oblečení, jídlo, 3 priority) eliminuje ranní decision fatigue.",
        tip: "Připrav stránku v journalu pro zítřejší den. Polož oblečení. Víc neřeš.",
        categoryId: "structure",
        categoryColor: "#D85A30",
      },
    ],
  },
];

export const featuredBuild: FeaturedBuild = {
  name: "Matějův systém",
  description:
    "Tenhle systém jsem si sestavil po měsících experimentování. Funguje pro mě — ale nemusí fungovat pro tebe. Použij ho jako inspiraci, ne jako předpis.",
  morning: ["meditation", "yoga", "cold-shower", "neti-pot", "hydration"],
  daily: ["reading", "boredom", "3-priorities", "brain-dump"],
  evening: ["screen-curfew", "journaling", "gratitude", "tomorrow-prep"],
};

// Flat map of all rituals by id for quick lookup
export const ritualsById: Record<string, Ritual> = Object.fromEntries(
  categories.flatMap((c) => c.rituals).map((r) => [r.id, r])
);

export const SLOT_MAX: Record<Slot, number> = {
  morning: 5,
  daily: 5,
  evening: 4,
};

export const SLOT_LABELS: Record<Slot, string> = {
  morning: "Ranní rutina",
  daily: "Denní rutina",
  evening: "Večerní rutina",
};
