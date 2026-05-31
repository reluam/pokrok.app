import type { Lang } from "./dictionaries";

/* ── Datový model zvuku (čistá data, interpretuje je Web Audio) ── */

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

export type SoundSpec = {
  layers: Layer[];
  totalMs: number;
  tags: string[];
};

/* ── Seedovaný RNG (determinismus podle promptu) ───────────────── */

function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}

function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/* ── Pomocné buildery vrstev ───────────────────────────────────── */

type R = () => number;

function tone(o: { freqStart: number; durMs: number } & Partial<ToneLayer>): ToneLayer {
  return {
    kind: "tone",
    wave: o.wave ?? "sine",
    freqStart: o.freqStart,
    freqEnd: o.freqEnd ?? o.freqStart,
    sweep: o.sweep ?? "exp",
    startMs: o.startMs ?? 0,
    durMs: o.durMs,
    gain: o.gain ?? 0.2,
    attackMs: o.attackMs ?? 4,
    vibratoHz: o.vibratoHz,
    vibratoDepth: o.vibratoDepth,
  };
}

function noise(o: { durMs: number } & Partial<NoiseLayer>): NoiseLayer {
  return {
    kind: "noise",
    color: o.color ?? "white",
    startMs: o.startMs ?? 0,
    durMs: o.durMs,
    gain: o.gain ?? 0.2,
    attackMs: o.attackMs ?? 4,
    filterType: o.filterType,
    filterFreqStart: o.filterFreqStart,
    filterFreqEnd: o.filterFreqEnd,
    q: o.q,
  };
}

/* ── Archetypy: prompt → recept (vrstvy + délka) ───────────────── */

type Recipe = (r: R) => { layers: Layer[]; durMs: number };

type Archetype = { id: string; kw: string[]; label: { cs: string; en: string }; recipe: Recipe };

