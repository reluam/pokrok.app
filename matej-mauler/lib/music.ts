import type { Lang } from "./dictionaries";

/* ── Konfigurace ────────────────────────────────────────────────── */

export const MELODY_STEPS = 8;        // kolik not má melodie
export const ROUND_SECONDS = 60;      // délka kola — ladí s minutovým Vercel cronem

export type Phase = "note" | "instrument" | "drums" | "done";

export type NoteEvent = { type: "note" | "rest"; midi: number | null };

export type Option = {
  id: string;
  label: { cs: string; en: string };
  payload: { midi?: number | null; wave?: OscillatorType; pattern?: string };
};

export type RoundState = {
  id: number;
  phase: Phase;
  stepIndex: number;
  options: Option[];
  deadline: string;
  counts: Record<string, number>;
};

export type SongState = {
  id: number;
  scaleRoot: number;
  scaleName: string;
  tempo: number;
  status: Phase | "melody";
  instrument: OscillatorType | null;
  drums: string | null;
  events: NoteEvent[];
};

export type FinishedSong = {
  id: number;
  scaleRoot: number;
  scaleName: string;
  tempo: number;
  instrument: OscillatorType;
  drums: string;
  events: NoteEvent[];
  createdAt: string;
};

export type MusicState = {
  song: SongState;
  round: RoundState | null;
  finished: FinishedSong[];
  serverNow: string;
};

/* ── Hudební teorie ─────────────────────────────────────────────── */

export const SCALES: Record<string, number[]> = {
  majorPenta: [0, 2, 4, 7, 9],
  minorPenta: [0, 3, 5, 7, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};

export const SCALE_NAMES = Object.keys(SCALES);

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiToName(m: number): string {
  return NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1);
}
export function midiToFreq(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12);
}

/** Seznam midi not škály v pohodlném rozsahu (~2 oktávy nad kořenem). */
export function scaleMidiNotes(root: number, scaleName: string): number[] {
  const intervals = SCALES[scaleName] ?? SCALES.majorPenta;
  const notes: number[] = [];
  for (let oct = 0; oct < 2; oct++) {
    for (const iv of intervals) notes.push(root + 12 * oct + iv);
  }
  notes.push(root + 24);
  return notes;
}

/* ── Generování možností (vždy hudebně smysluplné) ─────────────── */

function arrowLabel(deltaIdx: number): { cs: string; en: string } {
  if (deltaIdx === 0) return { cs: "stejně", en: "same" };
  if (deltaIdx === 1) return { cs: "o stupeň výš", en: "step up" };
  if (deltaIdx === -1) return { cs: "o stupeň níž", en: "step down" };
  if (deltaIdx > 1) return { cs: "skok nahoru", en: "leap up" };
  return { cs: "skok dolů", en: "leap down" };
}

export function generateNoteOptions(
  root: number, scaleName: string, prevMidi: number | null, rng: () => number
): Option[] {
  const notes = scaleMidiNotes(root, scaleName);
  const opts: Option[] = [];

  if (prevMidi === null) {
    // První nota — kolem kořene
    const rootIdx = notes.indexOf(root);
    const picks = [rootIdx, rootIdx + 1, rootIdx + 2, rootIdx + (scaleName.includes("Penta") ? 3 : 4)];
    for (const p of picks) {
      const i = Math.max(0, Math.min(notes.length - 1, p));
      const m = notes[i];
      opts.push({ id: `n${m}`, label: { cs: midiToName(m), en: midiToName(m) }, payload: { midi: m } });
    }
  } else {
    const idx = notes.indexOf(prevMidi);
    const base = idx < 0 ? notes.indexOf(root) : idx;
    // jemné vedení hlasu + občasný skok / návrat ke kořeni
    const deltas = [-1, 0, 1, base > notes.length - 3 ? -2 : 2];
    for (const d of deltas) {
      const i = Math.max(0, Math.min(notes.length - 1, base + d));
      const m = notes[i];
      const lbl = arrowLabel(d);
      opts.push({ id: `n${m}-${d}`, label: { cs: `${midiToName(m)} · ${lbl.cs}`, en: `${midiToName(m)} · ${lbl.en}` }, payload: { midi: m } });
    }
  }

  // odstraň duplicity podle midi
  const seen = new Set<number>();
  const uniq = opts.filter((o) => {
    const m = o.payload.midi!;
    if (seen.has(m)) return false; seen.add(m); return true;
  });

  // vždy přidej pauzu
  uniq.push({ id: "rest", label: { cs: "pauza", en: "rest" }, payload: { midi: null } });
  return uniq;
}

