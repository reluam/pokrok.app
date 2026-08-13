import type { Bi } from "@/lib/about";

/**
 * Texty osobních stránek. Záměrně mimo lib/dictionaries.ts — ten je svázaný
 * s admin overridy a experimenty; tohle je statický obsah rozcestníku.
 *
 * Hlas: honest, humble, to the point. Žádná pointa na konci odstavce, žádné
 * sebehodnocení, neúspěchy holé. Web popisuje člověka, co se snaží žít, jak umí —
 * ne portfolio. Viz docs/superpowers/specs/2026-08-12-osobni-web-texty-design.md.
 */

/**
 * Úvod na hlavní stránce. Každý prvek = jeden <p>; proto pole a ne jeden Bi.
 * „for me" / „pro mě" v první větě je záměrné — dělá z toho Matějovu zkušenost,
 * ne tvrzení o tom, jaký život je. Nevypouštět.
 */
export const DESCRIPTION: Bi[] = [
  {
    cs: "Jsem Matěj. Jsem z živočišného druhu člověk. Život a to, být člověkem, je pro mě fascinující, pokořující a úžasná zkušenost.",
    en: "I'm Matěj. I'm of the human species. Life, and being human, is a fascinating, humbling and awe-inspiring experience for me.",
  },
  {
    cs: "Svým malým dílem chci přispět k tomu, aby byl ještě fascinující. Tak se pořád učím — o světě, o lidech, o sobě.",
    en: "In my small way I want to make it more fascinating still. So I keep learning — about the world, about people, about myself.",
  },
  {
    cs: "Ať dělám cokoli, dělám to s tímhle cílem — jako projektový manažer, jako muzikant, jako člověk.",
    en: "Whatever I do, I do it with that end goal in mind — as a project manager, as a musician, as a human being.",
  },
];

export const COPY = {
  /**
   * Hlavní stránka záměrně nenese jediný konkrétní fakt, takže veškerou
   * faktickou váhu pro vyhledávače nese tenhle řádek. Držet pod 165 znaky.
   */
  metaDescription: {
    cs: "Matěj Mauler — obchod v Teyi, hudba jako Matt Mauler a malé webové experimenty po večerech. Pořád se učím o světě, o lidech a o sobě.",
    en: "Matěj Mauler — sales at Teya, music as Matt Mauler, and small web experiments in the evenings. Still learning about the world, people, and myself.",
  },
  /** Popisek nad kontakty. */
  contactLabel: { cs: "Ozvi se", en: "Say hi" },
  /** Aria popisek šipky na hlavní stránce. */
  goTo: { cs: "Přejít na", en: "Go to" },
  /** Dělič mezi trojúhelníkem přesvědčení a kruhem pravidel. */
  inPractice: { cs: "a v praxi", en: "so, in practice" },
  /** Úvod sekce „Čemu se věnuju teď". */
  nowIntro: {
    cs: "Nic z toho není byznys. Dělám to, protože chci, aby to existovalo.",
    en: "None of this is a business. I make it because I want it to exist.",
  },
  langSwitch: {
    cs: "Switch to English",
    en: "Přepnout do češtiny",
  },
} satisfies Record<string, Bi>;
