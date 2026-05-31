export type Option = {
  id: string;
  label: string;
  emoji: string;
  note?: string;
};

export type Question = {
  id: string;
  text: string;
  subtext?: string;
  type: "select";
  options: Option[];
};

export const questions: Question[] = [
  {
    id: "origin",
    text: "Odkud vlastně pocházíš?",
    type: "select",
    options: [
      { id: "druhohoryCzech", label: "Z druhohor",                    emoji: "🦕", note: "Gratuluji k přežití." },
      { id: "rim",            label: "Ze starého Říma",               emoji: "🏛️" },
      { id: "stredovek",      label: "Ze Středověku",                 emoji: "🧙" },
      { id: "budoucnost",     label: "Z budoucnosti (rok 2387)",      emoji: "🚀", note: "Tak jak to vypadá?" },
      { id: "atlantis",       label: "Z Atlantidy",                   emoji: "🌊" },
      { id: "bublina",        label: "Jsem bublina. Ještě neexistuji.", emoji: "🫧" },
    ],
  },
  {
    id: "fuel",
    text: "Co tě pohání?",
    type: "select",
    options: [
      { id: "kofein",    label: "Kofein a věčná naděje",          emoji: "☕" },
      { id: "chaos",     label: "Čistá chaos energie",             emoji: "🌀" },
      { id: "hruza",     label: "Existenciální hrůza",             emoji: "💀", note: "Efektivní palivo." },
      { id: "pizza",     label: "Výhradně pizza",                  emoji: "🍕" },
      { id: "kachny",    label: "Vztek z kachen",                  emoji: "🦆" },
      { id: "solarni",   label: "Sluneční energie (jsem panel)",   emoji: "⚡" },
    ],
  },
  {
    id: "hobby",
    text: "Jak trávíš volný čas?",
    type: "select",
    options: [
      { id: "smysl",       label: "Hledám smysl v YouTube komentářích",  emoji: "🕳️" },
      { id: "kachny2",     label: "Krmím kachny a řeším existenci",      emoji: "🦆" },
      { id: "teleport",    label: "Teleportuji se (jen v místnosti)",    emoji: "✨" },
      { id: "kryo",        label: "Hibernuji v kryokapsli",              emoji: "🧊", note: "Efektivní strategie." },
      { id: "powerpoint",  label: "Tvořím PowerPoint o PowerPointu",    emoji: "📊" },
      { id: "scroll",      label: "Scrolluji do nicoty",                 emoji: "📱" },
    ],
  },
  {
    id: "goal",
    text: "Tvůj životní cíl?",
    type: "select",
    options: [
      { id: "zalozky",     label: "Přečíst všechny záložky v prohlížeči",      emoji: "🌈" },
      { id: "oprava",      label: "Konečně opravit tu jednu věc doma",         emoji: "🔧" },
      { id: "inbox",       label: "Inbox na nulu", emoji: "📭", note: "Bylo to možné jednou. Rok 2014." },
      { id: "motylek",     label: "Stát se motýlem",                           emoji: "🦋" },
      { id: "singularita", label: "Přežít AI singularitu",                     emoji: "🤖" },
      { id: "nesmrtelnost",label: "Nesmrtelnost (nebo aspoň dobrý spánek)",   emoji: "💤" },
    ],
  },
  {
    id: "fear",
    text: "Čeho se (tajně) nejvíce bojíš?",
    type: "select",
    options: [
      { id: "kachny3",  label: "Kachen. Jsou divné.",                       emoji: "🦆" },
      { id: "pondeli",  label: "Pohledu do zrcadla v pondělí ráno",         emoji: "🪞" },
      { id: "ticho",    label: "Ticha v hovoru delšího než 3 vteřiny",      emoji: "😶" },
      { id: "vecnost",  label: "Věčnosti",                                  emoji: "♾️" },
      { id: "perlivka", label: "Perlivé vody bez bublin",                   emoji: "🫧" },
      { id: "pravda",   label: "Že přijdu pozdě a budu mít přesto pravdu",  emoji: "⏱️" },
    ],
  },
];

/* ── Duration types & data ──────────────────────────────────────── */

export type Duration = {
  display: string;
  seconds?: number;
  headline: string;
};

