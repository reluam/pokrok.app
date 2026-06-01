import type { Lang } from "./dictionaries";

/* ── Konfigurace ────────────────────────────────────────────────── */

export const STEPS = 16;

export type TrackName = "melody" | "bass" | "pluck" | "drums";
export const TRACKS: TrackName[] = ["melody", "bass", "pluck", "drums"];

export type PartEvent = { type: "note" | "rest" | "drum"; midi: number | null; combo: string | null };

export type Option = {
  id: string;
  label: { cs: string; en: string };
  payload: { midi?: number | null; combo?: string };
};

export type Assignment = {
  songId: number;
  partId: number;
  track: TrackName;
  inst: string;
  scaleRoot: number;
  scaleName: string;
  tempo: number;
};

export type SongPart = { track: TrackName; inst: string; events: PartEvent[]; done: boolean };
export type SongDetail = {
  id: number; scaleRoot: number; scaleName: string; tempo: number;
  complete: boolean; parts: SongPart[];
};
export type FinishedItem = { id: number; scaleName: string; tempo: number; createdAt: string };

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

export function baseRootForTrack(scaleRoot: number, track: TrackName): number {
  return track === "bass" ? scaleRoot - 12 : track === "pluck" ? scaleRoot + 12 : scaleRoot;
}

function arrow(d: number): { cs: string; en: string } {
  if (d === 0) return { cs: "stejně", en: "same" };
  if (d === 1) return { cs: "výš", en: "up" };
  if (d === -1) return { cs: "níž", en: "down" };
  if (d > 1) return { cs: "skok ↑", en: "leap ↑" };
  return { cs: "skok ↓", en: "leap ↓" };
}

/** Možnosti další noty — hudebně smysluplné, dle předchozí noty. */
export function noteOptions(root: number, scaleName: string, prevMidi: number | null): Option[] {
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
    const jump = Math.random() > 0.5 ? 2 : -2;
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

/* ── Nástroje ──────────────────────────────────────────────────── */

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
export function randomInst(track: TrackName): string {
  const list = instsForTrack(track);
  return list[Math.floor(Math.random() * list.length)].id;
}

/* ── Bicí ──────────────────────────────────────────────────────── */

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
export function comboHits(id: string): DrumHit[] { return DRUM_COMBOS.find((c) => c.id === id)?.hits ?? []; }

export function drumOptions(): Option[] {
  return DRUM_COMBOS.map((c) => ({ id: c.id, label: c.label, payload: { combo: c.id } }));
}

/* ── Stavba kroku ──────────────────────────────────────────────── */

export function optionsForStep(track: TrackName, scaleRoot: number, scaleName: string, prevMidi: number | null): Option[] {
  if (track === "drums") return drumOptions();
  return noteOptions(baseRootForTrack(scaleRoot, track), scaleName, prevMidi);
}

export function emptyTracks(): Record<TrackName, PartEvent[]> {
  return { melody: [], bass: [], pluck: [], drums: [] };
}

/* ── UI ────────────────────────────────────────────────────────── */

export const musicUi = {
  cs: {
    back: "← Spaghetti.ltd",
    eyebrow: "Slepá hudební spolupráce",
    title: "Skládačka hudby",
    intro: "Vytvoříš jen jednu část — basu, melodii, pluck nebo bicí. Nevíš, co tvoří ostatní. Až se sejdou všechny 4 části ve stejné stupnici, vznikne společný song.",
    startBtn: "Vytvořit svou část →",
    assigning: "Losuji…",
    yourTask: "Tvůj úkol",
    trackName: { melody: "Melodie", bass: "Basa", pluck: "Pluck", drums: "Bicí" } as Record<TrackName, string>,
    instrument: "Nástroj", scale: "Stupnice", tempo: "Tempo",
    step: "Krok", of: "z",
    pickNote: "Vyber další notu", pickDrum: "Vyber bicí na další dobu",
    play: "Přehrát svou část ♪", stop: "Zastavit ■",
    finishTitle: "Hotovo! Tvá část je připravená.",
    emailLabel: "Zanech e-mail (nepovinné) — až se song doskládá, pošleme ti ho",
    emailPlaceholder: "tvuj@email.cz",
    submit: "Odeslat část →",
    submitting: "Odesílám…",
    doneTitle: "Tvá část je v hře 🎵",
    doneWaiting: "Song se ještě skládá — chybí další části od jiných lidí.",
    doneComplete: "A je hotovo! Song je kompletní:",
    openSong: "Přehrát výsledný song →",
    again: "Vytvořit další část",
    finishedHeading: "Hotové songy",
    finishedEmpty: "Zatím žádný hotový song. Vytvoř první dílek.",
    blindNote: "Tvořís naslepo — ostatní části uvidíš, až bude song hotový.",
  },
  en: {
    back: "← Spaghetti.ltd",
    eyebrow: "Blind musical collaboration",
    title: "Music builder",
    intro: "You create only one part — bass, melody, pluck or drums. You don't know what others are making. When all 4 parts in the same scale come together, a shared song is born.",
    startBtn: "Create your part →",
    assigning: "Rolling…",
    yourTask: "Your task",
    trackName: { melody: "Melody", bass: "Bass", pluck: "Pluck", drums: "Drums" } as Record<TrackName, string>,
    instrument: "Instrument", scale: "Scale", tempo: "Tempo",
    step: "Step", of: "of",
    pickNote: "Pick the next note", pickDrum: "Pick drums for the next beat",
    play: "Play your part ♪", stop: "Stop ■",
    finishTitle: "Done! Your part is ready.",
    emailLabel: "Leave an e-mail (optional) — we'll send you the song when it's assembled",
    emailPlaceholder: "you@email.com",
    submit: "Submit part →",
    submitting: "Submitting…",
    doneTitle: "Your part is in the game 🎵",
    doneWaiting: "The song is still assembling — other parts are missing.",
    doneComplete: "And it's done! The song is complete:",
    openSong: "Play the finished song →",
    again: "Create another part",
    finishedHeading: "Finished songs",
    finishedEmpty: "No finished song yet. Make the first piece.",
    blindNote: "You're working blind — you'll see the other parts once the song is finished.",
  },
} as const;
