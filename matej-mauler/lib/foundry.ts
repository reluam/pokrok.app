import type { Lang } from "./dictionaries";

/* ── Datový model zvuku ─────────────────────────────────────────── */

export type ToneLayer = {
  kind: "tone";
  wave: OscillatorType;
  freqStart: number;
  freqEnd: number;
  sweep: "lin" | "exp";
  startMs: number;
  durMs: number;
  gain: number;
  attackMs: number;
  vibratoHz?: number;
  vibratoDepth?: number;
};

export type NoiseLayer = {
  kind: "noise";
  color: "white" | "pink";
  startMs: number;
  durMs: number;
  gain: number;
  attackMs: number;
  filterType?: BiquadFilterType;
  filterFreqStart?: number;
  filterFreqEnd?: number;
  q?: number;
};

export type Layer = ToneLayer | NoiseLayer;

export type SoundSpec = { layers: Layer[]; totalMs: number; tags: string[] };

/* ── Determinismus ─────────────────────────────────────────────── */

function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}
export function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/* ── Buildery vrstev ───────────────────────────────────────────── */

type R = () => number;

function tone(o: { freqStart: number; durMs: number } & Partial<ToneLayer>): ToneLayer {
  return {
    kind: "tone", wave: o.wave ?? "sine",
    freqStart: o.freqStart, freqEnd: o.freqEnd ?? o.freqStart,
    sweep: o.sweep ?? "exp", startMs: o.startMs ?? 0, durMs: o.durMs,
    gain: o.gain ?? 0.2, attackMs: o.attackMs ?? 4,
    vibratoHz: o.vibratoHz, vibratoDepth: o.vibratoDepth,
  };
}
function noise(o: { durMs: number } & Partial<NoiseLayer>): NoiseLayer {
  return {
    kind: "noise", color: o.color ?? "white",
    startMs: o.startMs ?? 0, durMs: o.durMs, gain: o.gain ?? 0.2, attackMs: o.attackMs ?? 4,
    filterType: o.filterType, filterFreqStart: o.filterFreqStart, filterFreqEnd: o.filterFreqEnd, q: o.q,
  };
}

type RecipeOut = { layers: Layer[]; durMs: number };
type Recipe = (r: R) => RecipeOut;

/* ── Syntézní rodiny ───────────────────────────────────────────── */

