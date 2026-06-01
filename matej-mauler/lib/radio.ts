import { SCALES, midiToFreq } from "./music";
import type { Lang } from "./dictionaries";

export { midiToFreq };

/* ── Mřížka ─────────────────────────────────────────────────────── */
export const BARS = 4;
export const SPB = 16;
export const TOTAL = BARS * SPB; // 64

export type DrumId = "kick" | "clap" | "chat" | "ohat";
export const DRUM_IDS: DrumId[] = ["kick", "clap", "chat", "ohat"];
export type MelodicId = "sub" | "pad" | "arp" | "pluck" | "lead";
export const MELODIC_IDS: MelodicId[] = ["sub", "pad", "arp", "pluck", "lead"];
export type LayerId = DrumId | MelodicId;
export const LAYER_IDS: LayerId[] = [...DRUM_IDS, ...MELODIC_IDS];

export type RNote = { step: number; midi: number; dur: number };
export type MelLayer = { inst: string; notes: RNote[]; muted: boolean };

export type SongState = {
  tempo: number;
  root: number;
  scaleName: string;
  chords: number[];
  drums: Record<DrumId, { pattern: boolean[]; muted: boolean }>;
  sub: MelLayer; pad: MelLayer; arp: MelLayer; pluck: MelLayer; lead: MelLayer;
};

/* ── Hlasy (moderní syntéza) ───────────────────────────────────── */
export type Voice = {
  id: string; label: { cs: string; en: string };
  osc: OscillatorType; unison: number; detune: number;  // supersaw
  cutoff: number; cutoffEnv: number; q: number;
  a: number; d: number; s: number; r: number;           // ADSR (s = sustain 0..1)
  gain: number; reverb: number; sub?: boolean;
};

export const VOICES: Record<MelodicId, Voice[]> = {
  sub: [
    { id: "sub", label: { cs: "sub bas", en: "sub bass" }, osc: "sine", unison: 1, detune: 0, cutoff: 220, cutoffEnv: 0, q: 0.5, a: 0.005, d: 0.1, s: 0.9, r: 0.12, gain: 0.42, reverb: 0, sub: true },
    { id: "reese", label: { cs: "reese bas", en: "reese bass" }, osc: "sawtooth", unison: 3, detune: 14, cutoff: 380, cutoffEnv: 200, q: 4, a: 0.005, d: 0.15, s: 0.8, r: 0.12, gain: 0.16, reverb: 0 },
    { id: "fmbass", label: { cs: "FM bas", en: "FM bass" }, osc: "square", unison: 1, detune: 0, cutoff: 600, cutoffEnv: 400, q: 3, a: 0.004, d: 0.12, s: 0.6, r: 0.1, gain: 0.18, reverb: 0, sub: true },
  ],
  pad: [
    { id: "supersaw", label: { cs: "supersaw pad", en: "supersaw pad" }, osc: "sawtooth", unison: 5, detune: 22, cutoff: 1400, cutoffEnv: 900, q: 2, a: 0.25, d: 0.5, s: 0.8, r: 0.6, gain: 0.075, reverb: 0.45 },
    { id: "warm", label: { cs: "teplý pad", en: "warm pad" }, osc: "triangle", unison: 3, detune: 10, cutoff: 1100, cutoffEnv: 400, q: 1.5, a: 0.3, d: 0.6, s: 0.85, r: 0.7, gain: 0.1, reverb: 0.5 },
    { id: "choir", label: { cs: "sbor", en: "choir" }, osc: "sine", unison: 4, detune: 16, cutoff: 2200, cutoffEnv: 300, q: 1, a: 0.35, d: 0.5, s: 0.8, r: 0.8, gain: 0.09, reverb: 0.6 },
  ],
  arp: [
    { id: "plucksynth", label: { cs: "pluck synth", en: "pluck synth" }, osc: "sawtooth", unison: 2, detune: 12, cutoff: 2600, cutoffEnv: 1800, q: 3, a: 0.002, d: 0.16, s: 0.0, r: 0.12, gain: 0.12, reverb: 0.35 },
    { id: "bell", label: { cs: "zvonkohra", en: "bells" }, osc: "sine", unison: 1, detune: 0, cutoff: 4000, cutoffEnv: 0, q: 1, a: 0.002, d: 0.25, s: 0.0, r: 0.2, gain: 0.16, reverb: 0.5, sub: false },
    { id: "sqarp", label: { cs: "square arp", en: "square arp" }, osc: "square", unison: 1, detune: 0, cutoff: 3000, cutoffEnv: 1500, q: 2, a: 0.002, d: 0.14, s: 0.0, r: 0.1, gain: 0.1, reverb: 0.3 },
  ],
  pluck: [
    { id: "piano", label: { cs: "piano", en: "piano" }, osc: "triangle", unison: 1, detune: 0, cutoff: 3200, cutoffEnv: 800, q: 1, a: 0.003, d: 0.4, s: 0.0, r: 0.3, gain: 0.18, reverb: 0.35 },
    { id: "stab", label: { cs: "synth stab", en: "synth stab" }, osc: "sawtooth", unison: 3, detune: 18, cutoff: 1800, cutoffEnv: 1400, q: 4, a: 0.004, d: 0.22, s: 0.0, r: 0.18, gain: 0.1, reverb: 0.3 },
    { id: "epiano", label: { cs: "el. piano", en: "e-piano" }, osc: "sine", unison: 2, detune: 8, cutoff: 2600, cutoffEnv: 600, q: 1, a: 0.004, d: 0.45, s: 0.0, r: 0.35, gain: 0.16, reverb: 0.4, sub: true },
  ],
  lead: [
    { id: "supersawlead", label: { cs: "supersaw lead", en: "supersaw lead" }, osc: "sawtooth", unison: 5, detune: 20, cutoff: 2400, cutoffEnv: 1600, q: 3, a: 0.02, d: 0.3, s: 0.7, r: 0.3, gain: 0.1, reverb: 0.4 },
    { id: "pluckylead", label: { cs: "pluck lead", en: "pluck lead" }, osc: "square", unison: 2, detune: 10, cutoff: 3000, cutoffEnv: 2000, q: 3, a: 0.003, d: 0.2, s: 0.2, r: 0.2, gain: 0.1, reverb: 0.45 },
    { id: "sinelead", label: { cs: "sine lead", en: "sine lead" }, osc: "sine", unison: 1, detune: 0, cutoff: 5000, cutoffEnv: 0, q: 1, a: 0.03, d: 0.2, s: 0.7, r: 0.3, gain: 0.16, reverb: 0.5 },
  ],
};

