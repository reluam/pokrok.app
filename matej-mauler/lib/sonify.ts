import type { Lang } from "./dictionaries";

export type SonNote = {
  freq: number;        // 0 = pomlka (rest)
  startMs: number;     // začátek vůči startu skladby
  durationMs: number;
  degree: number;      // pro vizualizaci (0..n)
  rest: boolean;
};

export type SonifyResult = {
  notes: SonNote[];
  waveform: OscillatorType;
  tempoBpm: number;
  scaleName: { cs: string; en: string };
  totalMs: number;
};

/* ── Stupnice (pentatonické → vždy znějí dobře) ───────────────── */
const SCALES: { semitones: number[]; cs: string; en: string }[] = [
  { semitones: [0, 2, 4, 7, 9],  cs: "durová pentatonika",   en: "major pentatonic" },
  { semitones: [0, 3, 5, 7, 10], cs: "mollová pentatonika",  en: "minor pentatonic" },
  { semitones: [0, 2, 5, 7, 9],  cs: "egyptská",             en: "egyptian" },
  { semitones: [0, 2, 4, 7, 11], cs: "snová",                en: "dreamy" },
];

const WAVEFORMS: OscillatorType[] = ["sine", "triangle", "square", "sawtooth"];

function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}

const MAX_CHARS = 40;

export function sonify(input: string): SonifyResult | null {
  const text = input.trim();
  if (!text) return null;

  const h = hash(text);

  const scale = SCALES[h % SCALES.length];
  const waveform = WAVEFORMS[(h >> 3) % WAVEFORMS.length];
  const tempoBpm = 72 + ((h >> 6) % 120);          // 72–191 BPM
  const octaveBase = (h >> 11) % 2;                 // 0 nebo 1 oktáva navíc
  const rootHz = 220 * Math.pow(2, octaveBase);     // A3 nebo A4

  const eighth = (60000 / tempoBpm) / 2;            // délka osminky v ms

  const chars = [...text].slice(0, MAX_CHARS);
  const notes: SonNote[] = [];
  let cursor = 0;

  chars.forEach((ch, i) => {
    const code = ch.codePointAt(0) ?? 32;

    // Mezera / interpunkce → pomlka nebo delší tón
    const isSpace = /\s/.test(ch);
    if (isSpace) {
      notes.push({ freq: 0, startMs: cursor, durationMs: eighth, degree: -1, rest: true });
      cursor += eighth;
      return;
    }

    const degree = code % scale.semitones.length;
    const octShift = Math.floor(code / scale.semitones.length) % 3;     // rozprostři do 3 oktáv
    const semitone = scale.semitones[degree] + 12 * octShift;
    const freq = rootHz * Math.pow(2, semitone / 12);

    // Délka: většinou osminka, občas (dle kódu) čtvrtka pro rytmickou pestrost
    const isLong = (code + i) % 5 === 0;
    const durationMs = isLong ? eighth * 2 : eighth;

    notes.push({ freq, startMs: cursor, durationMs, degree, rest: false });
    cursor += durationMs;
  });

  return {
    notes,
    waveform,
    tempoBpm,
    scaleName: { cs: scale.cs, en: scale.en },
    totalMs: cursor,
  };
}

/* ── UI texty + presety ───────────────────────────────────────── */

export const sonifyUi = {
  cs: {
    back: "← Spaghetti.ltd",
    eyebrow: "Sonifikace absurdit",
    title: "Jak to zní?",
    intro: "Vlož cokoliv. Algoritmus z toho udělá melodii. Každý vstup zní jinak.",
    placeholder: "Napiš slovo, jméno, cokoliv…",
    play: "Přehrát ♪",
    playing: "Hraje…",
    stop: "Zastavit ■",
    presetsLabel: "Nebo zkus:",
    statsTempo: "Tempo",
    statsScale: "Stupnice",
    statsWave: "Vlna",
    statsNotes: "Tónů",
    bpm: "BPM",
    empty: "Sem napiš něco a zjisti, jak to zní.",
    disclaimer: "Stejný vstup zní vždy stejně. Hudba je tu deterministická, na rozdíl od života.",
  },
  en: {
    back: "← Spaghetti.ltd",
    eyebrow: "Sonification of the absurd",
    title: "What does it sound like?",
    intro: "Type anything. The algorithm turns it into a melody. Every input sounds different.",
    placeholder: "Type a word, a name, anything…",
    play: "Play ♪",
    playing: "Playing…",
    stop: "Stop ■",
    presetsLabel: "Or try:",
    statsTempo: "Tempo",
    statsScale: "Scale",
    statsWave: "Wave",
    statsNotes: "Notes",
    bpm: "BPM",
    empty: "Type something here and find out how it sounds.",
    disclaimer: "The same input always sounds the same. Music here is deterministic, unlike life.",
  },
} as const;

export function presets(lang: Lang): { label: string; value: string }[] {
  const today = new Date().toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-GB");
  return lang === "cs"
    ? [
        { label: "dnešní datum", value: today },
        { label: "Spaghetti.ltd", value: "Spaghetti.ltd" },
        { label: "číslo 42", value: "42" },
        { label: "ahoj světe", value: "ahoj světe" },
      ]
    : [
        { label: "today's date", value: today },
        { label: "Spaghetti.ltd", value: "Spaghetti.ltd" },
        { label: "the number 42", value: "42" },
        { label: "hello world", value: "hello world" },
      ];
}

export function waveLabel(w: OscillatorType): string {
  const labels: Record<string, string> = { sine: "∿ sine", triangle: "△ triangle", square: "▭ square", sawtooth: "◹ saw" };
  return labels[w] ?? w;
}
