import { SCALES, midiToFreq } from "./music";
import type { Lang } from "./dictionaries";

export { midiToFreq };

/* ── Mřížka ─────────────────────────────────────────────────────── */
export const BARS = 4;
export const SPB = 16;             // 16 šestnáctin na takt
export const TOTAL = BARS * SPB;   // 64 kroků

export type DrumId = "kick" | "snare" | "hihat" | "clap";
export const DRUM_IDS: DrumId[] = ["kick", "snare", "hihat", "clap"];
export type MelodicId = "bass" | "chord" | "pluck" | "lead";
export const MELODIC_IDS: MelodicId[] = ["bass", "chord", "pluck", "lead"];
export type LayerId = DrumId | MelodicId;
export const LAYER_IDS: LayerId[] = [...DRUM_IDS, ...MELODIC_IDS];

export type RNote = { step: number; midi: number; dur: number };
export type MelLayer = { inst: string; notes: RNote[]; muted: boolean };

export type SongState = {
  tempo: number;
  root: number;          // midi kořene (např. 48 = C3)
  scaleName: string;
  chords: number[];      // 4 stupně (index do stupnice), jeden na takt
  drums: Record<DrumId, { pattern: boolean[]; muted: boolean }>;
  bass: MelLayer;
  chord: MelLayer;
  pluck: MelLayer;
  lead: MelLayer;
};

/* ── Nástroje ───────────────────────────────────────────────────── */
export type RInst = { id: string; label: { cs: string; en: string }; wave: OscillatorType; attack: number; rel: number; gain: number; harm?: number };

export const INSTS: Record<MelodicId, RInst[]> = {
  bass: [
    { id: "fingerbass", label: { cs: "prstová basa", en: "finger bass" }, wave: "triangle", attack: 0.01, rel: 0.5, gain: 0.34 },
    { id: "subbass", label: { cs: "sub bas", en: "sub bass" }, wave: "sine", attack: 0.01, rel: 0.8, gain: 0.4 },
    { id: "sawbass", label: { cs: "saw bas", en: "saw bass" }, wave: "sawtooth", attack: 0.005, rel: 0.4, gain: 0.22 },
    { id: "squarebass", label: { cs: "square bas", en: "square bass" }, wave: "square", attack: 0.005, rel: 0.4, gain: 0.2 },
  ],
  chord: [
    { id: "pad", label: { cs: "pad", en: "pad" }, wave: "sine", attack: 0.25, rel: 1.0, gain: 0.13 },
    { id: "organ", label: { cs: "varhany", en: "organ" }, wave: "square", attack: 0.04, rel: 0.6, gain: 0.1 },
    { id: "strings", label: { cs: "smyčce", en: "strings" }, wave: "sawtooth", attack: 0.2, rel: 0.9, gain: 0.1 },
    { id: "warmpad", label: { cs: "teplý pad", en: "warm pad" }, wave: "triangle", attack: 0.3, rel: 1.0, gain: 0.14 },
  ],
  pluck: [
    { id: "piano", label: { cs: "piano", en: "piano" }, wave: "triangle", attack: 0.005, rel: 0.4, gain: 0.2, harm: 0.3 },
    { id: "epluck", label: { cs: "el. pluck", en: "e-pluck" }, wave: "square", attack: 0.004, rel: 0.25, gain: 0.14 },
    { id: "xylo", label: { cs: "xylofon", en: "xylophone" }, wave: "sine", attack: 0.002, rel: 0.18, gain: 0.22, harm: 0.5 },
    { id: "harp", label: { cs: "harfa", en: "harp" }, wave: "triangle", attack: 0.004, rel: 0.6, gain: 0.18 },
  ],
  lead: [
    { id: "violin", label: { cs: "housle", en: "violin" }, wave: "sawtooth", attack: 0.12, rel: 0.6, gain: 0.13 },
    { id: "flute", label: { cs: "flétna", en: "flute" }, wave: "sine", attack: 0.05, rel: 0.5, gain: 0.18 },
    { id: "synthlead", label: { cs: "synth lead", en: "synth lead" }, wave: "square", attack: 0.01, rel: 0.4, gain: 0.12 },
    { id: "sawlead", label: { cs: "saw lead", en: "saw lead" }, wave: "sawtooth", attack: 0.02, rel: 0.4, gain: 0.12 },
  ],
};

export function findRInst(layer: MelodicId, id: string): RInst {
  const list = INSTS[layer];
  return list.find((i) => i.id === id) ?? list[0];
}

export const DRUM_LABEL: Record<DrumId, { cs: string; en: string }> = {
  kick: { cs: "kopák", en: "kick" }, snare: { cs: "snare", en: "snare" },
  hihat: { cs: "hihat", en: "hihat" }, clap: { cs: "clap", en: "clap" },
};
export const LAYER_LABEL: Record<MelodicId, { cs: string; en: string }> = {
  bass: { cs: "basa", en: "bass" }, chord: { cs: "akordy", en: "chords" },
  pluck: { cs: "pluck", en: "pluck" }, lead: { cs: "lead", en: "lead" },
};

