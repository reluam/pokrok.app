import type { NodeDef } from "./types";

/* ── Hudba — termíny propojené nudlemi ──────────────────────────────
   hudba → rytmus → basa → akordy → melodie
   Interaktivní studio žije v The Lab; tady jsou hesla. */

export const MUSIC_NODES: NodeDef[] = [
  {
    slug: "hudba", realm: "music",
    title: { cs: "Hudba", en: "Music" },
    guide: {
      cs: "Zvuk je jen chvění vzduchu. Hudba je zvuk, který někdo uspořádal — do času a do výšek. Tep, spodek, nálada a příběh, sladěné dohromady tak, že ti z toho rozhýbají nohu, aniž by ses na tom s nohou domlouval.",
      en: "Sound is just shaking air. Music is sound someone organised — in time and pitch. Pulse, bottom, mood and story, locked together so well your foot starts tapping without ever being consulted.",
    },
    up: "zvuk", next: "rytmus",
    plain: { glyph: "🎶" },
    satellites: [
      { to: "zvuk", x: 14, y: 30 },
      { to: "hudebni-nastroje", x: 86, y: 30 },
    ],
  },
  {
    slug: "rytmus", realm: "music",
    title: { cs: "Rytmus", en: "Rhythm" },
    guide: {
      cs: "Tep skladby. Pravidelné údery v čase, na které tělo přikyvuje samo od sebe — srdce to ostatně dělá celý život. Kopák drží dobu, snare odpovídá, hi-hat mezi tím cupitá.",
      en: "The pulse of a track. Regular beats in time that your body nods along to all by itself — your heart has been doing it your whole life. The kick keeps the time, the snare answers, the hi-hat patters in between.",
    },
    up: "hudba", next: "basa",
    plain: { glyph: "🥁" },
  },
  {
    slug: "basa", realm: "music",
    title: { cs: "Basa", en: "Bass" },
    guide: {
      cs: "Drží spodek. Hluboké tóny, které víc cítíš než slyšíš — pevná půda, po které ostatní nástroje chodí. Když basa vypadne, skladba se vznáší; když nastoupí, všechno najednou sedí.",
      en: "Holds the bottom. Low notes you feel more than hear — the solid ground the other instruments walk on. When the bass drops out, the track floats; when it lands, everything suddenly fits.",
    },
    up: "rytmus", next: "akordy",
    plain: { glyph: "🎸" },
  },
  {
    slug: "akordy", realm: "music",
    title: { cs: "Akordy", en: "Chords" },
    guide: {
      cs: "Víc tónů zahraných naráz. Akordy dělají náladu — dur se usmívá, moll se mračí, a septakord se tváří zajímavě, aby vypadal chytře. Jejich sled je harmonie: emoce skladby napsaná do not.",
      en: "Several notes played at once. Chords set the mood — major smiles, minor frowns, and the seventh chord acts mysterious to look smart. Their sequence is harmony: the song's emotions written into notes.",
    },
    up: "basa", next: "melodie",
    plain: { glyph: "🎹" },
    satellites: [{ to: "tonina", x: 86, y: 30 }],
  },
  {
    slug: "melodie", realm: "music",
    title: { cs: "Melodie", en: "Melody" },
    guide: {
      cs: "Jeden hlas, co si zpívá nahoru a dolů — příběh skladby. To, co si pak pískáš ve sprše a nemůžeš to dostat z hlavy. Rytmus je tep, basa půda, akordy nálada a melodie je důvod, proč si píseň pamatuješ.",
      en: "A single voice singing up and down — the story of a track. The thing you whistle in the shower and can't get out of your head. Rhythm is the pulse, bass the ground, chords the mood, and the melody is why you remember the song.",
    },
    up: "akordy",
    plain: { glyph: "🎼" },
    satellites: [{ to: "ton", x: 86, y: 30 }],
  },
];
