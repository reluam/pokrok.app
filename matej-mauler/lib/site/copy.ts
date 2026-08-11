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
    cs: "Zrovna se nic nenačetlo — články žijí na Substacku.",
    en: "Nothing loaded right now — the articles live on Substack.",
  },
  thoughtsAll: { cs: "Všechny texty na Substacku", en: "All writing on Substack" },
  thoughtsShort: { cs: "Krátké myšlenky", en: "Short thoughts" },
  thoughtsShortLead: {
    cs: "Věci, na které jsem za ta léta přišel. Nic z toho není originální — ale všechno mě to něco stálo.",
    en: "Things I've worked out over the years. None of it is original — but all of it cost me something.",
  },
  thoughtsArticles: { cs: "Delší články", en: "Longer pieces" },
  articleOrigin: { cs: "Vyšlo na Substacku", en: "Originally on Substack" },
  expand: { cs: "Číst dál", en: "Read on" },
  collapse: { cs: "Sbalit", en: "Collapse" },
  /** Úvod sekce „Čemu se věnuju teď". */
  nowIntro: {
    cs: "Snažím se dělat věci, které mi dávají smysl. Ne proto, že by z nich něco koukalo, ale protože mě zajímá otázka, na kterou odpovídají. Většinou vzniknou večer, z nudy nebo ze vzteku, a část z nich se pak ukáže jako užitečná i pro někoho dalšího.",
    en: "I try to make things that make sense to me. Not because there's something in it, but because I care about the question they answer. Most of them start in the evening, out of boredom or irritation, and some turn out to be useful to somebody else too.",
  },
  langSwitch: {
    cs: "Switch to English",
    en: "Přepnout do češtiny",
  },
} satisfies Record<string, Bi>;
