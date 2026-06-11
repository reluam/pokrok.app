import type { NodeDef } from "./types";

/* ── Zvuk — termíny propojené nudlemi ───────────────────────────────
   zvuk → zvuková vlna → šíření → médium → ticho ve vesmíru
   → frekvence → amplituda → barva zvuku → ozvěna
   Interaktivní experience žije v The Lab; tady jsou hesla. */

export const SOUND_NODES: NodeDef[] = [
  {
    slug: "zvuk", realm: "sound",
    title: { cs: "Zvuk", en: "Sound" },
    guide: {
      cs: "Zvuk je chvění. Zdroj se rozkmitá a postrká vzduch; to šťouchnutí běží od částice k částici, až doletí k tvému uchu. Všechno, co jsi kdy slyšel — hrom, šepot i znělku večerníčku — je jen šikovně rozhýbaný vzduch.",
      en: "Sound is shaking. A source vibrates and nudges the air; the nudge runs from particle to particle until it reaches your ear. Everything you've ever heard — thunder, a whisper, your favourite jingle — is just cleverly wobbled air.",
    },
    up: "brana", next: "zvukova-vlna",
    plain: { glyph: "🔊" },
  },
  {
    slug: "zvukova-vlna", realm: "sound",
    title: { cs: "Zvuková vlna", en: "Sound wave" },
    guide: {
      cs: "Na vodě se hladina vlní nahoru a dolů — to je příčná vlna. Zvuk je jiný: částice se kývou tam a zpět podél směru letu a vlna běží dál. Podélná vlna ze samých zhuštění a zředění — částice zůstávají na místě, cestuje jen šťouchnutí.",
      en: "On water the surface ripples up and down — a transverse wave. Sound is different: particles swing back and forth along the direction of travel while the wave moves on. A longitudinal wave of squeezes and stretches — the particles stay put, only the nudge travels.",
    },
    up: "zvuk", next: "sireni-zvuku",
    plain: { glyph: "〰️" },
    satellites: [
      { to: "vlneni", x: 14, y: 28 },
      { to: "voda", x: 86, y: 28, label: { cs: "Vlny na vodě", en: "Water waves" } },
    ],
  },
  {
    slug: "sireni-zvuku", realm: "sound",
    title: { cs: "Šíření zvuku", en: "How sound spreads" },
    guide: {
      cs: "Ze zdroje se zvuk šíří na všechny strany zároveň — kulové vlny, co pořád dokola hustí a řídnou vzduch kolem. Proto tě kamarád slyší, i když na něj nemíříš pusou.",
      en: "From its source, sound spreads in every direction at once — spheres of squeeze and stretch, over and over. That's why your friend hears you even when your mouth isn't aimed at them.",
    },
    up: "zvukova-vlna", next: "medium",
    plain: { glyph: "📢" },
  },
  {
    slug: "medium", realm: "sound",
    title: { cs: "Médium", en: "Medium" },
    guide: {
      cs: "Aby se vlna nesla, musí mít co strkat — vzduch, vodu, zeď. V hutnějším prostředí letí zvuk rychleji: vzduchem ~340 m/s, vodou ~1480 m/s, železem ~5100 m/s. Indiáni nepřikládali ucho ke kolejím pro nic za nic.",
      en: "To travel, a wave needs something to push — air, water, a wall. In a denser medium sound flies faster: ~340 m/s in air, ~1,480 m/s in water, ~5,100 m/s in iron. There's a reason people in westerns put their ear to the rail.",
    },
    up: "sireni-zvuku", next: "ticho-vesmiru",
    plain: { glyph: "🌫️" },
    satellites: [
      { to: "vzduch", x: 14, y: 28 },
      { to: "voda", x: 86, y: 28 },
      { to: "zelezo", x: 14, y: 72 },
    ],
  },
  {
    slug: "ticho-vesmiru", realm: "sound",
    title: { cs: "Ticho ve vesmíru", en: "Silence in space" },
    guide: {
      cs: "Ve vesmíru nejsou skoro žádné částice. Není co strkat — a tak je tam dokonalé ticho. Křič si jak chceš; exploze ve sci-fi filmech jsou prostě lež, kterou režisérům odpouštíme.",
      en: "Space has almost no particles. Nothing to push — so it's perfectly silent. Scream all you like; the explosions in sci-fi movies are simply a lie we've agreed to forgive.",
    },
    up: "medium", next: "frekvence",
    plain: { glyph: "🤫" },
    satellites: [{ to: "vesmir", x: 86, y: 30 }],
  },
  {
    slug: "frekvence", realm: "sound",
    title: { cs: "Frekvence", en: "Frequency" },
    guide: {
      cs: "Jak hustě jdou zhuštění za sebou, taková je výška tónu. Pomalé chvění = basa, rychlé = pískot. Měří se v hertzích — kolikrát za sekundu se vzduch stihne zhustit. Ty slyšíš zhruba 20 až 20 000 Hz; tvůj pes se ti směje výš.",
      en: "How tightly the squeezes follow each other sets the pitch. Slow shaking = bass, fast = a squeal. Measured in hertz — how many times a second the air gets squeezed. You hear roughly 20 to 20,000 Hz; your dog laughs at you higher up.",
    },
    up: "ticho-vesmiru", next: "amplituda",
    plain: { glyph: "Hz" },
    satellites: [{ to: "ton", x: 86, y: 28 }],
  },
  {
    slug: "amplituda", realm: "sound",
    title: { cs: "Amplituda", en: "Amplitude" },
    guide: {
      cs: "Jak daleko částice vyrazí ze svého místa, tak je to hlasité. Malé výkyvy = šepot, velké = koncert, na kterém ti soused odpadne. Frekvence říká, jak rychle se vzduch kýve; amplituda, jak moc.",
      en: "How far the particles dart from their spot is how loud it is. Tiny swings = a whisper, big ones = the concert your neighbour complains about. Frequency says how fast the air wobbles; amplitude says how much.",
    },
    up: "frekvence", next: "barva-zvuku",
    plain: { glyph: "📣" },
    satellites: [{ to: "decibel", x: 86, y: 28 }],
  },
  {
    slug: "barva-zvuku", realm: "sound",
    title: { cs: "Barva zvuku", en: "Timbre" },
    guide: {
      cs: "Stejný tón na housle a na klavír zní úplně jinak — a přesto má stejnou výšku i hlasitost. Rozdíl dělá směs vyšších harmonických tónů, které se vezou na tom základním. Říká se tomu barva. Proto poznáš mámu po hlase.",
      en: "The same note on a violin and a piano sounds completely different — yet it has the same pitch and loudness. The difference is the blend of higher harmonics riding on the fundamental. It's called timbre. It's why you recognise your mum's voice.",
    },
    up: "amplituda", next: "ozvena",
    plain: { glyph: "🎻" },
    satellites: [{ to: "hudebni-nastroje", x: 14, y: 28 }],
  },
  {
    slug: "ozvena", realm: "sound",
    title: { cs: "Ozvěna", en: "Echo" },
    guide: {
      cs: "Zvuk se od tvrdé stěny odráží jako míček. Když je stěna dost daleko, vrátí se ti vlastní hlas se zpožděním — znova a slaběji, jak doznívá. HALÓ… haló… ló… A tím máš zvuk celý: chvění, vlna, výška, hlasitost, barva, odraz.",
      en: "Sound bounces off a hard wall like a ball. If the wall is far enough, your own voice comes back delayed — again and fainter as it fades. HELLO… hello… lo… And that's all of sound: a tremble, a wave, pitch, loudness, colour, reflection.",
    },
    up: "barva-zvuku",
    plain: { glyph: "🔁" },
    satellites: [{ to: "hudba", x: 86, y: 28 }],
  },
];
