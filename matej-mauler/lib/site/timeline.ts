import type { Bi } from "@/lib/about";

/**
 * Životopis na časové ose. Texty jsou PRVNÍ NÁSTŘEL podle toho, co Matěj řekl —
 * roky a role si nevymýšlím, `period` je všude TODO a čeká na doplnění.
 * Pořadí = odshora dolů na stránce, `current` je dnešek.
 */
export type TimelineEntry = {
  id: string;
  org: string;
  /** TODO: doplnit roky. */
  period: string;
  role: Bi;
  body: Bi;
  current?: boolean;
};

export const TIMELINE: TimelineEntry[] = [
  {
    id: "b4l",
    org: "B4L",
    period: "TODO",
    role: { cs: "TODO: role", en: "TODO: role" },
    body: {
      cs: "První velká škola. Tady jsem zjistil, že obchod není o mluvení, ale o tom umět se zeptat a pak držet hubu.",
      en: "The first real school. This is where I learned that sales isn't about talking — it's about asking the right question and then shutting up.",
    },
  },
  {
    id: "mlada-fronta",
    org: "Mladá fronta",
    period: "TODO",
    role: { cs: "Herní weby", en: "Gaming websites" },
    body: {
      cs: "Dělal jsem herní weby ve velkém vydavatelství. Poprvé jsem viděl, jak vzniká obsah, který má číst hodně lidí — a jak snadno se z redakce stane továrna.",
      en: "I worked on gaming websites at a big publishing house. My first look at how content gets made for a large audience — and how easily a newsroom turns into a factory.",
    },
  },
  {
    id: "marketpubg",
    org: "MarketPUBG",
    period: "TODO",
    role: { cs: "Vlastní projekt", en: "My own project" },
    body: {
      cs: "Vlastní projekt, který nedopadl. Naučil mě víc než většina věcí, co vyšly: že nápad bez lidí, kteří ho chtějí, je jen drahý koníček.",
      en: "My own project, and it flopped. It taught me more than most things that worked: an idea without people who want it is just an expensive hobby.",
    },
  },
  {
    id: "kinder-fest",
    org: "Kinder Fest",
    period: "TODO",
    role: { cs: "Festivaly", en: "Festivals" },
    body: {
      cs: "Festivaly pro děti. Nakonec ošklivá zkušenost — odešel jsem s tím, že dohoda platí jen tak dlouho, jak dlouho ji chce druhá strana dodržet. Drahá lekce o tom, komu věřit.",
      en: "Festivals for kids. It ended badly — I left knowing that an agreement holds only as long as the other side wants it to. An expensive lesson in who to trust.",
    },
  },
  {
    id: "net-direct",
    org: "Net Direct",
    period: "TODO",
    role: { cs: "Projektový manažer pro e-shopy", en: "Project manager for e-shops" },
    body: {
      cs: "Vedení projektů e-shopů. Tady jsem se naučil dívat se na zakázku jako na systém — kde se to zadrhne, není obvykle tam, kde to bolí.",
      en: "Running e-shop projects. This is where I learned to look at a job as a system — the place it jams is rarely the place that hurts.",
    },
  },
  {
    id: "teya",
    org: "Teya",
    period: "TODO",
    role: { cs: "Obchodník pro fintech", en: "Sales for fintech" },
    body: {
      cs: "Obchod ve fintechu. Denně mluvím s lidmi, kteří něco provozují — a poslouchám, kde je tlačí bota. Většina mých nápadů začíná tam.",
      en: "Sales in fintech. Every day I talk to people running something — and listen for where it pinches. Most of my ideas start right there.",
    },
    current: true,
  },
];
