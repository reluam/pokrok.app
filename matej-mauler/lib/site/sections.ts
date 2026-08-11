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
    nav: { cs: "Čím jsem prošel", en: "Where I've been" },
    title: { cs: "Čím jsem prošel", en: "Where I've been" },
    summary: {
      cs: "Herní weby, jeden vlastní projekt, co nevyšel, festivaly, e-shopy a teď fintech. Životopis, ale na časové ose — i s tím, co nedopadlo.",
      en: "Gaming sites, one project of my own that flopped, festivals, e-shops, and fintech today. A CV on a timeline — including the parts that went wrong.",
    },
  },
  {
    id: "projects",
    href: "/projects",
    nav: { cs: "Moje projekty", en: "My projects" },
    title: { cs: "Moje projekty", en: "My projects" },
    summary: {
      cs: "Co si stavím sám a po večerech — hudba jako Matt Mauler, webové experimenty na Spaghetti.ltd a další věci, které vznikly z nudy nebo z otázky.",
      en: "The things I build on my own time — music as Matt Mauler, web experiments on Spaghetti.ltd, and whatever else grew out of boredom or a question.",
    },
  },
  {
    id: "thoughts",
    href: "/thoughts",
    nav: { cs: "Občas se zamyslím", en: "Sometimes I think" },
    title: { cs: "Občas se zamyslím", en: "Sometimes I think" },
    summary: {
      cs: "Texty o tom, co znamená být člověkem — a co z toho plyne. Píšu je nepravidelně, vždycky až když mi něco doopravdy nedá spát.",
      en: "Notes on what it means to be human — and what follows from it. Written irregularly, always only when something genuinely won't let me sleep.",
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
