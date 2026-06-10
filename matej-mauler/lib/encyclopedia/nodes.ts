import type { Bilingual, NodeDef } from "./types";
import { SOUND_NODES } from "./sound-nodes";
import { MUSIC_NODES } from "./music-nodes";

/* ── Zásobník: témata, která zatím neexistují (červené odkazy) ──────
   Synapse na ně smí vést — dostanou placeholder a počítadlo přání. */
export const SEEDS: Record<string, Bilingual> = {
  svetlo: { cs: "Světlo", en: "Light" },
  gravitace: { cs: "Gravitace", en: "Gravity" },
  atmosfera: { cs: "Atmosféra", en: "Atmosphere" },
  zivot: { cs: "Život", en: "Life" },
  ocean: { cs: "Oceán", en: "The ocean" },
  "priliv-a-odliv": { cs: "Příliv a odliv", en: "Tides" },
  zatmeni: { cs: "Zatmění", en: "Eclipses" },
  "sklenikovy-efekt": { cs: "Skleníkový efekt", en: "Greenhouse effect" },
  voda: { cs: "Voda", en: "Water" },
  "cerna-dira": { cs: "Černá díra", en: "Black hole" },
  vzduch: { cs: "Vzduch", en: "Air" },
  zelezo: { cs: "Železo", en: "Iron" },
  vlneni: { cs: "Vlnění", en: "Waves" },
  ton: { cs: "Tón", en: "Tone" },
  decibel: { cs: "Decibel", en: "Decibel" },
  "hudebni-nastroje": { cs: "Hudební nástroje", en: "Musical instruments" },
  tonina: { cs: "Tónina", en: "Key" },
};

/* ── Hesla ──────────────────────────────────────────────────────────
   Kanonická trasa (scroll ↓): vesmír → Mléčná dráha → sluneční
   soustava → Slunce → Země → Měsíc. Všechno ostatní jsou odbočky. */
