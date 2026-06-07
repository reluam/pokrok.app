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
  about: {
    heading: string;
    p1: string;
    p2: string;
    p3a: string;
    writeMe: string;
    p3b: string;
    rewardA: string;
    rewardLink: string;
  };
  wipLabel: string;
  experiments: ExperimentContent[];
};

export const dictionaries: Record<Lang, Dictionary> = {
  cs: {
    meta: {
      title: "Spaghetti.ltd",
      description: "Mám blbé nápady a hromadu umělé vůle je uskutečnit.",
    },
    switcher: { cs: "CZ", en: "EN" },
    hero: {
      name: "Spaghetti.ltd",
      tagline: "Mám blbé nápady a hromadu umělé vůle je uskutečnit.",
      sub: "9 z 10 experimentů je ztráta času. Tady jsou všechny.",
    },
    products: {
      title: "Experimenty",
      subtitle: "Každý vypadal jako skvělý nápad. Většina pořád vypadá. To je ten problém.",
    },
    journeyCredit: {
      prefix: "Pro vážnější publikum dělám také",
      label: "Cestu →",
    },
    about: {
      heading: "O projektu",
      p1: "Ahoj, jsem Matěj. Posedne mě nějaká věc, něco postavím a jdu dál. Pokaždé jsem přesvědčený, že je to ten nejlepší nápad, co jsem kdy měl. Většinou není.",
      p2: "Spaghetti je místo, kde ty nápady žijí. Některé jsou užitečné. Některé jsou jen zajímavé. Většina není ani jedno.",
      p3a: "Jestli tě tu něco zaujme — nebo potřebuješ někoho, kdo vymyslí 9 špatných nápadů, abys našel ten jeden dobrý — ",
      writeMe: "napiš mi",
      p3b: ".",
      rewardA: "Díky, žes to dočetl až sem, a za odměnu se můžeš kouknout, ",
      rewardLink: "co tě v životě nejspíš nepotká.",
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
        description: "Vytvoříš naslepo jednu část. Z dílků různých lidí vznikne společný song.",
      },
      {
        slug: "radio",
        title: "Spaghetti Radio",
        description: "Nekonečný generativní song, který se každé 4 takty sám promění.",
      },
      {
        slug: "anthem",
        title: "Hymna tvého života",
        description: "Šest otázek, samé špatné odpovědi. Na konci tvoje osobní hymna.",
      },
      {
        slug: "journey",
        title: "The Journey",
        description: "Od první buňky po poslední dech. Scrolluj a projdi celý lidský život.",
      },
      {
        slug: "space",
        title: "Space",
        description: "Interaktivní mapa naší galaxie. Klikni a zjisti, kde to vlastně jsme.",
      },
      {
        slug: "soundverse",
        title: "Sound Universe",
        description: "Postav svět mezi zdrojem zvuku a svýma ušima a poslouchej, jak se šíří.",
      },
    ],
  },

  en: {
    meta: {
      title: "Spaghetti.ltd",
      description: "I have bad ideas and plenty of artificial willpower to build them.",
    },
    switcher: { cs: "CZ", en: "EN" },
    hero: {
      name: "Spaghetti.ltd",
      tagline: "I have bad ideas and plenty of artificial willpower to build them.",
      sub: "9 out of 10 experiments are a waste of time. This is all of them.",
    },
    products: {
      title: "Experiments",
      subtitle: "Each one seemed like a great idea. Most still do. That's the problem.",
    },
    journeyCredit: {
      prefix: "For more serious folks, I also make the",
      label: "Journey →",
    },
    about: {
      heading: "About",
      p1: "Hi, I'm Matěj. I get obsessed with things, build something, and move on. Every time I'm convinced it's the best idea I've ever had. Usually it isn't.",
      p2: "Spaghetti is where those ideas live. Some are useful. Some are just interesting. Most are neither.",
      p3a: "If something here catches your eye — or you need someone to come up with 9 bad ideas so you can find the one good one — ",
      writeMe: "write to me",
      p3b: ".",
      rewardA: "Thanks for reading this far — as a reward, you can check out ",
      rewardLink: "what probably won't happen to you in life.",
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
        description: "You blindly make one part. A shared song emerges from many people's pieces.",
      },
      {
        slug: "radio",
        title: "Spaghetti Radio",
        description: "An endless generative song that mutates itself every 4 bars.",
      },
      {
        slug: "anthem",
        title: "Anthem of Your Life",
        description: "Six questions, only bad answers. At the end, your personal anthem.",
      },
      {
        slug: "journey",
        title: "The Journey",
        description: "From the first cell to the last breath. Scroll through an entire human life.",
      },
      {
        slug: "space",
        title: "Space",
        description: "An interactive map of our galaxy. Click to learn where we actually are.",
      },
      {
        slug: "soundverse",
        title: "Sound Universe",
        description: "Build the world between a sound source and your ears, and hear how it travels.",
      },
    ],
  },
};