const FAMILIES: Record<string, Recipe> = {
  /* zbraně / sci-fi */
  laser: (r) => { const f0 = 1400 + r() * 700, d = 240 + r() * 140; return { layers: [tone({ wave: "sawtooth", freqStart: f0, freqEnd: 120, sweep: "exp", durMs: d, gain: 0.22, attackMs: 3 }), noise({ durMs: 60, gain: 0.07, filterType: "highpass", filterFreqStart: 3000, filterFreqEnd: 3000 })], durMs: d }; },
  blaster: (r) => { const d = 300; return { layers: [tone({ wave: "square", freqStart: 900 + r() * 300, freqEnd: 90, sweep: "exp", durMs: d, gain: 0.2 }), tone({ wave: "sawtooth", freqStart: 1800, freqEnd: 200, sweep: "exp", durMs: d, gain: 0.1 })], durMs: d }; },
  gunshot: () => ({ layers: [noise({ durMs: 220, gain: 0.36, attackMs: 1, filterType: "lowpass", filterFreqStart: 2000, filterFreqEnd: 120, q: 1 }), tone({ wave: "sine", freqStart: 120, freqEnd: 40, sweep: "exp", durMs: 200, gain: 0.24 })], durMs: 240 }),
  machinegun: () => { const ls: Layer[] = []; let at = 0; for (let i = 0; i < 8; i++) { ls.push(noise({ durMs: 70, startMs: at, gain: 0.28, attackMs: 1, filterType: "lowpass", filterFreqStart: 1600, filterFreqEnd: 200, q: 1 })); at += 90; } return { layers: ls, durMs: at }; },
  explosion: (r) => { const d = 800 + r() * 600; return { layers: [noise({ durMs: d, gain: 0.34, attackMs: 6, filterType: "lowpass", filterFreqStart: 900, filterFreqEnd: 60, q: 1 }), tone({ wave: "sine", freqStart: 90, freqEnd: 26, sweep: "exp", durMs: d * 0.85, gain: 0.3 })], durMs: d }; },
  ricochet: (r) => { const ls: Layer[] = []; let at = 0; for (let i = 0; i < 4; i++) { const f = 2200 - i * 300 + r() * 200; ls.push(tone({ wave: "sine", freqStart: f, freqEnd: f * 0.8, sweep: "exp", startMs: at, durMs: 90, gain: 0.18 })); at += 70; } return { layers: ls, durMs: at + 60 }; },
  sword: () => ({ layers: [noise({ durMs: 260, gain: 0.2, attackMs: 30, filterType: "bandpass", filterFreqStart: 1200, filterFreqEnd: 4000, q: 1.4 }), tone({ wave: "triangle", freqStart: 1800, freqEnd: 2400, sweep: "lin", durMs: 400, gain: 0.12 })], durMs: 420 }),
  rocket: () => ({ layers: [noise({ durMs: 1600, gain: 0.3, attackMs: 200, filterType: "lowpass", filterFreqStart: 400, filterFreqEnd: 1400, q: 0.8 }), tone({ wave: "sawtooth", freqStart: 60, freqEnd: 130, sweep: "lin", durMs: 1600, gain: 0.12, vibratoHz: 24, vibratoDepth: 8 })], durMs: 1600 }),

  /* příroda / počasí (ambient = delší) */
  raindrop: (r) => { const d = 150 + r() * 60; return { layers: [tone({ wave: "sine", freqStart: 1700 + r() * 500, freqEnd: 600, sweep: "exp", durMs: d, gain: 0.26, attackMs: 2 })], durMs: d + 20 }; },
  rain: () => ({ layers: [noise({ durMs: 5000, gain: 0.16, attackMs: 400, filterType: "bandpass", filterFreqStart: 3800, filterFreqEnd: 4200, q: 0.5 })], durMs: 5000 }),
  storm: () => ({ layers: [noise({ durMs: 6000, gain: 0.2, attackMs: 600, filterType: "lowpass", filterFreqStart: 1200, filterFreqEnd: 600, q: 0.7 }), noise({ durMs: 6000, gain: 0.12, attackMs: 600, filterType: "bandpass", filterFreqStart: 3500, filterFreqEnd: 4000, q: 0.5 })], durMs: 6000 }),
  wind: () => ({ layers: [noise({ durMs: 5000, color: "pink", gain: 0.22, attackMs: 500, filterType: "bandpass", filterFreqStart: 550, filterFreqEnd: 1100, q: 0.8 })], durMs: 5000 }),
  thunder: () => ({ layers: [noise({ durMs: 1800, gain: 0.34, attackMs: 90, filterType: "lowpass", filterFreqStart: 240, filterFreqEnd: 50, q: 1 }), tone({ wave: "sine", freqStart: 55, freqEnd: 26, sweep: "exp", durMs: 1800, gain: 0.22 })], durMs: 1800 }),
  ocean: () => ({ layers: [noise({ durMs: 6000, color: "pink", gain: 0.22, attackMs: 1200, filterType: "lowpass", filterFreqStart: 500, filterFreqEnd: 900, q: 0.6 })], durMs: 6000 }),
  fire: (r) => { const ls: Layer[] = [noise({ durMs: 4500, color: "pink", gain: 0.14, attackMs: 300, filterType: "lowpass", filterFreqStart: 1200, filterFreqEnd: 900, q: 0.6 })]; let at = 0; while (at < 4200) { ls.push(noise({ durMs: 40, startMs: at, gain: 0.16, attackMs: 1, filterType: "highpass", filterFreqStart: 2000, filterFreqEnd: 2000 })); at += 120 + r() * 320; } return { layers: ls, durMs: 4500 }; },
  earthquake: () => ({ layers: [tone({ wave: "sine", freqStart: 32, freqEnd: 24, sweep: "lin", durMs: 5000, gain: 0.34, vibratoHz: 7, vibratoDepth: 5 }), noise({ durMs: 5000, gain: 0.12, attackMs: 600, filterType: "lowpass", filterFreqStart: 120, filterFreqEnd: 70, q: 1 })], durMs: 5000 }),
  water: (r) => { const ls: Layer[] = []; let at = 0; for (let i = 0; i < 5; i++) { const f = 500 + r() * 1400; ls.push(tone({ wave: "sine", freqStart: f, freqEnd: f * 1.8, sweep: "exp", startMs: at, durMs: 70, gain: 0.16 })); at += 80 + r() * 90; } return { layers: ls, durMs: at + 80 }; },
  drip: (r) => ({ layers: [tone({ wave: "sine", freqStart: 1400 + r() * 400, freqEnd: 700, sweep: "exp", durMs: 130, gain: 0.22 })], durMs: 150 }),
  splash: (r) => { const layers: Layer[] = [noise({ durMs: 220, gain: 0.24, attackMs: 3, filterType: "highpass", filterFreqStart: 900, filterFreqEnd: 2200 })]; let at = 60; for (let i = 0; i < 3; i++) { const f = 700 + r() * 900; layers.push(tone({ wave: "sine", freqStart: f, freqEnd: f * 1.6, sweep: "exp", startMs: at, durMs: 70, gain: 0.12 })); at += 70; } return { layers, durMs: 280 }; },
  steam: () => ({ layers: [noise({ durMs: 3000, gain: 0.18, attackMs: 200, filterType: "highpass", filterFreqStart: 4000, filterFreqEnd: 5000, q: 0.7 })], durMs: 3000 }),
  bubble: (r) => ({ layers: [tone({ wave: "sine", freqStart: 400 + r() * 300, freqEnd: 900, sweep: "exp", durMs: 120, gain: 0.18 })], durMs: 140 }),

  /* zvířata */
  bird: (r) => { const base = 2200 + r() * 400; const c = (at: number) => tone({ wave: "sine", freqStart: base, freqEnd: base + 400, sweep: "lin", startMs: at, durMs: 130, gain: 0.18, vibratoHz: 22, vibratoDepth: 180 }); return { layers: [c(0), c(180), c(340)], durMs: 470 }; },
  owl: () => ({ layers: [tone({ wave: "sine", freqStart: 420, freqEnd: 360, sweep: "exp", durMs: 300, gain: 0.2, attackMs: 40 }), tone({ wave: "sine", freqStart: 420, freqEnd: 360, sweep: "exp", startMs: 420, durMs: 320, gain: 0.2, attackMs: 40 })], durMs: 760 }),
  cricket: () => { const ls: Layer[] = []; let at = 0; for (let i = 0; i < 6; i++) { ls.push(tone({ wave: "square", freqStart: 4500, durMs: 22, startMs: at, gain: 0.1 })); at += 36; } return { layers: ls, durMs: 1200 }; },
  frog: () => ({ layers: [tone({ wave: "sawtooth", freqStart: 200, freqEnd: 150, sweep: "lin", durMs: 200, gain: 0.2, vibratoHz: 30, vibratoDepth: 40 })], durMs: 240 }),
  dog: () => ({ layers: [noise({ durMs: 120, gain: 0.16, attackMs: 4, filterType: "bandpass", filterFreqStart: 900, filterFreqEnd: 600, q: 1 }), tone({ wave: "sawtooth", freqStart: 320, freqEnd: 180, sweep: "exp", durMs: 160, gain: 0.22 })], durMs: 200 }),
  cat: () => ({ layers: [tone({ wave: "sawtooth", freqStart: 700, freqEnd: 500, sweep: "lin", durMs: 500, gain: 0.18, vibratoHz: 10, vibratoDepth: 60 })], durMs: 520 }),
  wolf: () => ({ layers: [tone({ wave: "sine", freqStart: 350, freqEnd: 620, sweep: "lin", durMs: 900, gain: 0.22, attackMs: 120, vibratoHz: 5, vibratoDepth: 25 })], durMs: 950 }),
  bee: () => ({ layers: [tone({ wave: "sawtooth", freqStart: 220, freqEnd: 240, sweep: "lin", durMs: 1400, gain: 0.16, vibratoHz: 45, vibratoDepth: 30 })], durMs: 1400 }),
  mosquito: () => ({ layers: [tone({ wave: "sawtooth", freqStart: 600, freqEnd: 660, sweep: "lin", durMs: 1600, gain: 0.1, vibratoHz: 12, vibratoDepth: 40 })], durMs: 1600 }),
  snake: () => ({ layers: [noise({ durMs: 1400, gain: 0.16, attackMs: 200, filterType: "highpass", filterFreqStart: 5000, filterFreqEnd: 6000, q: 0.8 })], durMs: 1400 }),

  /* stroje / doprava */
  engine: (r) => { const d = 1300, b = 70 + r() * 30; return { layers: [tone({ wave: "sawtooth", freqStart: b, freqEnd: b * 1.3, sweep: "lin", durMs: d, gain: 0.2, attackMs: 60, vibratoHz: 26, vibratoDepth: 14 }), tone({ wave: "square", freqStart: b * 1.5, freqEnd: b * 1.9, sweep: "lin", durMs: d, gain: 0.08, attackMs: 60, vibratoHz: 32, vibratoDepth: 10 })], durMs: d }; },
  helicopter: () => { const ls: Layer[] = []; let at = 0; while (at < 3000) { ls.push(noise({ durMs: 50, startMs: at, gain: 0.22, attackMs: 2, filterType: "lowpass", filterFreqStart: 400, filterFreqEnd: 200, q: 1 })); at += 95; } ls.push(tone({ wave: "sawtooth", freqStart: 70, durMs: 3000, gain: 0.1, vibratoHz: 11, vibratoDepth: 6 })); return { layers: ls, durMs: 3000 }; },
  airplane: () => ({ layers: [noise({ durMs: 4000, color: "pink", gain: 0.2, attackMs: 800, filterType: "bandpass", filterFreqStart: 700, filterFreqEnd: 900, q: 0.5 }), tone({ wave: "sawtooth", freqStart: 110, durMs: 4000, gain: 0.06, vibratoHz: 3, vibratoDepth: 4 })], durMs: 4000 }),
  train: () => { const ls: Layer[] = []; let at = 0; for (let i = 0; i < 12; i++) { ls.push(noise({ durMs: 60, startMs: at, gain: 0.2, attackMs: 3, filterType: "lowpass", filterFreqStart: 500, filterFreqEnd: 200, q: 1 })); at += i % 2 ? 140 : 220; } return { layers: ls, durMs: at }; },
  carhorn: () => ({ layers: [tone({ wave: "square", freqStart: 440, durMs: 700, gain: 0.16 }), tone({ wave: "square", freqStart: 554, durMs: 700, gain: 0.14 })], durMs: 740 }),
  motorcycle: () => ({ layers: [tone({ wave: "sawtooth", freqStart: 90, freqEnd: 160, sweep: "lin", durMs: 1500, gain: 0.22, vibratoHz: 40, vibratoDepth: 20 })], durMs: 1500 }),
  robot: () => { const ls: Layer[] = []; const fs = [300, 500, 400, 700]; let at = 0; for (const f of fs) { ls.push(tone({ wave: "square", freqStart: f, durMs: 90, startMs: at, gain: 0.16, vibratoHz: 30, vibratoDepth: 20 })); at += 100; } return { layers: ls, durMs: at }; },

  /* UI / hra */
  beep: (r) => ({ layers: [tone({ wave: "square", freqStart: 700 + r() * 500, durMs: 180, gain: 0.18, sweep: "lin" })], durMs: 200 }),
  coin: () => ({ layers: [tone({ wave: "square", freqStart: 988, durMs: 90, gain: 0.18 }), tone({ wave: "square", freqStart: 1319, startMs: 90, durMs: 360, gain: 0.18 })], durMs: 460 }),
  powerup: () => { const notes = [523, 659, 784, 1047]; return { layers: notes.map((f, i) => tone({ wave: "square", freqStart: f, durMs: 110, startMs: i * 80, gain: 0.16, sweep: "lin" })), durMs: notes.length * 80 + 80 }; },
  success: () => { const notes = [523, 659, 784, 1047, 1319]; return { layers: notes.map((f, i) => tone({ wave: "triangle", freqStart: f, durMs: 130, startMs: i * 90, gain: 0.18 })), durMs: notes.length * 90 + 120 }; },
  error: () => ({ layers: [tone({ wave: "square", freqStart: 200, freqEnd: 150, sweep: "lin", durMs: 320, gain: 0.2 }), tone({ wave: "square", freqStart: 150, startMs: 160, durMs: 260, gain: 0.18 })], durMs: 440 }),
  notification: () => ({ layers: [tone({ wave: "sine", freqStart: 880, durMs: 120, gain: 0.2 }), tone({ wave: "sine", freqStart: 1175, startMs: 120, durMs: 240, gain: 0.2 })], durMs: 380 }),
  jump: () => ({ layers: [tone({ wave: "square", freqStart: 200, freqEnd: 640, sweep: "lin", durMs: 200, gain: 0.18 })], durMs: 220 }),
  click: () => ({ layers: [noise({ durMs: 28, gain: 0.3, attackMs: 1, filterType: "highpass", filterFreqStart: 1500, filterFreqEnd: 1500 })], durMs: 50 }),
  buzzer: () => ({ layers: [tone({ wave: "square", freqStart: 160, durMs: 500, gain: 0.2, vibratoHz: 30, vibratoDepth: 20 })], durMs: 520 }),
  alarm: () => { const ls: Layer[] = []; let at = 0; for (let i = 0; i < 4; i++) { ls.push(tone({ wave: "square", freqStart: i % 2 ? 620 : 820, durMs: 170, startMs: at, gain: 0.16, sweep: "lin" })); at += 180; } return { layers: ls, durMs: at }; },
  siren: () => ({ layers: [tone({ wave: "sine", freqStart: 600, freqEnd: 1000, sweep: "lin", durMs: 1600, gain: 0.18, vibratoHz: 0.8, vibratoDepth: 200 })], durMs: 1600 }),
  teleport: () => ({ layers: [tone({ wave: "sine", freqStart: 300, freqEnd: 2400, sweep: "exp", durMs: 600, gain: 0.18, vibratoHz: 30, vibratoDepth: 60 }), noise({ durMs: 600, gain: 0.08, filterType: "highpass", filterFreqStart: 3000, filterFreqEnd: 6000 })], durMs: 600 }),
  portal: () => ({ layers: [tone({ wave: "sawtooth", freqStart: 120, freqEnd: 480, sweep: "exp", durMs: 1400, gain: 0.16, vibratoHz: 8, vibratoDepth: 40 })], durMs: 1400 }),
  magic: (r) => { const ls: Layer[] = []; let at = 0; for (let i = 0; i < 6; i++) { const f = 1200 + r() * 1600; ls.push(tone({ wave: "sine", freqStart: f, freqEnd: f * 1.5, sweep: "exp", startMs: at, durMs: 120, gain: 0.14 })); at += 70; } return { layers: ls, durMs: at + 100 }; },
  heal: () => { const notes = [523, 784, 1047]; return { layers: notes.map((f, i) => tone({ wave: "sine", freqStart: f, durMs: 500, startMs: i * 120, gain: 0.16, attackMs: 40 })), durMs: 900 }; },

  /* hudba / perkuse */
  bell: (r) => { const f = 520 + r() * 200, d = 1500; return { layers: [tone({ wave: "sine", freqStart: f, durMs: d, gain: 0.2 }), tone({ wave: "sine", freqStart: f * 2.01, durMs: d * 0.8, gain: 0.1 }), tone({ wave: "sine", freqStart: f * 3.02, durMs: d * 0.6, gain: 0.05 })], durMs: d }; },
  gong: () => ({ layers: [tone({ wave: "sine", freqStart: 110, durMs: 3000, gain: 0.22 }), tone({ wave: "sine", freqStart: 164, durMs: 2400, gain: 0.12 }), tone({ wave: "triangle", freqStart: 277, durMs: 1800, gain: 0.06 })], durMs: 3000 }),
  chime: () => ({ layers: [tone({ wave: "sine", freqStart: 1318, durMs: 1400, gain: 0.16 }), tone({ wave: "sine", freqStart: 1975, durMs: 1000, gain: 0.08 })], durMs: 1400 }),
  kick: () => ({ layers: [tone({ wave: "sine", freqStart: 150, freqEnd: 45, sweep: "exp", durMs: 180, gain: 0.34 })], durMs: 200 }),
  snare: () => ({ layers: [noise({ durMs: 180, gain: 0.26, attackMs: 1, filterType: "highpass", filterFreqStart: 1200, filterFreqEnd: 1200, q: 0.7 }), tone({ wave: "triangle", freqStart: 220, freqEnd: 180, sweep: "exp", durMs: 120, gain: 0.12 })], durMs: 200 }),
  hihat: () => ({ layers: [noise({ durMs: 70, gain: 0.2, attackMs: 1, filterType: "highpass", filterFreqStart: 7000, filterFreqEnd: 7000 })], durMs: 90 }),
  tom: () => ({ layers: [tone({ wave: "sine", freqStart: 220, freqEnd: 90, sweep: "exp", durMs: 260, gain: 0.3 })], durMs: 280 }),
  clap: () => ({ layers: [noise({ durMs: 120, gain: 0.26, attackMs: 1, filterType: "bandpass", filterFreqStart: 1500, filterFreqEnd: 1500, q: 1.2 })], durMs: 140 }),
  cowbell: () => ({ layers: [tone({ wave: "square", freqStart: 540, durMs: 200, gain: 0.16 }), tone({ wave: "square", freqStart: 800, durMs: 200, gain: 0.12 })], durMs: 220 }),
  woodblock: () => ({ layers: [tone({ wave: "sine", freqStart: 900, freqEnd: 700, sweep: "exp", durMs: 70, gain: 0.24 })], durMs: 90 }),
  pluck: (r) => { const f = 220 * Math.pow(2, Math.floor(r() * 12) / 12); return { layers: [tone({ wave: "triangle", freqStart: f, durMs: 600, gain: 0.2, attackMs: 2 }), tone({ wave: "sine", freqStart: f * 2, durMs: 300, gain: 0.06 })], durMs: 620 }; },
  drone: () => ({ layers: [tone({ wave: "sawtooth", freqStart: 110, durMs: 4000, gain: 0.14, attackMs: 400 }), tone({ wave: "sine", freqStart: 110, durMs: 4000, gain: 0.1, attackMs: 400 })], durMs: 4000 }),
  hum: () => ({ layers: [tone({ wave: "sine", freqStart: 120, durMs: 3500, gain: 0.16, attackMs: 300, vibratoHz: 5, vibratoDepth: 3 })], durMs: 3500 }),

  /* domácnost / lidé */
  doorbell: () => ({ layers: [tone({ wave: "sine", freqStart: 659, durMs: 500, gain: 0.2 }), tone({ wave: "sine", freqStart: 523, startMs: 450, durMs: 600, gain: 0.2 })], durMs: 1050 }),
  phone: () => { const ls: Layer[] = []; let at = 0; for (let i = 0; i < 2; i++) { ls.push(tone({ wave: "sine", freqStart: 480, durMs: 350, startMs: at, gain: 0.16 })); ls.push(tone({ wave: "sine", freqStart: 620, durMs: 350, startMs: at, gain: 0.16 })); at += 550; } return { layers: ls, durMs: at }; },
  clock: () => { const ls: Layer[] = []; let at = 0; for (let i = 0; i < 6; i++) { ls.push(tone({ wave: "sine", freqStart: i % 2 ? 1200 : 900, freqEnd: 600, sweep: "exp", durMs: 30, startMs: at, gain: 0.2 })); at += 500; } return { layers: ls, durMs: at }; },
  knock: () => ({ layers: [noise({ durMs: 80, gain: 0.26, attackMs: 2, filterType: "lowpass", filterFreqStart: 400, filterFreqEnd: 200, q: 1 }), noise({ durMs: 80, startMs: 180, gain: 0.26, attackMs: 2, filterType: "lowpass", filterFreqStart: 400, filterFreqEnd: 200, q: 1 })], durMs: 280 }),
  glass: () => ({ layers: [tone({ wave: "sine", freqStart: 2400, freqEnd: 1800, sweep: "exp", durMs: 600, gain: 0.16 }), noise({ durMs: 200, gain: 0.1, filterType: "highpass", filterFreqStart: 5000, filterFreqEnd: 5000 })], durMs: 620 }),
  crash: () => ({ layers: [noise({ durMs: 900, gain: 0.3, attackMs: 1, filterType: "highpass", filterFreqStart: 2500, filterFreqEnd: 1500, q: 0.6 })], durMs: 900 }),
  applause: () => { const ls: Layer[] = []; let at = 0; while (at < 2800) { ls.push(noise({ durMs: 30, startMs: at, gain: 0.12, attackMs: 1, filterType: "bandpass", filterFreqStart: 1800, filterFreqEnd: 1800, q: 1 })); at += 18 + Math.random() * 40; } return { layers: ls, durMs: 2800 }; },
  crowd: () => ({ layers: [noise({ durMs: 5000, color: "pink", gain: 0.16, attackMs: 800, filterType: "bandpass", filterFreqStart: 700, filterFreqEnd: 1100, q: 0.5 })], durMs: 5000 }),
  heartbeat: () => { const thump = (at: number, g: number) => tone({ wave: "sine", freqStart: 62, freqEnd: 38, sweep: "exp", startMs: at, durMs: 130, gain: g }); return { layers: [thump(0, 0.32), thump(170, 0.24), thump(650, 0.32), thump(820, 0.24)], durMs: 1050 }; },
  footstep: () => ({ layers: [noise({ durMs: 110, gain: 0.26, attackMs: 3, filterType: "lowpass", filterFreqStart: 350, filterFreqEnd: 180, q: 1 }), tone({ wave: "sine", freqStart: 95, freqEnd: 55, sweep: "exp", durMs: 110, gain: 0.16 })], durMs: 150 }),
  whistle: (r) => { const f = 1500 + r() * 400; return { layers: [tone({ wave: "sine", freqStart: f, freqEnd: f * 1.25, sweep: "lin", durMs: 500, gain: 0.18, attackMs: 30, vibratoHz: 7, vibratoDepth: 25 })], durMs: 500 }; },
  swoosh: () => ({ layers: [noise({ durMs: 420, color: "pink", gain: 0.22, attackMs: 60, filterType: "bandpass", filterFreqStart: 500, filterFreqEnd: 3200, q: 1.2 })], durMs: 440 }),
  zap: (r) => ({ layers: [noise({ durMs: 300, gain: 0.16, attackMs: 2, filterType: "highpass", filterFreqStart: 1800, filterFreqEnd: 3500, q: 0.8 }), tone({ wave: "square", freqStart: 2600 + r() * 800, freqEnd: 1400, sweep: "lin", durMs: 300, gain: 0.1, vibratoHz: 60, vibratoDepth: 400 })], durMs: 300 }),
  ufo: (r) => { const f = 380 + r() * 200; return { layers: [tone({ wave: "sine", freqStart: f, freqEnd: f * 1.1, sweep: "lin", durMs: 1500, gain: 0.2, attackMs: 120, vibratoHz: 6, vibratoDepth: 110 })], durMs: 1500 }; },
};

