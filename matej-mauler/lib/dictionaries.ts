export type Lang = "cs" | "en";

export type Link = { name: string; handle: string; href: string; icon: string };

export type Project = {
  name: string;
  tagline: string;
  description: string;
  color: "primary" | "teal" | "lavender";
  emoji: string;
  comingSoon?: boolean;
  emptyText?: string;
  links: Link[];
};

export type Dictionary = {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    greetingPrefix: string;
    name: string;
    bioBefore: string;
    bioZijuLink: string;
    bioAfter: string;
    rozcestnikBefore: string;
    rozcestnikWord: string;
    rozcestnikAfter: string;
  };
  projectsSection: {
    label: string;
    titleBefore: string;
    titleHighlight: string;
  };
  contact: {
    title: string;
    text: string;
  };
  switcher: {
    cs: string;
    en: string;
  };
  comingSoon: string;
  projects: Project[];
};

const sharedLinks = {
  zijuWeb: {
    name: "Web",
    handle: "ziju.life",
    href: "https://ziju.life",
    icon: "globe",
  },
  zijuIg: {
    name: "Instagram",
    handle: "@zijulife",
    href: "https://www.instagram.com/zijulife/",
    icon: "instagram",
  },
  zijuYt: {
    name: "YouTube",
    handle: "@zijulife",
    href: "https://www.youtube.com/@zijulife",
    icon: "youtube",
  },
  zijuFb: {
    name: "Facebook",
    handle: "Žiju.life",
    href: "https://www.facebook.com/zijulife",
    icon: "facebook",
  },
  substack: {
    name: "Substack",
    handle: "reluam.substack.com",
    href: "https://reluam.substack.com/",
    icon: "article",
  },
};

export const dictionaries: Record<Lang, Dictionary> = {
  cs: {
    meta: {
      title: "Matěj Mauler",
      description:
        "Ahoj, jsem Matěj. Tvořím Žiju.life, píšu na Substack a snažím se přijít na to, jak žít vědoměji. Tady najdeš všechno, co dělám.",
    },
    hero: {
      greetingPrefix: "Ahoj, jsem ",
      name: "Matěj",
      bioBefore: "Tvořím ",
      bioZijuLink: "Žiju.life",
      bioAfter:
        ", píšu na Substack a dělám pár dalších věcí. Pořád zkouším přijít na to, jak žít vědoměji.",
      rozcestnikBefore: "Tahle stránka je ",
      rozcestnikWord: "rozcestník",
      rozcestnikAfter: " — najdeš tady všechno, co dělám.",
    },
    projectsSection: {
      label: "⚡ Co teď dělám",
      titleBefore: "Moje ",
      titleHighlight: "projekty",
    },
    contact: {
      title: "Chceš mi napsat?",
      text: "Nejjednodušší cesta je e-mail.",
    },
    switcher: {
      cs: "CZ",
      en: "EN",
    },
    comingSoon: "Coming soon",
    projects: [
      {
        name: "Žiju.life",
        tagline: "Můj hlavní projekt",
        description:
          "Aplikace, web a nástroje pro vědomější každodennost. Buduju to s týmem už nějaký ten rok.",
        color: "primary",
        emoji: "🌱",
        links: [
          sharedLinks.zijuWeb,
          sharedLinks.zijuIg,
          sharedLinks.zijuYt,
          sharedLinks.zijuFb,
        ],
      },
      {
        name: "Snaps",
        tagline: "Něco nového",
        description:
          "Pracuju na něčem novém. Brzy se dozvíš víc. Zatím jen tolik — bude to dobré.",
        color: "lavender",
        emoji: "📸",
        comingSoon: true,
        emptyText: "Až bude něco veřejně, najdeš to tady jako první.",
        links: [],
      },
      {
        name: "Matějův zápisník",
        tagline: "Substack",
        description:
          "Píšu o věcech, které mě právě teď zajímají — vědomí, žití, drobné objevy. Občas dlouho, občas krátce. Nikdy ne nuceně.",
        color: "teal",
        emoji: "✍️",
        links: [sharedLinks.substack],
      },
    ],
  },

  en: {
    meta: {
      title: "Matěj Mauler",
      description:
        "Hi, I'm Matěj. I'm building Žiju.life, writing on Substack, and trying to figure out how to live more consciously. Here's everything I do.",
    },
    hero: {
      greetingPrefix: "Hi, I'm ",
      name: "Matěj",
      bioBefore: "I'm building ",
      bioZijuLink: "Žiju.life",
      bioAfter:
        ", writing on Substack, and working on a few other things. I'm always trying to figure out how to live more consciously.",
      rozcestnikBefore: "This page is a ",
      rozcestnikWord: "hub",
      rozcestnikAfter: " — you'll find everything I do here.",
    },
    projectsSection: {
      label: "⚡ What I'm up to",
      titleBefore: "My ",
      titleHighlight: "projects",
    },
    contact: {
      title: "Want to reach out?",
      text: "Email is the easiest way.",
    },
    switcher: {
      cs: "CZ",
      en: "EN",
    },
    comingSoon: "Coming soon",
    projects: [
      {
        name: "Žiju.life",
        tagline: "My main project",
        description:
          "App, website, and tools for a more conscious everyday. I've been building it with a team for a while now.",
        color: "primary",
        emoji: "🌱",
        links: [
          sharedLinks.zijuWeb,
          sharedLinks.zijuIg,
          sharedLinks.zijuYt,
          sharedLinks.zijuFb,
        ],
      },
      {
        name: "Snaps",
        tagline: "Something new",
        description:
          "I'm working on something new. You'll hear more soon. For now, just this — it'll be good.",
        color: "lavender",
        emoji: "📸",
        comingSoon: true,
        emptyText: "When there's something public, you'll see it here first.",
        links: [],
      },
      {
        name: "Matěj's notebook",
        tagline: "Substack",
        description:
          "I write about whatever's on my mind right now — consciousness, living, small discoveries. Sometimes long, sometimes short. Never forced.",
        color: "teal",
        emoji: "✍️",
        links: [sharedLinks.substack],
      },
    ],
  },
};
