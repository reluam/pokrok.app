/* ── Composer: stav skladby + hlasovatelné změny ────────────────────
   Rádio renderuje server (radioRender) z tohoto stavu. Composer dbá,
   aby každá varianta zněla líbivě: jen prověřené progrese, pentatonické
   melodie kotvené na akordických tónech, žánrové bicí/basové šablony.

   Rádio je JEDNA kontinuální skladba, která ale výrazně driftuje — žánr,
   tónina i nálada se postupně mění (auto-drift), nebo skokem hlasem
   („Změnit žánr" / „Další skladba"). Tak to vždy zní dobře, ale je to
   pestré jako rádio. */

export type Lang = "cs" | "en";

export type LeadVoice = "pop" | "pluck" | "saw" | "bell" | "keys";
export type Genre =
  | "house" | "pop" | "chill" | "lofi" | "synthwave"
  | "funk" | "techno" | "dnb" | "trap" | "ambient";

export type MelNote = { step: number; deg: number; len: number }; // přes 32 kroků (2 takty)

export type Drums = { kick: number[]; clap: number[]; chh: number[]; ohh: number[] }; // 16 kroků / takt

export type SongState = {
  tempo: number;       // BPM (70–174 dle žánru)
  rootMidi: number;    // 55–67
  minor: boolean;
  prog: number[];      // 4 stupně (0..6), 1 akord / takt
  genre: Genre;
  drums: Drums;
  bassPat: number[];   // 16 kroků: -1 ticho, 0 root, 1 oktáva, 2 kvinta
  lead: { voice: LeadVoice; notes: MelNote[] };
  energy: number;      // 0..1 — pad, hustota hatů, delay
  swing: number;       // 0..0.3 — posun lichých 16tin (lo-fi/funk groove)
  subBass: boolean;    // 808/sub těžká basa (trap/dnb)
  hatRoll: boolean;    // trap rolls (triolové/16tinové hi-haty)
  mutes?: Partial<Record<Layer, boolean>>; // ztlumené vrstvy (vždy aspoň jedna hraje)
};

/* Mutovatelné vrstvy — vždy musí aspoň jedna hrát. */
export const LAYERS = ["drums", "bass", "lead", "pad"] as const;
export type Layer = (typeof LAYERS)[number];
export function activeLayers(s: SongState): number {
  const m = s.mutes ?? {};
  return LAYERS.filter((l) => !m[l]).length;
}
const TEMPO_STEP = 3; // BPM na jeden hlas „rychleji/pomaleji“

