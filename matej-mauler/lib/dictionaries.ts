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
        slug: "encyklopedie",
        title: "Absurdní encyklopedie",
        description: "Encyklopedie absurdních fikčních světů — braná smrtelně vážně. Futurama, Simpsonovi, Red Dwarf, Stopařův průvodce… jako by to všechno byla pravda.",
      },
      {
        slug: "sound",
        title: "Cesta po zvukové vlně",
        description: "Tvůj kurzor je ucho. Scrolluj zvukem od chvění po ozvěnu — a všechno si poslechni.",
      },
      {
        slug: "music",
        title: "Jak vzniká hudba",
        description: "Poskládej skladbu po vrstvách: beat, basa, akordy, melodie. Mřížky, fadery, efekty.",
      },
      {
        slug: "radio",
        title: "Rádio",
        description: "Rádio renderované na serveru — všichni slyší totéž a každých 15 vteřin hlasují, co se změní.",
      },
      {
        slug: "brain",
        title: "Synapse",
        description: "Slovo → asociace. Každá odpověď posílí synapsi ve společné síti internetu.",
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
        slug: "encyklopedie",
        title: "The Absurd Encyclopedia",
        description: "An encyclopedia of absurd fictional worlds — taken deadly seriously. Futurama, The Simpsons, Red Dwarf, the Hitchhiker's Guide… as if it were all real.",
      },
      {
        slug: "sound",
        title: "A journey along a sound wave",
        description: "Your cursor is an ear. Scroll through sound from a tremble to an echo — and hear it all.",
      },
      {
        slug: "music",
        title: "How music is made",
        description: "Build a track layer by layer: beat, bass, chords, melody. Grids, faders, effects.",
      },
      {
        slug: "radio",
        title: "The Radio",
        description: "A server-rendered radio — everyone hears the same stream and votes every 15 seconds on what changes next.",
      },
      {
        slug: "brain",
        title: "Synapses",
        description: "Word → association. Every answer strengthens a synapse in the internet's shared network.",
      },
    ],
  },
};
