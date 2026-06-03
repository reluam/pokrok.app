import type { Lang } from "./dictionaries";

export type SpaceKind =
  | "star" | "planet" | "superearth" | "rocky" | "gasgiant" | "ringed"
  | "moon" | "blackhole" | "nebula" | "dwarf" | "galaxy" | "comet" | "probe" | "cluster";

export type Bilingual = { cs: string; en: string };

export type SpaceObjectDef = {
  kind: SpaceKind;
  tint?: string; // pro rocky/planet varianty
  name: Bilingual;
  fact: Bilingual;
  features: Bilingual[]; // co se ukáže po přiblížení
};

export const OBJECTS: Record<string, SpaceObjectDef> = {
  milkyway: {
    kind: "galaxy",
    name: { cs: "Mléčná dráha", en: "The Milky Way" },
    fact: {
      cs: "Naše galaxie — 100 až 400 miliard hvězd v točícím se spirálním disku širokém ~100 000 světelných let. Slunce je jen jedna z nich, v Orionově rameni, 27 000 světelných let od centra.",
      en: "Our galaxy — 100 to 400 billion stars in a spinning spiral disk ~100,000 light-years wide. The Sun is just one of them, in the Orion Arm, 27,000 light-years from the center.",
    },
    features: [
      { cs: "Spirální ramena", en: "Spiral arms" },
      { cs: "Galaktické jádro", en: "Galactic core" },
      { cs: "Stovky miliard hvězd", en: "Hundreds of billions of stars" },
    ],
  },
  sun: {
    kind: "star",
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
  mercury: {
    kind: "rocky", tint: "#9a9088",
    name: { cs: "Merkur", en: "Mercury" },
    fact: {
      cs: "Nejmenší a nejrychlejší planeta, nejblíž Slunci. Bez atmosféry: ve dne +430 °C, v noci −180 °C. Rok tu trvá jen 88 dní.",
      en: "The smallest, fastest planet, closest to the Sun. No atmosphere: +430 °C by day, −180 °C at night. A year lasts just 88 days.",
    },
    features: [
      { cs: "Bez atmosféry", en: "No atmosphere" },
      { cs: "Extrémní teploty", en: "Extreme temperatures" },
    ],
  },
  venus: {
    kind: "rocky", tint: "#d9b06a",
    name: { cs: "Venuše", en: "Venus" },
    fact: {
      cs: "Nejžhavější planeta vůbec — 465 °C. Hustá atmosféra z CO₂ drží teplo jako poklička a prší tu kyselina sírová. Zemské „dvojče“, které se pokazilo.",
      en: "The hottest planet of all — 465 °C. A thick CO₂ atmosphere traps heat like a lid and it rains sulfuric acid. Earth's twin that went wrong.",
    },
    features: [
      { cs: "Skleníkový efekt", en: "Runaway greenhouse" },
      { cs: "Kyselé mraky", en: "Acid clouds" },
    ],
  },
  earth: {
    kind: "planet",
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
  mars: {
    kind: "rocky", tint: "#c1502e",
    name: { cs: "Mars", en: "Mars" },
    fact: {
      cs: "Rudá planeta — barvu dává rezavý prach. Kdysi tu tekly řeky. Je tu největší sopka i kaňon ve sluneční soustavě a prachové bouře přes celou planetu.",
      en: "The red planet — rust dust gives it the color. Rivers once flowed here. It has the largest volcano and canyon in the solar system, and planet-wide dust storms.",
    },
    features: [
      { cs: "Dávné řeky", en: "Ancient rivers" },
      { cs: "Prachové bouře", en: "Dust storms" },
    ],
  },
  jupiter: {
    kind: "gasgiant",
    name: { cs: "Jupiter", en: "Jupiter" },
    fact: {
      cs: "Největší planeta — vešlo by se do ní 1 300 Zemí. Plynový obr s bouří větší než celá Země (Velká rudá skvrna), která zuří už staletí.",
      en: "The largest planet — 1,300 Earths would fit inside. A gas giant with a storm bigger than the whole Earth (the Great Red Spot) that has raged for centuries.",
    },
    features: [
      { cs: "Velká rudá skvrna", en: "Great Red Spot" },
      { cs: "95 měsíců", en: "95 moons" },
    ],
  },
  saturn: {
    kind: "ringed",
    name: { cs: "Saturn", en: "Saturn" },
    fact: {
      cs: "Klenot soustavy. Prstence jsou miliardy kousků ledu a kamení, široké 280 000 km, ale jen ~10 m tlusté. Saturn je tak lehký, že by plaval na vodě.",
      en: "The jewel of the system. Its rings are billions of bits of ice and rock, 280,000 km wide but only ~10 m thick. Saturn is so light it would float on water.",
    },
    features: [
      { cs: "Ledové prstence", en: "Icy rings" },
      { cs: "146 měsíců", en: "146 moons" },
    ],
  },
  moon: {
    kind: "moon",
    name: { cs: "Měsíc", en: "The Moon" },
    fact: {
      cs: "Vzdaluje se od nás ~3,8 cm ročně. Stabilizuje sklon zemské osy — bez něj by se podnebí divoce houpalo a život by to měl mnohem těžší.",
      en: "Drifting away ~3.8 cm per year. It stabilizes Earth's tilt — without it the climate would swing wildly and life would have a much harder time.",
    },
    features: [
      { cs: "Krátery", en: "Craters" },
      { cs: "Bez atmosféry", en: "No atmosphere" },
    ],
  },
  sgrA: {
    kind: "blackhole",
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
  proxima: {
    kind: "dwarf",
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
  comet: {
    kind: "comet",
    name: { cs: "Kometa", en: "Comet" },
    fact: {
      cs: "Špinavá sněhová koule z okraje soustavy. Když se přiblíží ke Slunci, led se vypařuje a táhne za sebou ohon dlouhý miliony kilometrů.",
      en: "A dirty snowball from the edge of the system. Near the Sun its ice vaporizes, dragging a tail millions of kilometers long.",
    },
    features: [
      { cs: "Iontový ohon", en: "Ion tail" },
      { cs: "Ledové jádro", en: "Icy nucleus" },
    ],
  },
  voyager: {
    kind: "probe",
    name: { cs: "Voyager 1", en: "Voyager 1" },
    fact: {
      cs: "Nejvzdálenější lidský objekt — přes 24 miliard km. Veze zlatou desku se zvuky Země pro případ, že ji někdo najde. Stále vysílá, i po 47 letech.",
      en: "The most distant human object — over 24 billion km. It carries a golden record of Earth's sounds in case someone finds it. Still transmitting after 47 years.",
    },
    features: [
      { cs: "Zlatá deska", en: "Golden record" },
      { cs: "Mezihvězdný prostor", en: "Interstellar space" },
    ],
  },
  orion: {
    kind: "nebula",
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
  andromeda: {
    kind: "galaxy",
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
  exoplanet: {
    kind: "superearth",
    name: { cs: "Super-Země", en: "Super-Earth" },
    fact: {
      cs: "Skalnatá exoplaneta několikanásobně větší než Země, obíhající v obyvatelné zóně své hvězdy. Mohla by mít tekutou vodu — a možná i život. Známe jich už tisíce.",
      en: "A rocky exoplanet several times bigger than Earth, orbiting in its star's habitable zone. It could have liquid water — and maybe life. We've already found thousands.",
    },
    features: [
      { cs: "Obyvatelná zóna", en: "Habitable zone" },
      { cs: "Možná tekutá voda", en: "Possible liquid water" },
      { cs: "Několikrát větší než Země", en: "Several times Earth's size" },
    ],
  },
  pleiades: {
    kind: "cluster",
    name: { cs: "Hvězdokupa Plejády", en: "Pleiades Cluster" },
    fact: {
      cs: "Stovky horkých modrých hvězd narozených ze stejného mračna, 444 světelných let daleko. Mladé, jen ~100 milionů let — když vznikly, na Zemi vládli dinosauři.",
      en: "Hundreds of hot blue stars born from the same cloud, 444 light-years away. Young — only ~100 million years old; when they formed, dinosaurs ruled Earth.",
    },
    features: [
      { cs: "Mladé horké hvězdy", en: "Young hot stars" },
      { cs: "Viditelná okem", en: "Visible to the eye" },
    ],
  },
};

export type SceneId = "cosmos" | "galaxy" | "solar";

export type Placed = {
  id: string;            // klíč do OBJECTS
  x: number; y: number;  // pozice v %
  size: number;          // průměr v px
  zoomTo?: SceneId;      // klik = zoom do scény, jinak detail
};

export type Scene = {
  info: { name: Bilingual; intro: Bilingual };
  bodies: Placed[];
};

export const SCENES: Record<SceneId, Scene> = {
  cosmos: {
    info: {
      name: { cs: "Vesmír", en: "The Universe" },
      intro: { cs: "Náš kosmický dvorek. Klikni na Mléčnou dráhu a přibližuj se až domů.", en: "Our cosmic backyard. Click the Milky Way and zoom all the way home." },
    },
    bodies: [
      { id: "milkyway", x: 50, y: 50, size: 110, zoomTo: "galaxy" },
      { id: "andromeda", x: 80, y: 74, size: 78 },
      { id: "orion", x: 78, y: 24, size: 82 },
      { id: "exoplanet", x: 19, y: 31, size: 50 },
      { id: "pleiades", x: 24, y: 73, size: 42 },
      { id: "comet", x: 50, y: 88, size: 22 },
    ],
  },
  galaxy: {
    info: {
      name: { cs: "Mléčná dráha", en: "The Milky Way" },
      intro: { cs: "Naše galaxie zevnitř. Klikni na Slunce a podívej se do naší soustavy.", en: "Our galaxy from the inside. Click the Sun to see our solar system." },
    },
    bodies: [
      { id: "sun", x: 50, y: 52, size: 72, zoomTo: "solar" },
      { id: "sgrA", x: 28, y: 30, size: 66 },
      { id: "proxima", x: 74, y: 64, size: 34 },
      { id: "voyager", x: 16, y: 22, size: 30 },
      { id: "comet", x: 46, y: 82, size: 24 },
    ],
  },
  solar: {
    info: {
      name: { cs: "Sluneční soustava", en: "The Solar System" },
      intro: { cs: "Slunce a osm planet. Klikni na kteroukoli a zjisti, co je zač.", en: "The Sun and its planets. Click any of them to learn what it is." },
    },
    bodies: [
      { id: "sun", x: 50, y: 50, size: 84 },
      { id: "mercury", x: 64, y: 40, size: 16 },
      { id: "venus", x: 72, y: 60, size: 24 },
      { id: "earth", x: 36, y: 62, size: 26 },
      { id: "mars", x: 28, y: 38, size: 20 },
      { id: "jupiter", x: 80, y: 26, size: 48 },
      { id: "saturn", x: 18, y: 76, size: 44 },
    ],
  },
};

export const SCENE_PARENT: Record<SceneId, SceneId | null> = {
  cosmos: null, galaxy: "cosmos", solar: "galaxy",
};

export const spaceUi = {
  cs: {
    back: "← Spaghetti.ltd", eyebrow: "Mapa vesmíru", title: "Space",
    tapHint: "Klikni na objekt", close: "Zpět na přehled",
    scrollHint: "Scrolluj dolů zpět", up: "Zpět na",
  },
  en: {
    back: "← Spaghetti.ltd", eyebrow: "Map of the universe", title: "Space",
    tapHint: "Click an object", close: "Back to overview",
    scrollHint: "Scroll down to go back", up: "Back to",
  },
} as const;

export type SLang = Lang;