export function findVoice(layer: MelodicId, id: string): Voice {
  const list = VOICES[layer];
  return list.find((v) => v.id === id) ?? list[0];
}

export const DRUM_LABEL: Record<DrumId, { cs: string; en: string }> = {
  kick: { cs: "kick", en: "kick" }, clap: { cs: "clap", en: "clap" },
  chat: { cs: "hihat", en: "hi-hat" }, ohat: { cs: "open hat", en: "open hat" },
};
export const LAYER_LABEL: Record<MelodicId, { cs: string; en: string }> = {
  sub: { cs: "basa", en: "bass" }, pad: { cs: "akordy", en: "chords" },
  arp: { cs: "arp", en: "arp" }, pluck: { cs: "pluck", en: "pluck" }, lead: { cs: "lead", en: "lead" },
};

/* ── Pomocné (seedovatelné RNG kvůli serverovému sync) ─────────── */
let RNG: () => number = Math.random;
function rand<T>(a: T[]): T { return a[Math.floor(RNG() * a.length)]; }
function chance(p: number): boolean { return RNG() < p; }
function seededRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function withRng<T>(rng: () => number, fn: () => T): T {
  const prev = RNG; RNG = rng; try { return fn(); } finally { RNG = prev; }
}
function scaleDeg(root: number, scaleName: string, deg: number): number {
  const sc = SCALES[scaleName] ?? SCALES.minorPenta;
  const n = sc.length;
  const oct = Math.floor(deg / n);
  return root + 12 * oct + sc[((deg % n) + n) % n];
}
const PROGRESSIONS = [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 3, 4, 4], [5, 4, 0, 3], [0, 5, 4, 3]];

function chordTones(root: number, scaleName: string, deg: number, octave: number): number[] {
  return [deg, deg + 2, deg + 4].map((d) => scaleDeg(root, scaleName, d) + 12 * octave);
}