const DURATIONS: Duration[] = [
  { seconds: 17,  display: "17 vteřin",          headline: "Stihneš jeden zhluboka nadechnout." },
  { seconds: 43,  display: "43 vteřin",          headline: "Dost na jednu dobrou myšlenku." },
  { seconds: 73,  display: "73 vteřin",          headline: "Víc než dost. Využij to moudře." },
  { seconds: 119, display: "1 minutu 59 vteřin", headline: "Téměř dvě minuty. To je luxus." },
  { display: "42 minut",         headline: "Klasická délka dobrého seriálového dílu. Nebo jedné schůzky." },
  { display: "847 let",          headline: "Za tu dobu padlo pár říší. Ty pořád jedeš." },
  { display: "2 546 let",        headline: "Plato byl mrtvý 2 300 let. Stále ho čteme." },
  { display: "10 000 let",       headline: "Za 10 000 let bude to, co teď čteš, mrtvý jazyk." },
  { display: "3,2 miliardy let", headline: "Zhruba stejně jako trvala evoluce od bakterie k tobě." },
  { display: "věčnost (±15 %)",  headline: "Přesnost výpočtu závisí na definici věčnosti." },
];

const FUNNY_NOTES: Record<string, string> = {
  druhohoryCzech: "Technicky jsi přežil/a pět velkých vymírání. Imponující.",
  rim:            "Římanům trvalo 1 000 let, než uznali, že přehánějí s akvedukty.",
  stredovek:      "Průměrná délka středověkého života: 35 let. Ty to zvládneš líp.",
  budoucnost:     "Pokud víš, co se stane, proč jsi tu? Investuj.",
  atlantis:       "Atlantida zmizela před 11 600 lety. Ty vypadáš skvěle.",
  bublina:        "Bubliny existují průměrně 1–2 vteřiny. Filosoficky vzato — jsme všichni bubliny.",
  kofein:         "Kofein blokuje adenosin. Efektivita: 94 %. Závislost: 100 %.",
  chaos:          "Entropie vesmíru roste. Jsi v souladu s přírodou.",
  hruza:          "Existenciální hrůza zvyšuje bdělost o 23 %. Ověřeno.",
  pizza:          "Pizza jako palivo prodlužuje chuť k životu, ne délku života.",
  kachny:         "Kachny žijí průměrně 20 let. Stále je respektuj.",
  solarni:        "V noci tedy máš výpadky. Chápu.",
  smysl:          "YouTube komentáře jsou nejrychlejší způsob, jak ztratit víru v lidstvo.",
  kachny2:        "Kachny vědí víc, než dávají najevo. Moudrá metoda výzkumu.",
  teleport:       "Teleportace v rámci místnosti šetří energii o 0,003 %. Vedlejší efekty: žádné.",
  kryo:           "Kryogenické zmrazení prodlužuje technicky neomezeně. Gratulujeme.",
  powerpoint:     "PowerPoint byl vytvořen v roce 1987 a stále přežívá. Inspirativní.",
  scroll:         "Průměrný člověk přescrolluje 300 metrů obsahu denně. Ty pravděpodobně víc.",
  zalozky:        "Průměrný člověk má 47 záložek, které 'určitě jednou přečte'. Šťastnou cestu.",
  oprava:         "Ta věc čeká. Pořád čeká. A čekáním si buduje charakter.",
  inbox:          "Inbox zero bylo dosaženo jednou. V roce 2014. Nikdo neví kdo to byl.",
  motylek:        "Biologicky vzato: obtížné. Metaforicky: krásné.",
  singularita:    "Pokud AI přebere vládu, budeš přinejmenším zajímavý exponát.",
  nesmrtelnost:   "Dobrý spánek prodlužuje život o 7 let. Nesmrtelnost o víc.",
  kachny3:        "Kachny jsou opravdu divné. Máš pravdu. Nikdo to neřeší dost.",
  pondeli:        "Pondělní zrcadlo je statisticky nejhorší zrcadlo celého týdne.",
  ticho:          "3 vteřiny ticha v hovoru = 3 hodiny přemýšlení, co říct.",
  vecnost:        "Správná volba. Věčnost je opravdu děsivá.",
  perlivka:       "Bez bublin je to jen voda. Bez bublin jsme jen hmota.",
  pravda:         "Přijít pozdě a mít pravdu — nejhorší sociální kombinace.",
};

/* ── Calculation ──────────────────────────────────────────────────── */

export type CalcResult = {
  duration: Duration;
  funnyNotes: string[];
};

export type Answers = Record<string, string>;

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h >>> 0);
}

export function calculateResult(answers: Answers): CalcResult {
  const combined = Object.values(answers).sort().join("|");
  const idx = hashString(combined) % DURATIONS.length;
  const duration = DURATIONS[idx];

  const funnyNotes = Object.values(answers)
    .map((id) => FUNNY_NOTES[id])
    .filter(Boolean) as string[];

  return { duration, funnyNotes };
}
