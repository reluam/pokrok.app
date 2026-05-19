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

export type FormativeItem = {
  name: string;
  note: string;
};

export type Dictionary = {
  meta: { title: string; description: string };
  switcher: { cs: string; en: string };

  hero: {
    greeting: string;
    tagline: string;
    bio: string;
  };

  pisuSection: {
    label: string;
    title: string;
    lead: string;
    readMore: string;
    allPosts: string;
    emptyState: string;
  };

  formativeSection: {
    title: string;
    subtitle: string;
    items: FormativeItem[];
  };

  spolupracujiSection: {
    title: string;
    mainText: string;
    slotsLabel: string;
    otherLabel: string;
    otherItems: string[];
    ctaCallLabel: string;
    ctaCallUrl: string;
    ctaSubstackLabel: string;
    ctaEmailLabel: string;
  };
};

export const dictionaries: Record<Lang, Dictionary> = {
  cs: {
    meta: {
      title: "Matěj Mauler",
      description:
        "Píšu a přemýšlím o tom, proč chytří lidé jednají proti sobě — a co se s tím dá dělat.",
    },
    switcher: { cs: "CZ", en: "EN" },

    hero: {
      greeting: "Jsem Matěj.",
      tagline: "Zkoumám, co znamená být člověkem — a co z toho plyne.",
      bio: "Píšu, přemýšlím a pracuju se zakladateli jako thinking partner.",
    },

    pisuSection: {
      label: "Píšu",
      title: "Čím se teď zabývám",
      lead: "Píšu o tom, co mě právě zaměstnává. Většinou jednou týdně.",
      readMore: "Číst",
      allPosts: "Všechny články",
      emptyState: "Momentálně se nepodařilo načíst články.",
    },

    formativeSection: {
      title: "Co mě formuje",
      subtitle:
        "Není to bibliografie. Je to mapa toho, kde mám kořeny.",
      items: [
        {
          name: "John Vervaeke",
          note: "Awakening from the Meaning Crisis. Smysl není věc, ale proces — a jeho ztráta bolí konkrétně.",
        },
        {
          name: "Ray Dalio",
          note: "Principy a historické cykly. Jak číst svět skrze vzorce, ne izolované události.",
        },
        {
          name: "Viktor Frankl",
          note: "Smysl jako základ motivace. Bez toho jdou všechny ostatní rámce do prázdna.",
        },
        {
          name: "Daniel Kahneman",
          note: "Thinking, Fast and Slow. Mapa toho, jak nás naše myšlení klame — a kdy to nevadí.",
        },
      ],
    },

    spolupracujiSection: {
      title: "Myslíme spolu",
      mainText:
        "Pracuji s malým počtem zakladatelů jako thinking partner — někdo mimo jejich hlavu, kdo pomáhá vidět systém za problémem. Nejde o koučink. Jde o to myslet společně.",
      slotsLabel: "Momentálně: 2 sloty k dispozici.",
      otherLabel: "Jsem otevřený i:",
      otherItems: ["speakingu na konferencích", "workshopům pro týmy", "partnerstvím, která mají smysl"],
      ctaCallLabel: "Rezervuj 30 minut",
      ctaCallUrl: "https://cal.eu/matejmauler/30min",
      ctaSubstackLabel: "Odebírej na Substacku →",
      ctaEmailLabel: "matej@matejmauler.com",
    },
  },

  en: {
    meta: {
      title: "Matěj Mauler",
      description:
        "I write and think about why smart people work against themselves — and what can be done about it.",
    },
    switcher: { cs: "CZ", en: "EN" },

    hero: {
      greeting: "I'm Matěj.",
      tagline: "I explore what it means to be human — and what follows from that.",
      bio: "I write, think, and work with founders as a thinking partner.",
    },

    pisuSection: {
      label: "Writing",
      title: "What I'm thinking about now",
      lead: "I write about what's on my mind. Usually once a week.",
      readMore: "Read",
      allPosts: "All posts",
      emptyState: "Couldn't load posts right now.",
    },

    formativeSection: {
      title: "What shapes me",
      subtitle: "Not a bibliography. A map of where my thinking is rooted.",
      items: [
        {
          name: "John Vervaeke",
          note: "Awakening from the Meaning Crisis. Why meaning isn't a thing but a process — and why its loss hurts.",
        },
        {
          name: "Ray Dalio",
          note: "Principles and historical cycles. How to read the world through patterns, not isolated events.",
        },
        {
          name: "Viktor Frankl",
          note: "Meaning as the foundation of motivation. Without it, every other framework collapses.",
        },
        {
          name: "Daniel Kahneman",
          note: "Thinking, Fast and Slow. A map of how our minds deceive us — and when that's fine.",
        },
      ],
    },

    spolupracujiSection: {
      title: "Thinking together",
      mainText:
        "I work with a small number of founders as a thinking partner — someone outside their head who helps them see the system behind the problem. It's not coaching. It's thinking together.",
      slotsLabel: "Currently: 2 slots available.",
      otherLabel: "I'm also open to:",
      otherItems: ["speaking at conferences", "workshops for teams", "partnerships that make sense"],
      ctaCallLabel: "Book 30 minutes",
      ctaCallUrl: "https://cal.eu/matejmauler/30min",
      ctaSubstackLabel: "Subscribe on Substack",
      ctaEmailLabel: "matej@matejmauler.com",
    },
  },
};