/* ── Generátory (house / moderní elektronika) ──────────────────── */
function genDrums(): SongState["drums"] {
  const kick = new Array(TOTAL).fill(false);
  const clap = new Array(TOTAL).fill(false);
  const chat = new Array(TOTAL).fill(false);
  const ohat = new Array(TOTAL).fill(false);
  const fourFloor = chance(0.7);
  for (let bar = 0; bar < BARS; bar++) {
    const b = bar * SPB;
    if (fourFloor) { for (let s = 0; s < SPB; s += 4) kick[b + s] = true; }
    else { kick[b] = true; kick[b + 6] = true; kick[b + 10] = true; }
    clap[b + 4] = true; clap[b + 12] = true;
    for (let s = 2; s < SPB; s += 4) ohat[b + s] = true;          // offbeaty
    for (let s = 0; s < SPB; s += 2) if (!ohat[b + s] && chance(0.9)) chat[b + s] = true;
    if (chance(0.5)) chat[b + 15] = true;
  }
  return {
    kick: { pattern: kick, muted: false },
    clap: { pattern: clap, muted: false },
    chat: { pattern: chat, muted: false },
    ohat: { pattern: ohat, muted: false },
  };
}
function genChords(): number[] { return [...rand(PROGRESSIONS)]; }

function genSub(base: { root: number; scaleName: string; chords: number[] }, inst: string): MelLayer {
  const notes: RNote[] = [];
  base.chords.forEach((deg, bar) => {
    const b = bar * SPB;
    const m = scaleDeg(base.root, base.scaleName, deg) - 12;
    for (let s = 0; s < SPB; s += 4) notes.push({ step: b + s, midi: m, dur: 3 }); // pumpující basa po dobách
  });
  return { inst, notes, muted: false };
}
function genPad(base: { root: number; scaleName: string; chords: number[] }, inst: string): MelLayer {
  const notes: RNote[] = [];
  base.chords.forEach((deg, bar) => {
    for (const m of chordTones(base.root, base.scaleName, deg, 0)) notes.push({ step: bar * SPB, midi: m, dur: SPB });
  });
  return { inst, notes, muted: false };
}
function genArp(base: { root: number; scaleName: string; chords: number[] }, inst: string): MelLayer {
  const notes: RNote[] = [];
  const dir = chance(0.5);
  base.chords.forEach((deg, bar) => {
    const tones = chordTones(base.root, base.scaleName, deg, 1);
    const seq = dir ? [...tones, tones[1]] : [tones[2], tones[1], tones[0], tones[1]];
    for (let s = 0; s < SPB; s += 2) notes.push({ step: bar * SPB + s, midi: seq[(s / 2) % seq.length], dur: 2 });
  });
  return { inst, notes, muted: chance(0.4) };
}
function genPluck(base: { root: number; scaleName: string; chords: number[] }, inst: string): MelLayer {
  const notes: RNote[] = [];
  base.chords.forEach((deg, bar) => {
    const tones = chordTones(base.root, base.scaleName, deg, 1);
    for (const s of [2, 6, 10, 14]) if (chance(0.7)) for (const m of tones) notes.push({ step: bar * SPB + s, midi: m, dur: 2 });
  });
  return { inst, notes, muted: chance(0.5) };
}
function genLead(base: { root: number; scaleName: string; chords: number[] }, inst: string): MelLayer {
  const notes: RNote[] = [];
  base.chords.forEach((deg, bar) => {
    const b = bar * SPB; let pos = 0;
    while (pos < SPB) {
      const dur = rand([2, 4, 4, 6]);
      if (chance(0.65)) notes.push({ step: b + pos, midi: scaleDeg(base.root, base.scaleName, deg + rand([0, 2, 4, 1, 5, 7])) + 12, dur });
      pos += dur;
    }
  });
  return { inst, notes, muted: chance(0.45) };
}

export function genSong(): SongState {
  const tempo = rand([120, 122, 124, 126, 128, 124, 128, 100, 110, 174]);
  const root = 48 + Math.floor(RNG() * 5);
  const scaleName = rand(["minorPenta", "minorPenta", "dorian", "major", "majorPenta"]);
  const chords = genChords();
  const base = { root, scaleName, chords };
  return {
    tempo, root, scaleName, chords,
    drums: genDrums(),
    sub: genSub(base, rand(VOICES.sub).id),
    pad: genPad(base, rand(VOICES.pad).id),
    arp: genArp(base, rand(VOICES.arp).id),
    pluck: genPluck(base, rand(VOICES.pluck).id),
    lead: genLead(base, rand(VOICES.lead).id),
  };
}

