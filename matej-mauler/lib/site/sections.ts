import type { Bi } from "@/lib/about";

/**
 * Čtyři sekce = čtyři routy = čtyři kontinenty na kouli.
 * Pořadí tady určuje pořadí v menu; kde kontinent leží na kouli, říká
 * lib/site/continents.ts. URL zůstávají anglické i v české verzi (jazyk drží
 * cookie, ne cesta) — jinak by každá stránka musela existovat dvakrát.
 */
export type Section = {
  id: "home" | "work" | "ideas" | "contact";
  href: string;
  /** Krátký popisek do menu. */
  nav: Bi;
  /** Nadpis panelu i řádku na hlavní stránce. */
  title: Bi;
  /** Shrnutí na hlavní stránce (řádek se šipkou). */
  summary: Bi;
};

export const SECTIONS: Section[] = [
  {
    id: "home",
    href: "/",
    nav: { cs: "Začátek", en: "Start" },
    title: { cs: "Matěj Mauler", en: "Matěj Mauler" },
    summary: { cs: "", en: "" },
  },
  {
    id: "work",
    href: "/work",
    nav: { cs: "Kousek historie", en: "A bit of history" },
    title: { cs: "Kousek historie", en: "A bit of history" },
    summary: {
      cs: "Firmy, kterými jsem prošel, a co jsem v nich dělal. Velikost země říká, jak dlouho jsem tam byl.",
      en: "The companies I've been through and what I did in them. A country's size says how long I stayed.",
    },
  },
  {
    id: "ideas",
    href: "/ideas",
    nav: { cs: "Nad čím přemýšlím", en: "What I'm thinking about" },
    title: { cs: "Nad čím přemýšlím", en: "What I'm thinking about" },
    summary: {
      cs: "Nápady, které nedělám a myslím si, že by měly existovat. Klidně si je vezmi.",
      en: "Ideas I'm not building that I think should exist. Take one if you want.",
    },
  },
  {
    id: "contact",
    href: "/contact",
    nav: { cs: "Zůstaňme ve spojení", en: "Let's stay in touch" },
    title: { cs: "Zůstaňme ve spojení", en: "Let's stay in touch" },
    summary: {
      cs: "Nejrychleji Discord. Mail taky funguje. Důvod není potřeba.",
      en: "Discord is fastest. Email works too. No reason needed.",
    },
  },
];

export const sectionIndex = (id: Section["id"]) => SECTIONS.findIndex((s) => s.id === id);

/** Pro popstate / přímý vstup: z cesty zjisti pozici sekce. */
export const indexForPath = (path: string) => {
  const clean = path.replace(/\/+$/, "") || "/";
  const found = SECTIONS.findIndex((s) => s.href === clean);
  return found === -1 ? 0 : found;
};