const ARCHETYPES: Archetype[] = [
  {
    id: "laser", kw: ["laser", "pew", "phaser", "blaster", "vystrel"], label: { cs: "laser", en: "laser" },
    recipe: (r) => {
      const f0 = 1400 + r() * 700, dur = 240 + r() * 140;
      return { layers: [
        tone({ wave: "sawtooth", freqStart: f0, freqEnd: 120 + r() * 80, sweep: "exp", durMs: dur, gain: 0.22, attackMs: 3 }),
        noise({ color: "white", durMs: 60, gain: 0.08, filterType: "highpass", filterFreqStart: 3000, filterFreqEnd: 3000, q: 0.7 }),
      ], durMs: dur };
    },
  },
  {
    id: "explosion", kw: ["explos", "vybuch", "boom", "exploze", "bomb", "blast", "rachot"], label: { cs: "výbuch", en: "explosion" },
    recipe: (r) => {
      const dur = 700 + r() * 500;
      return { layers: [
        noise({ color: "white", durMs: dur, gain: 0.34, attackMs: 6, filterType: "lowpass", filterFreqStart: 900, filterFreqEnd: 60, q: 1 }),
        tone({ wave: "sine", freqStart: 90, freqEnd: 28, sweep: "exp", durMs: dur * 0.85, gain: 0.28, attackMs: 6 }),
      ], durMs: dur };
    },
  },
  {
    id: "raindrop", kw: ["kapka", "raindrop", "dropple", "kap", "drop"], label: { cs: "kapka", en: "raindrop" },
    recipe: (r) => {
      const dur = 150 + r() * 60;
      return { layers: [
        tone({ wave: "sine", freqStart: 1700 + r() * 500, freqEnd: 600, sweep: "exp", durMs: dur, gain: 0.26, attackMs: 2 }),
      ], durMs: dur + 20 };
    },
  },
  {
    id: "rain", kw: ["dest", "rain", "prsi", "lijak"], label: { cs: "déšť", en: "rain" },
    recipe: (r) => {
      const dur = 1500;
      return { layers: [
        noise({ color: "pink", durMs: dur, gain: 0.16, attackMs: 200, filterType: "bandpass", filterFreqStart: 3500, filterFreqEnd: 4500, q: 0.6 }),
      ], durMs: dur };
    },
  },
  {
    id: "bird", kw: ["ptak", "bird", "chirp", "tweet", "cvrlik"], label: { cs: "pták", en: "bird" },
    recipe: (r) => {
      const base = 2200 + r() * 400;
      const c = (at: number) => tone({ wave: "sine", freqStart: base, freqEnd: base + 400, sweep: "lin", startMs: at, durMs: 130, gain: 0.18, attackMs: 6, vibratoHz: 22, vibratoDepth: 180 });
      return { layers: [c(0), c(180), c(340)], durMs: 470 };
    },
  },
  {
    id: "wind", kw: ["vitr", "wind", "vichr", "fukot"], label: { cs: "vítr", en: "wind" },
    recipe: () => {
      const dur = 1700;
      return { layers: [
        noise({ color: "pink", durMs: dur, gain: 0.2, attackMs: 350, filterType: "bandpass", filterFreqStart: 550, filterFreqEnd: 1100, q: 0.8 }),
      ], durMs: dur };
    },
  },
  {
    id: "water", kw: ["voda", "water", "bublin", "bubble", "potok"], label: { cs: "voda", en: "water" },
    recipe: (r) => {
      const blips: Layer[] = [];
      let at = 0;
      for (let i = 0; i < 5; i++) {
        const f = 500 + r() * 1400;
        blips.push(tone({ wave: "sine", freqStart: f, freqEnd: f * 1.8, sweep: "exp", startMs: at, durMs: 70, gain: 0.16, attackMs: 4 }));
        at += 80 + r() * 90;
      }
      return { layers: blips, durMs: at + 80 };
    },
  },
  {
    id: "coin", kw: ["mince", "coin", "penize", "money", "cink"], label: { cs: "mince", en: "coin" },
    recipe: () => ({ layers: [
      tone({ wave: "square", freqStart: 988, durMs: 90, gain: 0.18, attackMs: 2 }),
      tone({ wave: "square", freqStart: 1319, startMs: 90, durMs: 360, gain: 0.18, attackMs: 2 }),
    ], durMs: 460 }),
  },
  {
    id: "beep", kw: ["beep", "pip", "pipnu", "ton"], label: { cs: "pípnutí", en: "beep" },
    recipe: (r) => ({ layers: [ tone({ wave: "square", freqStart: 700 + r() * 500, durMs: 180, gain: 0.18, attackMs: 3, sweep: "lin" }) ], durMs: 200 }),
  },
  {
    id: "engine", kw: ["motor", "engine", "auto", "car", "stroj"], label: { cs: "motor", en: "engine" },
    recipe: (r) => {
      const dur = 1300, base = 70 + r() * 30;
      return { layers: [
        tone({ wave: "sawtooth", freqStart: base, freqEnd: base * 1.3, sweep: "lin", durMs: dur, gain: 0.2, attackMs: 60, vibratoHz: 26, vibratoDepth: 14 }),
        tone({ wave: "square", freqStart: base * 1.5, freqEnd: base * 1.9, sweep: "lin", durMs: dur, gain: 0.08, attackMs: 60, vibratoHz: 32, vibratoDepth: 10 }),
      ], durMs: dur };
    },
  },
  {
    id: "heartbeat", kw: ["srdce", "tep", "heart", "puls", "beat"], label: { cs: "srdce", en: "heartbeat" },
    recipe: () => {
      const thump = (at: number, g: number) => tone({ wave: "sine", freqStart: 62, freqEnd: 38, sweep: "exp", startMs: at, durMs: 130, gain: g, attackMs: 6 });
      return { layers: [thump(0, 0.32), thump(170, 0.24), thump(650, 0.32), thump(820, 0.24)], durMs: 1050 };
    },
  },
  {
    id: "ufo", kw: ["ufo", "talir", "alien", "spaceship", "vesmir", "mimozem"], label: { cs: "UFO", en: "UFO" },
    recipe: (r) => {
      const dur = 1500, f = 380 + r() * 200;
      return { layers: [ tone({ wave: "sine", freqStart: f, freqEnd: f * 1.1, sweep: "lin", durMs: dur, gain: 0.2, attackMs: 120, vibratoHz: 6, vibratoDepth: 110 }) ], durMs: dur };
    },
  },
  {
    id: "zap", kw: ["zap", "elektr", "electric", "spark", "jiskr", "vyboj"], label: { cs: "elektřina", en: "zap" },
    recipe: (r) => {
      const dur = 300;
      return { layers: [
        noise({ color: "white", durMs: dur, gain: 0.16, attackMs: 2, filterType: "highpass", filterFreqStart: 1800, filterFreqEnd: 3500, q: 0.8 }),
        tone({ wave: "square", freqStart: 2600 + r() * 800, freqEnd: 1400, sweep: "lin", durMs: dur, gain: 0.1, attackMs: 2, vibratoHz: 60, vibratoDepth: 400 }),
      ], durMs: dur };
    },
  },
  {
    id: "thunder", kw: ["hrom", "thunder", "blesk", "lightning", "boure"], label: { cs: "hrom", en: "thunder" },
    recipe: () => {
      const dur = 1500;
      return { layers: [
        noise({ color: "white", durMs: dur, gain: 0.34, attackMs: 90, filterType: "lowpass", filterFreqStart: 240, filterFreqEnd: 50, q: 1 }),
        tone({ wave: "sine", freqStart: 55, freqEnd: 26, sweep: "exp", durMs: dur, gain: 0.2, attackMs: 90 }),
      ], durMs: dur };
    },
  },
  {
    id: "bell", kw: ["zvon", "bell", "gong", "cinkn", "zvonek"], label: { cs: "zvon", en: "bell" },
    recipe: (r) => {
      const f = 520 + r() * 200, dur = 1500;
      return { layers: [
        tone({ wave: "sine", freqStart: f, durMs: dur, gain: 0.2, attackMs: 2 }),
        tone({ wave: "sine", freqStart: f * 2.01, durMs: dur * 0.8, gain: 0.1, attackMs: 2 }),
        tone({ wave: "sine", freqStart: f * 3.02, durMs: dur * 0.6, gain: 0.05, attackMs: 2 }),
      ], durMs: dur };
    },
  },
  {
    id: "whistle", kw: ["piskot", "whistle", "pistal", "pisk", "houkac"], label: { cs: "píšťalka", en: "whistle" },
    recipe: (r) => {
      const f = 1500 + r() * 400, dur = 500;
      return { layers: [ tone({ wave: "sine", freqStart: f, freqEnd: f * 1.25, sweep: "lin", durMs: dur, gain: 0.18, attackMs: 30, vibratoHz: 7, vibratoDepth: 25 }) ], durMs: dur };
    },
  },
  {
    id: "alarm", kw: ["alarm", "poplach", "siren", "siréna", "houkani"], label: { cs: "alarm", en: "alarm" },
    recipe: () => {
      const ls: Layer[] = [];
      let at = 0;
      for (let i = 0; i < 4; i++) {
        ls.push(tone({ wave: "square", freqStart: i % 2 ? 620 : 820, durMs: 170, startMs: at, gain: 0.16, attackMs: 4, sweep: "lin" }));
        at += 180;
      }
      return { layers: ls, durMs: at };
    },
  },
  {
    id: "powerup", kw: ["powerup", "power", "levelup", "bonus", "level"], label: { cs: "power-up", en: "power-up" },
    recipe: () => {
      const notes = [523, 659, 784, 1047];
      const ls = notes.map((f, i) => tone({ wave: "square", freqStart: f, durMs: 110, startMs: i * 80, gain: 0.16, attackMs: 2, sweep: "lin" }));
      return { layers: ls, durMs: notes.length * 80 + 80 };
    },
  },
  {
    id: "jump", kw: ["skok", "jump", "hop", "poskok"], label: { cs: "skok", en: "jump" },
    recipe: () => ({ layers: [ tone({ wave: "square", freqStart: 200, freqEnd: 640, sweep: "lin", durMs: 200, gain: 0.18, attackMs: 2 }) ], durMs: 220 }),
  },
  {
    id: "footstep", kw: ["krok", "footstep", "step", "dupnu", "chuze"], label: { cs: "krok", en: "footstep" },
    recipe: () => ({ layers: [
      noise({ color: "white", durMs: 110, gain: 0.26, attackMs: 3, filterType: "lowpass", filterFreqStart: 350, filterFreqEnd: 180, q: 1 }),
      tone({ wave: "sine", freqStart: 95, freqEnd: 55, sweep: "exp", durMs: 110, gain: 0.16, attackMs: 3 }),
    ], durMs: 150 }),
  },
  {
    id: "swoosh", kw: ["swoosh", "swish", "fjuk", "svist", "svihnut"], label: { cs: "svist", en: "swoosh" },
    recipe: () => ({ layers: [
      noise({ color: "pink", durMs: 420, gain: 0.22, attackMs: 60, filterType: "bandpass", filterFreqStart: 500, filterFreqEnd: 3200, q: 1.2 }),
    ], durMs: 440 }),
  },
  {
    id: "splash", kw: ["splash", "cak", "caknu", "plesk", "cup"], label: { cs: "šplouch", en: "splash" },
    recipe: (r) => {
      const layers: Layer[] = [ noise({ color: "white", durMs: 220, gain: 0.24, attackMs: 3, filterType: "highpass", filterFreqStart: 900, filterFreqEnd: 2200, q: 0.7 }) ];
      let at = 60;
      for (let i = 0; i < 3; i++) { const f = 700 + r() * 900; layers.push(tone({ wave: "sine", freqStart: f, freqEnd: f * 1.6, sweep: "exp", startMs: at, durMs: 70, gain: 0.12, attackMs: 4 })); at += 70; }
      return { layers, durMs: 280 };
    },
  },
];

