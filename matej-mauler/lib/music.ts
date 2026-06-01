import type { Lang } from "./dictionaries";

/* ── Konfigurace ────────────────────────────────────────────────── */

export const STEPS = 16;
export const GRID_SEMIS = 24; // rozsah piano-rollu: 2 oktávy (25 řádků)

export type TrackName = "melody" | "bass" | "pluck" | "drums";
export const TRACKS: TrackName[] = ["melody", "bass", "pluck", "drums"];

export type NoteCell = { midi: number; start: number; len: number };
export type DrumLane = "kick" | "clap" | "hihat";
export const DRUM_LANES: DrumLane[] = ["kick", "clap", "hihat"];
export type DrumCell = { lane: DrumLane; step: number };

/** Data jedné části: melodické tracky používají notes, bicí drums. */
export type PartData = { notes: NoteCell[]; drums: DrumCell[] };
export function emptyPartData(): PartData { return { notes: [], drums: [] }; }

export type SongTracks = { melody: NoteCell[]; bass: NoteCell[]; pluck: NoteCell[]; drums: DrumCell[] };
export function emptyTracks(): SongTracks { return { melody: [], bass: [], pluck: [], drums: [] }; }

export type Assignment = {
  songId: number; partId: number; track: TrackName; inst: string;
  scaleRoot: number; scaleName: string; tempo: number;
};
export type SongPart = { track: TrackName; inst: string; data: PartData; done: boolean };
export type SongDetail = { id: number; scaleRoot: number; scaleName: string; tempo: number; complete: boolean; parts: SongPart[] };
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
export function midiToShort(m: number): string { return NOTE_NAMES[m % 12]; }
export function midiToFreq(m: number): number { return 440 * Math.pow(2, (m - 69) / 12); }
export function isSharp(m: number): boolean { return NOTE_NAMES[m % 12].includes("#"); }

export function baseRootForTrack(scaleRoot: number, track: TrackName): number {
  return track === "bass" ? scaleRoot - 12 : track === "pluck" ? scaleRoot + 12 : scaleRoot;
}

/** Chromatické řádky piano-rollu (vzestupně, midi). */
export function chromaticRows(baseRoot: number): number[] {
  const a: number[] = [];
  for (let i = 0; i <= GRID_SEMIS; i++) a.push(baseRoot + i);
  return a;
}
export function isInScale(midi: number, root: number, scaleName: string): boolean {
  const iv = SCALES[scaleName] ?? SCALES.majorPenta;
  const pc = (((midi - root) % 12) + 12) % 12;
  return iv.includes(pc);
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
  { id: "pluckbass", label: { cs: "pluck bas", en: "pluck bass" }, wave: "triangle", gain: 0.26, rel: 0.6 },
];
export const PLUCK_INSTS: Inst[] = [
  { id: "guitar", label: { cs: "kytara", en: "guitar" }, wave: "triangle", gain: 0.2, rel: 0.7, harm: true },
  { id: "harp", label: { cs: "harfa", en: "harp" }, wave: "sine", gain: 0.18, rel: 0.8 },
  { id: "koto", label: { cs: "koto", en: "koto" }, wave: "square", gain: 0.13, rel: 0.5 },
  { id: "mandolin", label: { cs: "mandolína", en: "mandolin" }, wave: "sawtooth", gain: 0.13, rel: 0.5 },
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

export const DRUM_LABEL: Record<DrumLane, { cs: string; en: string }> = {
  kick: { cs: "kick", en: "kick" }, clap: { cs: "clap", en: "clap" }, hihat: { cs: "hihat", en: "hihat" },
};

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
    play: "Přehrát svou část ♪", stop: "Zastavit ■",
    gridHintNote: "Táhni = nakresli notu (začátek + délka). Klikni na notu = smazat. Noty ve stupnici jsou zvýrazněné.",
    gridHintDrum: "Klikej do mřížky — kick, clap, hihat na jednotlivé doby.",
    clear: "Vyčistit",
    emailLabel: "Zanech e-mail (nepovinné) — až se song doskládá, pošleme ti ho",
    emailPlaceholder: "tvuj@email.cz",
    submit: "Odeslat část →",
    submitting: "Odesílám…",
    emptyWarn: "Přidej aspoň jednu notu nebo úder.",
    doneTitle: "Tvá část je v hře 🎵",
    doneWaiting: "Song se ještě skládá — chybí další části od jiných lidí.",
    doneComplete: "A je hotovo! Song je kompletní:",
    openSong: "Přehrát výsledný song →",
    again: "Vytvořit další část",
    finishedHeading: "Hotové songy",
    finishedEmpty: "Zatím žádný hotový song. Vytvoř první dílek.",
    blindNote: "Tvoříš naslepo — ostatní části uvidíš, až bude song hotový.",
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
    play: "Play your part ♪", stop: "Stop ■",
    gridHintNote: "Drag = draw a note (start + length). Click a note = delete. Scale notes are highlighted.",
    gridHintDrum: "Click the grid — kick, clap, hihat on each beat.",
    clear: "Clear",
    emailLabel: "Leave an e-mail (optional) — we'll send you the song when it's assembled",
    emailPlaceholder: "you@email.com",
    submit: "Submit part →",
    submitting: "Submitting…",
    emptyWarn: "Add at least one note or hit.",
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