/* ── Pomocné ───────────────────────────────────────────────────── */
function rand<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
function chance(p: number): boolean { return Math.random() < p; }

function scaleDeg(root: number, scaleName: string, deg: number): number {
  const sc = SCALES[scaleName] ?? SCALES.majorPenta;
  const n = sc.length;
  const oct = Math.floor(deg / n);
  return root + 12 * oct + sc[((deg % n) + n) % n];
}

const PROGRESSIONS = [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 3, 4, 4], [0, 0, 3, 4]];

/* ── Generátory ────────────────────────────────────────────────── */

function genDrums(): SongState["drums"] {
  const kick = new Array(TOTAL).fill(false);
  const snare = new Array(TOTAL).fill(false);
  const hihat = new Array(TOTAL).fill(false);
  const clap = new Array(TOTAL).fill(false);
  for (let bar = 0; bar < BARS; bar++) {
    const b = bar * SPB;
    kick[b] = true; kick[b + 8] = true;
    if (chance(0.5)) kick[b + 11] = true;
    if (chance(0.3)) kick[b + 14] = true;
    snare[b + 4] = true; snare[b + 12] = true;
    if (chance(0.4)) clap[b + 12] = true;
    for (let s = 0; s < SPB; s += 2) if (chance(0.85)) hihat[b + s] = true;
    if (chance(0.4)) hihat[b + 7] = true;
  }
  return {
    kick: { pattern: kick, muted: false },
    snare: { pattern: snare, muted: false },
    hihat: { pattern: hihat, muted: false },
    clap: { pattern: clap, muted: true },
  };
}

function genChords(): number[] { return [...rand(PROGRESSIONS)]; }

function chordTones(root: number, scaleName: string, deg: number, octave: number): number[] {
  return [deg, deg + 2, deg + 4].map((d) => scaleDeg(root, scaleName, d) + 12 * octave);
}

function genChordLayer(state: Pick<SongState, "root" | "scaleName" | "chords">, inst: string): MelLayer {
  const notes: RNote[] = [];
  state.chords.forEach((deg, bar) => {
    for (const m of chordTones(state.root, state.scaleName, deg, 1)) notes.push({ step: bar * SPB, midi: m, dur: SPB });
  });
  return { inst, notes, muted: false };
}

function genBass(state: Pick<SongState, "root" | "scaleName" | "chords">, inst: string): MelLayer {
  const notes: RNote[] = [];
  state.chords.forEach((deg, bar) => {
    const b = bar * SPB;
    const rootM = scaleDeg(state.root, state.scaleName, deg) - 12;
    const steps = chance(0.5) ? [0, 6, 8, 14] : [0, 8];
    for (const s of steps) notes.push({ step: b + s, midi: rootM, dur: 3 });
    if (chance(0.4)) notes.push({ step: b + 12, midi: scaleDeg(state.root, state.scaleName, deg + 4) - 12, dur: 3 });
  });
  return { inst, notes, muted: false };
}

function genPluck(state: Pick<SongState, "root" | "scaleName" | "chords">, inst: string): MelLayer {
  const notes: RNote[] = [];
  state.chords.forEach((deg, bar) => {
    const tones = chordTones(state.root, state.scaleName, deg, 1);
    for (let s = 0; s < SPB; s += 2) {
      if (chance(0.7)) notes.push({ step: bar * SPB + s, midi: tones[(s / 2) % tones.length], dur: 2 });
    }
  });
  return { inst, notes, muted: false };
}

function genLead(state: Pick<SongState, "root" | "scaleName" | "chords">, inst: string): MelLayer {
  const notes: RNote[] = [];
  state.chords.forEach((deg, bar) => {
    const b = bar * SPB;
    let pos = 0;
    while (pos < SPB) {
      const dur = rand([2, 2, 4, 4, 6]);
      if (chance(0.7)) {
        const d = deg + rand([0, 2, 4, 1, 3, 5, -1]);
        notes.push({ step: b + pos, midi: scaleDeg(state.root, state.scaleName, d) + 12, dur });
      }
      pos += dur;
    }
  });
  return { inst, notes, muted: false };
}

export function genSong(): SongState {
  const tempo = 96 + Math.floor(Math.random() * 40);
  const root = 48 + Math.floor(Math.random() * 5);
  const scaleName = rand(["majorPenta", "minorPenta", "major", "dorian"]);
  const chords = genChords();
  const base = { root, scaleName, chords };
  return {
    tempo, root, scaleName, chords,
    drums: genDrums(),
    bass: genBass(base, rand(INSTS.bass).id),
    chord: genChordLayer(base, rand(INSTS.chord).id),
    pluck: genPluck(base, rand(INSTS.pluck).id),
    lead: genLead(base, rand(INSTS.lead).id),
  };
}

