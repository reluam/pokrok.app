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
      p1: "Ahoj, jsem Matěj. Celý svůj život se snažím přijít na to, jak vlastně žít a proč tu jsem. A tak brouzdám internetem a knihami a zjišťuju, o čem život vlastně je.",
      p2: "Většinu času jsem mimo, ale občas mám aha moment, který mi pomůže něco objasnit. A právě tyto momenty sdílím zde na Spaghetti.ltd.",
      p3a: "Pokud máš feedback, nápad nebo tě něco zaujme natolik, že bys byl rád, abych pro tebe něco udělal, neváhej mi napsat na ",
      writeMe: "můj mail",
      p3b: ".",
      rewardA: "Díky, že jsi to dočetl až sem, a za odměnu se můžeš kouknout na zbytečné informace z mé ",
      rewardLink: "Špagetí encyklopedie.",
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
        slug: "price-of-a-life",
        title: "Cena života",
        description: "Hraješ stát: dvacet rozhodnutí, jestli zaplatit za záchranu životů. Stejná cena, jiní lidé — na konci uvidíš, kde sis za stejný rozpočet jednou řekl ano a podruhé ne.",
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
      p1: "Hi, I'm Matěj. My whole life I've been trying to figure out how to actually live and why I'm here. So I wander the internet and books, working out what life is really about.",
      p2: "Most of the time I'm off the mark, but every now and then I get an aha moment that helps me make sense of something. And those are exactly the moments I share here on Spaghetti.ltd.",
      p3a: "If you have feedback, an idea, or something grabs you enough that you'd like me to make something for you, don't hesitate to drop me a line at ",
      writeMe: "my email",
      p3b: ".",
      rewardA: "Thanks for reading this far — and as a reward, you can peek at some useless trivia from my ",
      rewardLink: "Spaghetti encyclopedia.",
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
        slug: "price-of-a-life",
        title: "The Price of a Life",
        description: "You play the government: 20 decisions to fund a life-saving measure or not. Same price, different people — the end reveals where the very same budget got a yes once and a no the next.",
      },
    ],
  },
};
