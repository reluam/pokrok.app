import type { Bi } from "@/lib/about";

/**
 * Texty osobních stránek. Záměrně mimo lib/dictionaries.ts — ten je svázaný
 * s admin overridy a experimenty; tohle je statický obsah rozcestníku.
 */
export const COPY = {
  description: {
    cs: "Jsem Matěj. Ve dne dělám obchod ve fintechu, večer hudbu jako Matt Mauler a mezi tím stavím malé webové věci, o které nikdo neprosil. Prošel jsem herními weby, festivaly, e-shopy i vlastním projektem, co nevyšel — a zůstal mi z toho zvyk rozebírat věci, abych viděl, co je ve skutečnosti drží pohromadě. Nejradši mám otázky, které si ještě nikdo nedal práci položit.",
    en: "I'm Matěj. By day I do sales in fintech, by night I make music as Matt Mauler, and in between I build small web things nobody asked for. I've been through gaming sites, festivals, e-shops and a project of my own that flopped — what stayed with me is the habit of taking things apart to see what actually holds them together. My favourite questions are the ones nobody has bothered to ask yet.",
  },
  /** Popisek nad kontakty. */
  contactLabel: { cs: "Ozvi se", en: "Say hi" },
  /** Aria popisek šipky na hlavní stránce. */
  goTo: { cs: "Přejít na", en: "Go to" },
  timelineNow: { cs: "teď", en: "now" },
  beliefsHeading: { cs: "Jsem přesvědčený, že…", en: "I believe that…" },
  thoughtsShort: { cs: "Myslím si", en: "I think" },
  thoughtsShortLead: {
    cs: "Věci, na které jsem za ta léta přišel. Nic z toho není originální — ale všechno mě to něco stálo.",
    en: "Things I've worked out over the years. None of it is original — but all of it cost me something.",
  },
  prev: { cs: "Předchozí", en: "Previous" },
  next: { cs: "Další", en: "Next" },
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