/* ── Modifikátory ───────────────────────────────────────────────── */

export type Mod = { pitch: number; durMul: number; bright: number; gainMul: number };
const NEUTRAL: Mod = { pitch: 0, durMul: 1, bright: 1, gainMul: 1 };

type ModWord = { adjust: Partial<Mod> };

/* ── Slovník ────────────────────────────────────────────────────── */

export type Word = {
  id: string;
  cs: string;
  en: string;
  family?: string;          // syntézní rodina (zvuk)
  mod?: Partial<Mod>;       // přednastavená variace
  modifier?: ModWord;       // úpravové slovo
  aliases?: string[];       // další hledatelné výrazy (normalizované)
};

function w(id: string, cs: string, en: string, family: string, mod?: Partial<Mod>, aliases?: string[]): Word {
  return { id, cs, en, family, mod, aliases };
}

export const MODIFIERS: Word[] = [
  { id: "m-big", cs: "velký", en: "big", modifier: { adjust: { pitch: -7, durMul: 1.4, gainMul: 1.1 } }, aliases: ["velka", "obrovsky", "huge", "large"] },
  { id: "m-small", cs: "malý", en: "small", modifier: { adjust: { pitch: 8, durMul: 0.6, gainMul: 0.9 } }, aliases: ["mala", "tiny", "mini"] },
  { id: "m-deep", cs: "hluboký", en: "deep", modifier: { adjust: { pitch: -12 } }, aliases: ["hluboka", "low", "basovy", "bass"] },
  { id: "m-high", cs: "vysoký", en: "high", modifier: { adjust: { pitch: 12 } }, aliases: ["vysoka", "treble", "pisklavy"] },
  { id: "m-long", cs: "dlouhý", en: "long", modifier: { adjust: { durMul: 2 } }, aliases: ["dlouha", "delsi"] },
  { id: "m-short", cs: "krátký", en: "short", modifier: { adjust: { durMul: 0.5 } }, aliases: ["kratka", "kratsi", "quick"] },
  { id: "m-soft", cs: "jemný", en: "soft", modifier: { adjust: { gainMul: 0.6, bright: 0.7 } }, aliases: ["jemna", "tichy", "quiet", "mekky"] },
  { id: "m-harsh", cs: "drsný", en: "harsh", modifier: { adjust: { gainMul: 1.2, bright: 1.6 } }, aliases: ["drsna", "ostry", "rough", "loud"] },
  { id: "m-bright", cs: "jasný", en: "bright", modifier: { adjust: { bright: 1.7 } }, aliases: ["jasna", "svetly"] },
  { id: "m-dark", cs: "temný", en: "dark", modifier: { adjust: { bright: 0.55 } }, aliases: ["temna", "tmavy", "muddy"] },
  { id: "m-fast", cs: "rychlý", en: "fast", modifier: { adjust: { durMul: 0.65 } }, aliases: ["rychla"] },
  { id: "m-slow", cs: "pomalý", en: "slow", modifier: { adjust: { durMul: 1.7 } }, aliases: ["pomala"] },
];

