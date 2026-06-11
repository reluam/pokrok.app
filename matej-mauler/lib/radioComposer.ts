/* ── Composer: stav skladby + hlasovatelné změny ────────────────────
   Rádio renderuje server (radioRender) z tohoto stavu. Composer dbá,
   aby každá varianta zněla líbivě: jen prověřené progrese, pentatonické
   melodie kotvené na akordických tónech, žánrové bicí šablony. */

export type Lang = "cs" | "en";

export type LeadVoice = "pluck" | "saw" | "bell" | "keys";
export type Genre = "house" | "pop" | "chill";

export type MelNote = { step: number; deg: number; len: number }; // přes 32 kroků (2 takty)

export type SongState = {
  tempo: number;       // BPM (104–126)
  rootMidi: number;    // 55–67
  minor: boolean;
  prog: number[];      // 4 stupně (0..6), 1 akord / takt
  genre: Genre;
  drums: { kick: number[]; clap: number[]; chh: number[]; ohh: number[] }; // 16 kroků / takt
  bassPat: number[];   // 16 kroků: -1 ticho, 0 root, 1 oktáva, 2 kvinta
  lead: { voice: LeadVoice; notes: MelNote[] };
  energy: number;      // 0..1 — pad, hustota hatů, delay
};

/* ── seedovaná náhoda (deterministická kola) ── */
export function mkRng(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const pick = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

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

const DRUMS: Record<Genre, () => SongState["drums"]> = {
  house: () => ({ kick: D(0, 4, 8, 12), clap: D(4, 12), chh: D(2, 6, 10, 14), ohh: D(14) }),
  pop:   () => ({ kick: D(0, 6, 8, 10), clap: D(4, 12), chh: D(0, 2, 4, 6, 8, 10, 12, 14), ohh: D() }),
  chill: () => ({ kick: D(0, 10), clap: D(4, 12), chh: D(2, 5, 10, 13), ohh: D(7) }),
};
const BASS: Record<Genre, readonly number[][]> = {
  house: [[-1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 1, -1], [-1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 1]],
  pop:   [[0, -1, -1, 0, -1, -1, 0, -1, 0, -1, -1, 0, -1, -1, 2, -1], [0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 1, -1]],
  chill: [[0, -1, -1, -1, -1, -1, -1, 1, -1, -1, 0, -1, -1, -1, -1, -1], [0, -1, -1, -1, 2, -1, -1, -1, 0, -1, -1, -1, 1, -1, -1, -1]],
};

/** Melodie: 2taktový motiv + variace, kotvený na akordických tónech, pentatonika → vždy ladí. */
function genMelody(s: SongState, rng: () => number): MelNote[] {
  const penta = s.minor ? [0, 2, 3, 4, 6] : [0, 1, 2, 4, 5]; // stupně pentatoniky v rámci stupnice
  const notes: MelNote[] = [];
  const motif: { step: number; off: number; len: number }[] = [];
  const density = 4 + Math.floor(rng() * 3); // 4–6 not v motivu
  let step = 0;
  for (let i = 0; i < density; i++) {
    const len = pick(rng, [2, 2, 4, 4, 6]);
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

export function genSong(seed: number): SongState {
  const rng = mkRng(seed);
  const minor = rng() < 0.45;
  const genre = pick(rng, ["house", "pop", "chill"] as const);
  const s: SongState = {
    tempo: genre === "chill" ? 108 : 118 + Math.floor(rng() * 8),
    rootMidi: pick(rng, ROOTS),
    minor,
    prog: [...pick(rng, minor ? PROGS_MINOR : PROGS_MAJOR)],
    genre,
    drums: DRUMS[genre](),
    bassPat: [...pick(rng, BASS[genre])],
    lead: { voice: pick(rng, ["pluck", "saw", "bell", "keys"] as const), notes: [] },
    energy: 0.5 + rng() * 0.3,
  };
  s.lead.notes = genMelody(s, rng);
  return s;
}

/* ── hlasovatelné možnosti ── */
export type OptionId = "melody" | "drums" | "bass" | "instrument" | "tempo" | "key";

export const OPTIONS: { id: OptionId; emoji: string; label: { cs: string; en: string }; desc: { cs: string; en: string } }[] = [
  { id: "melody", emoji: "🎼", label: { cs: "Nová melodie", en: "New melody" }, desc: { cs: "Lead si vymyslí jiný motiv.", en: "The lead invents a new motif." } },
  { id: "drums", emoji: "🥁", label: { cs: "Jiný beat", en: "New beat" }, desc: { cs: "Bicí přehodí groove.", en: "The drums switch the groove." } },
  { id: "bass", emoji: "🎸", label: { cs: "Jiná basa", en: "New bassline" }, desc: { cs: "Spodek pojede jinak.", en: "The low end moves differently." } },
  { id: "instrument", emoji: "🎹", label: { cs: "Vyměnit nástroj", en: "Swap instrument" }, desc: { cs: "Melodie dostane jiný zvuk.", en: "The melody gets a new sound." } },
  { id: "tempo", emoji: "⏱️", label: { cs: "Změnit tempo", en: "Change tempo" }, desc: { cs: "Zrychlí, nebo zpomalí.", en: "Speeds up or slows down." } },
  { id: "key", emoji: "🎚️", label: { cs: "Nová tónina", en: "New key" }, desc: { cs: "Jiný základ + nálada (dur/moll).", en: "New root + mood (major/minor)." } },
];

/** Aplikace vítězné volby — vždy v rámci líbivých mantinelů. */
export function applyOption(prev: SongState, opt: OptionId | null, seed: number): SongState {
  const rng = mkRng(seed);
  const s: SongState = JSON.parse(JSON.stringify(prev));
  const o: OptionId = opt ?? pick(rng, ["melody", "drums", "instrument", "bass"] as const); // bez hlasů jemná změna
  switch (o) {
    case "melody":
      s.lead.notes = genMelody(s, rng);
      break;
    case "drums": {
      const g = pick(rng, (["house", "pop", "chill"] as const).filter((x) => x !== s.genre));
      s.genre = g; s.drums = DRUMS[g](); s.bassPat = [...pick(rng, BASS[g])];
      break;
    }
    case "bass":
      s.bassPat = [...pick(rng, BASS[s.genre])];
      break;
    case "instrument": {
      s.lead.voice = pick(rng, (["pluck", "saw", "bell", "keys"] as const).filter((v) => v !== s.lead.voice));
      break;
    }
    case "tempo": {
      const dir = rng() < 0.5 ? -1 : 1;
      s.tempo = Math.max(104, Math.min(126, s.tempo + dir * (4 + Math.floor(rng() * 5))));
      break;
    }
    case "key": {
      s.minor = rng() < 0.5;
      s.rootMidi = pick(rng, ROOTS.filter((r) => r !== prev.rootMidi));
      s.prog = [...pick(rng, s.minor ? PROGS_MINOR : PROGS_MAJOR)];
      s.lead.notes = genMelody(s, rng); // melodie se přeladí do nové tóniny
      break;
    }
  }
  s.energy = Math.max(0.35, Math.min(0.85, s.energy + (rng() - 0.5) * 0.12));
  return s;
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