/* ── Nástroje a bicí ───────────────────────────────────────────── */

export const INSTRUMENTS: { wave: OscillatorType; label: { cs: string; en: string } }[] = [
  { wave: "sine", label: { cs: "flétna (sine)", en: "flute (sine)" } },
  { wave: "triangle", label: { cs: "měkký (triangle)", en: "soft (triangle)" } },
  { wave: "square", label: { cs: "chiptune (square)", en: "chiptune (square)" } },
  { wave: "sawtooth", label: { cs: "synth (saw)", en: "synth (saw)" } },
];

export const DRUMS: { id: string; label: { cs: string; en: string } }[] = [
  { id: "none", label: { cs: "bez bicích", en: "no drums" } },
  { id: "fourFloor", label: { cs: "house (4/4)", en: "four-on-floor" } },
  { id: "rock", label: { cs: "rock", en: "rock" } },
  { id: "hats", label: { cs: "jen hi-haty", en: "hats only" } },
];

/** Pro daný beat vrátí, co má hrát z bicích. */
export function drumHits(pattern: string, beat: number): { kick: boolean; snare: boolean; hat: boolean } {
  const b = beat % 4;
  switch (pattern) {
    case "fourFloor": return { kick: true, snare: false, hat: b % 2 === 1 };
    case "rock": return { kick: b === 0 || b === 2, snare: b === 1 || b === 3, hat: true };
    case "hats": return { kick: false, snare: false, hat: true };
    default: return { kick: false, snare: false, hat: false };
  }
}

export function instrumentLabel(wave: OscillatorType, lang: Lang): string {
  return INSTRUMENTS.find((i) => i.wave === wave)?.label[lang] ?? wave;
}
export function drumLabel(id: string, lang: Lang): string {
  return DRUMS.find((d) => d.id === id)?.label[lang] ?? id;
}

export function optionsForInstrument(): Option[] {
  return INSTRUMENTS.map((i) => ({ id: `i-${i.wave}`, label: i.label, payload: { wave: i.wave } }));
}
export function optionsForDrums(): Option[] {
  return DRUMS.map((d) => ({ id: `d-${d.id}`, label: d.label, payload: { pattern: d.id } }));
}

/* ── UI ────────────────────────────────────────────────────────── */

export const musicUi = {
  cs: {
    back: "← Spaghetti.ltd",
    eyebrow: "Společné skládání hudby",
    title: "Hlasování o hudbě",
    intro: "Každé kolo se společně hlasuje o další notě. Když nikdo nehlasuje, vybere se náhoda. Z toho vzniká song.",
    phaseNote: "Hlasuj o další notě",
    phaseInstrument: "Hlasuj o nástroji",
    phaseDrums: "Hlasuj o bicích",
    nextIn: "Další kolo za",
    yourVote: "Tvůj hlas",
    votes: "hlasů",
    melody: "Melodie",
    play: "Přehrát song ♪",
    stop: "Zastavit ■",
    finishedTitle: "Hotové songy",
    finishedEmpty: "Zatím žádný hotový song. Pomoz vytvořit první.",
    step: "Nota",
    of: "z",
    tempo: "Tempo",
    scale: "Stupnice",
    seconds: "s",
    disclaimer: "Kolektivní rádio. Pokud nikdo nehlasuje, rozhodne náhoda — ale možnosti vždy dávají hudebně smysl.",
  },
  en: {
    back: "← Spaghetti.ltd",
    eyebrow: "Collaborative music making",
    title: "Vote the music",
    intro: "Each round, everyone votes on the next note. If nobody votes, chance decides. A song emerges from it.",
    phaseNote: "Vote on the next note",
    phaseInstrument: "Vote on the instrument",
    phaseDrums: "Vote on the drums",
    nextIn: "Next round in",
    yourVote: "Your vote",
    votes: "votes",
    melody: "Melody",
    play: "Play song ♪",
    stop: "Stop ■",
    finishedTitle: "Finished songs",
    finishedEmpty: "No finished song yet. Help create the first one.",
    step: "Note",
    of: "of",
    tempo: "Tempo",
    scale: "Scale",
    seconds: "s",
    disclaimer: "A collective radio. If nobody votes, chance decides — but the options always make musical sense.",
  },
} as const;

export const SCALE_LABEL: Record<string, string> = {
  majorPenta: "major pentatonic", minorPenta: "minor pentatonic", major: "major", dorian: "dorian",
};
