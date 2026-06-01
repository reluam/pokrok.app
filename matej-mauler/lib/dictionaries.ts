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
  journeyCredit: {
    prefix: string;
    label: string;
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
      title: "Experimenty",
      subtitle: "Každý z nich byl nejlepší nápad v daném okamžiku.",
    },
    journeyCredit: {
      prefix: "Pro vážnější publikum dělám také",
      label: "Cestu →",
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
        slug: "odds",
        title: "What are the odds?",
        description: "Absurdní pravděpodobnosti. Jak likely je, že tě trefí meteor zrovna dnes?",
      },
      {
        slug: "sonify",
        title: "Jak to zní?",
        description: "Vlož cokoliv a algoritmus z toho udělá melodii. Každé slovo zní jinak.",
      },
      {
        slug: "foundry",
        title: "Sound Foundry",
        description: "Napiš zvuk a engine ho vyrobí z oscilátorů a šumu. Laser, výbuch, kapka…",
      },
      {
        slug: "musicvote",
        title: "Skládačka hudby",
        description: "Kdo klikne první, určí další krok. Melodie, basa, pluck i bicí.",
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
      sub: "We build things nobody needed, but nobody wanted as well.",
    },
    products: {
      title: "Experiments",
      subtitle: "Each of them was the best idea at the time.",
    },
    journeyCredit: {
      prefix: "For more serious folks, I also make the",
      label: "Journey →",
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
        slug: "odds",
        title: "What are the odds?",
        description: "Absurd probabilities. How likely is it that a meteor hits you today?",
      },
      {
        slug: "sonify",
        title: "What does it sound like?",
        description: "Type anything and the algorithm turns it into a melody. Every word sounds different.",
      },
      {
        slug: "foundry",
        title: "Sound Foundry",
        description: "Type a sound and the engine forges it from oscillators and noise. Laser, explosion, drop…",
      },
      {
        slug: "musicvote",
        title: "Music builder",
        description: "First click decides the next step. Melody, bass, pluck and drums.",
      },
    ],
  },
};
