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
    wipLabel: "Brzy",
    experiments: [
      {
        slug: "encyklopedie",
        title: "Encyklopedie",
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
      {
        slug: "rules",
        title: "Pravidla",
        description: "Hromádka klasických her — každá má svá pravidla a každá tichou cestu okolo nich. Hra o tom, jak si toho všimnout.",
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
    wipLabel: "Soon",
    experiments: [
      {
        slug: "encyklopedie",
        title: "The Encyclopedia",
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
      {
        slug: "rules",
        title: "The Rules",
        description: "A stack of classic games — each states its rules, and each has a quiet way around them. A game about noticing that.",
      },
    ],
  },
};
