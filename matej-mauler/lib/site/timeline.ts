import type { Bi } from "@/lib/about";

/**
 * Životopis na časové ose — CV tón: role a firma napřed, pak stručně co to bylo.
 * Texty jsou PRVNÍ NÁSTŘEL podle toho, co Matěj řekl. Roky ani náplň práce si
 * nevymýšlím: `period` je všude TODO a `bullets` (konkrétní odpovědnosti /
 * výsledky do odrážek) čekají na doplnění — prázdné pole se prostě nevykreslí.
 */
export type TimelineEntry = {
  id: string;
  org: string;
  /** TODO: doplnit roky. */
  period: string;
  role: Bi;
  body: Bi;
  bullets?: Bi[];
  current?: boolean;
};

export const TIMELINE: TimelineEntry[] = [
  {
    id: "teya",
    org: "Teya",
    period: "TODO",
    role: { cs: "Obchodník, fintech", en: "Sales, fintech" },
    body: {
      cs: "Obchod ve fintechu. Denně mluvím s lidmi, kteří něco provozují, a poslouchám, kde je tlačí bota.",
      en: "Sales in fintech. Every day I talk to people running a business and listen for where it pinches.",
    },
    current: true,
  },
  {
    id: "net-direct",
    org: "Net Direct",
    period: "TODO",
    role: { cs: "Projektový manažer, e-shopy", en: "Project manager, e-commerce" },
    body: {
      cs: "Vedení projektů e-shopů — od zadání po předání. Naučil jsem se dívat na zakázku jako na systém.",
      en: "Running e-commerce projects end to end. This is where I learned to read a project as a system.",
    },
  },
  {
    id: "kinder-fest",
    org: "Kinder Fest",
    period: "TODO",
    role: { cs: "Festivaly pro děti", en: "Festivals for kids" },
    body: {
      cs: "Pořádání festivalů pro děti. Skončilo to ošklivě — a s poznatkem, že dohoda platí jen tak dlouho, jak dlouho ji chce druhá strana dodržet.",
      en: "Producing festivals for kids. It ended badly — and taught me that an agreement holds only as long as the other side wants it to.",
    },
  },
  {
    id: "marketpubg",
    org: "MarketPUBG",
    period: "TODO",
    role: { cs: "Zakladatel, vlastní projekt", en: "Founder, my own project" },
    body: {
      cs: "Vlastní projekt, který nedopadl. Naučil mě víc než většina věcí, co vyšly: nápad bez lidí, kteří ho chtějí, je drahý koníček.",
      en: "My own project, and it flopped. It taught me more than most things that worked: an idea without people who want it is an expensive hobby.",
    },
  },
  {
    id: "mlada-fronta",
    org: "Mladá fronta",
    period: "TODO",
    role: { cs: "Herní weby", en: "Gaming websites" },
    body: {
      cs: "Herní weby ve vydavatelském domě. Poprvé jsem viděl zblízka, jak vzniká obsah pro velké publikum.",
      en: "Gaming websites at a publishing house. My first close look at how content gets made for a large audience.",
    },
  },
  {
    id: "b4l",
    org: "B4L",
    period: "TODO",
    role: { cs: "TODO: role", en: "TODO: role" },
    body: {
      cs: "První velká škola. Tady jsem zjistil, že obchod není o mluvení, ale o tom umět se zeptat a pak držet hubu.",
      en: "The first real school. Where I learned that sales isn't about talking — it's about asking the right question and then shutting up.",
    },
  },
];
