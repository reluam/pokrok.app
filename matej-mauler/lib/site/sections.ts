import type { Bi } from "@/lib/about";

/**
 * Pět sekcí = pět rout = pět panelů jednoho vodorovného pásu.
 * `index` je pozice v pásu: posun je vždy -index * 100vw, takže pořadí tady
 * určuje i směr a délku animace. URL zůstávají anglické i v české verzi
 * (jazyk drží cookie, ne cesta) — jinak by každá stránka musela existovat dvakrát.
 */
export type Section = {
  id: "home" | "work" | "projects" | "thoughts" | "contact";
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
      cs: "Kde jsem pracoval, od nejnovějšího. Fintech, e-shopy, vlastní firma, herní weby a festival, u kterého jsem od roku 2015.",
      en: "Where I've worked, newest first. Fintech, e-commerce, a company of my own, gaming sites, and a festival I've been at since 2015.",
    },
  },
  {
    id: "projects",
    href: "/projects",
    nav: { cs: "Čemu se věnuju teď", en: "What I do now" },
    title: { cs: "Čemu se věnuju teď", en: "What I do now" },
    summary: {
      cs: "Tři věci, ke kterým se pořád vracím. Ani jedna nic nevydělává.",
      en: "Three things I keep coming back to. None of them pay for anything.",
    },
  },
  {
    id: "thoughts",
    href: "/thoughts",
    nav: { cs: "Jak to vidím", en: "How I see it" },
    title: { cs: "Jak to vidím", en: "How I see it" },
    summary: {
      cs: "Pár věcí, na kterých jsem zůstal. Nejsou to rady, je to jen to, kde jsem.",
      en: "A few things I've landed on. Not advice — just where I am.",
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

/** Pro popstate / přímý vstup: z cesty zjisti pozici v pásu. */
export const indexForPath = (path: string) => {
  const clean = path.replace(/\/+$/, "") || "/";
  const found = SECTIONS.findIndex((s) => s.href === clean);
  return found === -1 ? 0 : found;
};
