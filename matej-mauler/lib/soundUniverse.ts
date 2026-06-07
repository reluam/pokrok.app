import type { Lang } from "./dictionaries";

/* ── Materiály překážek ────────────────────────────────────────────
   c2f = podíl rychlosti² oproti médiu (nižší = tvrdší/odrazivější bariéra)
   damp = pohlcení (vyšší = víc absorbuje energii)                       */
export type Material = {
  id: number;
  name: { cs: string; en: string };
  color: string;
  c2f: number;
  damp: number;
};

export const MATERIALS: Material[] = [
  { id: 1, name: { cs: "Cihla", en: "Brick" }, color: "#b5562f", c2f: 0.14, damp: 0.010 },
  { id: 2, name: { cs: "Beton", en: "Concrete" }, color: "#8b8d92", c2f: 0.05, damp: 0.004 },
  { id: 3, name: { cs: "Sklo", en: "Glass" }, color: "#7fd3e0", c2f: 0.07, damp: 0.003 },
  { id: 4, name: { cs: "Zemina / val", en: "Soil / berm" }, color: "#6b4f32", c2f: 0.22, damp: 0.045 },
  { id: 5, name: { cs: "Písek", en: "Sand" }, color: "#e3c779", c2f: 0.30, damp: 0.060 },
  { id: 6, name: { cs: "Stromy / plot", en: "Trees / hedge" }, color: "#3f8a4a", c2f: 0.55, damp: 0.030 },
];
export const materialById = (id: number) => MATERIALS.find((m) => m.id === id) ?? null;

/* ── Média ─────────────────────────────────────────────────────────── */
export type Medium = { id: string; name: { cs: string; en: string }; courant: number; damp: number };
export const MEDIA: Medium[] = [
  { id: "air", name: { cs: "Vzduch", en: "Air" }, courant: 0.5, damp: 0.0009 },
  { id: "water", name: { cs: "Voda", en: "Water" }, courant: 0.5, damp: 0.0003 },
  { id: "fog", name: { cs: "Hustá mlha", en: "Thick fog" }, courant: 0.5, damp: 0.0022 },
];
export const mediumById = (id: string) => MEDIA.find((m) => m.id === id) ?? MEDIA[0];

/* ── Emitory (procedurální syntéza) ───────────────────────────────── */
export type EmitterId = "highway" | "speaker" | "birds" | "helicopter";
export type Emitter = {
  id: EmitterId;
  name: { cs: string; en: string };
  color: string;
  // dominantní frekvence pro buzení FDTD (vizualizace + měření přenosu)
  driveHz: number;
};
export const EMITTERS: Emitter[] = [
  { id: "highway", name: { cs: "Dálnice", en: "Highway" }, color: "#9aa0ab", driveHz: 0.9 },
  { id: "speaker", name: { cs: "Repro s hudbou", en: "Music speaker" }, color: "#ff6fae", driveHz: 1.3 },
  { id: "birds", name: { cs: "Ptáci", en: "Birds" }, color: "#5ec46a", driveHz: 2.2 },
  { id: "helicopter", name: { cs: "Vrtulník", en: "Helicopter" }, color: "#d97706", driveHz: 0.7 },
];
export const emitterById = (id: EmitterId) => EMITTERS.find((e) => e.id === id) ?? EMITTERS[0];

/* ── FDTD 2D akustická vlnová simulace ─────────────────────────────── */
export class Fdtd {
  W: number; H: number; N: number;
  groundY: number; // řádek, od kterého dolů je zem (odrazivá)
  p: Float32Array; p1: Float32Array; pnew: Float32Array;
  c2: Float32Array; damp: Float32Array;
  mat: Uint8Array; // id materiálu (0 = médium)
  private baseCourant = 0.5;
  private baseDamp = 0.0009;

  constructor(W: number, H: number) {
    this.W = W; this.H = H; this.N = W * H;
    this.groundY = H - 7;
    this.p = new Float32Array(this.N);
    this.p1 = new Float32Array(this.N);
    this.pnew = new Float32Array(this.N);
    this.c2 = new Float32Array(this.N);
    this.damp = new Float32Array(this.N);
    this.mat = new Uint8Array(this.N);
    this.rebuild();
  }

  idx(x: number, y: number) { return y * this.W + x; }

  setMedium(courant: number, damp: number) { this.baseCourant = courant; this.baseDamp = damp; this.rebuild(); }

