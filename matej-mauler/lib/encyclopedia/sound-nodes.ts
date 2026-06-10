import type { NodeDef } from "./types";

/* ── Sound Basics — kanonická trasa zvukem ──────────────────────────
   zvuk → vlna → šíření → médium → prostředí → ticho → kreslení
   → frekvence → amplituda → barva → ozvěna
   Všechna hesla rendruje SoundRealm (společný canvas + audio),
   text je nahoře, střed patří vlně (hřišti pro ucho). */

const L = { textPos: "top" } as const;

export const SOUND_NODES: NodeDef[] = [
  {
    slug: "zvuk", realm: "sound", ...L,
    title: { cs: "Zvuk", en: "Sound" },
    guide: {
      cs: "Zvuk je chvění. Vlevo je zdroj — rozkmitá se a postrká vzduch. To šťouchnutí běží zleva doprava. Tvůj kurzor je ucho: polož ho na vlnu a uslyšíš ji. Scrolluj dolů a projdi zvuk od chvění až po ozvěnu.",
      en: "Sound is shaking. On the left is the source — it vibrates and nudges the air. That nudge runs left to right. Your cursor is an ear: park it on the wave and you'll hear it. Scroll down to follow sound from a tremble to an echo.",
    },
    up: "brana", next: "zvukova-vlna",
    sound: { freqMul: 0.6, gainMul: 0.9, filter: 18000, rows: 1, medium: "air" },
  },
  {
    slug: "zvukova-vlna", realm: "sound", ...L,
    title: { cs: "Zvuková vlna", en: "Sound wave" },
    guide: {
      cs: "Na vodě se hladina vlní nahoru a dolů — to je příčná vlna. Zvuk je jiný: částice se kývou tam a zpět, podél směru letu. Sleduj zelené — jen se houpou na místě, vlna běží dál.",
      en: "On water the surface ripples up and down — that's a transverse wave. Sound is different: particles swing back and forth, along the direction of travel. Watch the green ones — they bob in place, the wave moves on.",
    },
    up: "zvuk", next: "sireni-zvuku",
    sound: { freqMul: 0.8, gainMul: 0.9, filter: 18000, rows: 5, medium: "air", tracer: true },
    satellites: [
      { to: "vlneni", x: 14, y: 28 },
      { to: "voda", x: 86, y: 28, label: { cs: "Vlny na vodě", en: "Water waves" } },
    ],
  },
  {
    slug: "sireni-zvuku", realm: "sound", ...L,
    title: { cs: "Šíření zvuku", en: "How sound spreads" },
    guide: {
      cs: "Ze zdroje se zvuk šíří na všechny strany zároveň — kulové vlny, co pořád dokola hustí a řídnou vzduch kolem.",
      en: "From the source, sound spreads in every direction at once — spheres of squeeze and spread, over and over.",
    },
    up: "zvukova-vlna", next: "medium",
    sound: { freqMul: 0.9, gainMul: 0.9, filter: 18000, rows: 7, medium: "air", mode: "disk" },
  },
  {
    slug: "medium", realm: "sound", ...L,
    title: { cs: "Médium", en: "Medium" },
    guide: {
      cs: "Aby se vlna nesla, musí mít co strkat — vzduch, vodu, zeď. V dokonale prázdném prostoru není co rozhýbat.",
      en: "To travel, the wave needs something to push — air, water, a wall. In truly empty space there's nothing to move.",
    },
    up: "sireni-zvuku", next: "prostredi",
    sound: { freqMul: 0.9, gainMul: 0.9, filter: 18000, rows: 3, medium: "air" },
    satellites: [
      { to: "vzduch", x: 14, y: 28 },
      { to: "voda", x: 86, y: 28 },
      { to: "zelezo", x: 14, y: 85 },
    ],
  },
  {
    slug: "prostredi", realm: "sound", ...L,
    title: { cs: "Různá prostředí", en: "Different media" },
    guide: {
      cs: "Vzduch, voda, železo vedle sebe. Výška zůstává stejná — to dělá zdroj. Ale v hutnějším prostředí letí zvuk rychleji a vlna se roztáhne: komprese jsou od sebe dál. Popisky pásem jsou dveře — klikni a prozkoumej je.",
      en: "Air, water, iron side by side. The pitch stays the same — that's set by the source. But in a denser medium sound travels faster and the wave stretches: the squeezes spread further apart. The band labels are doors — click one to explore.",
    },
    up: "medium", next: "ticho-vesmiru",
    sound: { freqMul: 1, gainMul: 0.95, filter: 18000, rows: 5, medium: "air", interactive: "medium" },
  },
  {
    slug: "ticho-vesmiru", realm: "sound", textPos: "top",
    title: { cs: "Ticho ve vesmíru", en: "Silence in space" },
    guide: {
      cs: "Ve vesmíru nejsou skoro žádné částice. Není co strkat — a tak je dokonalé ticho. Ucho sem dej, kam chceš, neuslyšíš nic.",
      en: "Space has almost no particles. Nothing to push — so it's perfect silence. Put your ear anywhere here, you'll hear nothing.",
    },
    up: "prostredi", next: "jak-se-zvuk-kresli",
    sound: { freqMul: 1, gainMul: 0, filter: 8000, rows: 3, medium: "space" },
    satellites: [{ to: "vesmir", x: 86, y: 30 }],
  },
  {
    slug: "jak-se-zvuk-kresli", realm: "sound", ...L,
    title: { cs: "Jak se zvuk kreslí", en: "How sound is drawn" },
    guide: {
      cs: "Zvuk se nejčastěji kreslí jako vlnka nahoru a dolů (nahoře). Ale doopravdy se vzduch jen hustí a řídne podél směru (dole). Obě křivky říkají totéž — jen ta dolní je pravdivá.",
      en: "Sound is most often drawn as a wiggle up and down (top). But really the air just squeezes and spreads along the direction (bottom). Both say the same thing — the lower one is the true picture.",
    },
    up: "ticho-vesmiru", next: "frekvence",
    sound: { freqMul: 0.8, gainMul: 0.9, filter: 18000, rows: 1, medium: "air", mode: "compare" },
  },
  {
    slug: "frekvence", realm: "sound", ...L,
    title: { cs: "Frekvence", en: "Frequency" },
    guide: {
      cs: "Jak hustě jdou komprese za sebou, taková je výška. Posuň ucho vlevo (basa) ↔ vpravo (výška). Co naladíš, to si neseš dál.",
      en: "How tightly the squeezes follow each other sets the pitch. Move your ear left (bass) ↔ right (treble). Whatever you tune stays with you.",
    },
    up: "jak-se-zvuk-kresli", next: "amplituda",
    sound: { freqMul: 1, gainMul: 0.9, filter: 18000, rows: 5, medium: "air", interactive: "freq" },
    satellites: [{ to: "ton", x: 86, y: 28 }],
  },
  {
    slug: "amplituda", realm: "sound", ...L,
    title: { cs: "Amplituda", en: "Amplitude" },
    guide: {
      cs: "Jak daleko částice z místa vyrazí, tak je to hlasité. Blíž ke středu vlny = hlasitěji, k okraji = tišeji.",
      en: "How far the particles dart from their spot is how loud it is. Closer to the wave's center = louder, near the edge = softer.",
    },
    up: "frekvence", next: "barva-zvuku",
    sound: { freqMul: 1, gainMul: 1, filter: 18000, rows: 5, medium: "air", interactive: "amp" },
    satellites: [{ to: "decibel", x: 86, y: 28 }],
  },
  {
    slug: "barva-zvuku", realm: "sound", ...L,
    title: { cs: "Barva zvuku", en: "The color of sound" },
    guide: {
      cs: "Každé pásmo je jiný nástroj — od čistého tónu po housle a klavír. Přejížděj uchem a poslouchej, čím se liší. Co posloucháš naposled, to si neseš dál.",
      en: "Each band is a different instrument — from a pure tone to violin and piano. Glide your ear across and hear how they differ. Whatever you hear last, you carry on.",
    },
    up: "amplituda", next: "ozvena",
    sound: { freqMul: 1, gainMul: 0.9, filter: 18000, rows: 7, medium: "air", interactive: "wave" },
    satellites: [{ to: "hudebni-nastroje", x: 14, y: 28 }],
  },
  {
    slug: "ozvena", realm: "sound", ...L,
    title: { cs: "Ozvěna", en: "Echo" },
    guide: {
      cs: "Vyber si zvuk a poslouchej, jak se odrazí od zdi a vrací se zpět — znova a znova, jak doznívá. To je ozvěna. A tím máš zvuk celý: chvění, vlna, výška, hlasitost, barva, odraz.",
      en: "Pick a sound and hear it bounce off the wall and come back — again and again as it fades. That's an echo. And that's all of sound: a tremble, a wave, pitch, loudness, color, reflection.",
    },
    up: "barva-zvuku",
    sound: { freqMul: 0.9, gainMul: 0.95, filter: 18000, rows: 5, medium: "air", mode: "reflect", interactive: "wave" },
    satellites: [{ to: "hudba", x: 86, y: 28 }],
  },
];