// Generátor slov: mnoho výrazů mapuje na rodinu (+ variace) → stovky možností.
export const WORDS: Word[] = [
  /* sci-fi / zbraně */
  w("laser", "laser", "laser", "laser"),
  w("phaser", "phaser", "phaser", "laser", { pitch: 3 }),
  w("blaster", "blaster", "blaster", "blaster"),
  w("pewpew", "pew pew", "pew pew", "laser", { pitch: 5 }, ["pew"]),
  w("raygun", "paprskomet", "ray gun", "laser", { pitch: -2 }),
  w("plasma", "plazma", "plasma", "blaster", { bright: 1.3 }),
  w("photon", "foton", "photon", "laser", { pitch: 7 }),
  w("gunshot", "výstřel", "gunshot", "gunshot", undefined, ["strelba", "shot", "pistole", "gun"]),
  w("rifle", "puška", "rifle", "gunshot", { pitch: -2 }),
  w("cannon", "dělo", "cannon", "explosion", { pitch: -4 }),
  w("machinegun", "kulomet", "machine gun", "machinegun"),
  w("explosion", "výbuch", "explosion", "explosion", undefined, ["exploze", "boom", "bomba", "bomb"]),
  w("nuke", "atomovka", "nuke", "explosion", { pitch: -6, durMul: 1.6 }),
  w("grenade", "granát", "grenade", "explosion", { pitch: 2, durMul: 0.7 }),
  w("ricochet", "odraz", "ricochet", "ricochet", undefined, ["odrazeni"]),
  w("sword", "meč", "sword", "sword", undefined, ["sek", "slash"]),
  w("rocket", "raketa", "rocket", "rocket", undefined, ["missile", "strela"]),
  w("laserbig", "obří laser", "giant laser", "laser", { pitch: -9, durMul: 1.5 }),

  /* příroda / počasí */
  w("raindrop", "kapka", "raindrop", "raindrop", undefined, ["kapka deste"]),
  w("rain", "déšť", "rain", "rain", undefined, ["prset", "lijak"]),
  w("rainheavy", "průtrž", "downpour", "rain", { gainMul: 1.3, durMul: 1.2 }),
  w("storm", "bouře", "storm", "storm", undefined, ["bourka"]),
  w("wind", "vítr", "wind", "wind", undefined, ["vichr", "vanek"]),
  w("breeze", "vánek", "breeze", "wind", { gainMul: 0.7, bright: 1.2 }),
  w("hurricane", "uragán", "hurricane", "storm", { gainMul: 1.3, pitch: -3 }),
  w("thunder", "hrom", "thunder", "thunder", undefined, ["blesk", "lightning"]),
  w("ocean", "oceán", "ocean", "ocean", undefined, ["more", "vlny", "sea", "waves"]),
  w("fire", "oheň", "fire", "fire", undefined, ["plamen", "flames", "ohen"]),
  w("campfire", "táborák", "campfire", "fire", { gainMul: 0.8 }),
  w("earthquake", "zemětřesení", "earthquake", "earthquake", undefined, ["otres", "rumble"]),
  w("water", "voda", "water", "water", undefined, ["bublani"]),
  w("drip", "kapání", "drip", "drip"),
  w("splash", "šplouch", "splash", "splash", undefined, ["cak", "plesk"]),
  w("steam", "pára", "steam", "steam", undefined, ["sycivy", "hiss"]),
  w("bubble", "bublina", "bubble", "bubble", undefined, ["bublinky"]),
  w("waterfall", "vodopád", "waterfall", "ocean", { bright: 1.4, pitch: 4 }),
  w("river", "řeka", "river", "ocean", { bright: 1.6 }),

  /* zvířata */
  w("bird", "pták", "bird", "bird", undefined, ["ptacek", "chirp", "zpev", "tweet"]),
  w("sparrow", "vrabec", "sparrow", "bird", { pitch: 2 }),
  w("eagle", "orel", "eagle", "bird", { pitch: -5, durMul: 1.4 }),
  w("owl", "sova", "owl", "owl", undefined, ["houkani"]),
  w("cricket", "cvrček", "cricket", "cricket", undefined, ["cvrlikani"]),
  w("frog", "žába", "frog", "frog", undefined, ["kvakani"]),
  w("dog", "pes", "dog", "dog", undefined, ["stekot", "bark", "haf"]),
  w("puppy", "štěně", "puppy", "dog", { pitch: 7, durMul: 0.7 }),
  w("cat", "kočka", "cat", "cat", undefined, ["mnoukani", "meow", "mnau"]),
  w("wolf", "vlk", "wolf", "wolf", undefined, ["vytí", "howl", "vyti"]),
  w("bee", "včela", "bee", "bee", undefined, ["bzukot", "buzz"]),
  w("mosquito", "komár", "mosquito", "mosquito", undefined, ["komar"]),
  w("snake", "had", "snake", "snake", undefined, ["sykot", "hiss"]),
  w("lion", "lev", "lion", "wolf", { pitch: -7, durMul: 1.2 }),
  w("rooster", "kohout", "rooster", "bird", { pitch: -3, durMul: 1.3 }),

  /* stroje / doprava */
  w("engine", "motor", "engine", "engine", undefined, ["stroj", "auto", "car"]),
  w("helicopter", "vrtulník", "helicopter", "helicopter", undefined, ["vrtule", "chopper"]),
  w("airplane", "letadlo", "airplane", "airplane", undefined, ["letoun", "jet", "tryskac"]),
  w("train", "vlak", "train", "train", undefined, ["lokomotiva"]),
  w("carhorn", "klakson", "car horn", "carhorn", undefined, ["troubeni", "honk"]),
  w("motorcycle", "motorka", "motorcycle", "motorcycle", undefined, ["moped"]),
  w("robot", "robot", "robot", "robot", undefined, ["android", "droid"]),
  w("spaceship", "vesmírná loď", "spaceship", "rocket", { pitch: -2, durMul: 1.3 }),
  w("submarine", "ponorka", "submarine", "siren", { pitch: -10 }),
  w("forklift", "vozík", "forklift beep", "beep", { pitch: -4 }),

  /* UI / hra */
  w("beep", "pípnutí", "beep", "beep", undefined, ["pip"]),
  w("coin", "mince", "coin", "coin", undefined, ["penize", "money"]),
  w("powerup", "power-up", "power-up", "powerup", undefined, ["bonus", "levelup"]),
  w("success", "úspěch", "success", "success", undefined, ["vitezstvi", "win", "fanfara"]),
  w("error", "chyba", "error", "error", undefined, ["spatne", "fail", "wrong"]),
  w("notification", "notifikace", "notification", "notification", undefined, ["upozorneni", "ding"]),
  w("jump", "skok", "jump", "jump", undefined, ["hop", "poskok"]),
  w("click", "klik", "click", "click", undefined, ["tap", "tik"]),
  w("buzzer", "bzučák", "buzzer", "buzzer", undefined, ["bzuk"]),
  w("alarm", "alarm", "alarm", "alarm", undefined, ["poplach", "budik"]),
  w("siren", "siréna", "siren", "siren", undefined, ["houkacka"]),
  w("teleport", "teleport", "teleport", "teleport", undefined, ["presun"]),
  w("portal", "portál", "portal", "portal", undefined, ["brana"]),
  w("magic", "kouzlo", "magic", "magic", undefined, ["jiskreni", "sparkle", "carodejnictvi"]),
  w("heal", "léčení", "heal", "heal", undefined, ["uzdraveni", "regenerace"]),
  w("levelcomplete", "level hotov", "level complete", "success", { durMul: 1.2 }),
  w("gameover", "game over", "game over", "error", { pitch: -3, durMul: 1.4 }),
  w("select", "výběr", "select", "click", { pitch: 5 }),
  w("zap", "zap", "zap", "zap", undefined, ["elektrina", "vyboj"]),
  w("ufo", "UFO", "UFO", "ufo", undefined, ["talir", "alien"]),

  /* hudba / perkuse */
  w("bell", "zvon", "bell", "bell", undefined, ["zvonek"]),
  w("gong", "gong", "gong", "gong"),
  w("chime", "zvonkohra", "chime", "chime", undefined, ["zvonecky"]),
  w("kick", "kopák", "kick drum", "kick", undefined, ["basak"]),
  w("snare", "virbl", "snare", "snare"),
  w("hihat", "hi-hat", "hi-hat", "hihat", undefined, ["cinel"]),
  w("tom", "tom", "tom", "tom"),
  w("clap", "tlesk", "clap", "clap", undefined, ["plesknuti"]),
  w("cowbell", "kravský zvonec", "cowbell", "cowbell"),
  w("woodblock", "dřívko", "woodblock", "woodblock"),
  w("pluck", "brnknutí", "pluck", "pluck", undefined, ["struna", "string"]),
  w("piano", "klavír", "piano note", "pluck", { pitch: 3 }),
  w("bass", "basa", "bass note", "pluck", { pitch: -12, durMul: 1.3 }),
  w("drone", "drone", "drone", "drone", undefined, ["zvuk pozadi", "pad"]),
  w("hum", "hučení", "hum", "hum", undefined, ["bzuceni"]),
  w("synthlead", "synth", "synth lead", "pluck", { pitch: 7 }),

  /* domácnost / lidé */
  w("doorbell", "zvonek u dveří", "doorbell", "doorbell"),
  w("phone", "telefon", "phone ring", "phone", undefined, ["vyzvaneni", "ring"]),
  w("clock", "hodiny", "clock", "clock", undefined, ["tikani", "tick"]),
  w("knock", "klepání", "knock", "knock", undefined, ["zaklepani"]),
  w("glass", "sklenice", "glass", "glass", undefined, ["cinknuti"]),
  w("crash", "řinkot", "crash", "crash", undefined, ["rozbiti", "smash"]),
  w("applause", "potlesk", "applause", "applause", undefined, ["tleskani"]),
  w("crowd", "dav", "crowd", "crowd", undefined, ["lide", "hluk"]),
  w("heartbeat", "tep srdce", "heartbeat", "heartbeat", undefined, ["srdce", "puls"]),
  w("footstep", "krok", "footstep", "footstep", undefined, ["chuze", "dupnuti"]),
  w("whistle", "písknutí", "whistle", "whistle", undefined, ["piskot"]),
  w("swoosh", "svist", "swoosh", "swoosh", undefined, ["fjuk", "swish"]),
  w("microwave", "mikrovlnka", "microwave", "beep", { pitch: -2 }),
  w("camera", "závěrka", "camera shutter", "click", { bright: 1.4 }),
  w("typewriter", "psací stroj", "typewriter", "click", { pitch: -2 }),
];

