import type { Lang } from "./dictionaries";

/* ── Konfigurace ────────────────────────────────────────────────── */

export const STEPS = 16;              // délka každého tracku (dvojnásobek)

export type TrackName = "melody" | "bass" | "pluck" | "drums";
export type Phase =
  | "melody_inst" | "bass_inst" | "pluck_inst"
  | "melody" | "bass" | "pluck" | "drums" | "done";

export type Ev = { track: TrackName; position: number; type: "note" | "rest" | "drum"; midi: number | null; combo: string | null };

export type Option = {
  id: string;
  label: { cs: string; en: string };
  payload: { midi?: number | null; inst?: string; combo?: string };
};

export type SongState = {
  id: number;
  scaleRoot: number;
  scaleName: string;
  tempo: number;
  melodyInst: string | null;
  bassInst: string | null;
  pluckInst: string | null;
  tracks: Record<TrackName, Ev[]>;
};

export type FinishedSong = {
  id: number; scaleRoot: number; scaleName: string; tempo: number;
  melodyInst: string; bassInst: string; pluckInst: string;
  tracks: Record<TrackName, Ev[]>; createdAt: string;
};

export type MusicState = {
  song: SongState;
  phase: Phase;
  stepIndex: number;
  options: Option[];
  finished: FinishedSong[];
};

/* ── Hudební teorie ─────────────────────────────────────────────── */

