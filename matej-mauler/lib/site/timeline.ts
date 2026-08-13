import type { Bi } from "@/lib/about";

/**
 * Životopis na časové ose, od nejnovějšího. Beats for Love běží průběžně od 2015
 * (dva roky z toho na plný úvazek), takže mezery mezi ostatními položkami nejsou
 * prázdné roky — timeline díry nemá a nemusí je vysvětlovat.
 *
 * Neúspěchy zůstávají holé, bez přilepeného ponaučení. Přilepené ponaučení
 * z průšvihu dělá životní moudro — a tohle není portfolio.
 */
export type TimelineEntry = {
  id: string;
  org: string;
  period: string;
  role: Bi;
  body: Bi;
  bullets?: Bi[];
  /** Jen vizuální zvýraznění. `period` se vypisuje vždycky. */
  current?: boolean;
};

export const TIMELINE: TimelineEntry[] = [
  {
    id: "teya",
    org: "Teya",
    period: "May 2025 – now",
    role: { cs: "Obchod", en: "Sales" },
    body: {
      cs: "Platební terminály pro malé podniky. Celý den mluvím s lidma, co nějaký provozují.",
      en: "Card payment terminals for small businesses. I spend the day talking to people who run one.",
    },
    current: true,
  },
  {
    id: "net-direct",
    org: "NetDirect (FLO)",
    period: "Sep 2023 – Nov 2024",
    role: { cs: "Projektový manažer", en: "Project manager" },
    body: {
      cs: "E-shopy od zadání po předání.",
      en: "E-commerce builds, brief to handover.",
    },
  },
  {
    id: "kinder-fest",
    org: "Kinder Fest",
    period: "2020 – 2021",
    role: { cs: "Festivaly pro děti", en: "Festivals for kids" },
    body: {
      cs: "Pořádání festivalů pro děti. Skončilo to ošklivě.",
      en: "Producing festivals for children. It ended badly.",
    },
  },
  {
    id: "marketpubg",
    org: "MarketPUBG",
    period: "2019 – 2020",
    role: { cs: "Zakladatel", en: "Founder" },
    body: {
      cs: "Tržiště se skiny do her. Vlastní firma. Nevyšlo to.",
      en: "A marketplace for game skins. My own company. It didn't make it.",
    },
  },
  {
    id: "mlada-fronta",
    org: "Mladá fronta",
    period: "Feb 2018 – Aug 2019",
    role: { cs: "Herní weby", en: "Gaming websites" },
    body: {
      cs: "Herní weby ve vydavatelském domě.",
      en: "Gaming sites at a publishing house.",
    },
  },
  {
    id: "b4l",
    org: "Beats for Love",
    period: "2015 – now",
    role: {
      cs: "Festival insights & visitor research",
      en: "Festival insights & visitor research",
    },
    body: {
      cs: "Začínal jsem v roce 2015 na produkci jako brigádník a už jsem neodešel. Produkce, projektové řízení, dva roky na plný úvazek mezi 2021 a 2023, dneska visitor research. K tomu projektový asistent na Sweetsen Festu. Je to jediná věc, u které jsem zůstal.",
      en: "Started as summer crew on production in 2015 and never left. Production, project management, two years full-time between 2021 and 2023, and now the visitor research. Also project assistant on Sweetsen Fest. It's the one thing I've stayed with.",
    },
    current: true,
  },
];