/* ── Sestavení z vybraných slov ────────────────────────────────── */

function combineMods(mods: Mod[]): Mod {
  return mods.reduce<Mod>((acc, m) => ({
    pitch: acc.pitch + m.pitch,
    durMul: acc.durMul * m.durMul,
    bright: acc.bright * m.bright,
    gainMul: acc.gainMul * m.gainMul,
  }), { ...NEUTRAL });
}

function applyMod(layer: Layer, m: Mod): Layer {
  const pitchMul = Math.pow(2, m.pitch / 12);
  if (layer.kind === "tone") {
    return { ...layer, freqStart: layer.freqStart * pitchMul, freqEnd: layer.freqEnd * pitchMul, durMs: layer.durMs * m.durMul, gain: Math.min(0.5, layer.gain * m.gainMul) };
  }
  return {
    ...layer, durMs: layer.durMs * m.durMul, gain: Math.min(0.5, layer.gain * m.gainMul),
    filterFreqStart: layer.filterFreqStart !== undefined ? layer.filterFreqStart * m.bright : undefined,
    filterFreqEnd: layer.filterFreqEnd !== undefined ? layer.filterFreqEnd * m.bright : undefined,
  };
}

export const ALL_WORDS: Word[] = [...WORDS, ...MODIFIERS];

