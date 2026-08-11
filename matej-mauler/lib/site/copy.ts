import type { Bi } from "@/lib/about";

/**
 * Texty osobních stránek. Záměrně mimo lib/dictionaries.ts — ten je svázaný
 * s admin overridy a experimenty; tohle je statický obsah rozcestníku.
 */
export const COPY = {
  description: {
    cs: "Živím se obchodem a rozvojem byznysu, po nocích dělám hudbu jako Matt Mauler a mezitím stavím webové experimenty. Baví mě dívat se na věci jako na systémy — a hledat v nich to místo, kde to zaskřípe.",
    en: "I do sales and business development by day, music as Matt Mauler by night, and web experiments in between. I like looking at things as systems — and finding the one place where they creak.",
  },
  motto: {
    cs: "Devět z deseti nápadů je špatných. Proto jich mám hodně, abych našel ten jeden.",
    en: "Nine out of ten ideas are bad. That's why I have plenty — to find the one that isn't.",
  },
  /** Popisek nad kontakty. */
  contactLabel: { cs: "Ozvi se", en: "Say hi" },
  /** Aria popisek šipky na hlavní stránce. */
  goTo: { cs: "Přejít na", en: "Go to" },
  timelineNow: { cs: "teď", en: "now" },
  thoughtsEmpty: {
    cs: "Zrovna se nic nenačetlo — texty žijí na Substacku.",
    en: "Nothing loaded right now — the writing lives on Substack.",
  },
  thoughtsAll: { cs: "Všechny texty na Substacku", en: "All writing on Substack" },
  projectsNote: {
    cs: "Aktivní věci jsou vysázené naplno, ty odložené tišeji.",
    en: "Active things are set at full weight, the parked ones quieter.",
  },
  langSwitch: {
    cs: "Switch to English",
    en: "Přepnout do češtiny",
  },
} satisfies Record<string, Bi>;
