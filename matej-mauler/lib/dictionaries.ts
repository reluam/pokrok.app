export type Lang = "cs" | "en";

export type Link = {
  name: string;
  handle: string;
  href: string;
  icon: string;
};

export type ExperimentProject = {
  name: string;
  description: string;
  url?: string;
  emoji: string;
  wip?: boolean;
};

export type Dictionary = {
  meta: { title: string; description: string };
  switcher: { cs: string; en: string };

  hero: {
    greeting: string;
    tagline: string;
    lines: string[];
  };

  pisuSection: {
    label: string;
    title: string;
    intro: string;
    substackSubtitle: string;
    linkedinLabel: string;
    linkedinHandle: string;
    linkedinDesc: string;
    readMore: string;
    allPosts: string;
    emptyState: string;
  };

  spolupracujiSection: {
    label: string;
    title: string;
    intro: string;
    text: string;
    ctaLabel: string;
    zijuText: string;
    zijuLabel: string;
  };

  experimentySection: {
    label: string;
    title: string;
    intro: string;
    wipLabel: string;
    visitLabel: string;
    projects: ExperimentProject[];
  };
};

export const dictionaries: Record<Lang, Dictionary> = {
  cs: {
    meta: {
      title: "Matěj Mauler",
      description:
        "Zkoumám, jak žít vědoměji a jak budovat věci, které mají smysl.",
    },
    switcher: { cs: "CZ", en: "EN" },

    hero: {
      greeting: "Jsem Matěj.",
      tagline:
        "Zkoumám, jak žít vědoměji a jak budovat věci, které mají smysl.",
      lines: [],
    },

    pisuSection: {
      label: "Píšu",
      title: "Občas něco napíšu",
      intro:
        "Psaní je pro mě způsob, jak si utřídit myšlenky — a pak je poslat dál. Najdeš tu zápisky ze Substacku: někdy krátká pozorování, někdy delší eseje o věcech, které mě právě zaměstnávají.",
      substackSubtitle: "Kratší i delší zápisky ze Substacku.",
      linkedinLabel: "LinkedIn",
      linkedinHandle: "matej-mauler",
      linkedinDesc:
        "Kratší myšlenky, postřehy a poznámky z podnikání a vědomého žití.",
      readMore: "Číst",
      allPosts: "Všechny články",
      emptyState: "Momentálně se nepodařilo načíst články.",
    },

    spolupracujiSection: {
      label: "Spolupracuji",
      title: "A ještě radši tvořím",
      intro:
        "Nejsem k dispozici na vše — ale když mi to dává smysl, do toho jdu naplno. Tady je přehled toho, na co jsem otevřený.",
      text: "Aktuálně se nejvíc věnuju koučinku na žiju.life, ale jsem otevřený i dalším spolupracím. Nejvíce mě baví dívat se na věci jako na systémy, vymýšlet, jak by měly fungovat, a hledat cestu tam, kde se ostatní zasekli.\nPokud máš nápad nebo otázku, napiš mi.",
      ctaLabel: "Napsat e-mail",
      zijuText: "Koučink a vědomé žití:",
      zijuLabel: "žiju.life →",
    },

    experimentySection: {
      label: "Experimentuju",
      title: "Aktivní projekty",
      intro:
        "Věci, které stavím mimo Žiju.life — většinou proto, že mě něco zaujalo natolik, že jsem to prostě musel zkusit postavit.",
      wipLabel: "Probíhá",
      visitLabel: "Otevřít",
      projects: [
        {
          name: "Thinkable",
          description:
            "Mobilní app pro trénink kritického myšlení. Duolingo pro myšlení.",
          url: "https://thinkable.website",
          emoji: "🧠",
        },
        {
          name: "Interactive: The Changing World Order",
          description:
            "Interaktivní vizualizace cyklů moci dle knihy Raye Dalia — kde jsme v historickém cyklu a proč na tom záleží.",
          emoji: "🌍",
          wip: true,
        },
      ],
    },
  },

  en: {
    meta: {
      title: "Matěj Mauler",
      description:
        "Exploring how to live more consciously and how to build things that matter. I write, coach, and experiment.",
    },
    switcher: { cs: "CZ", en: "EN" },

    hero: {
      greeting: "I'm Matěj.",
      tagline:
        "Exploring how to live more consciously and how to build things that matter.",

      lines: [],
    },

    pisuSection: {
      label: "Writing",
      title: "What I'm writing",
      intro:
        "Writing is how I make sense of things — and then send them out into the world. Here you'll find notes from Substack: sometimes short observations, sometimes longer essays on whatever's on my mind.",
      substackSubtitle:
        "Longer essays and notes from Substack — unfiltered, unhurried.",
      linkedinLabel: "LinkedIn",
      linkedinHandle: "matej-mauler",
      linkedinDesc:
        "Shorter thoughts, observations, and notes on building and conscious living.",
      readMore: "Read",
      allPosts: "All posts",
      emptyState: "Couldn't load posts right now.",
    },

    spolupracujiSection: {
      label: "Collaboration",
      title: "How we can work together",
      intro:
        "I'm not available for everything — but when something makes sense to me, I'm all in. Here's what I'm open to.",
      text: "Right now I focus mostly on coaching at žiju.life, but I'm open to other collaborations — speaking, advising founders, partnerships. If you have an idea or a question, write to me.",
      ctaLabel: "Send an email",
      zijuText: "Coaching and conscious living:",
      zijuLabel: "žiju.life →",
    },

    experimentySection: {
      label: "Experiments",
      title: "Active projects",
      intro:
        "Things I build outside of Žiju.life — usually because something caught my interest enough that I just had to try building it.",
      wipLabel: "In progress",
      visitLabel: "Visit",
      projects: [
        {
          name: "Thinkable",
          description:
            "A mobile app for training critical thinking. Duolingo for the mind.",
          url: "https://thinkable.website",
          emoji: "🧠",
        },
        {
          name: "Interactive: The Changing World Order",
          description:
            "An interactive visualisation of power cycles based on Ray Dalio's book — where we are in the historical arc and why it matters.",
          emoji: "🌍",
          wip: true,
        },
      ],
    },
  },
};
