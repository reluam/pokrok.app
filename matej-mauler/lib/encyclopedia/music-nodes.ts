import type { NodeDef } from "./types";

/* ── Music — kanonická trasa hudbou ─────────────────────────────────
   hudba → rytmus → basa → akordy → melodie → mix → studio
   Vrstvy se po trase sčítají (rank): co sis naklikal, hraje dál.
   hudba.up = zvuk — hudba je zvuk, který někdo uspořádal. */

const L = { theme: "light", textPos: "top" } as const;

export const MUSIC_NODES: NodeDef[] = [
  {
    slug: "hudba", realm: "music", ...L,
    title: { cs: "Hudba", en: "Music" },
    guide: {
      cs: "Zvuk je jen chvění vzduchu. Hudba je zvuk, který někdo uspořádal — do času a do výšek. Pojďme jednu skladbu poskládat po vrstvách: tep, spodek, nálada, příběh.",
      en: "Sound is just shaking air. Music is sound someone organized — in time and pitch. Let's build a track layer by layer: pulse, bottom, mood, story.",
    },
    up: "zvuk", next: "rytmus",
    music: { rank: 0, view: "intro" },
    satellites: [
      { to: "zvuk", x: 14, y: 30 },
      { to: "hudebni-nastroje", x: 86, y: 30 },
    ],
  },
  {
    slug: "rytmus", realm: "music", ...L,
    title: { cs: "Rytmus", en: "Rhythm" },
    guide: {
      cs: "Rytmus je tep skladby. Nejdřív styl a tempo — vyber vibe, nalaď swing. A pak klikej do mřížky: ze čtyř bicích vrstev si poskládej vlastní beat.",
      en: "Rhythm is the pulse of a track. First the style and tempo — pick a vibe, set the swing. Then click the grid: build your own beat from four drum lanes.",
    },
    up: "hudba", next: "basa",
    music: { rank: 1, editor: "drums" },
  },
  {
    slug: "basa", realm: "music", ...L,
    title: { cs: "Basa", en: "Bass" },
    guide: {
      cs: "Basa dává skladbě pevnou půdu. Klikej do piano rollu — určuješ, kdy hraje i jak je vysoká. Tóny jsou z tóniny, takže to vždy ladí.",
      en: "Bass gives the track solid ground. Click the piano roll — you set when it plays and how high. Notes come from the key, so it always fits.",
    },
    up: "rytmus", next: "akordy",
    music: { rank: 2, editor: "bass" },
  },
  {
    slug: "akordy", realm: "music", ...L,
    title: { cs: "Akordy", en: "Chords" },
    guide: {
      cs: "Víc tónů naráz je akord — a akordy dělají náladu. Skládej je v piano rollu z diatonických možností. Tóninu a dur/moll měň vpravo nahoře kdykoliv — vše se přeladí.",
      en: "Several notes at once make a chord — and chords set the mood. Place them in the roll from diatonic options. Change key and major/minor in the top right anytime — it all re-tunes.",
    },
    up: "basa", next: "melodie",
    music: { rank: 3, editor: "chords" },
    satellites: [{ to: "tonina", x: 86, y: 30 }],
  },
  {
    slug: "melodie", realm: "music", ...L,
    title: { cs: "Melodie", en: "Melody" },
    guide: {
      cs: "Melodie je jeden hlas, co si zpívá nahoru a dolů — příběh skladby. Naklikej si vlastní v piano rollu. Drží se tóniny, takže to ladí.",
      en: "Melody is a single voice singing up and down — the story of the track. Click your own in the roll. It stays in the key, so it fits.",
    },
    up: "akordy", next: "mix",
    music: { rank: 4, editor: "melody" },
    satellites: [{ to: "ton", x: 86, y: 30 }],
  },
  {
    slug: "mix", realm: "music", ...L,
    title: { cs: "Mix", en: "The mix" },
    guide: {
      cs: "Skladba je vrstvy hrající spolu. Jako v DAW jim dole nastav hlasitost faderem a vypínej je tlačítkem mute — uslyšíš, co která vrstva dělá.",
      en: "A track is layers playing together. Like in a DAW, set each one's volume with the fader below and silence it with mute — you'll hear what each layer does.",
    },
    up: "melodie", next: "studio",
    music: { rank: 5, editor: "drums", view: "mix" },
  },
  {
    slug: "studio", realm: "music", ...L,
    title: { cs: "Studio", en: "The studio" },
    guide: {
      cs: "Teď jsi u kniplů. Všechny čtyři mřížky najednou, dole fader, mute a efekt u každé vrstvy. Hudba je chytře poskládaný zvuk — a ty teď víš jak na to.",
      en: "Now you're at the controls. All four grids at once, with a fader, mute and effect per layer below. Music is cleverly arranged sound — and now you know how.",
    },
    up: "mix",
    music: { rank: 6, view: "studio" },
  },
];
