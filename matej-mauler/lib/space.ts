import type { Lang } from "./dictionaries";

export type SpaceObject = {
  id: string; emoji: string; x: number; y: number; size: number;
  name: { cs: string; en: string };
  fact: { cs: string; en: string };
};

export const objects: SpaceObject[] = [
  {
    id: "sun", emoji: "☀️", x: 50, y: 52, size: 56,
    name: { cs: "Slunce", en: "The Sun" },
    fact: {
      cs: "Naše hvězda. Tvoří 99,86 % hmotnosti celé sluneční soustavy. Světlo z ní k nám letí 8 minut a 20 sekund — vidíš ji vždycky tak, jak vypadala v minulosti.",
      en: "Our star. It holds 99.86% of the entire solar system's mass. Its light takes 8 minutes 20 seconds to reach us — you always see it as it looked in the past.",
    },
  },
  {
    id: "earth", emoji: "🌍", x: 62, y: 60, size: 30,
    name: { cs: "Země", en: "Earth" },
    fact: {
      cs: "Jediné známé místo se životem. Letíš na ní vesmírem rychlostí ~107 000 km/h kolem Slunce — a celá soustava obíhá střed galaxie rychlostí 828 000 km/h.",
      en: "The only known place with life. You're riding it around the Sun at ~107,000 km/h — and the whole system orbits the galaxy's center at 828,000 km/h.",
    },
  },
  {
    id: "moon", emoji: "🌙", x: 70, y: 54, size: 22,
    name: { cs: "Měsíc", en: "The Moon" },
    fact: {
      cs: "Vzdaluje se od nás ~3,8 cm ročně. Stabilizuje sklon zemské osy — bez něj by se podnebí divoce houpalo a život by to měl mnohem těžší.",
      en: "Drifting away ~3.8 cm per year. It stabilizes Earth's tilt — without it the climate would swing wildly and life would have a much harder time.",
    },
  },
  {
    id: "sgrA", emoji: "🕳️", x: 30, y: 30, size: 50,
    name: { cs: "Sagittarius A*", en: "Sagittarius A*" },
    fact: {
      cs: "Supermasivní černá díra ve středu Mléčné dráhy — 4 miliony hmotností Slunce stlačených do bodu. Všechno v galaxii kolem ní obíhá, včetně tebe.",
      en: "The supermassive black hole at the Milky Way's center — 4 million Suns crushed into a point. Everything in the galaxy orbits it, including you.",
    },
  },
  {
    id: "orion", emoji: "✨", x: 78, y: 30, size: 40,
    name: { cs: "Mlhovina v Orionu", en: "Orion Nebula" },
    fact: {
      cs: "Hvězdná porodnice 1 344 světelných let daleko. Z plynu a prachu tu právě vznikají nové hvězdy a soustavy — přesně tak, jak před 4,6 miliardami let vzniklo Slunce.",
      en: "A stellar nursery 1,344 light-years away. New stars and systems are being born from gas and dust right now — just as the Sun formed 4.6 billion years ago.",
    },
  },
  {
    id: "proxima", emoji: "🔴", x: 18, y: 64, size: 26,
    name: { cs: "Proxima Centauri", en: "Proxima Centauri" },
    fact: {
      cs: "Nejbližší hvězda po Slunci — jen 4,24 světelného roku. I nejrychlejší sonda by tam letěla přes 6 000 let. Vesmír je obrovský a prázdný.",
      en: "The closest star after the Sun — \"only\" 4.24 light-years. Even our fastest probe would take over 6,000 years. Space is vast and empty.",
    },
  },
  {
    id: "andromeda", emoji: "🌌", x: 84, y: 70, size: 46,
    name: { cs: "Galaxie v Andromedě", en: "Andromeda Galaxy" },
    fact: {
      cs: "Naše nejbližší velká galaxie, 2,5 milionu světelných let daleko. Řítí se k nám a za ~4,5 miliardy let se s Mléčnou dráhou srazí a splynou.",
      en: "Our nearest large galaxy, 2.5 million light-years away. It's rushing toward us — in ~4.5 billion years it will collide and merge with the Milky Way.",
    },
  },
  {
    id: "comet", emoji: "☄️", x: 40, y: 76, size: 28,
    name: { cs: "Kometa", en: "Comet" },
    fact: {
      cs: "Špinavá sněhová koule z okraje soustavy. Když se přiblíží ke Slunci, led se vypařuje a táhne za sebou ohon dlouhý miliony kilometrů.",
      en: "A dirty snowball from the edge of the system. Near the Sun its ice vaporizes, dragging a tail millions of kilometers long.",
    },
  },
  {
    id: "voyager", emoji: "🛰️", x: 12, y: 22, size: 22,
    name: { cs: "Voyager 1", en: "Voyager 1" },
    fact: {
      cs: "Nejvzdálenější lidský objekt — přes 24 miliard km. Veze zlatou desku se zvuky Země pro případ, že ji někdo najde. Stále vysílá, i po 47 letech.",
      en: "The most distant human object — over 24 billion km. It carries a golden record of Earth's sounds in case someone finds it. Still transmitting after 47 years.",
    },
  },
];

export const spaceUi = {
  cs: {
    back: "← Spaghetti.ltd", eyebrow: "Mapa naší galaxie", title: "Space",
    intro: "Mléčná dráha a okolí. Klikni na objekt a zjisti, kde to vlastně jsme.",
    tapHint: "Klikni na světélka ✦", close: "Zavřít",
  },
  en: {
    back: "← Spaghetti.ltd", eyebrow: "Map of our galaxy", title: "Space",
    intro: "The Milky Way and its neighbours. Click an object to learn where we actually are.",
    tapHint: "Click the lights ✦", close: "Close",
  },
} as const;

export type SLang = Lang;
