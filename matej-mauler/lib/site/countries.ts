import type { Bi } from "@/lib/about";

/**
 * Firmy jako země uvnitř kontinentu Práce. Nahradilo časovou osu.
 *
 * Pozice ani roky se nikde nevypisují — z životopisu zůstala jen náplň práce.
 * Délku působení nese plocha země: Beats for Love (2015 → dnes) je zdaleka
 * největší pevnina, Kinder Fest a MarketPUBG malé ostrovy. Čas je tak vidět,
 * aniž by se psal. `months` je jediné, k čemu roky ještě slouží.
 *
 * Neúspěchy zůstávají holé, bez přilepeného ponaučení. Přilepené ponaučení
 * z průšvihu dělá životní moudro — a tohle není portfolio.
 */

export type Country = {
  id: string;
  org: string;
  /** Co jsem tam dělal. Náplň, ne pozice. */
  body: Bi;
  bullets?: Bi[];
  /** Měsíce působení. Do textu se nepíšou, řídí jen velikost země. */
  months: number;
  /** Střed země v [lon, lat]. Musí ležet uvnitř obrysu kontinentu Práce. */
  seat: [number, number];
  /** Který jednotkový obrys použít — ať nejsou všechny země stejné. */
  blob: number;
};

/** Jednotkové obrysy zemí, poloměr ≈ 1. Ručně psané, ať mají siluetu. */
const BLOBS: [number, number][][] = [
  [[-1, 0.2], [-0.7, 0.85], [0, 1], [0.75, 0.8], [1, 0.1], [0.7, -0.7], [0, -1], [-0.75, -0.65]],
  [[-1, -0.1], [-0.8, 0.6], [-0.2, 1], [0.6, 0.9], [1, 0.3], [0.85, -0.5], [0.2, -1], [-0.6, -0.8]],
  [[-0.9, 0.4], [-0.4, 1], [0.4, 0.95], [1, 0.45], [0.9, -0.3], [0.35, -0.95], [-0.45, -0.9], [-1, -0.25]],
];

/** Největší země má poloměr 13°, ostatní se škálují dolů. */
const MAX_RADIUS = 13;

export const COUNTRIES: Country[] = [
  {
    id: "b4l",
    org: "Beats for Love",
    months: 130,
    seat: [88, -6],
    blob: 0,
    body: {
      cs: "Začínal jsem na produkci jako brigádník a už jsem neodešel. Produkce, projektové řízení, pak visitor research. K tomu projektový asistent na Sweetsen Festu. Je to jediná věc, u které jsem zůstal.",
      en: "Started as summer crew on production and never left. Production, project management, then the visitor research. Also project assistant on Sweetsen Fest. It's the one thing I've stayed with.",
    },
  },
  {
    id: "teya",
    org: "Teya",
    months: 16,
    seat: [106, 4],
    blob: 1,
    body: {
      cs: "Platební terminály pro malé podniky. Celý den mluvím s lidma, co nějaký provozují.",
      en: "Card payment terminals for small businesses. I spend the day talking to people who run one.",
    },
  },
  {
    id: "net-direct",
    org: "NetDirect (FLO)",
    months: 15,
    seat: [68, 2],
    blob: 2,
    body: {
      cs: "E-shopy od zadání po předání. Sbírání požadavků, hlídání rozpočtu, komunikace mezi klientem a vývojem.",
      en: "E-commerce builds, brief to handover. Gathering requirements, watching the budget, sitting between the client and the developers.",
    },
  },
  {
    id: "mlada-fronta",
    org: "Mladá fronta",
    months: 19,
    seat: [76, -24],
    blob: 1,
    body: {
      cs: "Herní weby ve vydavatelském domě. Obsah, redakce, provoz.",
      en: "Gaming sites at a publishing house. Content, editorial, running the thing day to day.",
    },
  },
  {
    id: "marketpubg",
    org: "MarketPUBG",
    months: 18,
    seat: [104, -18],
    blob: 2,
    body: {
      cs: "Tržiště se skiny do her. Vlastní firma. Nevyšlo to.",
      en: "A marketplace for game skins. My own company. It didn't make it.",
    },
  },
  {
    id: "kinder-fest",
    org: "Kinder Fest",
    months: 18,
    seat: [90, 15],
    blob: 0,
    body: {
      cs: "Pořádání festivalů pro děti. Skončilo to ošklivě.",
      en: "Producing festivals for children. It ended badly.",
    },
  },
];

/**
 * Lineární měřítko z délky působení. sqrt, protože plocha roste s druhou
 * mocninou — plocha pak roste lineárně s měsíci. Podlaha 0,45 drží nejmenší
 * zemi nad pětinou plochy té největší, aby unesla popisek a dala se kliknout.
 */
export function countryScale(months: number): number {
  const all = COUNTRIES.map((c) => Math.sqrt(c.months));
  const min = Math.min(...all);
  const max = Math.max(...all);
  if (max === min) return 1;
  return 0.45 + 0.55 * ((Math.sqrt(months) - min) / (max - min));
}

export function countryShape(c: Country): [number, number][] {
  const r = MAX_RADIUS * countryScale(c.months);
  return BLOBS[c.blob % BLOBS.length].map(
    ([x, y]) => [c.seat[0] + x * r, c.seat[1] + y * r] as [number, number],
  );
}

/** Plocha polygonu (shoelace). Jen pro testy a řazení, ne pro kreslení. */
export function polygonArea(points: [number, number][]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

/** Ray casting. Hlídá, že země nepřeteče přes okraj kontinentu. */
export function pointInPolygon(p: [number, number], poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const hits = yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi;
    if (hits) inside = !inside;
  }
  return inside;
}
