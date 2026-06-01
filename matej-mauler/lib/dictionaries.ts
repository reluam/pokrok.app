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
      sub: "Tvořím věci, které nikdo nepotřeboval, ale taky je nikdo nechtěl.",
    },
    products: {
      title: "Experimenty",
      subtitle: "Každý z nich byl nejlepší nápad v daném okamžiku.",
    },
    journeyCredit: {
      prefix: "Pro vážnější publikum dělám také",
      label: "Cestu →",
    },
    about: {
      heading: "O projektu",
      p1: "Ahoj, jsem Matěj. Tvůrce projektu Spaghetti.ltd. Mám rád zkoumání nových věcí a následné experimentování s nově nabytými znalostmi. Protože jsem za celý svůj život u žádného projektu nevydržel déle než 3 měsíce, rozhodl jsem se udělat tuto stránku, kde u žádného experimentu nemusím vydržet déle než týden.",
      p2: "Ve zkratce — můj život je mess. A špagety to pěkně vyjadřují.",
      p3a: "Pokud tě některý z mých experimentů zaujme nebo tě dokonce nedejbože osloví, můžeš mi ",
      writeMe: "napsat",
      p3b: " a rád vymyslím nějaký speciální experiment ušitý přímo tobě na míru.",
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
      sub: "I build things nobody needed, but nobody wanted either.",
    },
    products: {
      title: "Experiments",
      subtitle: "Each of them was the best idea at the time.",
    },
    journeyCredit: {
      prefix: "For more serious folks, I also make the",
      label: "Journey →",
    },
    about: {
      heading: "About",
      p1: "Hi, I'm Matěj — the maker of Spaghetti.ltd. I love exploring new things and then experimenting with what I've just learned. Because in my whole life I've never stuck with a single project longer than 3 months, I decided to build this site, where I don't have to stick with any experiment longer than a week.",
      p2: "In short — my life is a mess. And spaghetti captures it nicely.",
      p3a: "If one of my experiments catches your eye, or god forbid even speaks to you, you can ",
      writeMe: "write to me",
      p3b: " and I'll happily cook up a special experiment tailored just for you.",
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
    ],
  },
};