const N: NodeDef[] = [
  {
    slug: "brana", realm: "space",
    title: { cs: "Spaghetti.ltd", en: "Spaghetti.ltd" },
    guide: {
      cs: "Interaktivní encyklopedie, ve které se dá přeskakovat. Každé heslo je hřiště: scrolluj dolů a noř se z obecného do konkrétního, klikej na to, co pluje kolem, a odbočuj, kam tě to táhne. Každý týden přibude nové téma. Převážně neškodná.",
      en: "An interactive encyclopedia you can skip around in. Every entry is a playground: scroll down to dive from the general to the specific, click whatever floats by and take detours wherever they pull you. A new topic lands every week. Mostly harmless.",
    },
    next: "vesmir",
    satellites: [
      { to: "vesmir", object: "milkyway", x: 50, y: 79, size: 100 },
      { to: "zvuk", emoji: "🔊", x: 18, y: 28 },
      { to: "hudba", emoji: "🎶", x: 82, y: 28 },
      { to: "mesic", object: "moon", x: 13, y: 64, size: 30 },
      { to: "slunce", object: "sun", x: 87, y: 65, size: 36 },
      { to: "voyager-1", object: "voyager", x: 60, y: 13, size: 30 },
    ],
    links: [
      { href: "/mapa", label: { cs: "🗺 Mapa všeho", en: "🗺 Map of everything" } },
      { href: "/archiv", label: { cs: "🧪 Laboratoř", en: "🧪 The lab" } },
    ],
  },
  {
    slug: "vesmir", realm: "space", up: "brana",
    title: { cs: "Vesmír", en: "The Universe" },
    guide: {
      cs: "Všechno, co existuje, na jednom místě. Převážně prázdný, místy spektakulární, vcelku neškodný. Tohle je tvůj kosmický dvorek — scrolluj dolů a přibližuj se až domů, nebo klikni na cokoliv, co tě cestou zaujme.",
      en: "Everything that exists, all in one place. Mostly empty, occasionally spectacular, largely harmless. This is your cosmic backyard — scroll down to zoom all the way home, or click anything that catches your eye.",
    },
    next: "mlecna-draha",
    satellites: [
      { to: "mlecna-draha", object: "milkyway", x: 50, y: 79, size: 110 },
      { to: "andromeda", object: "andromeda", x: 82, y: 68, size: 72 },
      { to: "mlhovina-v-orionu", object: "orion", x: 79, y: 21, size: 78 },
      { to: "super-zeme", object: "exoplanet", x: 17, y: 26, size: 48 },
      { to: "plejady", object: "pleiades", x: 19, y: 71, size: 42 },
      { to: "kometa", object: "comet", x: 60, y: 12, size: 22 },
    ],
  },
  {
    slug: "mlecna-draha", realm: "space",
    title: { cs: "Mléčná dráha", en: "The Milky Way" },
    guide: {
      cs: "Naše galaxie — 100 až 400 miliard hvězd v točícím se spirálním disku širokém ~100 000 světelných let. Někde v Orionově rameni, 27 000 světelných let od centra, svítí jedna úplně obyčejná hvězda. Jdeme za ní.",
      en: "Our galaxy — 100 to 400 billion stars in a spinning spiral disk ~100,000 light-years wide. Somewhere in the Orion Arm, 27,000 light-years from the center, shines one perfectly ordinary star. Let's go find it.",
    },
    up: "vesmir", next: "slunecni-soustava",
    subject: { object: "milkyway" },
    satellites: [
      { to: "slunecni-soustava", object: "sun", x: 50, y: 80, size: 64, label: { cs: "Slunce", en: "The Sun" } },
      { to: "sagittarius-a", object: "sgrA", x: 21, y: 25, size: 60 },
      { to: "proxima-centauri", object: "proxima", x: 80, y: 66, size: 32 },
      { to: "voyager-1", object: "voyager", x: 14, y: 66, size: 30 },
      { to: "kometa", object: "comet", x: 81, y: 22, size: 22 },
    ],
  },
  {
    slug: "slunecni-soustava", realm: "space",
    title: { cs: "Sluneční soustava", en: "The Solar System" },
    guide: {
      cs: "Jedna hvězda, osm planet a spousta drobotiny. 99,86 % veškeré hmoty si nechalo Slunce — planety se dělí o zbytek. Ty bydlíš na třetí skále zleva. Klikni na kteroukoliv planetu, nebo scrolluj dál ke Slunci.",
      en: "One star, eight planets and a lot of debris. The Sun kept 99.86% of all the mass — the planets share the leftovers. You live on the third rock from the left. Click any planet, or scroll on to the Sun.",
    },
    up: "mlecna-draha", next: "slunce",
    subject: { object: "sun" },
    satellites: [
      { to: "merkur", object: "mercury", x: 33, y: 19, size: 16 },
      { to: "venuse", object: "venus", x: 67, y: 19, size: 24 },
      { to: "zeme", object: "earth", x: 85, y: 40, size: 26 },
      { to: "mars", object: "mars", x: 15, y: 40, size: 20 },
      { to: "jupiter", object: "jupiter", x: 80, y: 75, size: 46 },
      { to: "saturn", object: "saturn", x: 20, y: 77, size: 44 },
    ],
  },
  {
    slug: "slunce", realm: "space",
    title: { cs: "Slunce", en: "The Sun" },
    guide: {
      cs: "Naše hvězda. Světlo z ní k tobě letí 8 minut a 20 sekund — vidíš ji vždycky tak, jak vypadala v minulosti. Bez ní by nebylo světlo, teplo, fotosyntéza ani víkendy u vody.",
      en: "Our star. Its light takes 8 minutes and 20 seconds to reach you — you always see it as it looked in the past. Without it there'd be no light, no warmth, no photosynthesis, and no weekends by the lake.",
    },
    up: "slunecni-soustava", next: "zeme",
    subject: { object: "sun" },
    satellites: [
      { to: "svetlo", x: 79, y: 29 },
      { to: "gravitace", x: 21, y: 31 },
    ],
    features: [
      { cs: "korona", en: "corona" },
      { cs: "sluneční skvrny", en: "sunspots" },
      { cs: "sluneční vítr", en: "solar wind" },
    ],
  },
  {
    slug: "zeme", realm: "space",
    title: { cs: "Země", en: "Earth" },
    guide: {
      cs: "Jediné známé místo se životem. Právě teď na ní letíš vesmírem rychlostí ~107 000 km/h kolem Slunce — a celá soustava obíhá střed galaxie rychlostí 828 000 km/h. Drž se.",
      en: "The only known place with life. Right now you're riding it around the Sun at ~107,000 km/h — and the whole system orbits the galaxy's center at 828,000 km/h. Hold on tight.",
    },
    up: "slunecni-soustava", next: "mesic",
    subject: { object: "earth" },
    satellites: [
      { to: "mesic", object: "moon", x: 80, y: 30, size: 30 },
      { to: "atmosfera", x: 20, y: 28 },
      { to: "zivot", x: 22, y: 72 },
      { to: "ocean", x: 78, y: 74 },
    ],
  },
  {
    slug: "mesic", realm: "space",
    title: { cs: "Měsíc", en: "The Moon" },
    guide: {
      cs: "Vzdaluje se od nás ~3,8 cm ročně. Stabilizuje sklon zemské osy — bez něj by se podnebí divoce houpalo a život by to měl mnohem těžší. Konec kanonické trasy: dál už je jen tvoje zvědavost.",
      en: "Drifting away from us ~3.8 cm a year. It stabilizes Earth's tilt — without it the climate would swing wildly and life would have a much harder time. End of the canonical route: from here on it's just your curiosity.",
    },
    up: "zeme",
    subject: { object: "moon" },
    satellites: [
      { to: "priliv-a-odliv", x: 79, y: 30 },
      { to: "zatmeni", x: 21, y: 30 },
    ],
    features: [
      { cs: "krátery", en: "craters" },
      { cs: "bez atmosféry", en: "no atmosphere" },
    ],
  },
  {
    slug: "merkur", realm: "space",
    title: { cs: "Merkur", en: "Mercury" },
    guide: {
      cs: "Nejmenší a nejrychlejší planeta, nejblíž Slunci. Bez atmosféry: ve dne +430 °C, v noci −180 °C. Rok tu trvá jen 88 dní, takže narozeniny prakticky pořád.",
      en: "The smallest, fastest planet, closest to the Sun. No atmosphere: +430 °C by day, −180 °C at night. A year lasts just 88 days, so it's basically always your birthday.",
    },
    up: "slunecni-soustava",
    subject: { object: "mercury" },
    features: [
      { cs: "bez atmosféry", en: "no atmosphere" },
      { cs: "extrémní teploty", en: "extreme temperatures" },
    ],
  },
  {
    slug: "venuse", realm: "space",
    title: { cs: "Venuše", en: "Venus" },
    guide: {
      cs: "Nejžhavější planeta vůbec — 465 °C. Hustá atmosféra z CO₂ drží teplo jako poklička a prší tu kyselina sírová. Zemské „dvojče“, které se pokazilo.",
      en: "The hottest planet of all — 465 °C. A thick CO₂ atmosphere traps heat like a lid and it rains sulfuric acid. Earth's twin that went wrong.",
    },
    up: "slunecni-soustava",
    subject: { object: "venus" },
    satellites: [{ to: "sklenikovy-efekt", x: 78, y: 30 }],
    features: [{ cs: "kyselé mraky", en: "acid clouds" }],
  },
  {
    slug: "mars", realm: "space",
    title: { cs: "Mars", en: "Mars" },
    guide: {
      cs: "Rudá planeta — barvu dává rezavý prach. Kdysi tu tekly řeky. Je tu největší sopka i kaňon ve sluneční soustavě a prachové bouře přes celou planetu.",
      en: "The red planet — rust dust gives it the color. Rivers once flowed here. It has the largest volcano and canyon in the solar system, and planet-wide dust storms.",
    },
    up: "slunecni-soustava",
    subject: { object: "mars" },
    satellites: [{ to: "voda", x: 78, y: 30, label: { cs: "Dávné řeky", en: "Ancient rivers" } }],
    features: [
      { cs: "prachové bouře", en: "dust storms" },
      { cs: "největší sopka soustavy", en: "the system's largest volcano" },
    ],
  },
  {
    slug: "jupiter", realm: "space",
    title: { cs: "Jupiter", en: "Jupiter" },
    guide: {
      cs: "Největší planeta — vešlo by se do ní 1 300 Zemí. Plynový obr s bouří větší než celá Země (Velká rudá skvrna), která zuří už staletí.",
      en: "The largest planet — 1,300 Earths would fit inside. A gas giant with a storm bigger than the whole Earth (the Great Red Spot) that has raged for centuries.",
    },
    up: "slunecni-soustava",
    subject: { object: "jupiter" },
    features: [
      { cs: "Velká rudá skvrna", en: "Great Red Spot" },
      { cs: "95 měsíců", en: "95 moons" },
    ],
  },
  {
    slug: "saturn", realm: "space",
    title: { cs: "Saturn", en: "Saturn" },
    guide: {
      cs: "Klenot soustavy. Prstence jsou miliardy kousků ledu a kamení, široké 280 000 km, ale jen ~10 m tlusté. Saturn je tak lehký, že by plaval na vodě — kdybys našel dost velkou vanu.",
      en: "The jewel of the system. Its rings are billions of bits of ice and rock, 280,000 km wide but only ~10 m thick. Saturn is so light it would float on water — if you could find a big enough bathtub.",
    },
    up: "slunecni-soustava",
    subject: { object: "saturn" },
    features: [
      { cs: "ledové prstence", en: "icy rings" },
      { cs: "146 měsíců", en: "146 moons" },
    ],
  },
  {
    slug: "sagittarius-a", realm: "space",
    title: { cs: "Sagittarius A*", en: "Sagittarius A*" },
    guide: {
      cs: "Supermasivní černá díra ve středu Mléčné dráhy — 4 miliony hmotností Slunce stlačených do bodu. Všechno v galaxii kolem ní obíhá, včetně tebe. Neboj, je daleko.",
      en: "The supermassive black hole at the Milky Way's center — 4 million Suns crushed into a point. Everything in the galaxy orbits it, including you. Don't worry, it's far away.",
    },
    up: "mlecna-draha",
    subject: { object: "sgrA" },
    satellites: [{ to: "cerna-dira", x: 78, y: 30 }],
    features: [
      { cs: "akreční disk", en: "accretion disk" },
      { cs: "horizont událostí", en: "event horizon" },
    ],
  },
  {
    slug: "proxima-centauri", realm: "space",
    title: { cs: "Proxima Centauri", en: "Proxima Centauri" },
    guide: {
      cs: "Nejbližší hvězda po Slunci — jen 4,24 světelného roku. I nejrychlejší sonda by tam letěla přes 6 000 let. Vesmír je obrovský a prázdný a tohle je náš nejbližší soused.",
      en: "The closest star after the Sun — just 4.24 light-years. Even our fastest probe would take over 6,000 years to get there. Space is vast and empty, and this is our next-door neighbor.",
    },
    up: "mlecna-draha",
    subject: { object: "proxima" },
    satellites: [{ to: "super-zeme", object: "exoplanet", x: 78, y: 32, size: 38, label: { cs: "Planeta Proxima b", en: "Planet Proxima b" } }],
    features: [
      { cs: "červený trpaslík", en: "red dwarf" },
      { cs: "erupce", en: "flares" },
    ],
  },
  {
    slug: "voyager-1", realm: "space",
    title: { cs: "Voyager 1", en: "Voyager 1" },
    guide: {
      cs: "Nejvzdálenější lidský objekt — přes 24 miliard km. Veze zlatou desku se zvuky Země pro případ, že ji někdo najde. Stále vysílá, i po 47 letech. Pozdravuj.",
      en: "The most distant human object — over 24 billion km away. It carries a golden record of Earth's sounds in case someone finds it. Still transmitting after 47 years. Say hi.",
    },
    up: "mlecna-draha",
    subject: { object: "voyager" },
    satellites: [{ to: "zvuk", x: 78, y: 68, label: { cs: "Zlatá deska se zvuky Země", en: "Golden record of Earth's sounds" } }],
    features: [{ cs: "mezihvězdný prostor", en: "interstellar space" }],
  },
  {
    slug: "andromeda", realm: "space",
    title: { cs: "Galaxie v Andromedě", en: "Andromeda Galaxy" },
    guide: {
      cs: "Naše nejbližší velká galaxie, 2,5 milionu světelných let daleko. Řítí se k nám a za ~4,5 miliardy let se s Mléčnou dráhou srazí a splynou. Do kalendáře si to psát nemusíš.",
      en: "Our nearest large galaxy, 2.5 million light-years away. It's rushing toward us — in ~4.5 billion years it will collide and merge with the Milky Way. No need to mark your calendar.",
    },
    up: "vesmir",
    subject: { object: "andromeda" },
    features: [
      { cs: "~1 bilion hvězd", en: "~1 trillion stars" },
      { cs: "spirální ramena", en: "spiral arms" },
    ],
  },
  {
    slug: "mlhovina-v-orionu", realm: "space",
    title: { cs: "Mlhovina v Orionu", en: "Orion Nebula" },
    guide: {
      cs: "Hvězdná porodnice 1 344 světelných let daleko. Z plynu a prachu tu právě teď vznikají nové hvězdy a soustavy — přesně tak, jak před 4,6 miliardami let vzniklo Slunce.",
      en: "A stellar nursery 1,344 light-years away. New stars and systems are being born from gas and dust right now — just as the Sun formed 4.6 billion years ago.",
    },
    up: "vesmir",
    subject: { object: "orion" },
    features: [
      { cs: "protohvězdy", en: "protostars" },
      { cs: "Trapezium", en: "Trapezium" },
    ],
  },
  {
    slug: "super-zeme", realm: "space",
    title: { cs: "Super-Země", en: "Super-Earth" },
    guide: {
      cs: "Skalnatá exoplaneta několikanásobně větší než Země, obíhající v obyvatelné zóně své hvězdy. Mohla by mít tekutou vodu — a možná i život. Známe jich už tisíce a počítadlo běží.",
      en: "A rocky exoplanet several times bigger than Earth, orbiting in its star's habitable zone. It could have liquid water — and maybe life. We've already found thousands, and counting.",
    },
    up: "vesmir",
    subject: { object: "exoplanet" },
    satellites: [{ to: "zivot", x: 78, y: 30 }],
    features: [{ cs: "obyvatelná zóna", en: "habitable zone" }],
  },
  {
    slug: "plejady", realm: "space",
    title: { cs: "Plejády", en: "The Pleiades" },
    guide: {
      cs: "Stovky horkých modrých hvězd narozených ze stejného mračna, 444 světelných let daleko. Mladé, jen ~100 milionů let — když vznikaly, na Zemi vládli dinosauři.",
      en: "Hundreds of hot blue stars born from the same cloud, 444 light-years away. Young — only ~100 million years old; when they formed, dinosaurs ruled the Earth.",
    },
    up: "vesmir",
    subject: { object: "pleiades" },
    features: [
      { cs: "mladé horké hvězdy", en: "young hot stars" },
      { cs: "viditelné pouhým okem", en: "visible to the naked eye" },
    ],
  },
  {
    slug: "kometa", realm: "space",
    title: { cs: "Kometa", en: "Comet" },
    guide: {
      cs: "Špinavá sněhová koule z okraje soustavy. Když se přiblíží ke Slunci, led se vypařuje a táhne za sebou ohon dlouhý miliony kilometrů. Pak zase zmizí do tmy — na desítky až tisíce let.",
      en: "A dirty snowball from the edge of the system. Near the Sun its ice vaporizes, dragging a tail millions of kilometers long. Then it vanishes back into the dark — for decades to millennia.",
    },
    up: "vesmir",
    subject: { object: "comet" },
    features: [
      { cs: "iontový ohon", en: "ion tail" },
      { cs: "ledové jádro", en: "icy nucleus" },
    ],
  },
];

export const NODES: Record<string, NodeDef> = Object.fromEntries([...N, ...SOUND_NODES, ...MUSIC_NODES].map((n) => [n.slug, n]));
