import type { Lang } from "./dictionaries";

export type Scenario = {
  id: string;
  emoji: string;
  question: { cs: string; en: string };
  odds: string;          // e.g. "1 : 700 000"
  oneIn: number;         // for the "context" line
  explanation: { cs: string; en: string };
};

export const scenarios: Scenario[] = [
  {
    id: "meteor",
    emoji: "☄️",
    question: { cs: "Že tě dnes trefí meteorit", en: "That a meteor hits you today" },
    odds: "1 : 700 000 000 000",
    oneIn: 700_000_000_000,
    explanation: {
      cs: "Šance, že tě zasáhne meteorit, je nižší než výhra v loterii dvakrát po sobě. Vesmír na tebe necílí. Pravděpodobně.",
      en: "The chance a meteor hits you is lower than winning the lottery twice in a row. The universe isn't aiming at you. Probably.",
    },
  },
  {
    id: "sameBirthday",
    emoji: "🎂",
    question: { cs: "Že má někdo ve výtahu stejné narozeniny jako ty", en: "That someone in the elevator shares your birthday" },
    odds: "1 : 137",
    oneIn: 137,
    explanation: {
      cs: "Při pěti lidech ve výtahu je to pořád nepravděpodobné. Ale ne tak nepravděpodobné, jak by sis myslel. Narozeninový paradox je zákeřný.",
      en: "With five people in an elevator it's still unlikely. But not as unlikely as you'd think. The birthday paradox is sneaky.",
    },
  },
  {
    id: "deepDream",
    emoji: "🦑",
    question: { cs: "Že se ti dnes v noci bude zdát o chobotnici", en: "That you'll dream of an octopus tonight" },
    odds: "1 : 12 400",
    oneIn: 12_400,
    explanation: {
      cs: "Pokud o tom teď přemýšlíš, pravděpodobnost právě stoupla. Tím, že čteš tuto větu, sabotuješ výpočet.",
      en: "If you're thinking about it now, the probability just went up. By reading this sentence, you're sabotaging the calculation.",
    },
  },
  {
    id: "toastButter",
    emoji: "🍞",
    question: { cs: "Že toust spadne namazanou stranou dolů", en: "That toast lands butter-side down" },
    odds: "1 : 1,6",
    oneIn: 1.6,
    explanation: {
      cs: "Fyzika je proti tobě. Výška běžného stolu dává toustu přesně tolik času na půl otáčky. Murphy měl pravdu.",
      en: "Physics is against you. A normal table's height gives toast exactly enough time for half a rotation. Murphy was right.",
    },
  },
  {
    id: "alienToday",
    emoji: "👽",
    question: { cs: "Že dnes potkáš mimozemšťana", en: "That you'll meet an alien today" },
    odds: "1 : 8 000 000 000",
    oneIn: 8_000_000_000,
    explanation: {
      cs: "Statisticky vzato je pravděpodobnější, že mimozemšťan už mezi námi je a jen čeká, až přestaneš počítat pravděpodobnosti.",
      en: "Statistically, it's more likely an alien is already among us, just waiting for you to stop calculating probabilities.",
    },
  },
  {
    id: "phoneRing",
    emoji: "📞",
    question: { cs: "Že ti zazvoní telefon přesně když si pomyslíš na toho člověka", en: "That your phone rings exactly when you think of that person" },
    odds: "1 : 320",
    oneIn: 320,
    explanation: {
      cs: "Pamatuješ si jen ty případy, kdy to vyšlo. Tisíckrát to nevyšlo a ty sis toho nevšiml. Mozek je špatný statistik.",
      en: "You only remember the times it worked. It failed a thousand times and you didn't notice. The brain is a bad statistician.",
    },
  },
  {
    id: "lightning",
    emoji: "⚡",
    question: { cs: "Že tě za život zasáhne blesk", en: "That you'll be struck by lightning in your life" },
    odds: "1 : 15 300",
    oneIn: 15_300,
    explanation: {
      cs: "Vyšší, než bys čekal. Roy Sullivan byl zasažen sedmkrát a přežil. Buď nejšťastnější, nebo nejnešťastnější člověk v historii.",
      en: "Higher than you'd expect. Roy Sullivan was struck seven times and survived. Either the luckiest or unluckiest person in history.",
    },
  },
  {
    id: "perfectParking",
    emoji: "🅿️",
    question: { cs: "Že najdeš ideální parkovací místo hned napoprvé", en: "That you find the perfect parking spot on the first try" },
    odds: "1 : 47",
    oneIn: 47,
    explanation: {
      cs: "A když ho najdeš, nikdo to neuvidí. Vesmír odměňuje parkovací zázraky pouze tehdy, když jsi sám.",
      en: "And when you find it, nobody will see it. The universe rewards parking miracles only when you're alone.",
    },
  },
];

export function pickRandom(excludeId?: string): Scenario {
  const pool = excludeId ? scenarios.filter((s) => s.id !== excludeId) : scenarios;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const oddsUi = {
  cs: {
    back: "← Spaghetti.ltd",
    eyebrow: "Kalkulačka pravděpodobnosti",
    title: "What are the odds?",
    intro: "Absurdní pravděpodobnosti pro absurdní svět. Jaká je šance, že…",
    roll: "Spočítat pravděpodobnost 🎲",
    rollAgain: "Další pravděpodobnost 🎲",
    chanceLabel: "Pravděpodobnost",
    contextPrefix: "To je zhruba",
    pickPrompt: "Nebo si vyber, co tě zajímá:",
    disclaimer: "Všechna čísla jsou vymyšlená s láskou a žádnou statistickou metodikou.",
  },
  en: {
    back: "← Spaghetti.ltd",
    eyebrow: "Probability calculator",
    title: "What are the odds?",
    intro: "Absurd probabilities for an absurd world. What are the chances that…",
    roll: "Calculate a probability 🎲",
    rollAgain: "Another probability 🎲",
    chanceLabel: "Probability",
    contextPrefix: "That's roughly",
    pickPrompt: "Or pick what you're curious about:",
    disclaimer: "All numbers are made up with love and no statistical methodology.",
  },
} as const;

export function contextLine(oneIn: number, lang: Lang): string {
  if (oneIn <= 2) return lang === "cs" ? "skoro jisté" : "almost certain";
  if (oneIn < 100) return lang === "cs" ? `jako hodit ${Math.round(oneIn)}× kostkou a čekat jedničku` : `like rolling a die ${Math.round(oneIn)} times hoping for a one`;
  if (oneIn < 1_000_000) return lang === "cs" ? "méně pravděpodobné než výhra v drobné loterii" : "less likely than winning a small lottery";
  if (oneIn < 1_000_000_000) return lang === "cs" ? "méně pravděpodobné než blesk a výhra v loterii dohromady" : "less likely than lightning and a lottery win combined";
  return lang === "cs" ? "prakticky nemožné, ale ne úplně nula" : "practically impossible, but not quite zero";
}