export function getWordById(id: string): Word | undefined {
  return ALL_WORDS.find((x) => x.id === id);
}

export function searchWords(query: string, lang: Lang): Word[] {
  const q = normalize(query.trim());
  if (!q) return ALL_WORDS;
  return ALL_WORDS.filter((word) => {
    const hay = [word.cs, word.en, ...(word.aliases ?? [])].map(normalize);
    return hay.some((h) => h.includes(q));
  });
}

export function buildFromWords(selectedIds: string[], lang: Lang): SoundSpec | null {
  const selected = selectedIds.map(getWordById).filter(Boolean) as Word[];
  if (selected.length === 0) return null;

  const modWords = selected.filter((s) => s.modifier);
  const soundWords = selected.filter((s) => s.family).slice(0, 6);
  if (soundWords.length === 0) return null;

  const globalMod = combineMods(modWords.map((mw) => ({ ...NEUTRAL, ...mw.modifier!.adjust })));

  const seed = hash(selectedIds.join("|"));
  const r = makeRng(seed);

  const layers: Layer[] = [];
  const tags: string[] = [];
  let offset = 0;

  for (const sw of soundWords) {
    const recipe = FAMILIES[sw.family!];
    if (!recipe) continue;
    const base = recipe(r);
    const wordMod = combineMods([globalMod, { ...NEUTRAL, ...sw.mod }]);
    for (const l of base.layers) {
      const m = applyMod({ ...l, startMs: l.startMs + offset }, wordMod);
      layers.push(m);
    }
    offset += base.durMs * wordMod.durMul + 80;
    tags.push(lang === "cs" ? sw.cs : sw.en);
  }

  return { layers, totalMs: offset, tags };
}