  // přepočítá c2/damp z mapy materiálů + média; zem = odrazivá, okraje (kromě země) pohlcují
  rebuild() {
    const { W, H, groundY } = this;
    const c2base = this.baseCourant * this.baseCourant;
    const edge = 10;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        let c2 = c2base, d = this.baseDamp;
        if (y >= groundY) {
          // zem / hlína pod povrchem — tvrdá, odrazivá
          c2 = c2base * 0.03; d = 0.002;
        } else {
          const m = this.mat[i];
          if (m) { const mm = materialById(m); if (mm) { c2 = c2base * mm.c2f; d = mm.damp; } }
          // absorpční rámeček nahoře a po stranách (obloha = otevřený prostor), ne dole
          const e = Math.min(x, W - 1 - x, y);
          if (e < edge) d += 0.06 * (1 - e / edge);
        }
        this.c2[i] = c2; this.damp[i] = d;
      }
    }
  }

  paint(x: number, y: number, r: number, matId: number) {
    const { W, H } = this;
    for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) {
      const xx = x + k, yy = y + j;
      if (xx < 1 || yy < 1 || xx >= W - 1 || yy >= H - 1) continue;
      if (k * k + j * j > r * r) continue;
      this.mat[yy * W + xx] = matId;
    }
    this.rebuild();
  }

  clearField() { this.p.fill(0); this.p1.fill(0); this.pnew.fill(0); }
  clearMaterials() { this.mat.fill(0); this.rebuild(); }

  step(srcIdx: number, srcVal: number) {
    const { W, H, p, p1, pnew, c2, damp } = this;
    for (let y = 1; y < H - 1; y++) {
      const row = y * W;
      for (let x = 1; x < W - 1; x++) {
        const i = row + x;
        const lap = p[i - 1] + p[i + 1] + p[i - W] + p[i + W] - 4 * p[i];
        let v = 2 * p[i] - p1[i] + c2[i] * lap;
        v -= damp[i] * (p[i] - p1[i]);
        pnew[i] = v;
      }
    }
    pnew[srcIdx] += srcVal;
    // rotace bufferů
    const tmp = this.p1; this.p1 = this.p; this.p = this.pnew; this.pnew = tmp;
  }

  // RMS energie kolem bodu (malé okolí) — kolik zvuku dorazí k uchu
  energyAt(x: number, y: number, rad = 2): number {
    const { W, p } = this; let s = 0, n = 0;
    for (let j = -rad; j <= rad; j++) for (let k = -rad; k <= rad; k++) {
      const i = (y + j) * W + (x + k);
      if (i < 0 || i >= this.N) continue;
      s += p[i] * p[i]; n++;
    }
    return Math.sqrt(s / Math.max(1, n));
  }
}

export const suUi = {
  cs: {
    back: "← Spaghetti.ltd",
    eyebrow: "Sound Universe",
    title: "Sound Universe",
    intro: "Postav svět mezi zdrojem zvuku a svýma ušima. Uslyšíš a uvidíš, jak se zvuk šíří.",
    start: "Spustit zvuk 🔊",
    emitter: "Zdroj zvuku",
    medium: "Prostředí",
    material: "Materiál překážky",
    tools: "Nástroje",
    move: "Posun zdroje", ear: "Posun ucha", paint: "Stavět", erase: "Bourat",
    reset: "Vyčistit",
    youHear: "Co slyšíš",
    loudness: "Hlasitost", muffle: "Zatlumení výšek",
    tip: "Stavěj tažením od země nahoru — výška překážky rozhoduje. Nízkou zvuk přeskočí, vysokou hůř. Zem i tvrdé stěny zvuk odrážejí.",
    audioNote: "Audio experiment — zapni si zvuk.",
  },
  en: {
    back: "← Spaghetti.ltd",
    eyebrow: "Sound Universe",
    title: "Sound Universe",
    intro: "Build the world between a sound source and your ears. Hear and see how sound travels.",
    start: "Start sound 🔊",
    emitter: "Sound source",
    medium: "Medium",
    material: "Obstacle material",
    tools: "Tools",
    move: "Move source", ear: "Move ear", paint: "Build", erase: "Demolish",
    reset: "Clear",
    youHear: "What you hear",
    loudness: "Loudness", muffle: "High-end damping",
    tip: "Build by dragging up from the ground — the barrier's height matters. Sound hops over a low wall, not a tall one. Ground and hard walls reflect.",
    audioNote: "Audio experiment — turn your sound on.",
  },
} as const;

export type SULang = Lang;