/* ── Mutace ────────────────────────────────────────────────────── */

export type Mutation = { state: SongState; label: { cs: string; en: string } };

function transpose(layer: MelLayer, d: number): MelLayer {
  return { ...layer, notes: layer.notes.map((n) => ({ ...n, midi: n.midi + d })) };
}

export function randomMutate(prev: SongState): Mutation {
  const s: SongState = JSON.parse(JSON.stringify(prev));
  const kind = rand(["tempo", "key", "inst", "remelody", "chords", "toggle", "toggle"]);
  const base = { root: s.root, scaleName: s.scaleName, chords: s.chords };

  if (kind === "tempo") {
    const d = rand([-6, -4, 4, 6]);
    s.tempo = Math.max(60, Math.min(200, s.tempo + d));
    return { state: s, label: { cs: `Tempo → ${s.tempo}`, en: `Tempo → ${s.tempo}` } };
  }
  if (kind === "key") {
    const d = rand([-2, -1, 1, 2]);
    s.root += d;
    (["bass", "chord", "pluck", "lead"] as MelodicId[]).forEach((l) => { s[l] = transpose(s[l], d); });
    return { state: s, label: { cs: `Tónina ${d > 0 ? "+" : ""}${d}`, en: `Key ${d > 0 ? "+" : ""}${d}` } };
  }
  if (kind === "inst") {
    const l = rand(MELODIC_IDS);
    const opt = rand(INSTS[l]);
    s[l].inst = opt.id;
    return { state: s, label: { cs: `${LAYER_LABEL[l].cs}: ${opt.label.cs}`, en: `${LAYER_LABEL[l].en}: ${opt.label.en}` } };
  }
  if (kind === "remelody") {
    const l = rand(["pluck", "lead", "bass"] as MelodicId[]);
    const gen = l === "bass" ? genBass : l === "pluck" ? genPluck : genLead;
    s[l] = { ...gen(base, s[l].inst), muted: s[l].muted };
    return { state: s, label: { cs: `Nová melodie: ${LAYER_LABEL[l].cs}`, en: `New melody: ${LAYER_LABEL[l].en}` } };
  }
  if (kind === "chords") {
    s.chords = genChords();
    const nb = { root: s.root, scaleName: s.scaleName, chords: s.chords };
    s.bass = { ...genBass(nb, s.bass.inst), muted: s.bass.muted };
    s.chord = { ...genChordLayer(nb, s.chord.inst), muted: s.chord.muted };
    s.pluck = { ...genPluck(nb, s.pluck.inst), muted: s.pluck.muted };
    s.lead = { ...genLead(nb, s.lead.inst), muted: s.lead.muted };
    return { state: s, label: { cs: "Nová harmonie", en: "New harmony" } };
  }
  // toggle mute (drums i melodic)
  const id = rand(LAYER_IDS);
  if (DRUM_IDS.includes(id as DrumId)) {
    const d = id as DrumId; s.drums[d].muted = !s.drums[d].muted;
    return { state: s, label: { cs: `${s.drums[d].muted ? "Ztlumeno" : "Zapnuto"}: ${DRUM_LABEL[d].cs}`, en: `${s.drums[d].muted ? "Muted" : "On"}: ${DRUM_LABEL[d].en}` } };
  }
  const m = id as MelodicId; s[m].muted = !s[m].muted;
  return { state: s, label: { cs: `${s[m].muted ? "Ztlumeno" : "Zapnuto"}: ${LAYER_LABEL[m].cs}`, en: `${s[m].muted ? "Muted" : "On"}: ${LAYER_LABEL[m].en}` } };
}

/* ── UI texty ──────────────────────────────────────────────────── */
export const radioUi = {
  cs: {
    back: "← Spaghetti.ltd", eyebrow: "Nekonečné generativní rádio", title: "Spaghetti Radio",
    intro: "Song, který hraje pořád dokola a každé 4 takty se sám náhodně promění. Vlevo to vidíš, vpravo to poslouchá.",
    start: "Spustit rádio ♪", stop: "Zastavit ■",
    tempo: "Tempo", key: "Tónina", lastChange: "Poslední změna", layers: "Vrstvy",
    muted: "ztlumeno", on: "hraje", hint: "Každý loop = jedna náhodná změna (tempo, tónina, nástroj, melodie, harmonie…).",
  },
  en: {
    back: "← Spaghetti.ltd", eyebrow: "Endless generative radio", title: "Spaghetti Radio",
    intro: "A song that loops forever and randomly mutates every 4 bars. You watch it on the left, it plays on the right.",
    start: "Start radio ♪", stop: "Stop ■",
    tempo: "Tempo", key: "Key", lastChange: "Last change", layers: "Layers",
    muted: "muted", on: "playing", hint: "Each loop = one random change (tempo, key, instrument, melody, harmony…).",
  },
} as const;

export type Lang_ = Lang;
