import type { Lang } from "./dictionaries";

// měřítko: kolik metrů reality = 1 buňka mřížky
export const M_PER_CELL = 1.5;

/* ── Materiály překážek ────────────────────────────────────────────
   c2f = podíl rychlosti² oproti médiu (nižší = tvrdší/odrazivější bariéra)
   damp = pohlcení (vyšší = víc absorbuje energii)                       */
export type Material = {
  id: number;
  name: { cs: string; en: string };
  color: string;
  c2f: number;  // podíl rychlosti² (nižší = tvrdší, vyšší útlum prostupu)
  damp: number; // pohlcení (vyšší = víc absorbuje)
  cost: number; // cena za blok
  db: number;   // orientační útlum v dB na m³ materiálu (podle hustoty/typu)
};

// Řazení dle fyziky: těžké/tvrdé (vysoká hustota → nízké c2f) blokují prostup,
// porézní (vysoký damp) pohlcují odrazy. db ~ účinnost na m³.
export const MATERIALS: Material[] = [
  { id: 1, name: { cs: "Cihla", en: "Brick" }, color: "#b5562f", c2f: 0.12, damp: 0.012, cost: 2, db: 18 },
  { id: 2, name: { cs: "Beton", en: "Concrete" }, color: "#8b8d92", c2f: 0.05, damp: 0.006, cost: 3, db: 22 },
  { id: 3, name: { cs: "Sklo", en: "Glass" }, color: "#7fd3e0", c2f: 0.08, damp: 0.004, cost: 3, db: 16 },
  { id: 4, name: { cs: "Zemní val", en: "Earth berm" }, color: "#6b4f32", c2f: 0.20, damp: 0.050, cost: 1, db: 15 },
  { id: 5, name: { cs: "Písek", en: "Sand" }, color: "#e3c779", c2f: 0.26, damp: 0.060, cost: 1, db: 12 },
  { id: 6, name: { cs: "Stromy / plot", en: "Trees / hedge" }, color: "#3f8a4a", c2f: 0.55, damp: 0.030, cost: 1, db: 5 },
  { id: 7, name: { cs: "Protihluková stěna", en: "Acoustic barrier" }, color: "#6f8a9a", c2f: 0.06, damp: 0.045, cost: 2, db: 20 },
  { id: 8, name: { cs: "Gabion", en: "Gabion" }, color: "#9a8a6a", c2f: 0.10, damp: 0.030, cost: 2, db: 18 },
  { id: 9, name: { cs: "Minerální vata", en: "Mineral wool" }, color: "#e3d06a", c2f: 0.58, damp: 0.100, cost: 1, db: 9 },
  { id: 10, name: { cs: "Akustická pěna", en: "Acoustic foam" }, color: "#d98aa6", c2f: 0.72, damp: 0.130, cost: 1, db: 7 },
  { id: 11, name: { cs: "Těžká fólie", en: "Mass-loaded vinyl" }, color: "#4a4a52", c2f: 0.03, damp: 0.020, cost: 4, db: 27 },
  { id: 12, name: { cs: "Sádrokarton", en: "Drywall" }, color: "#ded9cf", c2f: 0.32, damp: 0.020, cost: 1, db: 10 },
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
    const sponge = 30; // široká pohlcující vrstva = otevřený prostor za okrajem (žádný odraz)
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
          // pohlcující vrstva nahoře a po stranách (obloha / volný prostor), ne dole (zem)
          const e = Math.min(x, W - 1 - x, y);
          if (e < sponge) { const k = 1 - e / sponge; d += 0.22 * k * k; }
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

/* ── Levely: reálné scénáře odhlučnění ─────────────────────────── */
export type LevelEnv = "meadow" | "city" | "indoor";
export type SourceKind =
  | "cars" | "train" | "machinery" | "factory" | "stage" | "crowd" | "engine"
  | "dog" | "bell" | "unit" | "turbine" | "club" | "band" | "heli" | "gun" | "plane";
export type Prebuilt = { x0: number; x1: number; top: number; mat: number };
export type BL = { cs: string; en: string };
export type Level = {
  id: string;
  name: BL;
  kind: SourceKind;
  env: LevelEnv;
  source: BL;       // co dělá hluk
  target: BL;       // co chráníme
  sourceDb: number; // hladina u zdroje
  limitDb: number;  // max přípustná hladina v cíli
  driveHz: number;  // charakter zvuku (nízká = basový rachot → hůř se blokuje)
  budget: number;   // rozpočet na odhlučnění (cena bloků)
  stageX: number;
  stageH?: number;  // výška zdroje
  cityX: number;
  cityW: number;
  materials?: number[];   // dostupné materiály (id); jinak všechny
  audienceX?: number;     // zóna posluchačů (festival/stadion) — musí dobře slyšet
  audienceW?: number;
  audienceMinDb?: number; // minimální hladina, kterou návštěvníci musí slyšet
  prebuilt?: Prebuilt[];
  enclosure?: boolean; // vnitřní prostor (klub, zkušebna) — kolem zdroje stěny s mezerou
};

// konstanty modelu (kalibrace dB; viz komponenta)
export const DRIVE_AMP = 2.6;   // amplituda buzení (konstantní pro všechny levely)
export const OPEN_REF = 0.7;    // referenční přenos ve volném poli
export const SRC_REF_M = 10;    // hladina zdroje měřena v 10 m

export const LEVELS: Level[] = [
  { id: "highway", name: { cs: "Dálnice", en: "Highway" }, kind: "cars", env: "meadow", source: { cs: "Dálnice", en: "Highway" }, target: { cs: "Domy", en: "Houses" }, sourceDb: 85, limitDb: 50, driveHz: 0.7, budget: 60, stageX: 46, stageH: 3, cityX: 244, cityW: 32, materials: [4, 7, 3, 2] },
  { id: "railway", name: { cs: "Železnice", en: "Railway" }, kind: "train", env: "meadow", source: { cs: "Vlak", en: "Train" }, target: { cs: "Domy", en: "Houses" }, sourceDb: 95, limitDb: 55, driveHz: 0.8, budget: 72, stageX: 44, stageH: 4, cityX: 250, cityW: 32, materials: [4, 7, 8, 2] },
  { id: "construction", name: { cs: "Stavba", en: "Construction" }, kind: "machinery", env: "city", source: { cs: "Stavba", en: "Construction" }, target: { cs: "Byty", en: "Flats" }, sourceDb: 100, limitDb: 60, driveHz: 1.1, budget: 80, stageX: 44, stageH: 6, cityX: 244, cityW: 30, prebuilt: [{ x0: 150, x1: 168, top: 86, mat: 2 }, { x0: 195, x1: 214, top: 80, mat: 2 }], materials: [2, 9, 12, 7] },
  { id: "festival", name: { cs: "Festival", en: "Festival" }, kind: "stage", env: "meadow", source: { cs: "Pódium", en: "Stage" }, target: { cs: "Město", en: "Town" }, sourceDb: 105, limitDb: 55, driveHz: 1.0, budget: 95, stageX: 46, stageH: 22, cityX: 258, cityW: 36, materials: [2, 7, 8], audienceX: 110, audienceW: 44, audienceMinDb: 70 },
  { id: "factory", name: { cs: "Továrna", en: "Factory" }, kind: "factory", env: "city", source: { cs: "Stroje", en: "Machinery" }, target: { cs: "Sídliště", en: "Residential" }, sourceDb: 92, limitDb: 50, driveHz: 0.85, budget: 85, stageX: 42, stageH: 8, cityX: 256, cityW: 30, materials: [2, 9, 10, 12] },
  { id: "stadium", name: { cs: "Stadion", en: "Stadium" }, kind: "crowd", env: "city", source: { cs: "Dav", en: "Crowd" }, target: { cs: "Čtvrť", en: "Neighborhood" }, sourceDb: 100, limitDb: 55, driveHz: 1.0, budget: 95, stageX: 46, stageH: 30, cityX: 258, cityW: 34, materials: [2, 7, 4], audienceX: 112, audienceW: 46, audienceMinDb: 62 },
  { id: "racetrack", name: { cs: "Závodní okruh", en: "Race track" }, kind: "engine", env: "meadow", source: { cs: "Motory", en: "Engines" }, target: { cs: "Kemp", en: "Campsite" }, sourceDb: 105, limitDb: 55, driveHz: 1.2, budget: 100, stageX: 44, stageH: 5, cityX: 260, cityW: 32, materials: [4, 7, 2] },
  { id: "kennel", name: { cs: "Psí útulek", en: "Dog kennel" }, kind: "dog", env: "city", source: { cs: "Štěkot", en: "Barking" }, target: { cs: "Sousedé", en: "Neighbors" }, sourceDb: 90, limitDb: 45, driveHz: 1.3, budget: 72, stageX: 52, stageH: 4, cityX: 226, cityW: 28, materials: [1, 6, 7] },
  { id: "bells", name: { cs: "Kostelní zvony", en: "Church bells" }, kind: "bell", env: "city", source: { cs: "Zvony", en: "Bells" }, target: { cs: "Domy", en: "Houses" }, sourceDb: 100, limitDb: 58, driveHz: 1.2, budget: 88, stageX: 48, stageH: 52, cityX: 256, cityW: 32, materials: [2, 1, 3] },
  { id: "heatpump", name: { cs: "Tepelné čerpadlo", en: "Heat pump" }, kind: "unit", env: "city", source: { cs: "Venkovní jednotka", en: "Outdoor unit" }, target: { cs: "Ložnice souseda", en: "Neighbor's bedroom" }, sourceDb: 68, limitDb: 35, driveHz: 0.7, budget: 55, stageX: 78, stageH: 4, cityX: 178, cityW: 22, materials: [7, 9, 2] },
  { id: "windturbine", name: { cs: "Větrná elektrárna", en: "Wind turbine" }, kind: "turbine", env: "meadow", source: { cs: "Turbína", en: "Turbine" }, target: { cs: "Statek", en: "Farmhouse" }, sourceDb: 95, limitDb: 42, driveHz: 0.5, budget: 105, stageX: 46, stageH: 70, cityX: 262, cityW: 30, materials: [4, 2, 7, 11] },
  { id: "nightclub", name: { cs: "Noční klub", en: "Nightclub" }, kind: "club", env: "indoor", source: { cs: "Klub", en: "Club" }, target: { cs: "Ulice v noci", en: "Night street" }, sourceDb: 100, limitDb: 45, driveHz: 0.9, budget: 95, stageX: 62, stageH: 12, cityX: 250, cityW: 30, enclosure: true, materials: [2, 9, 10, 11] },
  { id: "rehearsal", name: { cs: "Zkušebna", en: "Rehearsal room" }, kind: "band", env: "indoor", source: { cs: "Kapela", en: "Band" }, target: { cs: "Soused za zdí", en: "Neighbor next door" }, sourceDb: 105, limitDb: 40, driveHz: 1.0, budget: 100, stageX: 60, stageH: 12, cityX: 236, cityW: 26, enclosure: true, materials: [2, 9, 10, 11] },
  { id: "heliport", name: { cs: "Heliport", en: "Heliport" }, kind: "heli", env: "city", source: { cs: "Vrtulník", en: "Helicopter" }, target: { cs: "Nemocnice", en: "Hospital" }, sourceDb: 115, limitDb: 50, driveHz: 0.9, budget: 115, stageX: 46, stageH: 70, cityX: 262, cityW: 32, materials: [2, 7, 4] },
  { id: "shooting", name: { cs: "Střelnice", en: "Shooting range" }, kind: "gun", env: "meadow", source: { cs: "Výstřely", en: "Gunfire" }, target: { cs: "Vesnice", en: "Village" }, sourceDb: 130, limitDb: 60, driveHz: 1.1, budget: 150, stageX: 44, stageH: 4, cityX: 268, cityW: 34, materials: [4, 2, 8] },
  { id: "airport", name: { cs: "Letiště", en: "Airport" }, kind: "plane", env: "meadow", source: { cs: "Letadla", en: "Aircraft" }, target: { cs: "Obec pod dráhou", en: "Village under flightpath" }, sourceDb: 120, limitDb: 60, driveHz: 1.0, budget: 140, stageX: 44, stageH: 60, cityX: 268, cityW: 36, materials: [4, 2, 7, 11] },
];

export const suUi = {
  cs: {
    back: "← Spaghetti.ltd",
    eyebrow: "Sound Universe",
    title: "Festival",
    intro: "Na stagi hraje kapela a tvým úkolem je, aby se hudba nedostala do města. Postav odhlučnění a ztiš město pod limit.",
    start: "Spustit festival 🔊",
    level: "Level", stage: "Zdroj", city: "Cíl", distance: "Vzdálenost",
    sourceLbl: "Zdroj", targetLbl: "Cíl", inTarget: "V cíli", limitWord: "limit",
    barrier: "Tvá bariéra", mute: "Ztlumit", unmute: "Zapnout zvuk", audienceLbl: "Návštěvníci", minWord: "min",
    cityHears: "Co slyší město", limitLbl: "Limit",
    budget: "Odhlučnění", used: "použito",
    won: "Hotovo! Město má klid. 🎉", next: "Další level →", retry: "Zkusit znovu",
    tools: "Nástroje", material: "Materiál", paint: "Stavět", erase: "Bourat", reset: "Vyčistit",
    tip: "Postav stěnu mezi stage a město. Výška i materiál rozhodují — zvuk se ohýbá přes vršek a odráží od tvrdých ploch i budov.",
    audioNote: "Audio experiment — zapni si zvuk.",
    noSong: "(nemáš nahraný žádný song, hraje náhradní tón — nahraj si v /admin)",
    overBudget: "Došlo odhlučnění!",
    propagating: "zvuk se šíří…",
  },
  en: {
    back: "← Spaghetti.ltd",
    eyebrow: "Sound Universe",
    title: "Festival",
    intro: "A band is playing on the stage and your job is to keep the music out of the city. Build soundproofing and get the city below the limit.",
    start: "Start the festival 🔊",
    level: "Level", stage: "Source", city: "Target", distance: "Distance",
    sourceLbl: "Source", targetLbl: "Target", inTarget: "At target", limitWord: "limit",
    barrier: "Your barrier", mute: "Mute", unmute: "Unmute", audienceLbl: "Audience", minWord: "min",
    cityHears: "What the city hears", limitLbl: "Limit",
    budget: "Soundproofing", used: "used",
    won: "Done! The city has peace. 🎉", next: "Next level →", retry: "Try again",
    tools: "Tools", material: "Material", paint: "Build", erase: "Demolish", reset: "Clear",
    tip: "Build a wall between the stage and the city. Height and material both matter — sound bends over the top and reflects off hard surfaces and buildings.",
    audioNote: "Audio experiment — turn your sound on.",
    noSong: "(no uploaded song, playing a fallback tone — upload one in /admin)",
    overBudget: "Out of soundproofing!",
    propagating: "sound is travelling…",
  },
} as const;

export type SULang = Lang;
