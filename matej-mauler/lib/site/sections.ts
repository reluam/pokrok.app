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
      cs: "Herní weby, vlastní projekt, festivaly, e-shopy a dnes fintech. Životopis na časové ose — i s tím, co nevyšlo.",
      en: "Gaming sites, a project of my own, festivals, e-shops, and fintech today. A CV on a timeline — including what didn't work out.",
    },
  },
  {
    id: "projects",
    href: "/projects",
    nav: { cs: "Čemu se věnuju teď", en: "What I do now" },
    title: { cs: "Čemu se věnuju teď", en: "What I do now" },
    summary: {
      cs: "Věci, které si stavím sám, protože mi dávají smysl — hudba jako Matt Mauler, webové experimenty na Spaghetti.ltd a další.",
      en: "The things I build myself because they make sense to me — music as Matt Mauler, web experiments on Spaghetti.ltd, and more.",
    },
  },
  {
    id: "thoughts",
    href: "/thoughts",
    nav: { cs: "Jak to vidím", en: "How I see it" },
    title: { cs: "Jak to vidím", en: "How I see it" },
    summary: {
      cs: "Tři věci, o kterých jsem přesvědčený — a řada dalších, na které jsem cestou přišel. Proklikej si je, dokud tě to baví.",
      en: "Three things I'm convinced about — and a row of others I worked out along the way. Click through as long as it holds you.",
    },
  },
  {
    id: "contact",
    href: "/contact",
    nav: { cs: "Zůstaňme ve spojení", en: "Let's stay in touch" },
    title: { cs: "Zůstaňme ve spojení", en: "Let's stay in touch" },
    summary: {
      cs: "Nejrychleji mě chytneš na Discordu, ale funguje i mail. Ozvi se klidně jen tak.",
      en: "Discord is the fastest way to catch me, but email works too. Feel free to reach out for no reason at all.",
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