export const SCALES: Record<string, number[]> = {
  majorPenta: [0, 2, 4, 7, 9],
  minorPenta: [0, 3, 5, 7, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};
export const SCALE_NAMES = Object.keys(SCALES);
export const SCALE_LABEL: Record<string, string> = {
  majorPenta: "major pentatonic", minorPenta: "minor pentatonic", major: "major", dorian: "dorian",
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export function midiToName(m: number): string { return NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1); }
export function midiToFreq(m: number): number { return 440 * Math.pow(2, (m - 69) / 12); }

export function scaleMidiNotes(root: number, scaleName: string): number[] {
  const intervals = SCALES[scaleName] ?? SCALES.majorPenta;
  const notes: number[] = [];
  for (let oct = 0; oct < 2; oct++) for (const iv of intervals) notes.push(root + 12 * oct + iv);
  notes.push(root + 24);
  return notes;
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}

function arrow(d: number): { cs: string; en: string } {
  if (d === 0) return { cs: "stejně", en: "same" };
  if (d === 1) return { cs: "výš", en: "up" };
  if (d === -1) return { cs: "níž", en: "down" };
  if (d > 1) return { cs: "skok ↑", en: "leap ↑" };
  return { cs: "skok ↓", en: "leap ↓" };
}

export function noteOptions(root: number, scaleName: string, prevMidi: number | null, rng: () => number): Option[] {
  const notes = scaleMidiNotes(root, scaleName);
  const out: Option[] = [];
  if (prevMidi === null) {
    const ri = notes.indexOf(root);
    for (const p of [ri, ri + 1, ri + 2, ri + (scaleName.includes("Penta") ? 3 : 4)]) {
      const i = Math.max(0, Math.min(notes.length - 1, p));
      out.push({ id: `n${notes[i]}`, label: { cs: midiToName(notes[i]), en: midiToName(notes[i]) }, payload: { midi: notes[i] } });
    }
  } else {
    const idx = notes.indexOf(prevMidi);
    const base = idx < 0 ? notes.indexOf(root) : idx;
    const jump = rng() > 0.5 ? 2 : -2;
    for (const d of [-1, 0, 1, base > notes.length - 3 ? -2 : jump]) {
      const i = Math.max(0, Math.min(notes.length - 1, base + d));
      const m = notes[i]; const a = arrow(d);
      out.push({ id: `n${m}-${d}`, label: { cs: `${midiToName(m)} · ${a.cs}`, en: `${midiToName(m)} · ${a.en}` }, payload: { midi: m } });
    }
  }
  const seen = new Set<number>();
  const uniq = out.filter((o) => { const m = o.payload.midi!; if (seen.has(m)) return false; seen.add(m); return true; });
  uniq.push({ id: "rest", label: { cs: "pauza", en: "rest" }, payload: { midi: null } });
  return uniq;
}

/* ── Nástroje (4 na každý track) ───────────────────────────────── */

export type Inst = { id: string; label: { cs: string; en: string }; wave: OscillatorType; gain: number; rel: number; harm?: boolean };

export const MELODY_INSTS: Inst[] = [
  { id: "flute", label: { cs: "flétna", en: "flute" }, wave: "sine", gain: 0.22, rel: 0.95 },
  { id: "soft", label: { cs: "měkký", en: "soft" }, wave: "triangle", gain: 0.22, rel: 0.9 },
  { id: "chip", label: { cs: "chiptune", en: "chiptune" }, wave: "square", gain: 0.16, rel: 0.85 },
  { id: "synthlead", label: { cs: "synth lead", en: "synth lead" }, wave: "sawtooth", gain: 0.16, rel: 0.9 },
];
export const BASS_INSTS: Inst[] = [
  { id: "sub", label: { cs: "sub bas", en: "sub bass" }, wave: "sine", gain: 0.3, rel: 0.95 },
  { id: "sawbass", label: { cs: "saw bas", en: "saw bass" }, wave: "sawtooth", gain: 0.2, rel: 0.85 },
  { id: "squarebass", label: { cs: "square bas", en: "square bass" }, wave: "square", gain: 0.18, rel: 0.8 },
  { id: "pluckbass", label: { cs: "pluck bas", en: "pluck bass" }, wave: "triangle", gain: 0.26, rel: 0.4 },
];
export const PLUCK_INSTS: Inst[] = [
  { id: "guitar", label: { cs: "kytara", en: "guitar" }, wave: "triangle", gain: 0.2, rel: 0.5, harm: true },
  { id: "harp", label: { cs: "harfa", en: "harp" }, wave: "sine", gain: 0.18, rel: 0.6 },
  { id: "koto", label: { cs: "koto", en: "koto" }, wave: "square", gain: 0.13, rel: 0.32 },
  { id: "mandolin", label: { cs: "mandolína", en: "mandolin" }, wave: "sawtooth", gain: 0.13, rel: 0.34 },
];

export function instsForTrack(track: TrackName): Inst[] {
  return track === "bass" ? BASS_INSTS : track === "pluck" ? PLUCK_INSTS : MELODY_INSTS;
}
export function findInst(track: TrackName, id: string | null): Inst {
  const list = instsForTrack(track);
  return list.find((i) => i.id === id) ?? list[0];
}

/* ── Bicí kombinace ────────────────────────────────────────────── */

export type DrumHit = "kick" | "clap" | "hihat";
export const DRUM_COMBOS: { id: string; label: { cs: string; en: string }; hits: DrumHit[] }[] = [
  { id: "none", label: { cs: "—", en: "—" }, hits: [] },
  { id: "kick", label: { cs: "kick", en: "kick" }, hits: ["kick"] },
  { id: "clap", label: { cs: "clap", en: "clap" }, hits: ["clap"] },
  { id: "hihat", label: { cs: "hihat", en: "hihat" }, hits: ["hihat"] },
  { id: "kick_hihat", label: { cs: "kick + hihat", en: "kick + hihat" }, hits: ["kick", "hihat"] },
  { id: "clap_hihat", label: { cs: "clap + hihat", en: "clap + hihat" }, hits: ["clap", "hihat"] },
  { id: "kick_clap", label: { cs: "kick + clap", en: "kick + clap" }, hits: ["kick", "clap"] },
  { id: "all", label: { cs: "vše", en: "all" }, hits: ["kick", "clap", "hihat"] },
];
export function comboHits(id: string): DrumHit[] {
  return DRUM_COMBOS.find((c) => c.id === id)?.hits ?? [];
}

/* ── Fáze, kroky, možnosti ─────────────────────────────────────── */

export const PHASE_ORDER: Phase[] = ["melody_inst", "bass_inst", "pluck_inst", "melody", "bass", "pluck", "drums"];

export function currentPhase(song: SongState): { phase: Phase; stepIndex: number } {
  if (!song.melodyInst) return { phase: "melody_inst", stepIndex: 0 };
  if (!song.bassInst) return { phase: "bass_inst", stepIndex: 0 };
  if (!song.pluckInst) return { phase: "pluck_inst", stepIndex: 0 };
  if (song.tracks.melody.length < STEPS) return { phase: "melody", stepIndex: song.tracks.melody.length };
  if (song.tracks.bass.length < STEPS) return { phase: "bass", stepIndex: song.tracks.bass.length };
  if (song.tracks.pluck.length < STEPS) return { phase: "pluck", stepIndex: song.tracks.pluck.length };
  if (song.tracks.drums.length < STEPS) return { phase: "drums", stepIndex: song.tracks.drums.length };
  return { phase: "done", stepIndex: 0 };
}

function lastNote(events: Ev[]): number | null {
  for (let i = events.length - 1; i >= 0; i--) if (events[i].type === "note" && events[i].midi != null) return events[i].midi;
  return null;
}

export function optionsFor(song: SongState, phase: Phase, stepIndex: number): Option[] {
  if (phase === "melody_inst") return MELODY_INSTS.map((i) => ({ id: i.id, label: i.label, payload: { inst: i.id } }));
  if (phase === "bass_inst") return BASS_INSTS.map((i) => ({ id: i.id, label: i.label, payload: { inst: i.id } }));
  if (phase === "pluck_inst") return PLUCK_INSTS.map((i) => ({ id: i.id, label: i.label, payload: { inst: i.id } }));
  if (phase === "drums") return DRUM_COMBOS.map((c) => ({ id: c.id, label: c.label, payload: { combo: c.id } }));

  const baseRoot = phase === "bass" ? song.scaleRoot - 12 : phase === "pluck" ? song.scaleRoot + 12 : song.scaleRoot;
  const rng = makeRng(hash(`${song.id}:${phase}:${stepIndex}`));
  return noteOptions(baseRoot, song.scaleName, lastNote(song.tracks[phase as TrackName]), rng);
}

/* ── UI ────────────────────────────────────────────────────────── */

export const musicUi = {
  cs: {
    back: "← Spaghetti.ltd",
    eyebrow: "Společné skládání hudby",
    title: "Skládačka hudby",
    intro: "Kdo první klikne, ten rozhodne o dalším kroku. Sám projdeš celý song, nebo to skládáte společně.",
    firstClick: "First click first served — kdo klikne první, rozhodne",
    phase: {
      melody_inst: "Vyber nástroj melodie", bass_inst: "Vyber nástroj basy", pluck_inst: "Vyber nástroj plucku",
      melody: "Další nota melodie", bass: "Další nota basy", pluck: "Další nota plucku", drums: "Bicí na další dobu", done: "Hotovo",
    } as Record<Phase, string>,
    trackName: { melody: "Melodie", bass: "Basa", pluck: "Pluck", drums: "Bicí" } as Record<TrackName, string>,
    step: "Krok", of: "z", tempo: "Tempo", scale: "Stupnice",
    play: "Přehrát ve smyčce ♪", stop: "Zastavit ■",
    finishedTitle: "Hotové songy", finishedEmpty: "Zatím žádný hotový song. Začni skládat.",
    disclaimer: "Žádné AI, žádné nahrávky — vše se počítá z čísel. Playback se přehrává ve smyčce.",
  },
  en: {
    back: "← Spaghetti.ltd",
    eyebrow: "Collaborative music making",
    title: "Music builder",
    intro: "Whoever clicks first decides the next step. Build a whole song alone, or together.",
    firstClick: "First click first served — first to click decides",
    phase: {
      melody_inst: "Pick melody instrument", bass_inst: "Pick bass instrument", pluck_inst: "Pick pluck instrument",
      melody: "Next melody note", bass: "Next bass note", pluck: "Next pluck note", drums: "Drums for next beat", done: "Done",
    } as Record<Phase, string>,
    trackName: { melody: "Melody", bass: "Bass", pluck: "Pluck", drums: "Drums" } as Record<TrackName, string>,
    step: "Step", of: "of", tempo: "Tempo", scale: "Scale",
    play: "Play in loop ♪", stop: "Stop ■",
    finishedTitle: "Finished songs", finishedEmpty: "No finished song yet. Start building.",
    disclaimer: "No AI, no recordings — all computed from numbers. Playback loops continuously.",
  },
} as const;