/* ── Sestavení zvuku z promptu ─────────────────────────────────── */

function abstractRecipe(seed: number): { layers: Layer[]; durMs: number } {
  const r = makeRng(seed);
  const waves: OscillatorType[] = ["sine", "triangle", "square", "sawtooth"];
  const wave = waves[seed % waves.length];
  const penta = [0, 2, 4, 7, 9];
  const root = 300 + (seed % 200);
  const n = 3 + (seed % 4);
  const layers: Layer[] = [];
  let at = 0;
  for (let i = 0; i < n; i++) {
    const semi = penta[Math.floor(r() * penta.length)] + 12 * Math.floor(r() * 2);
    const f = root * Math.pow(2, semi / 12);
    const d = 120 + Math.floor(r() * 160);
    layers.push(tone({ wave, freqStart: f, freqEnd: f * (0.9 + r() * 0.4), sweep: "exp", startMs: at, durMs: d, gain: 0.18, attackMs: 4 }));
    at += d + 20;
  }
  return { layers, durMs: at };
}

export function buildSound(prompt: string, lang: Lang): SoundSpec | null {
  const text = prompt.trim();
  if (!text) return null;

  const norm = normalize(text);
  const seed = hash(text);
  const r = makeRng(seed);

  // Najdi archetypy podle prvního výskytu klíčového slova
  const found = ARCHETYPES
    .map((a) => {
      const idx = Math.min(...a.kw.map((k) => { const i = norm.indexOf(k); return i < 0 ? Infinity : i; }));
      return { a, idx };
    })
    .filter((x) => x.idx !== Infinity)
    .sort((x, y) => x.idx - y.idx)
    .slice(0, 4)
    .map((x) => x.a);

  if (found.length === 0) {
    const ab = abstractRecipe(seed);
    return { layers: ab.layers, totalMs: ab.durMs, tags: [lang === "cs" ? "abstraktní" : "abstract"] };
  }

  const layers: Layer[] = [];
  const tags: string[] = [];
  let offset = 0;
  for (const a of found) {
    const rec = a.recipe(r);
    for (const l of rec.layers) layers.push({ ...l, startMs: l.startMs + offset });
    offset += rec.durMs + 70;
    tags.push(a.label[lang]);
  }

  return { layers, totalMs: offset, tags };
}