/* ── Mutace ────────────────────────────────────────────────────── */
export type Mutation = { state: SongState; label: { cs: string; en: string } };
function transpose(layer: MelLayer, d: number): MelLayer { return { ...layer, notes: layer.notes.map((n) => ({ ...n, midi: n.midi + d })) }; }

export function randomMutate(prev: SongState): Mutation {
  const s: SongState = JSON.parse(JSON.stringify(prev));
  const base = { root: s.root, scaleName: s.scaleName, chords: s.chords };
  const kind = rand(["tempo", "key", "inst", "remelody", "chords", "toggle", "toggle", "drumfill"]);

  if (kind === "tempo") {
    s.tempo = Math.max(60, Math.min(200, s.tempo + rand([-4, -2, 2, 4])));
    return { state: s, label: { cs: `Tempo → ${s.tempo}`, en: `Tempo → ${s.tempo}` } };
  }
  if (kind === "key") {
    const d = rand([-2, -1, 1, 2]); s.root += d;
    MELODIC_IDS.forEach((l) => { s[l] = transpose(s[l], d); });
    return { state: s, label: { cs: `Tónina ${d > 0 ? "+" : ""}${d}`, en: `Key ${d > 0 ? "+" : ""}${d}` } };
  }
  if (kind === "inst") {
    const l = rand(MELODIC_IDS); const v = rand(VOICES[l]); s[l].inst = v.id; s[l].muted = false;
    return { state: s, label: { cs: `${LAYER_LABEL[l].cs}: ${v.label.cs}`, en: `${LAYER_LABEL[l].en}: ${v.label.en}` } };
  }
  if (kind === "remelody") {
    const l = rand(["arp", "pluck", "lead", "sub"] as MelodicId[]);
    const gen = l === "sub" ? genSub : l === "arp" ? genArp : l === "pluck" ? genPluck : genLead;
    s[l] = { ...gen(base, s[l].inst), muted: false };
    return { state: s, label: { cs: `Nová linka: ${LAYER_LABEL[l].cs}`, en: `New line: ${LAYER_LABEL[l].en}` } };
  }
  if (kind === "chords") {
    s.chords = genChords(); const nb = { root: s.root, scaleName: s.scaleName, chords: s.chords };
    s.sub = { ...genSub(nb, s.sub.inst), muted: s.sub.muted };
    s.pad = { ...genPad(nb, s.pad.inst), muted: s.pad.muted };
    s.arp = { ...genArp(nb, s.arp.inst), muted: s.arp.muted };
    s.pluck = { ...genPluck(nb, s.pluck.inst), muted: s.pluck.muted };
    s.lead = { ...genLead(nb, s.lead.inst), muted: s.lead.muted };
    return { state: s, label: { cs: "Nová harmonie", en: "New harmony" } };
  }
  if (kind === "drumfill") {
    s.drums = genDrums();
    return { state: s, label: { cs: "Nový beat", en: "New beat" } };
  }
  const id = rand(LAYER_IDS);
  if ((DRUM_IDS as string[]).includes(id)) {
    const d = id as DrumId; s.drums[d].muted = !s.drums[d].muted;
    return { state: s, label: { cs: `${s.drums[d].muted ? "Ztlumeno" : "Zpět"}: ${DRUM_LABEL[d].cs}`, en: `${s.drums[d].muted ? "Muted" : "On"}: ${DRUM_LABEL[d].en}` } };
  }
  const m = id as MelodicId; s[m].muted = !s[m].muted;
  return { state: s, label: { cs: `${s[m].muted ? "Ztlumeno" : "Zpět"}: ${LAYER_LABEL[m].cs}`, en: `${s[m].muted ? "Muted" : "On"}: ${LAYER_LABEL[m].en}` } };
}

/* ── Deterministický server stream ─────────────────────────────── */
export const SERVER_SEED = 0x5af3107a;
export const SERVER_TEMPO = 124;
export const BLOCK = 48; // po kolika kolech se base přegeneruje

export function serverRoundSec(): number { return TOTAL * ((60 / SERVER_TEMPO) / 4); }

