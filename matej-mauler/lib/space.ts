import type { Lang } from "./dictionaries";

export type SpaceKind =
  | "star" | "planet" | "moon" | "blackhole" | "nebula"
  | "dwarf" | "galaxy" | "comet" | "probe";

export type SpaceObject = {
  id: string;
  kind: SpaceKind;
  x: number; y: number; size: number; // přehled: pozice v % a průměr v px
  color: string; // barva záře
  name: { cs: string; en: string };
  fact: { cs: string; en: string };
  features: { cs: string; en: string }[]; // co se ukáže po přiblížení
};

export const objects: SpaceObject[] = [
  {
    id: "sun", kind: "star", x: 50, y: 52, size: 86, color: "rgba(255,170,60,0.7)",
    name: { cs: "Slunce", en: "The Sun" },
    fact: {
      cs: "Naše hvězda. Tvoří 99,86 % hmotnosti celé sluneční soustavy. Světlo z ní k nám letí 8 minut a 20 sekund — vidíš ji vždycky tak, jak vypadala v minulosti.",
      en: "Our star. It holds 99.86% of the entire solar system's mass. Its light takes 8 minutes 20 seconds to reach us — you always see it as it looked in the past.",
    },
    features: [
      { cs: "Korona", en: "Corona" },
      { cs: "Sluneční skvrny", en: "Sunspots" },
      { cs: "Sluneční vítr", en: "Solar wind" },
    ],
  },
  {
    id: "earth", kind: "planet", x: 64, y: 62, size: 46, color: "rgba(80,150,220,0.6)",
    name: { cs: "Země", en: "Earth" },
    fact: {
      cs: "Jediné známé místo se životem. Letíš na ní vesmírem rychlostí ~107 000 km/h kolem Slunce — a celá soustava obíhá střed galaxie rychlostí 828 000 km/h.",
      en: "The only known place with life. You're riding it around the Sun at ~107,000 km/h — and the whole system orbits the galaxy's center at 828,000 km/h.",
    },
    features: [
      { cs: "Atmosféra", en: "Atmosphere" },
      { cs: "Měsíc", en: "The Moon" },
      { cs: "71 % oceán", en: "71% ocean" },
    ],
  },
  {
    id: "moon", kind: "moon", x: 73, y: 55, size: 30, color: "rgba(200,200,210,0.5)",
    name: { cs: "Měsíc", en: "The Moon" },
    fact: {
      cs: "Vzdaluje se od nás ~3,8 cm ročně. Stabilizuje sklon zemské osy — bez něj by se podnebí divoce houpalo a život by to měl mnohem těžší.",
      en: "Drifting away ~3.8 cm per year. It stabilizes Earth's tilt — without it the climate would swing wildly and life would have a much harder time.",
    },
    features: [
      { cs: "Krátery", en: "Craters" },
      { cs: "Přivrácená strana", en: "Near side" },
      { cs: "Bez atmosféry", en: "No atmosphere" },
    ],
  },
  {
    id: "sgrA", kind: "blackhole", x: 28, y: 30, size: 70, color: "rgba(255,160,70,0.6)",
    name: { cs: "Sagittarius A*", en: "Sagittarius A*" },
    fact: {
      cs: "Supermasivní černá díra ve středu Mléčné dráhy — 4 miliony hmotností Slunce stlačených do bodu. Všechno v galaxii kolem ní obíhá, včetně tebe.",
      en: "The supermassive black hole at the Milky Way's center — 4 million Suns crushed into a point. Everything in the galaxy orbits it, including you.",
    },
    features: [
      { cs: "Akreční disk", en: "Accretion disk" },
      { cs: "Horizont událostí", en: "Event horizon" },
      { cs: "Výtrysky", en: "Jets" },
    ],
  },
  {
    id: "orion", kind: "nebula", x: 80, y: 28, size: 92, color: "rgba(232,121,185,0.5)",
    name: { cs: "Mlhovina v Orionu", en: "Orion Nebula" },
    fact: {
      cs: "Hvězdná porodnice 1 344 světelných let daleko. Z plynu a prachu tu právě vznikají nové hvězdy a soustavy — přesně tak, jak před 4,6 miliardami let vzniklo Slunce.",
      en: "A stellar nursery 1,344 light-years away. New stars and systems are being born from gas and dust right now — just as the Sun formed 4.6 billion years ago.",
    },
    features: [
      { cs: "Protohvězdy", en: "Protostars" },
      { cs: "Plyn a prach", en: "Gas & dust" },
      { cs: "Trapezium", en: "Trapezium" },
    ],
  },
  {
    id: "proxima", kind: "dwarf", x: 16, y: 64, size: 34, color: "rgba(224,86,63,0.6)",
    name: { cs: "Proxima Centauri", en: "Proxima Centauri" },
    fact: {
      cs: "Nejbližší hvězda po Slunci — jen 4,24 světelného roku. I nejrychlejší sonda by tam letěla přes 6 000 let. Vesmír je obrovský a prázdný.",
      en: "The closest star after the Sun — just 4.24 light-years. Even our fastest probe would take over 6,000 years. Space is vast and empty.",
    },
    features: [
      { cs: "Červený trpaslík", en: "Red dwarf" },
      { cs: "Planeta Proxima b", en: "Planet Proxima b" },
      { cs: "Erupce", en: "Flares" },
    ],
  },
  {
    id: "andromeda", kind: "galaxy", x: 85, y: 72, size: 96, color: "rgba(185,160,255,0.55)",
    name: { cs: "Galaxie v Andromedě", en: "Andromeda Galaxy" },
    fact: {
      cs: "Naše nejbližší velká galaxie, 2,5 milionu světelných let daleko. Řítí se k nám a za ~4,5 miliardy let se s Mléčnou dráhou srazí a splynou.",
      en: "Our nearest large galaxy, 2.5 million light-years away. It's rushing toward us — in ~4.5 billion years it will collide and merge with the Milky Way.",
    },
    features: [
      { cs: "Spirální ramena", en: "Spiral arms" },
      { cs: "~1 bilion hvězd", en: "~1 trillion stars" },
      { cs: "Jasné jádro", en: "Bright core" },
    ],
  },
  {
    id: "comet", kind: "comet", x: 40, y: 78, size: 26, color: "rgba(159,233,255,0.6)",
    name: { cs: "Kometa", en: "Comet" },
    fact: {
      cs: "Špinavá sněhová koule z okraje soustavy. Když se přiblíží ke Slunci, led se vypařuje a táhne za sebou ohon dlouhý miliony kilometrů.",
      en: "A dirty snowball from the edge of the system. Near the Sun its ice vaporizes, dragging a tail millions of kilometers long.",
    },
    features: [
      { cs: "Iontový ohon", en: "Ion tail" },
      { cs: "Prachový ohon", en: "Dust tail" },
      { cs: "Ledové jádro", en: "Icy nucleus" },
    ],
  },
  {
    id: "voyager", kind: "probe", x: 12, y: 20, size: 30, color: "rgba(207,214,230,0.5)",
    name: { cs: "Voyager 1", en: "Voyager 1" },
    fact: {
      cs: "Nejvzdálenější lidský objekt — přes 24 miliard km. Veze zlatou desku se zvuky Země pro případ, že ji někdo najde. Stále vysílá, i po 47 letech.",
      en: "The most distant human object — over 24 billion km. It carries a golden record of Earth's sounds in case someone finds it. Still transmitting after 47 years.",
    },
    features: [
      { cs: "Zlatá deska", en: "Golden record" },
      { cs: "Anténa", en: "Antenna" },
      { cs: "Mezihvězdný prostor", en: "Interstellar space" },
    ],
  },
];

export const spaceUi = {
  cs: {
    back: "← Spaghetti.ltd", eyebrow: "Mapa naší galaxie", title: "Space",
    intro: "Mléčná dráha a okolí. Klikni na objekt a přibliž si ho.",
    tapHint: "Klikni na objekt", close: "Zpět na přehled", scrollHint: "Scrolluj dolů zpět na přehled",
  },
  en: {
    back: "← Spaghetti.ltd", eyebrow: "Map of our galaxy", title: "Space",
    intro: "The Milky Way and its neighbours. Click an object to zoom in.",
    tapHint: "Click an object", close: "Back to overview", scrollHint: "Scroll down for the overview",
  },
} as const;

export type SLang = Lang;