/* ── UI texty ──────────────────────────────────────────────────── */

export const foundryUi = {
  cs: {
    back: "← Spaghetti.ltd",
    eyebrow: "Dynamická knihovna zvuků",
    title: "Sound Foundry",
    intro: "Hledej zvuky ve slovníku, přidávej je a engine z nich poskládá výsledek. Oscilátory, šum, filtry — žádné AI, žádné nahrávky.",
    search: "Hledej zvuk… (laser, déšť, pták, motor)",
    selectedLabel: "Tvůj recept",
    selectedEmpty: "Zatím nic. Přidej zvuky z výsledků hledání.",
    play: "Vyrobit zvuk ♪",
    stop: "Zastavit ■",
    clear: "Vyčistit",
    detected: "Zvuků",
    layers: "Vrstev",
    duration: "Délka",
    soundsLabel: "Zvuky",
    modifiersLabel: "Úpravy (změní celý recept)",
    noResults: "Nic nenalezeno. Zkus jiné slovo.",
    disclaimer: "Stejný recept zní vždy stejně. Vše se počítá z čísel — žádná nahrávka skutečného světa.",
  },
  en: {
    back: "← Spaghetti.ltd",
    eyebrow: "Dynamic sound library",
    title: "Sound Foundry",
    intro: "Search the vocabulary, add sounds, and the engine forges the result. Oscillators, noise, filters — no AI, no recordings.",
    search: "Search a sound… (laser, rain, bird, engine)",
    selectedLabel: "Your recipe",
    selectedEmpty: "Nothing yet. Add sounds from the search results.",
    play: "Forge sound ♪",
    stop: "Stop ■",
    clear: "Clear",
    detected: "Sounds",
    layers: "Layers",
    duration: "Length",
    soundsLabel: "Sounds",
    modifiersLabel: "Modifiers (affect the whole recipe)",
    noResults: "Nothing found. Try another word.",
    disclaimer: "The same recipe always sounds the same. Everything is computed from numbers — no recording of the real world.",
  },
} as const;
