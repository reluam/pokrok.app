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
    sub: string;
  };
  products: {
    title: string;
    subtitle: string;
  };
  wipLabel: string;
  experiments: ExperimentContent[];
};

export const dictionaries: Record<Lang, Dictionary> = {
  cs: {
    meta: {
      title: "Spaghetti.ltd",
      description: "Máme špatné nápady a hromadu AI vůle je uskutečnit.",
    },
    switcher: { cs: "CZ", en: "EN" },
    hero: {
      name: "Spaghetti.ltd",
      tagline: "Máme špatné nápady a hromadu AI vůle je uskutečnit.",
      sub: "Stavíme věci, které nikdo nepotřeboval, ale teď neví jak bez nich žít.",
    },
    products: {
      title: "Produkty",
      subtitle: "Každý z nich byl nejlepší nápad v daném okamžiku.",
    },
    wipLabel: "Brzy",
    experiments: [
      {
        slug: "cas",
        title: "Kolik ti zbývá?",
        description: "Absurdní životní kalkulačka. Výsledky zaručeně nepřesné.",
      },
      {
        slug: "vvv",
        title: "VVV",
        description: "Veškeré vesmírné vědění. Encyklopedie kompletnější než Stopařův průvodce.",
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
        slug: "nahoda",
        title: "Náhoda",
        description: "Co kdybys mohl zkusit cokoliv — a nevěděl předem co?",
      },
    ],
  },

  en: {
    meta: {
      title: "Spaghetti.ltd",
      description: "We have bad ideas and plenty of AI willpower to build them.",
    },
    switcher: { cs: "CZ", en: "EN" },
    hero: {
      name: "Spaghetti.ltd",
      tagline: "We have bad ideas and plenty of AI willpower to build them.",
      sub: "We build things nobody needed, but now can't live without.",
    },
    products: {
      title: "Products",
      subtitle: "Each of them was the best idea at the time.",
    },
    wipLabel: "Soon",
    experiments: [
      {
        slug: "cas",
        title: "How much time?",
        description: "Absurd life calculator. Results guaranteed inaccurate.",
      },
      {
        slug: "vvv",
        title: "VVV",
        description: "Vast Void Vault. An encyclopedia more complete than the Hitchhiker's Guide.",
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
        slug: "nahoda",
        title: "Chance",
        description: "What if you could try anything — without knowing what it is first?",
      },
    ],
  },
};