/* ── UI texty + návrhy promptů ─────────────────────────────────── */

export const foundryUi = {
  cs: {
    back: "← Spaghetti.ltd",
    eyebrow: "Dynamická knihovna zvuků",
    title: "Sound Foundry",
    intro: "Napiš, jaký zvuk chceš. Engine ho poskládá z oscilátorů, šumu a filtrů. Žádné nahrávky — čistý výpočet.",
    placeholder: "laser, výbuch, kapka vody, zpěv ptáka…",
    play: "Vyrobit zvuk ♪",
    playing: "Hraje…",
    stop: "Zastavit ■",
    detected: "Rozpoznáno",
    layers: "Vrstev",
    duration: "Délka",
    suggestionsLabel: "Zkus třeba:",
    empty: "Napiš prompt a klikni na Vyrobit zvuk.",
    disclaimer: "Stejný prompt zní vždy stejně. Není to nahrávka skutečného světa — je to jeho syntetická rekonstrukce z čísel.",
  },
  en: {
    back: "← Spaghetti.ltd",
    eyebrow: "Dynamic sound library",
    title: "Sound Foundry",
    intro: "Type the sound you want. The engine builds it from oscillators, noise and filters. No recordings — pure computation.",
    placeholder: "laser, explosion, water drop, bird song…",
    play: "Forge sound ♪",
    playing: "Playing…",
    stop: "Stop ■",
    detected: "Detected",
    layers: "Layers",
    duration: "Length",
    suggestionsLabel: "Try for example:",
    empty: "Type a prompt and hit Forge sound.",
    disclaimer: "The same prompt always sounds the same. It's not a recording of the real world — it's a synthetic reconstruction from numbers.",
  },
} as const;

export function suggestions(lang: Lang): string[] {
  return lang === "cs"
    ? ["laser k výbuchu", "kapka vody", "zpěv ptáka", "motor auta", "UFO", "zvon", "srdce bije", "vítr a déšť"]
    : ["laser to explosion", "water drop", "bird song", "car engine", "UFO", "bell", "heartbeat", "wind and rain"];
}