/* ── seedovaná náhoda (deterministická kola) ── */
export function mkRng(seed: number) {
  // scramble semínka (32bit hash) — sousední celá semínka jdou jinak.
  // Kola na serveru jdou sekvenčně, takže bez tohohle by žánr/tónina
  // sotva driftovaly (LCG dává pro blízká semínka korelovaný 1. výstup).
  let s = (seed >>> 0) || 1;
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0;
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0;
  s = (s ^ (s >>> 16)) >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const pick = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
function pickWeighted<T>(rng: () => number, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((a, [, w]) => a + w, 0);
  let r = rng() * total;
  for (const [v, w] of items) { r -= w; if (r <= 0) return v; }
  return items[items.length - 1][0];
}

/* ── hudební materiál ── */
export const MAJOR = [0, 2, 4, 5, 7, 9, 11];
export const MINOR = [0, 2, 3, 5, 7, 8, 10];
export const scaleOf = (s: SongState) => (s.minor ? MINOR : MAJOR);
export const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
export const degMidi = (s: SongState, deg: number, oct = 0) => {
  const sc = scaleOf(s);
  return s.rootMidi + sc[((deg % 7) + 7) % 7] + 12 * (Math.floor(deg / 7) + oct);
};

// prověřené progrese (stupně) — vždy zní dobře
const PROGS_MAJOR: readonly number[][] = [[0, 4, 5, 3], [5, 3, 0, 4], [0, 3, 5, 4], [3, 4, 0, 5], [0, 5, 3, 4]];
const PROGS_MINOR: readonly number[][] = [[0, 5, 2, 6], [0, 3, 4, 4], [0, 6, 5, 4], [5, 0, 3, 4]];
const ROOTS: readonly number[] = [55, 57, 58, 60, 62, 63, 65];

const D = (...on: number[]) => { const a = new Array(16).fill(0); on.forEach((i) => (a[i] = 1)); return a; };
const drm = (kick: number[], clap: number[], chh: number[], ohh: number[]): Drums => ({ kick, clap, chh, ohh });

/* ── žánrová definice ── */
type GenreDef = {
  tempo: [number, number];
  minorLean: number;            // pravděpodobnost moll
  energy: [number, number];
  swing: number;
  voices: readonly LeadVoice[];
  bass: readonly number[][];
  drums: readonly (() => Drums)[];
  melody: [number, number];     // počet not v motivu
  noteLens: readonly number[];  // délky not (kroky)
  subBass?: boolean;
  hatRoll?: boolean;
  noDrums?: boolean;
  progsMajor?: readonly number[][];
  progsMinor?: readonly number[][];
  weight: number;               // váha při náhodném výběru žánru
};

const GENRES: Record<Genre, GenreDef> = {
  house: {
    tempo: [120, 126], minorLean: 0.4, energy: [0.6, 0.85], swing: 0, weight: 3,
    voices: ["pluck", "saw", "pop"], melody: [4, 6], noteLens: [2, 2, 4, 4, 6],
    drums: [
      () => drm(D(0, 4, 8, 12), D(4, 12), D(2, 6, 10, 14), D(14)),
      () => drm(D(0, 4, 8, 12), D(4, 12), D(2, 6, 10, 14), D(2, 6, 10, 14)),
    ],
    bass: [[-1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 1, -1], [-1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 1]],
  },
  pop: {
    tempo: [110, 120], minorLean: 0.35, energy: [0.55, 0.8], swing: 0, weight: 3,
    voices: ["pop", "keys", "bell"], melody: [4, 6], noteLens: [2, 4, 4, 6],
    drums: [
      () => drm(D(0, 6, 8, 10), D(4, 12), D(0, 2, 4, 6, 8, 10, 12, 14), D()),
      () => drm(D(0, 8), D(4, 12), D(0, 2, 4, 6, 8, 10, 12, 14), D(6, 14)),
    ],
    bass: [[0, -1, -1, 0, -1, -1, 0, -1, 0, -1, -1, 0, -1, -1, 2, -1], [0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 1, -1]],
  },
  chill: {
    tempo: [90, 104], minorLean: 0.45, energy: [0.4, 0.62], swing: 0.08, weight: 2,
    voices: ["keys", "bell", "pop"], melody: [3, 5], noteLens: [4, 4, 6, 8],
    drums: [
      () => drm(D(0, 10), D(4, 12), D(2, 6, 10, 14), D(7)),
      () => drm(D(0, 8), D(4, 12), D(2, 5, 10, 13), D()),
    ],
    bass: [[0, -1, -1, -1, -1, -1, -1, 1, -1, -1, 0, -1, -1, -1, -1, -1], [0, -1, -1, -1, 2, -1, -1, -1, 0, -1, -1, -1, 1, -1, -1, -1]],
  },
  lofi: {
    tempo: [72, 86], minorLean: 0.6, energy: [0.3, 0.5], swing: 0.18, weight: 2,
    voices: ["keys", "bell"], melody: [3, 5], noteLens: [4, 6, 8, 6],
    drums: [
      () => drm(D(0, 10), D(4, 12), D(2, 6, 10, 14), D()),
      () => drm(D(0, 6, 9), D(4, 12), D(2, 6, 10, 14), D(14)),
    ],
    bass: [[0, -1, -1, -1, -1, -1, -1, -1, 0, -1, -1, -1, 2, -1, -1, -1], [0, -1, -1, -1, -1, -1, 1, -1, -1, -1, 0, -1, -1, -1, -1, -1]],
    progsMajor: [[0, 5, 1, 4], [0, 3, 1, 4], [3, 5, 1, 4]],
    progsMinor: [[0, 3, 5, 4], [0, 5, 3, 4]],
  },
  synthwave: {
    tempo: [98, 116], minorLean: 0.8, energy: [0.55, 0.8], swing: 0, weight: 2,
    voices: ["saw", "pop", "pluck"], melody: [4, 6], noteLens: [2, 2, 4, 4],
    drums: [
      () => drm(D(0, 4, 8, 12), D(4, 12), D(2, 6, 10, 14), D(6, 14)),
      () => drm(D(0, 4, 8, 12), D(4, 12), D(2, 6, 10, 14), D(2, 6, 10, 14)),
    ],
    bass: [[0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 1, -1], [0, -1, -1, 0, -1, 0, -1, -1, 0, -1, -1, 0, -1, 0, -1, -1]],
    progsMinor: [[0, 6, 5, 4], [0, 5, 2, 6], [0, 3, 4, 4]],
  },
  funk: {
    tempo: [106, 118], minorLean: 0.45, energy: [0.6, 0.85], swing: 0.12, weight: 2,
    voices: ["pluck", "keys"], melody: [4, 6], noteLens: [2, 2, 4],
    drums: [
      () => drm(D(0, 4, 8, 12), D(4, 12), D(0, 2, 4, 6, 8, 10, 12, 14), D(2, 6, 10, 14)),
      () => drm(D(0, 7, 10), D(4, 12), D(0, 2, 4, 6, 8, 10, 12, 14), D(2, 6, 10, 14)),
    ],
    bass: [[0, -1, 1, -1, -1, 0, -1, 1, -1, 0, -1, -1, 2, -1, 1, -1], [0, -1, -1, 0, 1, -1, 0, -1, -1, 0, 1, -1, 0, -1, 2, -1]],
  },
  techno: {
    tempo: [126, 134], minorLean: 0.7, energy: [0.6, 0.85], swing: 0, weight: 2,
    voices: ["pluck", "saw"], melody: [2, 4], noteLens: [4, 4, 8, 2],
    drums: [
      () => drm(D(0, 4, 8, 12), D(12), D(2, 6, 10, 14), D(2, 6, 10, 14)),
      () => drm(D(0, 4, 8, 12), D(), D(0, 2, 4, 6, 8, 10, 12, 14), D(2, 6, 10, 14)),
    ],
    bass: [[-1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1], [0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1]],
    progsMinor: [[0, 0, 5, 5], [0, 6, 0, 6], [0, 3, 0, 4]],
  },
  dnb: {
    tempo: [168, 174], minorLean: 0.7, energy: [0.65, 0.9], swing: 0, weight: 1, subBass: true,
    voices: ["saw", "pluck", "bell"], melody: [3, 4], noteLens: [4, 6, 8],
    drums: [
      () => drm(D(0, 10), D(4, 12), D(2, 6, 8, 10, 14), D(14)),
      () => drm(D(0, 6), D(4, 12), D(2, 6, 10, 14), D(7, 14)),
    ],
    bass: [[0, -1, -1, -1, -1, -1, -1, -1, 1, -1, -1, -1, -1, -1, -1, -1], [0, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1]],
    progsMinor: [[0, 5, 2, 6], [0, 6, 5, 4]],
  },
  trap: {
    tempo: [132, 146], minorLean: 0.85, energy: [0.45, 0.7], swing: 0, weight: 1.5, subBass: true, hatRoll: true,
    voices: ["bell", "keys", "pluck"], melody: [3, 4], noteLens: [4, 6, 8],
    drums: [
      () => drm(D(0, 6), D(8), D(0, 2, 4, 6, 8, 10, 12, 14), D()),
      () => drm(D(0, 11), D(8), D(0, 2, 4, 6, 8, 10, 12, 14), D()),
    ],
    bass: [[0, -1, -1, -1, -1, -1, 2, -1, 0, -1, -1, -1, 1, -1, -1, -1], [0, -1, -1, -1, -1, -1, -1, -1, 1, -1, -1, -1, -1, -1, 0, -1]],
    progsMinor: [[0, 5, 3, 4], [0, 3, 5, 4], [0, 6, 5, 4]],
  },
  ambient: {
    tempo: [70, 84], minorLean: 0.5, energy: [0.2, 0.4], swing: 0, weight: 1, noDrums: true,
    voices: ["bell", "keys"], melody: [2, 3], noteLens: [8, 12, 16],
    drums: [() => drm(D(), D(), D(), D())],
    bass: [[0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], [0, -1, -1, -1, -1, -1, -1, -1, 2, -1, -1, -1, -1, -1, -1, -1]],
    progsMajor: [[0, 3, 4, 3], [0, 5, 3, 4]],
    progsMinor: [[0, 5, 3, 2], [0, 3, 5, 4]],
  },
};

const GENRE_LIST = Object.keys(GENRES) as Genre[];
function pickGenre(rng: () => number, exclude?: Genre): Genre {
  const cand = GENRE_LIST.filter((g) => g !== exclude);
  return pickWeighted(rng, cand.map((g) => [g, GENRES[g].weight] as const));
}
function pickProg(genre: Genre, minor: boolean, rng: () => number): number[] {
  const g = GENRES[genre];
  const pool = minor ? (g.progsMinor ?? PROGS_MINOR) : (g.progsMajor ?? PROGS_MAJOR);
  return [...pick(rng, pool)];
}

export const GENRE_LABEL: Record<Genre, { cs: string; en: string }> = {
  house: { cs: "house", en: "house" }, pop: { cs: "pop", en: "pop" }, chill: { cs: "chill", en: "chill" },
  lofi: { cs: "lo-fi", en: "lo-fi" }, synthwave: { cs: "synthwave", en: "synthwave" }, funk: { cs: "funk", en: "funk" },
  techno: { cs: "techno", en: "techno" }, dnb: { cs: "drum'n'bass", en: "drum'n'bass" }, trap: { cs: "trap", en: "trap" },
  ambient: { cs: "ambient", en: "ambient" },
};

/** „Jiný beat" v rámci žánru: jiná šablona + drobné obměny hatů. */
function varyDrums(d: Drums, rng: () => number): Drums {
  const c: Drums = { kick: [...d.kick], clap: [...d.clap], chh: [...d.chh], ohh: [...d.ohh] };
  const flips = 1 + Math.floor(rng() * 2);
  for (let k = 0; k < flips; k++) { const i = Math.floor(rng() * 16); c.chh[i] = c.chh[i] ? 0 : 1; }
  if (rng() < 0.5) { const i = [2, 6, 10, 14][Math.floor(rng() * 4)]; c.ohh[i] = c.ohh[i] ? 0 : 1; }
  return c;
}

/** Melodie: 2taktový motiv + variace, kotvený na akordických tónech, pentatonika → vždy ladí. */
function genMelody(s: SongState, rng: () => number): MelNote[] {
  const g = GENRES[s.genre];
  const penta = s.minor ? [0, 2, 3, 4, 6] : [0, 1, 2, 4, 5]; // stupně pentatoniky v rámci stupnice
  const notes: MelNote[] = [];
  const motif: { step: number; off: number; len: number }[] = [];
  const [dMin, dMax] = g.melody;
  const density = dMin + Math.floor(rng() * (dMax - dMin + 1));
  let step = 0;
  for (let i = 0; i < density; i++) {
    const len = pick(rng, g.noteLens);
    if (step >= 14) break;
    motif.push({ step, off: pick(rng, penta) + (rng() < 0.25 ? 7 : 0), len });
    step += len + (rng() < 0.3 ? 2 : 0);
  }
  // takt 1–2: motiv nad 1. a 2. akordem; takt 3–4 (druhá půlka 32 kroků): variace posunutá k akordu
  for (const half of [0, 1]) {
    for (const m of motif) {
      const chordDeg = s.prog[half * 2 + (m.step >= 8 ? 1 : 0)] ?? s.prog[0];
      const vary = half === 1 && rng() < 0.4 ? pick(rng, [-1, 1, 2]) : 0;
      notes.push({ step: half * 16 + m.step, deg: chordDeg + m.off + vary, len: m.len });
    }
  }
  return notes;
}

/** Nastaví všechny žánrové parametry. keepKey zachová tóninu (plynulá změna žánru). */
function applyGenre(s: SongState, genre: Genre, rng: () => number, keepKey = false) {
  const g = GENRES[genre];
  s.genre = genre;
  s.tempo = Math.round(g.tempo[0] + rng() * (g.tempo[1] - g.tempo[0]));
  s.swing = g.swing;
  s.subBass = !!g.subBass;
  s.hatRoll = !!g.hatRoll;
  s.drums = pick(rng, g.drums)();
  s.bassPat = [...pick(rng, g.bass)];
  s.lead.voice = pick(rng, g.voices);
  s.energy = g.energy[0] + rng() * (g.energy[1] - g.energy[0]);
  if (!keepKey) {
    s.minor = rng() < g.minorLean;
    s.rootMidi = pick(rng, ROOTS);
  }
  s.prog = pickProg(genre, s.minor, rng);
  s.lead.notes = genMelody(s, rng);
}

export function genSong(seed: number): SongState {
  const rng = mkRng(seed);
  const s: SongState = {
    tempo: 118, rootMidi: 60, minor: false, prog: [0, 4, 5, 3], genre: "house",
    drums: drm(D(), D(), D(), D()), bassPat: [], lead: { voice: "pop", notes: [] },
    energy: 0.6, swing: 0, subBass: false, hatRoll: false, mutes: {},
  };
  applyGenre(s, pickGenre(rng), rng);
  return s;
}

/* ── normalizace starého/neúplného stavu (DB může mít kola z dřívějška) ── */
function normalize(s: SongState): SongState {
  if (!(s.genre in GENRES)) s.genre = "pop";
  s.swing ??= 0; s.subBass ??= false; s.hatRoll ??= false;
  return s;
}

/* ── hlasovatelné možnosti ── */
export type OptionId =
  | "next_track" | "genre" | "melody" | "drums" | "bass" | "instrument" | "key"
  | "tempo_up" | "tempo_down"
  | "mute_drums" | "mute_bass" | "mute_lead" | "mute_pad";

export const OPTIONS: { id: OptionId; emoji: string; label: { cs: string; en: string }; desc: { cs: string; en: string } }[] = [
  { id: "next_track", emoji: "🔀", label: { cs: "Další skladba", en: "Next track" }, desc: { cs: "Naladit úplně novou skladbu (nový žánr, tónina, nálada).", en: "Tune a whole new track (new genre, key, mood)." } },
  { id: "genre", emoji: "🎛️", label: { cs: "Změnit žánr", en: "Change genre" }, desc: { cs: "Přejít do jiného žánru, tónina zůstává.", en: "Morph into a different genre, key stays." } },
  { id: "melody", emoji: "🎼", label: { cs: "Nová melodie", en: "New melody" }, desc: { cs: "Lead si vymyslí jiný motiv.", en: "The lead invents a new motif." } },
  { id: "instrument", emoji: "🎹", label: { cs: "Vyměnit nástroj", en: "Swap instrument" }, desc: { cs: "Melodie dostane jiný zvuk.", en: "The melody gets a new sound." } },
  { id: "bass", emoji: "🎸", label: { cs: "Jiná basa", en: "New bassline" }, desc: { cs: "Spodek pojede jinak.", en: "The low end moves differently." } },
  { id: "drums", emoji: "🥁", label: { cs: "Jiný beat", en: "New beat" }, desc: { cs: "Bicí přehodí groove.", en: "The drums switch the groove." } },
  { id: "tempo_up", emoji: "⏩", label: { cs: "Zrychlit", en: "Speed up" }, desc: { cs: `Tempo o ${TEMPO_STEP} BPM výš.`, en: `Tempo up ${TEMPO_STEP} BPM.` } },
  { id: "tempo_down", emoji: "⏪", label: { cs: "Zpomalit", en: "Slow down" }, desc: { cs: `Tempo o ${TEMPO_STEP} BPM níž.`, en: `Tempo down ${TEMPO_STEP} BPM.` } },
  { id: "key", emoji: "🎚️", label: { cs: "Nová tónina", en: "New key" }, desc: { cs: "Jiný základ + nálada (dur/moll).", en: "New root + mood (major/minor)." } },
  // mute toggly — klient přepisuje text podle aktuálního stavu vrstvy
  { id: "mute_drums", emoji: "🥁", label: { cs: "Bicí", en: "Drums" }, desc: { cs: "Ztlumit / zapnout bicí.", en: "Mute / unmute drums." } },
  { id: "mute_bass", emoji: "🎸", label: { cs: "Basa", en: "Bass" }, desc: { cs: "Ztlumit / zapnout basu.", en: "Mute / unmute bass." } },
  { id: "mute_lead", emoji: "🎶", label: { cs: "Melodie", en: "Melody" }, desc: { cs: "Ztlumit / zapnout melodii.", en: "Mute / unmute melody." } },
  { id: "mute_pad", emoji: "🎹", label: { cs: "Akordy", en: "Chords" }, desc: { cs: "Ztlumit / zapnout akordy.", en: "Mute / unmute chords." } },
];

const tempoClamp = (s: SongState, t: number) => Math.max(GENRES[s.genre].tempo[0], Math.min(GENRES[s.genre].tempo[1], t));

/** Aplikace vítězné volby — vždy v rámci líbivých mantinelů. */
export function applyOption(prev: SongState, opt: OptionId | null, seed: number): SongState {
  const rng = mkRng(seed);
  const s = normalize(JSON.parse(JSON.stringify(prev)) as SongState);
  // bez hlasů: výraznější, pestřejší auto-drift (občas žánr/tónina, jinak melodie/basa/nástroj)
  const o: OptionId = opt ?? pickWeighted(rng, [
    ["melody", 4], ["bass", 2], ["instrument", 2], ["drums", 2],
    ["genre", 1.4], ["key", 1], ["tempo_up", 0.6], ["tempo_down", 0.6],
  ] as const);
  const unmute = (l: Layer) => { s.mutes = { ...(s.mutes ?? {}), [l]: false }; }; // změna vrstvy ji rozezní
  switch (o) {
    case "next_track": {
      s.mutes = {};
      applyGenre(s, pickGenre(rng, s.genre), rng); // nový žánr + nová tónina + vše
      break;
    }
    case "genre": {
      applyGenre(s, pickGenre(rng, s.genre), rng, true); // jiný žánr, tónina zůstává
      unmute("drums");
      break;
    }
    case "melody":
      s.lead.notes = genMelody(s, rng); unmute("lead");
      break;
    case "drums": {
      const g = GENRES[s.genre];
      s.drums = varyDrums(pick(rng, g.drums)(), rng);
      s.bassPat = [...pick(rng, g.bass)];
      unmute("drums");
      break;
    }
    case "bass":
      s.bassPat = [...pick(rng, GENRES[s.genre].bass)]; unmute("bass");
      break;
    case "instrument": {
      const voices = GENRES[s.genre].voices.filter((v) => v !== s.lead.voice);
      s.lead.voice = voices.length ? pick(rng, voices) : s.lead.voice; unmute("lead");
      break;
    }
    case "tempo_up":
    case "tempo_down": {
      const dir = o === "tempo_up" ? 1 : -1;
      s.tempo = tempoClamp(s, s.tempo + dir * TEMPO_STEP);
      break;
    }
    case "key": {
      s.minor = rng() < 0.5;
      s.rootMidi = pick(rng, ROOTS.filter((r) => r !== prev.rootMidi));
      s.prog = pickProg(s.genre, s.minor, rng);
      s.lead.notes = genMelody(s, rng); // melodie se přeladí do nové tóniny
      break;
    }
    case "mute_drums": case "mute_bass": case "mute_lead": case "mute_pad": {
      const layer = o.slice(5) as Layer;
      const mutes = { ...(s.mutes ?? {}) };
      if (mutes[layer]) mutes[layer] = false;            // zapnout zpět
      else if (activeLayers(s) > 1) mutes[layer] = true; // ztlumit — ale nikdy poslední hrající vrstvu
      s.mutes = mutes;
      break;
    }
  }
  s.energy = Math.max(0.15, Math.min(0.9, s.energy + (rng() - 0.5) * 0.14));
  return s;
}

/* ── popis změny do logu (formátuje se na klientovi podle jazyka) ── */
export type ChangeLog = {
  opt: string; tempo: number; genre: Genre; key: string; voice: LeadVoice;
  mute: { layer: Layer; on: boolean } | null;
};
export function summarizeChange(prev: SongState, next: SongState, opt: OptionId | null | "start"): ChangeLog {
  let mute: ChangeLog["mute"] = null; let muteOpt: string | null = null;
  for (const l of LAYERS) {
    const a = !!(prev.mutes ?? {})[l], b = !!(next.mutes ?? {})[l];
    if (a !== b) { mute = { layer: l, on: b }; muteOpt = `mute_${l}`; break; }
  }
  // popíše, co se SKUTEČNĚ změnilo (i u auto změn bez hlasu) — priorita podle výraznosti
  const J = (x: unknown) => JSON.stringify(x);
  let detected: string;
  if (opt === "start") detected = "start";
  else if (opt === "next_track") detected = "next_track";
  else if (muteOpt) detected = muteOpt;
  // skok přes víc parametrů (nová skladba i bez explicitního next_track) — bere se jako nová skladba
  else if (prev.genre !== next.genre && (prev.minor !== next.minor || prev.rootMidi !== next.rootMidi)) detected = "next_track";
  else if (prev.genre !== next.genre) detected = "genre";
  else if (prev.tempo !== next.tempo) detected = next.tempo > prev.tempo ? "tempo_up" : "tempo_down";
  else if (prev.minor !== next.minor || prev.rootMidi !== next.rootMidi) detected = "key";
  else if (J(prev.drums) !== J(next.drums)) detected = "drums";
  else if (J(prev.bassPat) !== J(next.bassPat)) detected = "bass";
  else if (prev.lead.voice !== next.lead.voice) detected = "instrument";
  else if (J(prev.lead.notes) !== J(next.lead.notes)) detected = "melody";
  else detected = "auto";
  return { opt: detected, tempo: next.tempo, genre: next.genre, key: keyName(next), voice: next.lead.voice, mute };
}

/** Délka kola: ~15 s zarovnaných na celé sudé takty (změna vždy od 1. doby). */
export function roundBars(tempo: number): number {
  const barSec = 240 / tempo;
  return Math.max(4, Math.round(15 / barSec / 2) * 2);
}
export function roundDurationMs(state: SongState): number {
  return Math.round(roundBars(state.tempo) * (240 / state.tempo) * 1000);
}

export const keyName = (s: SongState) =>
  ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][((s.rootMidi % 12) + 12) % 12] + (s.minor ? "m" : "");
