export type Lang = "cs" | "en";

export type ExperimentContent = {
  slug: string;
  title: string;
  description: string;
};

export type Dictionary = {
  meta: { title: string; description: string };
  switcher: { cs: string; en: string };
  hero: {
    name: string;
    tagline: string;
  };
  wipLabel: string;
  experiments: ExperimentContent[];
};

export const dictionaries: Record<Lang, Dictionary> = {
  cs: {
    meta: {
      title: "Matěj Mauler",
      description: "Sbírka pokusů, her a interaktivních věcí.",
    },
    switcher: { cs: "CZ", en: "EN" },
    hero: {
      name: "matěj.mauler",
      tagline: "Sbírka pokusů a interaktivních věcí.",
    },
    wipLabel: "Brzy",
    experiments: [
      {
        slug: "journey",
        title: "Cesta",
        description: "Interaktivní průvodce životní cestou. Otázky, které stojí za to si klást.",
      },
      {
        slug: "cas",
        title: "Kolik ti zbývá?",
        description: "Vizualizace tvého času. Kolik týdnů máš ještě před sebou?",
      },
      {
        slug: "otazky",
        title: "Otázky",
        description: "Jedna otázka denně. Na zamyšlení, ne na odpověď.",
      },
      {
        slug: "rozhodnuti",
        title: "Rozhodnutí",
        description: "Proč děláme špatná rozhodnutí — a jak s tím něco dělat.",
      },
      {
        slug: "mapy",
        title: "Mapy mysli",
        description: "Jak vidím svět skrze systémy, vzorce a mentální modely.",
      },
      {
        slug: "42",
        title: "42",
        description: "Encyklopedie Stopařova průvodce. Odpovědi na otázky, které nikdo nezná.",
      },
      {
        slug: "nahoda",
        title: "Náhoda",
        description: "Co kdybys mohl zkusit cokoliv — a nevěděl předem co?",
      },
    ],
  },

  en: {
    meta: {
      title: "Matěj Mauler",
      description: "A collection of experiments and interactive things.",
    },
    switcher: { cs: "CZ", en: "EN" },
    hero: {
      name: "matěj.mauler",
      tagline: "A collection of experiments and interactive things.",
    },
    wipLabel: "Soon",
    experiments: [
      {
        slug: "journey",
        title: "Journey",
        description: "An interactive guide through life. Questions worth asking.",
      },
      {
        slug: "cas",
        title: "How much time?",
        description: "A visualization of your time. How many weeks do you have left?",
      },
      {
        slug: "otazky",
        title: "Questions",
        description: "One question a day. To think about, not to answer.",
      },
      {
        slug: "rozhodnuti",
        title: "Decisions",
        description: "Why we make bad decisions — and what to do about it.",
      },
      {
        slug: "mapy",
        title: "Mind maps",
        description: "How I see the world through systems, patterns, and mental models.",
      },
      {
        slug: "42",
        title: "42",
        description: "Encyclopedia of the Hitchhiker's Guide. Answers to questions nobody knows.",
      },
      {
        slug: "nahoda",
        title: "Chance",
        description: "What if you could try anything — without knowing what it is first?",
      },
    ],
  },
};