export function genSongSeeded(seed: number): SongState {
  return withRng(seededRng(seed), () => { const s = genSong(); s.tempo = SERVER_TEMPO; return s; });
}
export function mutateSeeded(state: SongState, seed: number): SongState {
  return withRng(seededRng(seed), () => { const m = randomMutate(state); if (m.state.tempo !== SERVER_TEMPO) m.state.tempo = SERVER_TEMPO; return m.state; });
}

/** Deterministický stav serverového rádia pro kolo r (stejný pro všechny). */
export function serverStateAt(r: number): { state: SongState; label: { cs: string; en: string } } {
  const block = Math.floor(r / BLOCK);
  let s = genSongSeeded((SERVER_SEED ^ (block * 0x9e3779b9)) >>> 0);
  let label = { cs: "Start", en: "Start" };
  const within = r % BLOCK;
  for (let i = 0; i < within; i++) {
    withRng(seededRng(((SERVER_SEED ^ block) + i * 2654435761) >>> 0), () => {
      const m = randomMutate(s); if (m.state.tempo !== SERVER_TEMPO) m.state.tempo = SERVER_TEMPO;
      s = m.state; label = m.label;
    });
  }
  return { state: s, label };
}

/* ── Editor / mutace stavu ─────────────────────────────────────── */
export function scaleRowsFor(root: number, scaleName: string): number[] {
  const sc = SCALES[scaleName] ?? SCALES.minorPenta;
  const a: number[] = [];
  for (let oct = 0; oct < 2; oct++) for (const i of sc) a.push(root + 12 * oct + i);
  a.push(root + 24);
  return a;
}
export function midiToShort(m: number): string {
  return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][((m % 12) + 12) % 12];
}
export function toggleNote(notes: RNote[], step: number, midi: number): RNote[] {
  const i = notes.findIndex((n) => n.step === step && n.midi === midi);
  if (i >= 0) return notes.filter((_, j) => j !== i);
  return [...notes, { step, midi, dur: 2 }];
}
export function toggleDrumCell(pattern: boolean[], step: number): boolean[] {
  const p = [...pattern]; p[step] = !p[step]; return p;
}

/* ── UI ────────────────────────────────────────────────────────── */
export const radioUi = {
  cs: {
    back: "← Spaghetti.ltd", eyebrow: "Nekonečné generativní rádio", title: "Spaghetti Radio",
    intro: "Nekonečný elektronický set. Vyber si stanici.",
    start: "Spustit ♪", stop: "Zastavit ■", enter: "Vstoupit →",
    tempo: "Tempo", key: "Tónina", playtime: "Hraje", lastChange: "Poslední změna", changelog: "Historie změn", layers: "Vrstvy",
    muted: "ztlumeno", on: "hraje", hint: "Klikni do mřížky a vytvoř tón. Klik na existující = smazat.",
    nextIn: "Změna za", votes: "hlasů", yourVote: "tvůj hlas",
    modes: {
      server: { title: "Radio na serveru", desc: "Běží nonstop a všichni slyší totéž. Nedá se měnit — jen posloucháš společný proud." },
      my: { title: "My Radio", desc: "Náhodný song jen pro tebe. Uprav si ho, jak chceš — nikdo jiný to neslyší ani nemění." },
      shared: { title: "Shared Radio", desc: "Společný song, který upravují všichni naráz hlasováním. Každé kolo vyhraje nejvíc naklikané a změní se." },
    },
  },
  en: {
    back: "← Spaghetti.ltd", eyebrow: "Endless generative radio", title: "Spaghetti Radio",
    intro: "An endless electronic set. Pick a station.",
    start: "Start ♪", stop: "Stop ■", enter: "Enter →",
    tempo: "Tempo", key: "Key", playtime: "Playing", lastChange: "Last change", changelog: "Change log", layers: "Layers",
    muted: "muted", on: "playing", hint: "Click the grid to make a tone. Click an existing one to remove it.",
    nextIn: "Change in", votes: "votes", yourVote: "your vote",
    modes: {
      server: { title: "Server Radio", desc: "Runs nonstop, everyone hears the same. Can't be edited — you just listen to the shared stream." },
      my: { title: "My Radio", desc: "A random song just for you. Edit it however you like — nobody else hears or changes it." },
      shared: { title: "Shared Radio", desc: "A shared song everyone edits at once by voting. Each round the most-clicked change wins and applies." },
    },
  },
} as const;

export type Lang_ = Lang;
