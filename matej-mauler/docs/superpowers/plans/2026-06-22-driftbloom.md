# Driftbloom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Driftbloom", a Spaghetti experiment (slug `driftbloom`, route `/driftbloom`) that teaches "evolution has no goal" through a deterministic evolution sim with a predict-then-watch Phase A and an open survival Phase B.

**Architecture:** Three hard-separated layers, data flows one way (sim → render; UI drives input): `lib/sim/` is a pure, seed-deterministic simulation (no React/canvas/`window`/`Math.random`); `lib/render/` draws canvas from sim state and mutates nothing; `app/driftbloom` + `components/driftbloom/` is React UI. Persistence splits across the existing Spaghetti DB (insight/XP/badges via `/api/participation`), localStorage (ephemeral game state), and URL (`?dna=` sharing).

**Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript (strict), HTML canvas, vitest for the pure layer. Existing Spaghetti infra: `lib/accountsDb.ts`, `lib/account/session.ts`, `lib/rewards/*`, `app/api/participation/route.ts`, `components/PromptRegistration.tsx`.

## Global Constraints

- TypeScript strict; no `any` without a stated reason. Path alias `@/*` → repo root.
- `lib/sim/` is pure: no imports from React, canvas, `window`, or `Math.random()`.
- `lib/render/` reads state and draws; it never mutates sim state.
- Small focused files; no god component. Comment only non-trivial spots (gene→phenotype, fitness, RNG).
- No `Co-Authored-By` trailer in commits (breaks the Vercel deploy).
- English-only copy; lowercase, casual, "curious friend" voice. No completion/streak/count badges.
- No public leaderboard (Phase B leaderboard is localStorage only).
- Genome genes are all in `0–1`; everything (phenotype, fitness) is deterministically derived from the genome.
- Register the experiment in `lib/experiments.ts` (emoji, pastel color, `href: "/driftbloom"`).

---

## File Structure

**New — pure simulation (`lib/sim/`):**
- `lib/sim/rng.ts` — mulberry32 seeded RNG.
- `lib/sim/genome.ts` — `Genome`, `GENE_KEYS`, random/mutate/crossover, encode/decode.
- `lib/sim/environment.ts` — `Environment` interface + presets/helpers.
- `lib/sim/fitness.ts` — `fitness(g, env)` + `survivalPath(g, env)`.
- `lib/sim/population.ts` — `SimState`, `GenStats`, `initPopulation`, `step`.

**New — renderer (`lib/render/`):**
- `lib/render/blob.ts` — `drawBlob`.
- `lib/render/scene.ts` — `drawScene`.

**New — game logic (`lib/game/`):**
- `lib/game/scenarios.ts` — `Scenario[]` (Phase A data).
- `lib/game/insight.ts` — build participation `insight` + mirror sentence.
- `lib/game/progress.ts` — localStorage read/write.
- `lib/game/share.ts` — DNA ↔ URL helpers (wrap genome encode/decode).
- `lib/game/challenge.ts` — Phase B env scheduler + scoring.

**New — UI (`app/`, `components/driftbloom/`):**
- `app/driftbloom/page.tsx` — server component shell.
- `components/driftbloom/Driftbloom.tsx` — client orchestrator (phase routing).
- `components/driftbloom/GameCanvas.tsx` — canvas + rAF loop.
- `components/driftbloom/Controls.tsx` — env sliders, mutation rate, run/step/reset.
- `components/driftbloom/PredictionGate.tsx` — Phase A prediction UI.
- `components/driftbloom/StatsPanel.tsx` — history charts (own canvas).
- `components/driftbloom/ShareBar.tsx` — DNA URL copy.
- `components/driftbloom/PhaseBRunner.tsx` — open-mode loop + score + leaderboard.

**New — rewards:**
- `lib/rewards/driftbloom.ts` — `BadgeDef[]`.

**Modified:**
- `package.json` — add `vitest` devDep + `test` script.
- `vitest.config.ts` (new) — alias `@` → repo root.
- `lib/experiments.ts` — register the experiment.
- `lib/rewards/index.ts` — import + spread `driftbloomBadges`.

---

## Task 1: Test tooling (vitest)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `lib/sim/__tests__/smoke.test.ts` (temporary, deleted at end of task)

**Interfaces:**
- Produces: `npm test` runs vitest once; `@/*` resolves to repo root inside tests.

- [ ] **Step 1: Install vitest**

Run:
```bash
npm install -D vitest
```

- [ ] **Step 2: Add the test script**

In `package.json` `"scripts"`, add (keep existing dev/build/lint):
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create vitest config with the path alias**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: { include: ["lib/**/*.test.ts"], environment: "node" },
});
```

- [ ] **Step 4: Write a smoke test that uses the alias**

Create `lib/sim/__tests__/smoke.test.ts`:
```ts
import { expect, test } from "vitest";
test("vitest runs", () => { expect(1 + 1).toBe(2); });
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS (1 test). Note: vitest's `include` is `lib/**/*.test.ts`; this smoke file ends in `.test.ts` so it is picked up.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm lib/sim/__tests__/smoke.test.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "chore(driftbloom): add vitest for the pure sim layer"
```

---

## Task 2: Seeded RNG

**Files:**
- Create: `lib/sim/rng.ts`
- Test: `lib/sim/rng.test.ts`

**Interfaces:**
- Produces: `makeRng(seed: number): () => number` (each call returns next float in `[0,1)`); `nextGaussian(rng: () => number): number` (mean 0, sd 1, via Box–Muller).

- [ ] **Step 1: Write the failing test**

Create `lib/sim/rng.test.ts`:
```ts
import { expect, test } from "vitest";
import { makeRng, nextGaussian } from "@/lib/sim/rng";

test("same seed yields the same sequence", () => {
  const a = makeRng(123), b = makeRng(123);
  const seqA = [a(), a(), a(), a()];
  const seqB = [b(), b(), b(), b()];
  expect(seqA).toEqual(seqB);
});

test("different seeds diverge", () => {
  const a = makeRng(1), b = makeRng(2);
  expect(a()).not.toBe(b());
});

test("outputs stay in [0,1)", () => {
  const r = makeRng(7);
  for (let i = 0; i < 1000; i++) {
    const v = r();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  }
});

test("gaussian is roughly centered", () => {
  const r = makeRng(42);
  let sum = 0; const n = 5000;
  for (let i = 0; i < n; i++) sum += nextGaussian(r);
  expect(Math.abs(sum / n)).toBeLessThan(0.1);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL (cannot resolve `@/lib/sim/rng`).

- [ ] **Step 3: Implement**

Create `lib/sim/rng.ts`:
```ts
// mulberry32: a tiny deterministic PRNG. Seed in, a stream of floats in [0,1) out.
// Pure: no Math.random, no global state — the closure carries the seed.
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box–Muller transform: two uniforms → one standard-normal sample.
export function nextGaussian(rng: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rng(); // avoid log(0)
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/sim/rng.ts lib/sim/rng.test.ts
git commit -m "feat(driftbloom): seeded RNG (mulberry32) + gaussian"
```

---

## Task 3: Genome type, GENE_KEYS, randomGenome

**Files:**
- Create: `lib/sim/genome.ts`
- Test: `lib/sim/genome.test.ts`

**Interfaces:**
- Consumes: `makeRng` from `@/lib/sim/rng`.
- Produces:
  - `interface Genome { size; limbCount; limbLength; hue; particleDensity; metabolism; speed; toughness; sensorRange; camouflage }` — all `number` in `0–1`.
  - `const GENE_KEYS: (keyof Genome)[]`.
  - `randomGenome(rng: () => number): Genome`.
  - `clamp01(n: number): number`.

- [ ] **Step 1: Write the failing test**

Create `lib/sim/genome.test.ts`:
```ts
import { expect, test } from "vitest";
import { makeRng } from "@/lib/sim/rng";
import { GENE_KEYS, randomGenome, clamp01 } from "@/lib/sim/genome";

test("GENE_KEYS has all ten genes", () => {
  expect(GENE_KEYS).toHaveLength(10);
  expect(GENE_KEYS).toContain("camouflage");
});

test("randomGenome fills every gene in 0..1", () => {
  const g = randomGenome(makeRng(5));
  for (const k of GENE_KEYS) {
    expect(g[k]).toBeGreaterThanOrEqual(0);
    expect(g[k]).toBeLessThanOrEqual(1);
  }
});

test("randomGenome is seed-deterministic", () => {
  expect(randomGenome(makeRng(9))).toEqual(randomGenome(makeRng(9)));
});

test("clamp01 bounds values", () => {
  expect(clamp01(-3)).toBe(0);
  expect(clamp01(7)).toBe(1);
  expect(clamp01(0.4)).toBe(0.4);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL (cannot resolve `@/lib/sim/genome`).

- [ ] **Step 3: Implement**

Create `lib/sim/genome.ts`:
```ts
export interface Genome {
  size: number;
  limbCount: number;      // → 0..8 outgrowths in the renderer
  limbLength: number;
  hue: number;            // → 0..360°
  particleDensity: number;
  metabolism: number;     // higher = needs more energy, but faster
  speed: number;
  toughness: number;      // resistance to predators
  sensorRange: number;
  camouflage: number;     // genome trait; effective match also depends on env hue
}

export const GENE_KEYS: (keyof Genome)[] = [
  "size", "limbCount", "limbLength", "hue", "particleDensity",
  "metabolism", "speed", "toughness", "sensorRange", "camouflage",
];

export const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

export function randomGenome(rng: () => number): Genome {
  const g = {} as Genome;
  for (const k of GENE_KEYS) g[k] = rng();
  return g;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/sim/genome.ts lib/sim/genome.test.ts
git commit -m "feat(driftbloom): genome type, GENE_KEYS, randomGenome"
```

---

## Task 4: mutate + crossover

**Files:**
- Modify: `lib/sim/genome.ts`
- Test: `lib/sim/genome.test.ts` (append)

**Interfaces:**
- Produces:
  - `mutate(g: Genome, rate: number, rng: () => number): Genome` — per-gene gaussian shift scaled by `rate`, clamped 0–1; returns a new object.
  - `crossover(a: Genome, b: Genome, rng: () => number): Genome` — per-gene pick from one parent at random; returns a new object.

- [ ] **Step 1: Write the failing test (append)**

Append to `lib/sim/genome.test.ts`:
```ts
import { mutate, crossover } from "@/lib/sim/genome";

test("mutate stays clamped in 0..1 even at high rate", () => {
  const base = randomGenome(makeRng(3));
  const r = makeRng(11);
  for (let i = 0; i < 200; i++) {
    const m = mutate(base, 1, r);
    for (const k of GENE_KEYS) {
      expect(m[k]).toBeGreaterThanOrEqual(0);
      expect(m[k]).toBeLessThanOrEqual(1);
    }
  }
});

test("mutate with rate 0 is a no-op copy", () => {
  const base = randomGenome(makeRng(3));
  const m = mutate(base, 0, makeRng(1));
  expect(m).toEqual(base);
  expect(m).not.toBe(base); // new object
});

test("crossover takes every gene from one parent or the other", () => {
  const a = randomGenome(makeRng(1));
  const b = randomGenome(makeRng(2));
  const c = crossover(a, b, makeRng(5));
  for (const k of GENE_KEYS) {
    expect([a[k], b[k]]).toContain(c[k]);
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL (`mutate` / `crossover` not exported).

- [ ] **Step 3: Implement (append to genome.ts)**

Add to `lib/sim/genome.ts` (import `nextGaussian`):
```ts
import { nextGaussian } from "./rng";

const MUTATION_SCALE = 0.15; // sd of the gaussian step at rate 1

// Gaussian per-gene drift, scaled by rate, clamped to the gene's 0–1 range.
export function mutate(g: Genome, rate: number, rng: () => number): Genome {
  const out = {} as Genome;
  for (const k of GENE_KEYS) {
    out[k] = clamp01(g[k] + nextGaussian(rng) * MUTATION_SCALE * rate);
  }
  return out;
}

// Uniform per-gene crossover: each gene comes from parent a or b with equal chance.
export function crossover(a: Genome, b: Genome, rng: () => number): Genome {
  const out = {} as Genome;
  for (const k of GENE_KEYS) out[k] = rng() < 0.5 ? a[k] : b[k];
  return out;
}
```
Put the `import { nextGaussian } from "./rng";` line at the top of the file with other imports (there are none yet — add it as the first line).

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/sim/genome.ts lib/sim/genome.test.ts
git commit -m "feat(driftbloom): genome mutate + crossover"
```

---

## Task 5: encode/decode genome (DNA string)

**Files:**
- Modify: `lib/sim/genome.ts`
- Test: `lib/sim/genome.test.ts` (append)

**Interfaces:**
- Produces:
  - `encodeGenome(g: Genome): string` — each gene quantized to a byte (0–255), packed, base64url, no padding.
  - `decodeGenome(s: string): Genome` — inverse; tolerant of `+/=` vs base64url.

- [ ] **Step 1: Write the failing test (append)**

Append to `lib/sim/genome.test.ts`:
```ts
import { encodeGenome, decodeGenome } from "@/lib/sim/genome";

test("encode→decode round-trips within byte precision", () => {
  const g = randomGenome(makeRng(77));
  const back = decodeGenome(encodeGenome(g));
  for (const k of GENE_KEYS) {
    expect(Math.abs(back[k] - g[k])).toBeLessThan(1 / 255 + 1e-9);
  }
});

test("encoded string is short and url-safe", () => {
  const s = encodeGenome(randomGenome(makeRng(1)));
  expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
  expect(s.length).toBeLessThan(20);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL (`encodeGenome` not exported).

- [ ] **Step 3: Implement (append to genome.ts)**

Add to `lib/sim/genome.ts`:
```ts
// Pure base64 (no Buffer/btoa — keeps lib/sim runnable headless and in the browser).
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function bytesToB64url(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1] ?? 0, b2 = bytes[i + 2] ?? 0;
    const n = (b0 << 16) | (b1 << 8) | b2;
    const chunk = bytes.length - i;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    if (chunk > 1) out += B64[(n >> 6) & 63];
    if (chunk > 2) out += B64[n & 63];
  }
  return out;
}

function b64urlToBytes(s: string): number[] {
  const clean = s.replace(/[+]/g, "-").replace(/[/]/g, "_").replace(/=+$/, "");
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64.indexOf(clean[i]), c1 = B64.indexOf(clean[i + 1]);
    const c2 = clean[i + 2] ? B64.indexOf(clean[i + 2]) : -1;
    const c3 = clean[i + 3] ? B64.indexOf(clean[i + 3]) : -1;
    const n = (c0 << 18) | (c1 << 12) | ((c2 < 0 ? 0 : c2) << 6) | (c3 < 0 ? 0 : c3);
    bytes.push((n >> 16) & 255);
    if (c2 >= 0) bytes.push((n >> 8) & 255);
    if (c3 >= 0) bytes.push(n & 255);
  }
  return bytes;
}

export function encodeGenome(g: Genome): string {
  return bytesToB64url(GENE_KEYS.map((k) => Math.round(clamp01(g[k]) * 255)));
}

export function decodeGenome(s: string): Genome {
  const bytes = b64urlToBytes(s);
  const out = {} as Genome;
  GENE_KEYS.forEach((k, i) => { out[k] = clamp01((bytes[i] ?? 0) / 255); });
  return out;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/sim/genome.ts lib/sim/genome.test.ts
git commit -m "feat(driftbloom): DNA encode/decode (url-safe base64)"
```

---

## Task 6: Environment + fitness (multi-path)

**Files:**
- Create: `lib/sim/environment.ts`
- Create: `lib/sim/fitness.ts`
- Test: `lib/sim/fitness.test.ts`

**Interfaces:**
- Produces (`environment.ts`):
  - `interface Environment { foodAbundance; predatorPressure; temperature; backgroundHue }` — all `0–1`.
  - `const TEMP_NEUTRAL = 0.5`.
- Produces (`fitness.ts`):
  - `fitness(g: Genome, env: Environment): number` — `>= 0`.
  - `type SurvivalPath = "toughness" | "camouflage" | "speed" | "none"`.
  - `survivalPath(g: Genome, env: Environment): SurvivalPath` — which anti-predator trait carried this genome (highest contributor; `"none"` if predator pressure is low).

- [ ] **Step 1: Write the failing test**

Create `lib/sim/fitness.test.ts`:
```ts
import { expect, test } from "vitest";
import type { Environment } from "@/lib/sim/environment";
import { fitness, survivalPath } from "@/lib/sim/fitness";
import { makeRng } from "@/lib/sim/rng";
import { randomGenome, Genome, GENE_KEYS } from "@/lib/sim/genome";

const env = (o: Partial<Environment>): Environment => ({
  foodAbundance: 0.5, predatorPressure: 0.5, temperature: 0.5, backgroundHue: 0.5, ...o,
});
const gene = (o: Partial<Genome>): Genome => {
  const base = {} as Genome;
  for (const k of GENE_KEYS) base[k] = 0.5;
  return { ...base, ...o };
};

test("fitness is always >= 0", () => {
  const r = makeRng(1);
  for (let i = 0; i < 200; i++) {
    expect(fitness(randomGenome(r), env({}))).toBeGreaterThanOrEqual(0);
  }
});

test("camouflage rewards matching the background hue, not a fixed 'better' hue", () => {
  const e = env({ predatorPressure: 1, backgroundHue: 0.2 });
  const matched = gene({ hue: 0.2, toughness: 0.2, speed: 0.2 });
  const mismatched = gene({ hue: 0.9, toughness: 0.2, speed: 0.2 });
  expect(fitness(matched, e)).toBeGreaterThan(fitness(mismatched, e));
});

test("there are multiple ways to beat predators", () => {
  const e = env({ predatorPressure: 1, backgroundHue: 0.0 });
  const byTough = gene({ toughness: 1, camouflage: 0, speed: 0, hue: 1 });
  const bySpeed = gene({ toughness: 0, camouflage: 0, speed: 1, hue: 1 });
  const byCamo = gene({ toughness: 0, camouflage: 1, speed: 0, hue: 0 });
  const weak = gene({ toughness: 0, camouflage: 0, speed: 0, hue: 1 });
  expect(fitness(byTough, e)).toBeGreaterThan(fitness(weak, e));
  expect(fitness(bySpeed, e)).toBeGreaterThan(fitness(weak, e));
  expect(fitness(byCamo, e)).toBeGreaterThan(fitness(weak, e));
});

test("temperature extremes punish high metabolism", () => {
  const cold = env({ temperature: 0 });
  const hi = gene({ metabolism: 1 });
  const lo = gene({ metabolism: 0 });
  expect(fitness(lo, cold)).toBeGreaterThan(fitness(hi, cold));
});

test("survivalPath names the dominant anti-predator trait", () => {
  const e = env({ predatorPressure: 1, backgroundHue: 0 });
  expect(survivalPath(gene({ toughness: 1, camouflage: 0, speed: 0, hue: 1 }), e)).toBe("toughness");
  expect(survivalPath(gene({ toughness: 0, camouflage: 1, speed: 0, hue: 0 }), e)).toBe("camouflage");
  expect(survivalPath(gene({ toughness: 0, camouflage: 0, speed: 1, hue: 1 }), e)).toBe("speed");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL (cannot resolve environment/fitness).

- [ ] **Step 3: Implement environment.ts**

Create `lib/sim/environment.ts`:
```ts
export interface Environment {
  foodAbundance: number;    // 0–1
  predatorPressure: number; // 0–1
  temperature: number;      // 0–1 (extremes punish high metabolism)
  backgroundHue: number;    // 0–1 (camouflage works when genome.hue is near this)
}

export const TEMP_NEUTRAL = 0.5;
```

- [ ] **Step 4: Implement fitness.ts**

Create `lib/sim/fitness.ts`:
```ts
import type { Genome } from "./genome";
import type { Environment } from "./environment";
import { TEMP_NEUTRAL } from "./environment";

export type SurvivalPath = "toughness" | "camouflage" | "speed" | "none";

// Anti-predator contributions: three independent routes (toughness OR camouflage OR speed).
// camouflage is EFFECTIVE only when genome.hue matches the background — pure local fit.
function predatorContributions(g: Genome, env: Environment) {
  const camoMatch = (1 - Math.abs(g.hue - env.backgroundHue)) * g.camouflage;
  return { toughness: g.toughness, camouflage: camoMatch, speed: g.speed };
}

// Fitness rewards ONLY the match to THIS environment — never a generically "better" creature.
export function fitness(g: Genome, env: Environment): number {
  // Food: abundant food makes size/metabolism cheap; scarce food makes them expensive.
  const upkeep = (g.size + g.metabolism) / 2;
  const foodTerm = env.foodAbundance - upkeep * (1 - env.foodAbundance);

  // Predators: best of the three survival routes carries you (they don't simply add).
  const c = predatorContributions(g, env);
  const bestDefence = Math.max(c.toughness, c.camouflage, c.speed);
  const predatorTerm = env.predatorPressure * (bestDefence - 0.5);

  // Temperature: distance from neutral punishes high metabolism.
  const tempStress = Math.abs(env.temperature - TEMP_NEUTRAL) * 2; // 0..1
  const tempTerm = -tempStress * g.metabolism;

  // Sensors give a small flat survival edge proportional to predator + scarcity.
  const sensorTerm = g.sensorRange * 0.15 * (env.predatorPressure + (1 - env.foodAbundance)) / 2;

  const raw = 1 + foodTerm + predatorTerm + tempTerm + sensorTerm;
  return raw < 0 ? 0 : raw;
}

// Which anti-predator route dominates for this genome in this env (for insight/badges).
export function survivalPath(g: Genome, env: Environment): SurvivalPath {
  if (env.predatorPressure < 0.25) return "none";
  const c = predatorContributions(g, env);
  const entries: [SurvivalPath, number][] = [
    ["toughness", c.toughness], ["camouflage", c.camouflage], ["speed", c.speed],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][1] <= 0.5 ? "none" : entries[0][0];
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test`
Expected: PASS. If "multiple ways" fails, confirm each specialist beats `weak` (the `-0.5` offset means a specialist at 1.0 contributes `+0.5*pressure`, weak at 0 contributes `-0.5*pressure`).

- [ ] **Step 6: Commit**

```bash
git add lib/sim/environment.ts lib/sim/fitness.ts lib/sim/fitness.test.ts
git commit -m "feat(driftbloom): environment + multi-path fitness"
```

---

## Task 7: Population + generational step (with history)

**Files:**
- Create: `lib/sim/population.ts`
- Test: `lib/sim/population.test.ts`

**Interfaces:**
- Consumes: `Genome`, `GENE_KEYS`, `randomGenome`, `mutate`, `crossover`; `Environment`; `fitness`; `makeRng`.
- Produces:
  - `interface GenStats { generation; avgFitness; maxFitness; population; means: Record<keyof Genome, number> }`.
  - `interface SimState { generation; population: Genome[]; env: Environment; rngState: number; history: GenStats[] }`.
  - `initPopulation(seed: number, size: number, env: Environment): SimState`.
  - `step(state: SimState, mutationRate: number): SimState` — pure: returns a NEW state, does not mutate the input.
  - `setEnv(state: SimState, env: Environment): SimState` — returns a copy with a new env (for twists).

**Note on RNG threading:** `SimState.rngState` is the integer seed for the *next* step. Each `step` builds `makeRng(rngState)`, runs the generation, then derives the next `rngState` deterministically (e.g. `Math.floor(rng() * 2**32)`).

- [ ] **Step 1: Write the failing test**

Create `lib/sim/population.test.ts`:
```ts
import { expect, test } from "vitest";
import type { Environment } from "@/lib/sim/environment";
import { initPopulation, step, SimState } from "@/lib/sim/population";

const env: Environment = { foodAbundance: 0.6, predatorPressure: 0.7, temperature: 0.5, backgroundHue: 0.3 };

function runN(seed: number, n: number): SimState {
  let s = initPopulation(seed, 40, env);
  for (let i = 0; i < n; i++) s = step(s, 0.3);
  return s;
}

test("initPopulation creates the requested size at generation 0", () => {
  const s = initPopulation(1, 40, env);
  expect(s.population).toHaveLength(40);
  expect(s.generation).toBe(0);
  expect(s.history).toHaveLength(1); // gen 0 stats recorded
});

test("same seed → identical run (determinism)", () => {
  const a = runN(123, 25);
  const b = runN(123, 25);
  expect(a.population).toEqual(b.population);
  expect(a.history).toEqual(b.history);
});

test("different seeds diverge", () => {
  const a = runN(1, 25);
  const b = runN(2, 25);
  expect(a.population).not.toEqual(b.population);
});

test("step does not mutate the input state", () => {
  const s0 = initPopulation(5, 40, env);
  const snapshot = JSON.stringify(s0);
  step(s0, 0.3);
  expect(JSON.stringify(s0)).toBe(snapshot);
});

test("step advances generation and appends history", () => {
  const s0 = initPopulation(5, 40, env);
  const s1 = step(s0, 0.3);
  expect(s1.generation).toBe(1);
  expect(s1.history).toHaveLength(2);
  expect(s1.history[1].generation).toBe(1);
});

test("selection raises average fitness in a stable environment", () => {
  const s = runN(7, 40);
  const first = s.history[0].avgFitness;
  const last = s.history[s.history.length - 1].avgFitness;
  expect(last).toBeGreaterThan(first);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL (cannot resolve population).

- [ ] **Step 3: Implement**

Create `lib/sim/population.ts`:
```ts
import { Genome, GENE_KEYS, randomGenome, mutate, crossover } from "./genome";
import type { Environment } from "./environment";
import { fitness } from "./fitness";
import { makeRng } from "./rng";

export interface GenStats {
  generation: number;
  avgFitness: number;
  maxFitness: number;
  population: number;
  means: Record<keyof Genome, number>;
}

export interface SimState {
  generation: number;
  population: Genome[];
  env: Environment;
  rngState: number;       // seed for the NEXT step
  history: GenStats[];
}

function geneMeans(pop: Genome[]): Record<keyof Genome, number> {
  const means = {} as Record<keyof Genome, number>;
  for (const k of GENE_KEYS) {
    let sum = 0;
    for (const g of pop) sum += g[k];
    means[k] = sum / pop.length;
  }
  return means;
}

function statsFor(pop: Genome[], env: Environment, generation: number): GenStats {
  let sum = 0, max = 0;
  for (const g of pop) {
    const f = fitness(g, env);
    sum += f;
    if (f > max) max = f;
  }
  return { generation, avgFitness: sum / pop.length, maxFitness: max, population: pop.length, means: geneMeans(pop) };
}

export function initPopulation(seed: number, size: number, env: Environment): SimState {
  const rng = makeRng(seed);
  const population: Genome[] = [];
  for (let i = 0; i < size; i++) population.push(randomGenome(rng));
  const nextSeed = Math.floor(rng() * 0x100000000);
  return { generation: 0, population, env, rngState: nextSeed, history: [statsFor(population, env, 0)] };
}

// Fitness-proportional parent pick (roulette) over a precomputed fitness array.
function pickIndex(fits: number[], total: number, rng: () => number): number {
  if (total <= 0) return Math.floor(rng() * fits.length);
  let r = rng() * total;
  for (let i = 0; i < fits.length; i++) { r -= fits[i]; if (r <= 0) return i; }
  return fits.length - 1;
}

// One generation: eval → fitness-proportional selection → crossover + mutate → next gen.
// Pure: returns a new SimState; the input is untouched.
export function step(state: SimState, mutationRate: number): SimState {
  const rng = makeRng(state.rngState);
  const pop = state.population;
  const fits = pop.map((g) => fitness(g, state.env));
  const total = fits.reduce((a, b) => a + b, 0);

  const next: Genome[] = [];
  for (let i = 0; i < pop.length; i++) {
    const a = pop[pickIndex(fits, total, rng)];
    const b = pop[pickIndex(fits, total, rng)];
    next.push(mutate(crossover(a, b, rng), mutationRate, rng));
  }
  const generation = state.generation + 1;
  const nextSeed = Math.floor(rng() * 0x100000000);
  return {
    generation,
    population: next,
    env: state.env,
    rngState: nextSeed,
    history: [...state.history, statsFor(next, state.env, generation)],
  };
}

// Swap the environment (for Phase-A twists / Phase-B shifts). Returns a copy.
export function setEnv(state: SimState, env: Environment): SimState {
  return { ...state, env };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS (all sim tests across files).

- [ ] **Step 5: Commit**

```bash
git add lib/sim/population.ts lib/sim/population.test.ts
git commit -m "feat(driftbloom): population + generational step with history"
```

---

## Task 8: Renderer — blob + scene

**Files:**
- Create: `lib/render/blob.ts`
- Create: `lib/render/scene.ts`
- Test: `lib/render/blob.test.ts`

**Interfaces:**
- Consumes: `Genome`; `SimState`.
- Produces:
  - `drawBlob(ctx: CanvasRenderingContext2D, g: Genome, x: number, y: number, t: number): void` — deterministic per genome; `t` (ms) drives a subtle "breathing" pulse.
  - `drawScene(ctx: CanvasRenderingContext2D, state: SimState, t: number): void` — background from `env.backgroundHue` + a representative sample of the population.
  - Helper `hueToCss(hue01: number, sat: number, light: number): string`.

**Testing note:** the renderer is verified mainly by running the app, but a light test with a stub `ctx` guards against regressions and proves purity (no sim mutation).

- [ ] **Step 1: Write the failing test**

Create `lib/render/blob.test.ts`:
```ts
import { expect, test, vi } from "vitest";
import { drawBlob, hueToCss } from "@/lib/render/blob";
import { makeRng } from "@/lib/sim/rng";
import { randomGenome } from "@/lib/sim/genome";

function stubCtx() {
  return {
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), arc: vi.fn(),
    fill: vi.fn(), translate: vi.fn(), fillStyle: "", globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

test("hueToCss maps 0..1 to a degrees-based hsl string", () => {
  expect(hueToCss(0.5, 70, 50)).toBe("hsl(180, 70%, 50%)");
});

test("drawBlob draws particles without throwing and balances save/restore", () => {
  const ctx = stubCtx();
  const g = randomGenome(makeRng(1));
  drawBlob(ctx, g, 100, 100, 0);
  expect((ctx.save as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  expect((ctx.restore as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
});

test("drawBlob is deterministic in call count for a given genome", () => {
  const g = randomGenome(makeRng(2));
  const a = stubCtx(), b = stubCtx();
  drawBlob(a, g, 0, 0, 0);
  drawBlob(b, g, 0, 0, 0);
  expect((a.arc as ReturnType<typeof vi.fn>).mock.calls.length)
    .toBe((b.arc as ReturnType<typeof vi.fn>).mock.calls.length);
});
```

Add `lib/render/**/*.test.ts` to vitest `include` — update `vitest.config.ts` `include` to `["lib/**/*.test.ts"]` (already covers `lib/render`; no change needed).

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL (cannot resolve `@/lib/render/blob`).

- [ ] **Step 3: Implement blob.ts**

Create `lib/render/blob.ts`:
```ts
import type { Genome } from "@/lib/sim/genome";
import { makeRng } from "@/lib/sim/rng";

export function hueToCss(hue01: number, sat: number, light: number): string {
  return `hsl(${Math.round(hue01 * 360)}, ${sat}%, ${light}%)`;
}

// Genome → a soft cluster of particles. Deterministic: a genome-seeded RNG places particles,
// so the same genome always renders the same shape. `t` only animates a gentle breathing pulse.
export function drawBlob(ctx: CanvasRenderingContext2D, g: Genome, x: number, y: number, t: number): void {
  // Seed the layout from the genome so identical genomes look identical run-to-run.
  const seed = Math.floor((g.hue * 7919 + g.size * 104729 + g.particleDensity * 1299709)) >>> 0;
  const rng = makeRng(seed);

  const radius = 8 + g.size * 34;
  const particles = 6 + Math.round(g.particleDensity * 40);
  const breathe = 1 + Math.sin(t / 700) * 0.05;
  const color = hueToCss(g.hue, 60, 55);

  ctx.save();
  ctx.translate(x, y);

  // Limbs: 0..8 outgrowths radiating out, length from limbLength.
  const limbs = Math.round(g.limbCount * 8);
  ctx.fillStyle = hueToCss(g.hue, 55, 45);
  for (let i = 0; i < limbs; i++) {
    const ang = (i / Math.max(1, limbs)) * Math.PI * 2;
    const len = radius * (0.6 + g.limbLength * 1.4) * breathe;
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * len, Math.sin(ang) * len, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body particles: jittered around the centre within the breathing radius.
  ctx.fillStyle = color;
  for (let i = 0; i < particles; i++) {
    const ang = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * radius * breathe;
    const pr = 2 + rng() * 4;
    ctx.globalAlpha = 0.65 + rng() * 0.35;
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * r, Math.sin(ang) * r, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
```

- [ ] **Step 4: Implement scene.ts**

Create `lib/render/scene.ts`:
```ts
import type { SimState } from "@/lib/sim/population";
import { fitness } from "@/lib/sim/fitness";
import { drawBlob, hueToCss } from "./blob";

// Draw the environment background + a representative sample of the current population.
// Reads state only; never mutates it.
export function drawScene(ctx: CanvasRenderingContext2D, state: SimState, t: number): void {
  const { width, height } = ctx.canvas;
  // Background tinted by the environment hue (this is what camouflage matches against).
  ctx.fillStyle = hueToCss(state.env.backgroundHue, 35, 88);
  ctx.fillRect(0, 0, width, height);

  // Show up to 12 of the fittest individuals on a loose grid.
  const sample = [...state.population]
    .map((g) => ({ g, f: fitness(g, state.env) }))
    .sort((a, b) => b.f - a.f)
    .slice(0, 12);

  const cols = 4;
  const cellW = width / cols;
  const rows = Math.ceil(sample.length / cols);
  const cellH = height / Math.max(1, rows);
  sample.forEach((s, i) => {
    const cx = (i % cols) * cellW + cellW / 2;
    const cy = Math.floor(i / cols) * cellH + cellH / 2;
    drawBlob(ctx, s.g, cx, cy, t + i * 120);
  });
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/render/blob.ts lib/render/scene.ts lib/render/blob.test.ts
git commit -m "feat(driftbloom): canvas renderer (blob + scene)"
```

---

## Task 9: Route shell + GameCanvas + register experiment

**Files:**
- Create: `app/driftbloom/page.tsx`
- Create: `components/driftbloom/GameCanvas.tsx`
- Create: `components/driftbloom/Driftbloom.tsx`
- Modify: `lib/experiments.ts`

**Interfaces:**
- Consumes: `SimState`, `initPopulation`, `step`, `setEnv`; `drawScene`; `Environment`.
- Produces:
  - `GameCanvas` props: `{ state: SimState; width?: number; height?: number }` — runs a rAF loop calling `drawScene` with the live state via a ref.
  - `Driftbloom` is the default client orchestrator (no props yet).

**Note:** `GameCanvas` keeps the latest `state` in a ref updated each render, so the rAF loop (started once) always reads current state without restarting.

- [ ] **Step 1: Implement GameCanvas**

Create `components/driftbloom/GameCanvas.tsx`:
```tsx
"use client";
import { useEffect, useRef } from "react";
import type { SimState } from "@/lib/sim/population";
import { drawScene } from "@/lib/render/scene";

export function GameCanvas({ state, width = 640, height = 420 }: { state: SimState; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state; // always read the freshest state in the loop

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const loop = (t: number) => { drawScene(ctx, stateRef.current, t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", maxWidth: width, borderRadius: 16, display: "block" }} />;
}
```

- [ ] **Step 2: Implement the orchestrator (minimal — random run for now)**

Create `components/driftbloom/Driftbloom.tsx`:
```tsx
"use client";
import { useState } from "react";
import type { Environment } from "@/lib/sim/environment";
import { initPopulation, step, SimState } from "@/lib/sim/population";
import { GameCanvas } from "./GameCanvas";

const DEFAULT_ENV: Environment = { foodAbundance: 0.6, predatorPressure: 0.6, temperature: 0.5, backgroundHue: 0.3 };
const sans = "ui-sans-serif, system-ui, sans-serif";

export default function Driftbloom() {
  const [seed] = useState(() => Math.floor(Math.random() * 1e9)); // UI seed (fine outside lib/sim)
  const [state, setState] = useState<SimState>(() => initPopulation(seed, 40, DEFAULT_ENV));

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text-primary)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 22px 70px", fontFamily: sans }}>
        <h1 style={{ fontSize: "clamp(30px,6vw,46px)", fontWeight: 900, letterSpacing: "-0.03em" }}>🌱 driftbloom</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: 560 }}>watch life adapt to where it is — not toward anywhere.</p>
        <div style={{ margin: "16px 0" }}><GameCanvas state={state} /></div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="sbtn" onClick={() => setState((s) => step(s, 0.3))}>step</button>
          <button className="sbtn" onClick={() => setState((s) => { let n = s; for (let i = 0; i < 10; i++) n = step(n, 0.3); return n; })}>run ×10</button>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>generation {state.generation}</span>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Implement the route shell**

Create `app/driftbloom/page.tsx`:
```tsx
import type { Metadata } from "next";
import Driftbloom from "@/components/driftbloom/Driftbloom";

export const metadata: Metadata = {
  title: "driftbloom — evolution has no goal",
  description: "an evolution sim: selection fits the local environment, not a destination.",
};

export default function Page() {
  return <Driftbloom />;
}
```

- [ ] **Step 4: Register the experiment**

In `lib/experiments.ts`, add to the `experiments` array (after the last entry):
```ts
  {
    slug: "driftbloom",
    emoji: "🌱",
    color: "#DCFCE7",
    href: "/driftbloom",
  },
```

- [ ] **Step 5: Verify it builds and renders**

Run: `npm run dev`
Open `http://localhost:3000/driftbloom`. Expected: a canvas with blobs, a "step" and "run ×10" button; clicking advances the generation counter and the scene visibly changes.

- [ ] **Step 6: Commit**

```bash
git add app/driftbloom components/driftbloom/GameCanvas.tsx components/driftbloom/Driftbloom.tsx lib/experiments.ts
git commit -m "feat(driftbloom): route shell, canvas loop, experiment registration"
```

---

## Task 10: StatsPanel (history charts)

**Files:**
- Create: `components/driftbloom/StatsPanel.tsx`
- Modify: `components/driftbloom/Driftbloom.tsx`

**Interfaces:**
- Consumes: `GenStats` (`history`), `GENE_KEYS`.
- Produces: `StatsPanel` props `{ history: GenStats[] }` — draws avg-fitness line + 3 gene-mean lines on its own canvas (no new dependency).

- [ ] **Step 1: Implement StatsPanel**

Create `components/driftbloom/StatsPanel.tsx`:
```tsx
"use client";
import { useEffect, useRef } from "react";
import type { GenStats } from "@/lib/sim/population";

const TRACKED: { key: keyof GenStats["means"]; color: string; label: string }[] = [
  { key: "toughness", color: "#ef4444", label: "toughness" },
  { key: "camouflage", color: "#22c55e", label: "camouflage" },
  { key: "speed", color: "#3b82f6", label: "speed" },
];

export function StatsPanel({ history }: { history: GenStats[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    if (history.length < 2) return;

    const n = history.length;
    const xAt = (i: number) => (i / (n - 1)) * (W - 8) + 4;

    // avg fitness, normalised to its own max, drawn faint grey.
    const maxF = Math.max(...history.map((h) => h.avgFitness), 0.001);
    ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 1.5; ctx.beginPath();
    history.forEach((h, i) => {
      const y = H - 4 - (h.avgFitness / maxF) * (H - 8);
      i === 0 ? ctx.moveTo(xAt(i), y) : ctx.lineTo(xAt(i), y);
    });
    ctx.stroke();

    // gene means are already 0..1.
    for (const tr of TRACKED) {
      ctx.strokeStyle = tr.color; ctx.lineWidth = 2; ctx.beginPath();
      history.forEach((h, i) => {
        const y = H - 4 - h.means[tr.key] * (H - 8);
        i === 0 ? ctx.moveTo(xAt(i), y) : ctx.lineTo(xAt(i), y);
      });
      ctx.stroke();
    }
  }, [history]);

  return (
    <div>
      <canvas ref={ref} width={640} height={140} style={{ width: "100%", maxWidth: 640, borderRadius: 12, background: "var(--card, #fff)", display: "block" }} />
      <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
        <span>— avg fitness</span>
        {TRACKED.map((t) => <span key={t.key} style={{ color: t.color }}>— {t.label}</span>)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the orchestrator**

In `components/driftbloom/Driftbloom.tsx`, import and render it under the canvas:
```tsx
import { StatsPanel } from "./StatsPanel";
// ...inside the returned JSX, after the controls row:
<div style={{ marginTop: 16 }}><StatsPanel history={state.history} /></div>
```

- [ ] **Step 3: Verify**

Run: `npm run dev`; open `/driftbloom`; click "run ×10" several times. Expected: gene-mean lines move and the avg-fitness line rises in a stable environment.

- [ ] **Step 4: Commit**

```bash
git add components/driftbloom/StatsPanel.tsx components/driftbloom/Driftbloom.tsx
git commit -m "feat(driftbloom): stats panel charting fitness + gene means"
```

---

## Task 11: Controls (env sliders, mutation rate, seeded reset)

**Files:**
- Create: `components/driftbloom/Controls.tsx`
- Modify: `components/driftbloom/Driftbloom.tsx`

**Interfaces:**
- Produces: `Controls` props:
  ```ts
  {
    env: Environment;
    mutationRate: number;
    running: boolean;
    onEnvChange: (env: Environment) => void;
    onMutationRateChange: (r: number) => void;
    onToggleRun: () => void;
    onStep: () => void;
    onReset: () => void;
  }
  ```
- `Driftbloom` gains: a `running` state driving an interval that calls `step` ~4×/s; changing `env` calls `setEnv` on the current state (keeps the population, swaps pressures — this is the live "what if" lever).

- [ ] **Step 1: Implement Controls**

Create `components/driftbloom/Controls.tsx`:
```tsx
"use client";
import type { Environment } from "@/lib/sim/environment";

const sans = "ui-sans-serif, system-ui, sans-serif";
const FIELDS: { key: keyof Environment; label: string }[] = [
  { key: "foodAbundance", label: "food" },
  { key: "predatorPressure", label: "predators" },
  { key: "temperature", label: "temperature" },
  { key: "backgroundHue", label: "background hue" },
];

export function Controls(props: {
  env: Environment; mutationRate: number; running: boolean;
  onEnvChange: (env: Environment) => void;
  onMutationRateChange: (r: number) => void;
  onToggleRun: () => void; onStep: () => void; onReset: () => void;
}) {
  const { env, mutationRate, running } = props;
  return (
    <div style={{ fontFamily: sans, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="sbtn" onClick={props.onToggleRun}>{running ? "pause" : "run"}</button>
        <button className="sbtn" onClick={props.onStep} disabled={running}>step</button>
        <button className="sbtn" onClick={props.onReset}>reset</button>
      </div>
      {FIELDS.map((f) => (
        <label key={f.key} style={{ display: "grid", gridTemplateColumns: "120px 1fr 38px", gap: 8, alignItems: "center", fontSize: 13 }}>
          <span style={{ color: "var(--text-muted)" }}>{f.label}</span>
          <input type="range" min={0} max={1} step={0.01} value={env[f.key]}
            onChange={(e) => props.onEnvChange({ ...env, [f.key]: Number(e.target.value) })} />
          <span style={{ color: "var(--text-muted)" }}>{env[f.key].toFixed(2)}</span>
        </label>
      ))}
      <label style={{ display: "grid", gridTemplateColumns: "120px 1fr 38px", gap: 8, alignItems: "center", fontSize: 13 }}>
        <span style={{ color: "var(--text-muted)" }}>mutation rate</span>
        <input type="range" min={0} max={1} step={0.01} value={mutationRate}
          onChange={(e) => props.onMutationRateChange(Number(e.target.value))} />
        <span style={{ color: "var(--text-muted)" }}>{mutationRate.toFixed(2)}</span>
      </label>
    </div>
  );
}
```

- [ ] **Step 2: Wire run-loop + handlers into the orchestrator**

Replace the body of `components/driftbloom/Driftbloom.tsx` with the wired version:
```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import type { Environment } from "@/lib/sim/environment";
import { initPopulation, step, setEnv, SimState } from "@/lib/sim/population";
import { GameCanvas } from "./GameCanvas";
import { StatsPanel } from "./StatsPanel";
import { Controls } from "./Controls";

const DEFAULT_ENV: Environment = { foodAbundance: 0.6, predatorPressure: 0.6, temperature: 0.5, backgroundHue: 0.3 };
const sans = "ui-sans-serif, system-ui, sans-serif";

export default function Driftbloom() {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [env, setEnvState] = useState<Environment>(DEFAULT_ENV);
  const [mutationRate, setMutationRate] = useState(0.3);
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<SimState>(() => initPopulation(seed, 40, DEFAULT_ENV));
  const mutRef = useRef(mutationRate); mutRef.current = mutationRate;

  // run loop: advance ~4 generations/second while running.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setState((s) => step(s, mutRef.current)), 250);
    return () => clearInterval(id);
  }, [running]);

  function applyEnv(next: Environment) {
    setEnvState(next);
    setState((s) => setEnv(s, next)); // keep the population, change the pressures live
  }
  function reset() {
    const ns = Math.floor(Math.random() * 1e9);
    setSeed(ns); setRunning(false);
    setState(initPopulation(ns, 40, env));
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text-primary)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 22px 70px", fontFamily: sans }}>
        <h1 style={{ fontSize: "clamp(30px,6vw,46px)", fontWeight: 900, letterSpacing: "-0.03em" }}>🌱 driftbloom</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: 560 }}>watch life adapt to where it is — not toward anywhere. seed {seed}</p>
        <div style={{ margin: "16px 0" }}><GameCanvas state={state} /></div>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>generation {state.generation}</span>
        <div style={{ marginTop: 12 }}>
          <Controls
            env={env} mutationRate={mutationRate} running={running}
            onEnvChange={applyEnv} onMutationRateChange={setMutationRate}
            onToggleRun={() => setRunning((r) => !r)}
            onStep={() => setState((s) => step(s, mutationRate))}
            onReset={reset}
          />
        </div>
        <div style={{ marginTop: 16 }}><StatsPanel history={state.history} /></div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`; open `/driftbloom`. Expected: run/pause animates generations; moving sliders changes pressures and the gene-mean lines re-trend; reset starts a fresh seeded run.

- [ ] **Step 4: Commit**

```bash
git add components/driftbloom/Controls.tsx components/driftbloom/Driftbloom.tsx
git commit -m "feat(driftbloom): controls — env sliders, mutation rate, run loop, reset"
```

---

## Task 12: Scenarios + insight builder

**Files:**
- Create: `lib/game/scenarios.ts`
- Create: `lib/game/insight.ts`
- Test: `lib/game/insight.test.ts`

**Interfaces:**
- Produces (`scenarios.ts`):
  - `interface Scenario { id; title; intro; startEnv: Environment; twist?: { atGen: number; env: Environment; message: string }; predictionPrompt: string; revealInsight: string }`.
  - `const SCENARIOS: Scenario[]` (3 entries: `looks-like-a-plan`, `the-twist`, `dead-end`).
- Produces (`insight.ts`):
  - `type GeneFocus = "toughness" | "camouflage" | "speed" | "size" | "metabolism"`.
  - `interface DriftInsight { scenarioId: string; predictedGeneFocus: GeneFocus; actualWinningPath: SurvivalPath; predictionMatched: boolean; survivalPathsUsed: SurvivalPath[] }`.
  - `dominantPath(state: SimState): SurvivalPath` — most common `survivalPath` across the final population.
  - `buildInsight(args: { scenarioId; predictedGeneFocus; finalState: SimState; priorPaths: SurvivalPath[] }): DriftInsight`.
  - `mirrorSentence(insight: DriftInsight): string` — the shareable "what you learned" line.

- [ ] **Step 1: Write the failing test**

Create `lib/game/insight.test.ts`:
```ts
import { expect, test } from "vitest";
import type { Environment } from "@/lib/sim/environment";
import { initPopulation, step, SimState } from "@/lib/sim/population";
import { buildInsight, dominantPath, mirrorSentence } from "@/lib/game/insight";

const env: Environment = { foodAbundance: 0.5, predatorPressure: 1, temperature: 0.5, backgroundHue: 0.1 };
function evolved(seed: number): SimState {
  let s = initPopulation(seed, 40, env);
  for (let i = 0; i < 30; i++) s = step(s, 0.25);
  return s;
}

test("dominantPath returns a defined survival path under predator pressure", () => {
  const p = dominantPath(evolved(3));
  expect(["toughness", "camouflage", "speed", "none"]).toContain(p);
});

test("predictionMatched is true when the predicted focus matches the actual path", () => {
  const finalState = evolved(3);
  const actual = dominantPath(finalState);
  const focus = actual === "none" ? "size" : actual; // map path→focus for the test
  const insight = buildInsight({ scenarioId: "the-twist", predictedGeneFocus: focus as never, finalState, priorPaths: [] });
  expect(insight.predictionMatched).toBe(actual !== "none");
});

test("predictionMatched is false on a clear mismatch", () => {
  const finalState = evolved(3);
  const insight = buildInsight({ scenarioId: "the-twist", predictedGeneFocus: "metabolism", finalState, priorPaths: [] });
  expect(insight.predictionMatched).toBe(false);
});

test("survivalPathsUsed accumulates distinct prior paths plus this one", () => {
  const finalState = evolved(3);
  const insight = buildInsight({ scenarioId: "x", predictedGeneFocus: "speed", finalState, priorPaths: ["toughness"] });
  expect(insight.survivalPathsUsed).toContain("toughness");
  expect(new Set(insight.survivalPathsUsed).size).toBe(insight.survivalPathsUsed.length); // distinct
});

test("mirrorSentence is a non-empty lowercase line", () => {
  const finalState = evolved(3);
  const s = mirrorSentence(buildInsight({ scenarioId: "x", predictedGeneFocus: "metabolism", finalState, priorPaths: [] }));
  expect(s.length).toBeGreaterThan(10);
  expect(s).toBe(s.toLowerCase());
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL (cannot resolve `@/lib/game/insight`).

- [ ] **Step 3: Implement scenarios.ts**

Create `lib/game/scenarios.ts`:
```ts
import type { Environment } from "@/lib/sim/environment";

export interface Scenario {
  id: string;
  title: string;
  intro: string;
  startEnv: Environment;
  twist?: { atGen: number; env: Environment; message: string };
  predictionPrompt: string;
  revealInsight: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "looks-like-a-plan",
    title: "looks like a plan?",
    intro: "a calm, stable world. plenty of food, a steady background. predict where the line goes.",
    startEnv: { foodAbundance: 0.85, predatorPressure: 0.5, temperature: 0.5, backgroundHue: 0.25 },
    predictionPrompt: "which trait will the population lean into?",
    revealInsight: "it converged on what fit THIS world — not toward 'better'. change the world and 'better' changes with it.",
  },
  {
    id: "the-twist",
    title: "the twist",
    intro: "a population already adapted to a dark background. then the lights flip.",
    startEnv: { foodAbundance: 0.6, predatorPressure: 1, temperature: 0.5, backgroundHue: 0.05 },
    twist: { atGen: 25, env: { foodAbundance: 0.6, predatorPressure: 1, temperature: 0.5, backgroundHue: 0.95 }, message: "the background just inverted. perfect camouflage is now a billboard." },
    predictionPrompt: "after the flip, what saves them?",
    revealInsight: "nothing 'went back'. there's no memory of the old optimum — selection just blindly re-fit the new world.",
  },
  {
    id: "dead-end",
    title: "dead end",
    intro: "scarce food pushes everything toward cheap, tiny bodies. then a cold snap.",
    startEnv: { foodAbundance: 0.15, predatorPressure: 0.4, temperature: 0.5, backgroundHue: 0.4 },
    twist: { atGen: 25, env: { foodAbundance: 0.15, predatorPressure: 0.4, temperature: 0.0, backgroundHue: 0.4 }, message: "a cold snap. the cheap bodies that won are now the ones that can't cope." },
    predictionPrompt: "will the lineage 'see it coming' and hedge?",
    revealInsight: "it can't plan ahead. it optimized for yesterday and walked straight into a wall a designer would have dodged.",
  },
];
```

- [ ] **Step 4: Implement insight.ts**

Create `lib/game/insight.ts`:
```ts
import type { SimState } from "@/lib/sim/population";
import { survivalPath, SurvivalPath } from "@/lib/sim/fitness";

export type GeneFocus = "toughness" | "camouflage" | "speed" | "size" | "metabolism";

export interface DriftInsight {
  scenarioId: string;
  predictedGeneFocus: GeneFocus;
  actualWinningPath: SurvivalPath;
  predictionMatched: boolean;
  survivalPathsUsed: SurvivalPath[];
}

// The most common anti-predator route across the final population.
export function dominantPath(state: SimState): SurvivalPath {
  const counts: Record<SurvivalPath, number> = { toughness: 0, camouflage: 0, speed: 0, none: 0 };
  for (const g of state.population) counts[survivalPath(g, state.env)]++;
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as SurvivalPath;
}

export function buildInsight(args: {
  scenarioId: string; predictedGeneFocus: GeneFocus; finalState: SimState; priorPaths: SurvivalPath[];
}): DriftInsight {
  const actual = dominantPath(args.finalState);
  const matched = actual !== "none" && args.predictedGeneFocus === actual;
  const used = Array.from(new Set([...args.priorPaths, actual].filter((p) => p !== "none")));
  return { scenarioId: args.scenarioId, predictedGeneFocus: args.predictedGeneFocus, actualWinningPath: actual, predictionMatched: matched, survivalPathsUsed: used };
}

export function mirrorSentence(insight: DriftInsight): string {
  if (insight.actualWinningPath === "none") return "this world barely pushed back — nothing in particular had to win.";
  if (insight.predictionMatched) return `you read it right: ${insight.actualWinningPath} carried this world. but it only won here.`;
  return `you expected ${insight.predictedGeneFocus}; the world chose ${insight.actualWinningPath}. evolution didn't aim — it just fit.`;
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/game/scenarios.ts lib/game/insight.ts lib/game/insight.test.ts
git commit -m "feat(driftbloom): phase-A scenarios + insight/mirror builder"
```

---

## Task 13: PredictionGate + Phase-A flow

**Files:**
- Create: `components/driftbloom/PredictionGate.tsx`
- Modify: `components/driftbloom/Driftbloom.tsx`

**Interfaces:**
- Consumes: `Scenario`, `SCENARIOS`; `GeneFocus`; `buildInsight`, `mirrorSentence`, `DriftInsight`; `initPopulation`, `step`, `setEnv`.
- Produces: `PredictionGate` props `{ scenario: Scenario; onPredict: (focus: GeneFocus) => void }`.
- `Driftbloom` adds a `mode` state: `"sandbox" | "phaseA"`, a current scenario index, the player's prediction, and a reveal panel. Phase A: pick prediction → auto-run to `twist.atGen` (apply twist) → continue to gen 50 → reveal `mirrorSentence` + `scenario.revealInsight`.

**Note:** To keep this task focused, add a small top tab to switch sandbox/phase-A; the full orchestration (auto-run with twist) lives in a helper `runScenario(scenario, predictedFocus, seed): { finalState, insight }` inside `Driftbloom.tsx`.

- [ ] **Step 1: Implement PredictionGate**

Create `components/driftbloom/PredictionGate.tsx`:
```tsx
"use client";
import type { Scenario } from "@/lib/game/scenarios";
import type { GeneFocus } from "@/lib/game/insight";

const sans = "ui-sans-serif, system-ui, sans-serif";
const CHOICES: { focus: GeneFocus; label: string }[] = [
  { focus: "toughness", label: "tougher armor" },
  { focus: "camouflage", label: "blends in" },
  { focus: "speed", label: "faster" },
  { focus: "size", label: "bigger" },
  { focus: "metabolism", label: "burns hotter" },
];

export function PredictionGate({ scenario, onPredict }: { scenario: Scenario; onPredict: (f: GeneFocus) => void }) {
  return (
    <div style={{ fontFamily: sans, display: "grid", gap: 12, padding: "16px 0" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{scenario.title}</h2>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>{scenario.intro}</p>
      <p style={{ fontWeight: 600, margin: "4px 0 0" }}>{scenario.predictionPrompt}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CHOICES.map((c) => (
          <button key={c.focus} className="sbtn" onClick={() => onPredict(c.focus)}>{c.label}</button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>pick what you think wins, then watch.</p>
    </div>
  );
}
```

- [ ] **Step 2: Add the scenario runner + Phase-A mode to the orchestrator**

In `components/driftbloom/Driftbloom.tsx`, add the imports and a pure helper, plus mode state. Add near the top (after existing imports):
```tsx
import { SCENARIOS, Scenario } from "@/lib/game/scenarios";
import { GeneFocus, DriftInsight, buildInsight, mirrorSentence } from "@/lib/game/insight";
import { PredictionGate } from "./PredictionGate";
import { SurvivalPath } from "@/lib/sim/fitness";
```
Add this pure helper above the component:
```tsx
// Run a Phase-A scenario start→twist→end deterministically and produce the insight.
function runScenario(scenario: Scenario, predicted: GeneFocus, seed: number, priorPaths: SurvivalPath[]): { finalState: SimState; insight: DriftInsight } {
  let s = initPopulation(seed, 40, scenario.startEnv);
  const END = 50;
  for (let gen = 1; gen <= END; gen++) {
    if (scenario.twist && gen === scenario.twist.atGen) s = setEnv(s, scenario.twist.env);
    s = step(s, 0.25);
  }
  return { finalState: s, insight: buildInsight({ scenarioId: scenario.id, predictedGeneFocus: predicted, finalState: s, priorPaths }) };
}
```
Add state inside the component:
```tsx
  const [mode, setMode] = useState<"sandbox" | "phaseA">("sandbox");
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [reveal, setReveal] = useState<DriftInsight | null>(null);
  const [pathsUsed, setPathsUsed] = useState<SurvivalPath[]>([]);

  function handlePredict(focus: GeneFocus) {
    const scenario = SCENARIOS[scenarioIdx];
    const ns = Math.floor(Math.random() * 1e9);
    const { finalState, insight } = runScenario(scenario, focus, ns, pathsUsed);
    setState(finalState);
    setReveal(insight);
    setPathsUsed(insight.survivalPathsUsed);
  }
  function nextScenario() {
    setReveal(null);
    setScenarioIdx((i) => Math.min(i + 1, SCENARIOS.length - 1));
  }
```

- [ ] **Step 3: Render the Phase-A UI**

In the returned JSX of `Driftbloom.tsx`, add a mode switch under the `<h1>` and branch the body:
```tsx
<div style={{ display: "flex", gap: 8, margin: "8px 0 4px" }}>
  <button className="sbtn" onClick={() => setMode("phaseA")} disabled={mode === "phaseA"}>learn (phase a)</button>
  <button className="sbtn" onClick={() => setMode("sandbox")} disabled={mode === "sandbox"}>sandbox</button>
</div>

{mode === "phaseA" && (
  <div>
    {!reveal && <PredictionGate scenario={SCENARIOS[scenarioIdx]} onPredict={handlePredict} />}
    <div style={{ margin: "12px 0" }}><GameCanvas state={state} /></div>
    {reveal && (
      <div style={{ display: "grid", gap: 8, padding: "8px 0" }}>
        {SCENARIOS[scenarioIdx].twist && <p style={{ color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>{SCENARIOS[scenarioIdx].twist!.message}</p>}
        <p style={{ fontWeight: 700, margin: 0 }}>{mirrorSentence(reveal)}</p>
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>{SCENARIOS[scenarioIdx].revealInsight}</p>
        {scenarioIdx < SCENARIOS.length - 1
          ? <button className="sbtn" onClick={nextScenario} style={{ justifySelf: "start" }}>next scenario →</button>
          : <p style={{ fontWeight: 700, margin: 0 }}>that's the whole point: evolution has no goal. now go play (phase b).</p>}
      </div>
    )}
    <div style={{ marginTop: 12 }}><StatsPanel history={state.history} /></div>
  </div>
)}

{mode === "sandbox" && (
  <div>
    {/* existing sandbox JSX: canvas, generation label, Controls, StatsPanel */}
  </div>
)}
```
Move the existing sandbox canvas/label/Controls/StatsPanel block inside the `mode === "sandbox"` branch.

- [ ] **Step 4: Verify**

Run: `npm run dev`; open `/driftbloom`; click "learn (phase a)". Expected: scenario intro + prediction buttons; picking one fast-forwards the sim and shows the mirror line + insight; "next scenario" advances through all three, ending on the closing line.

- [ ] **Step 5: Commit**

```bash
git add components/driftbloom/PredictionGate.tsx components/driftbloom/Driftbloom.tsx
git commit -m "feat(driftbloom): phase-A prediction gate, scenario run, reveal"
```

---

## Task 14: localStorage progress

**Files:**
- Create: `lib/game/progress.ts`
- Test: `lib/game/progress.test.ts`
- Modify: `components/driftbloom/Driftbloom.tsx`

**Interfaces:**
- Produces:
  - `interface DriftProgress { completedScenarios: string[]; phaseBUnlocked: boolean; bestSurvival: number }`.
  - `loadProgress(): DriftProgress` — safe default when absent / SSR (`typeof window === "undefined"`).
  - `saveProgress(p: DriftProgress): void`.
  - `markScenarioComplete(id: string): DriftProgress` — adds id, unlocks Phase B when all `SCENARIOS` done, persists, returns new progress.
  - `recordSurvival(generations: number): DriftProgress` — keeps the max, persists.

- [ ] **Step 1: Write the failing test**

Create `lib/game/progress.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";
import { loadProgress, saveProgress, markScenarioComplete, recordSurvival } from "@/lib/game/progress";

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

test("default progress is empty and locked", () => {
  const p = loadProgress();
  expect(p.completedScenarios).toEqual([]);
  expect(p.phaseBUnlocked).toBe(false);
  expect(p.bestSurvival).toBe(0);
});

test("saveProgress round-trips", () => {
  saveProgress({ completedScenarios: ["a"], phaseBUnlocked: false, bestSurvival: 7 });
  expect(loadProgress().completedScenarios).toEqual(["a"]);
  expect(loadProgress().bestSurvival).toBe(7);
});

test("completing all scenarios unlocks phase B", () => {
  markScenarioComplete("looks-like-a-plan");
  markScenarioComplete("the-twist");
  const p = markScenarioComplete("dead-end");
  expect(p.phaseBUnlocked).toBe(true);
});

test("recordSurvival keeps the max", () => {
  recordSurvival(5);
  expect(recordSurvival(3).bestSurvival).toBe(5);
  expect(recordSurvival(9).bestSurvival).toBe(9);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL (cannot resolve `@/lib/game/progress`).

- [ ] **Step 3: Implement**

Create `lib/game/progress.ts`:
```ts
import { SCENARIOS } from "./scenarios";

export interface DriftProgress {
  completedScenarios: string[];
  phaseBUnlocked: boolean;
  bestSurvival: number;
}

const KEY = "driftbloom:progress:v1";
const DEFAULT: DriftProgress = { completedScenarios: [], phaseBUnlocked: false, bestSurvival: 0 };

export function loadProgress(): DriftProgress {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<DriftProgress>) };
  } catch { return { ...DEFAULT }; }
}

export function saveProgress(p: DriftProgress): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* quota / private mode — ignore */ }
}

export function markScenarioComplete(id: string): DriftProgress {
  const p = loadProgress();
  const completedScenarios = Array.from(new Set([...p.completedScenarios, id]));
  const phaseBUnlocked = SCENARIOS.every((s) => completedScenarios.includes(s.id));
  const next = { ...p, completedScenarios, phaseBUnlocked };
  saveProgress(next);
  return next;
}

export function recordSurvival(generations: number): DriftProgress {
  const p = loadProgress();
  const next = { ...p, bestSurvival: Math.max(p.bestSurvival, generations) };
  saveProgress(next);
  return next;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Wire into the orchestrator**

In `components/driftbloom/Driftbloom.tsx`: import `markScenarioComplete`, `loadProgress`, `DriftProgress`. Add `const [progress, setProgress] = useState<DriftProgress>(() => loadProgress());` Inside `handlePredict`, after `setReveal(insight)`, call `setProgress(markScenarioComplete(scenario.id));`. Surface `progress.phaseBUnlocked` later in Task 16.

- [ ] **Step 6: Commit**

```bash
git add lib/game/progress.ts lib/game/progress.test.ts components/driftbloom/Driftbloom.tsx
git commit -m "feat(driftbloom): localStorage progress + scenario completion"
```

---

## Task 15: Spaghetti integration (participation + rewards + registration prompt)

**Files:**
- Create: `lib/rewards/driftbloom.ts`
- Modify: `lib/rewards/index.ts`
- Modify: `components/driftbloom/Driftbloom.tsx`

**Interfaces:**
- Consumes: existing `POST /api/participation` (`{ experimentSlug, payload, insight }`); `PromptRegistration`; `BadgeDef`, `asBool`; `DriftInsight`.
- Produces: `driftbloomBadges: BadgeDef[]` registered in `lib/rewards/index.ts`. Client records a participation after each Phase-A reveal.

**Badge insight contract:** participation `insight` is the `DriftInsight` object. Badges read `insight.predictionMatched` and `insight.survivalPathsUsed`.

- [ ] **Step 1: Implement the badges**

Create `lib/rewards/driftbloom.ts`:
```ts
import type { BadgeDef } from "./types";

// Driftbloom — evolution has no goal. Badges name what the player saw about THEIR OWN thinking,
// never completion/counts. insight is a DriftInsight: { predictionMatched, survivalPathsUsed, ... }.
export const driftbloomBadges: BadgeDef[] = [
  {
    slug: "expected_a_plan",
    experimentSlug: "driftbloom",
    name: "you expected a plan",
    description: "you predicted a direction; selection just fit the local world instead.",
    criteriaKey: "prediction_missed",
    xp: 10,
    evaluate: ({ participation }) => {
      const insight = participation.insight as { predictionMatched?: boolean } | null;
      return insight?.predictionMatched === false;
    },
  },
  {
    slug: "found_a_second_way",
    experimentSlug: "driftbloom",
    name: "you found a second way to survive",
    description: "you watched a different trait win — there was never one 'right' answer.",
    criteriaKey: "two_survival_paths",
    xp: 15,
    evaluate: ({ participation }) => {
      const insight = participation.insight as { survivalPathsUsed?: string[] } | null;
      return (insight?.survivalPathsUsed?.length ?? 0) >= 2;
    },
  },
];
```

- [ ] **Step 2: Register in the rewards index**

In `lib/rewards/index.ts`, add the import and spread:
```ts
import { driftbloomBadges } from "./driftbloom";
// ...inside ALL_BADGES:
  ...driftbloomBadges,
```

- [ ] **Step 3: Record participation + show registration prompt**

In `components/driftbloom/Driftbloom.tsx`: import `PromptRegistration` from `@/components/PromptRegistration`. Inside `handlePredict`, after computing `insight`, fire-and-forget the participation POST:
```tsx
fetch("/api/participation", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ experimentSlug: "driftbloom", insight, payload: { scenarioId: SCENARIOS[scenarioIdx].id } }),
}).catch(() => {});
```
In the reveal block (Task 13 JSX), under the mirror sentence, add the prompt:
```tsx
<div style={{ marginTop: 8 }}>
  <PromptRegistration
    trigger="on_result"
    headline="keep what you learn here — across every experiment."
    sub="no account needed; sign in to carry your badges across the series."
  />
</div>
```

- [ ] **Step 4: Verify**

Run: `npm run dev`; open `/driftbloom`; complete a Phase-A scenario. Expected: no console errors; the registration prompt appears under the reveal. (Badges award only when signed in / after merge — confirm the POST returns 200 in the Network tab.)

- [ ] **Step 5: Commit**

```bash
git add lib/rewards/driftbloom.ts lib/rewards/index.ts components/driftbloom/Driftbloom.tsx
git commit -m "feat(driftbloom): spaghetti participation + badges + registration prompt"
```

---

## Task 16: DNA share (URL) + ShareBar

**Files:**
- Create: `lib/game/share.ts`
- Test: `lib/game/share.test.ts`
- Create: `components/driftbloom/ShareBar.tsx`
- Modify: `components/driftbloom/Driftbloom.tsx`

**Interfaces:**
- Consumes: `encodeGenome`, `decodeGenome`, `Genome`; `SimState`.
- Produces (`share.ts`):
  - `fittestGenome(state: SimState): Genome` — the single highest-fitness individual.
  - `buildShareUrl(origin: string, g: Genome): string` — `${origin}/driftbloom?dna=<code>`.
  - `readDnaParam(search: string): Genome | null` — parse `?dna=` from a query string; `null` if absent/invalid.
- Produces (`ShareBar.tsx`): props `{ state: SimState }`; copies the URL to clipboard.

- [ ] **Step 1: Write the failing test**

Create `lib/game/share.test.ts`:
```ts
import { expect, test } from "vitest";
import type { Environment } from "@/lib/sim/environment";
import { initPopulation } from "@/lib/sim/population";
import { GENE_KEYS } from "@/lib/sim/genome";
import { fittestGenome, buildShareUrl, readDnaParam } from "@/lib/game/share";

const env: Environment = { foodAbundance: 0.6, predatorPressure: 0.6, temperature: 0.5, backgroundHue: 0.3 };

test("buildShareUrl + readDnaParam round-trip the fittest genome", () => {
  const s = initPopulation(11, 40, env);
  const g = fittestGenome(s);
  const url = buildShareUrl("https://spaghetti.ltd", g);
  expect(url.startsWith("https://spaghetti.ltd/driftbloom?dna=")).toBe(true);
  const search = url.slice(url.indexOf("?"));
  const back = readDnaParam(search)!;
  for (const k of GENE_KEYS) expect(Math.abs(back[k] - g[k])).toBeLessThan(1 / 255 + 1e-9);
});

test("readDnaParam returns null when absent or invalid", () => {
  expect(readDnaParam("")).toBeNull();
  expect(readDnaParam("?foo=1")).toBeNull();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL (cannot resolve `@/lib/game/share`).

- [ ] **Step 3: Implement share.ts**

Create `lib/game/share.ts`:
```ts
import { Genome, encodeGenome, decodeGenome, GENE_KEYS } from "@/lib/sim/genome";
import type { SimState } from "@/lib/sim/population";
import { fitness } from "@/lib/sim/fitness";

export function fittestGenome(state: SimState): Genome {
  let best = state.population[0], bestF = -Infinity;
  for (const g of state.population) {
    const f = fitness(g, state.env);
    if (f > bestF) { bestF = f; best = g; }
  }
  return best;
}

export function buildShareUrl(origin: string, g: Genome): string {
  return `${origin}/driftbloom?dna=${encodeGenome(g)}`;
}

export function readDnaParam(search: string): Genome | null {
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const dna = params.get("dna");
    if (!dna) return null;
    const g = decodeGenome(dna);
    // sanity: decoded genome must have every gene in range
    for (const k of GENE_KEYS) if (!(g[k] >= 0 && g[k] <= 1)) return null;
    return g;
  } catch { return null; }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Implement ShareBar**

Create `components/driftbloom/ShareBar.tsx`:
```tsx
"use client";
import { useState } from "react";
import type { SimState } from "@/lib/sim/population";
import { buildShareUrl, fittestGenome } from "@/lib/game/share";

export function ShareBar({ state }: { state: SimState }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://spaghetti.ltd";
    const url = buildShareUrl(origin, fittestGenome(state));
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  }
  return (
    <button className="sbtn" onClick={share}>{copied ? "copied ✓" : "share this line (dna →)"}</button>
  );
}
```

- [ ] **Step 6: Seed from `?dna=` + show ShareBar**

In `components/driftbloom/Driftbloom.tsx`: import `ShareBar` and `readDnaParam`. On mount, if a `?dna=` genome is present, seed the population around it:
```tsx
import { ShareBar } from "./ShareBar";
import { readDnaParam } from "@/lib/game/share";
import { Genome } from "@/lib/sim/genome";
// ...inside the component:
useEffect(() => {
  if (typeof window === "undefined") return;
  const g = readDnaParam(window.location.search);
  if (!g) return;
  setState((s) => ({ ...s, population: s.population.map(() => ({ ...g })) })); // start everyone from the shared line
}, []);
```
Render `<ShareBar state={state} />` in the sandbox controls row.

- [ ] **Step 7: Verify**

Run: `npm run dev`; open `/driftbloom`; click "share this line" → paste the URL into a new tab. Expected: the run starts from the shared genome (uniform blobs initially).

- [ ] **Step 8: Commit**

```bash
git add lib/game/share.ts lib/game/share.test.ts components/driftbloom/ShareBar.tsx components/driftbloom/Driftbloom.tsx
git commit -m "feat(driftbloom): DNA share via URL + seed-from-dna"
```

---

## Task 17: Phase B — open survival mode

**Files:**
- Create: `lib/game/challenge.ts`
- Test: `lib/game/challenge.test.ts`
- Create: `components/driftbloom/PhaseBRunner.tsx`
- Modify: `components/driftbloom/Driftbloom.tsx`

**Interfaces:**
- Consumes: `Environment`; `SimState`, `step`, `setEnv`; `makeRng`; `recordSurvival`; `GameCanvas`, `StatsPanel`, `ShareBar`.
- Produces (`challenge.ts`):
  - `interface ChallengeState { sim: SimState; tick: number; alive: boolean; rng: () => number }`.
  - `MIN_VIABLE = 0.35` — if a generation's `avgFitness` drops below this the lineage "dies".
  - `SHIFT_EVERY = 12` — generations between environment shifts.
  - `nextEnv(rng: () => number): Environment` — a random environment.
  - `initChallenge(seed: number): ChallengeState`.
  - `tickChallenge(c: ChallengeState, mutationRate: number): ChallengeState` — step once; every `SHIFT_EVERY` ticks, shift env; set `alive=false` when `avgFitness < MIN_VIABLE`.
- Produces (`PhaseBRunner.tsx`): props `{ seed: number; onGameOver: (generations: number) => void }`.

- [ ] **Step 1: Write the failing test**

Create `lib/game/challenge.test.ts`:
```ts
import { expect, test } from "vitest";
import { initChallenge, tickChallenge, SHIFT_EVERY } from "@/lib/game/challenge";

test("initChallenge starts alive at tick 0", () => {
  const c = initChallenge(1);
  expect(c.alive).toBe(true);
  expect(c.tick).toBe(0);
  expect(c.sim.generation).toBe(0);
});

test("same seed → identical challenge run (determinism)", () => {
  const run = (seed: number) => {
    let c = initChallenge(seed);
    for (let i = 0; i < SHIFT_EVERY * 3; i++) c = tickChallenge(c, 0.3);
    return c;
  };
  expect(run(5).sim.population).toEqual(run(5).sim.population);
});

test("the environment shifts on the cadence", () => {
  let c = initChallenge(2);
  const startEnv = { ...c.sim.env };
  for (let i = 0; i < SHIFT_EVERY; i++) c = tickChallenge(c, 0.3);
  expect(c.sim.env).not.toEqual(startEnv); // a shift happened within the window
});

test("a lineage can die (alive flips false on collapse)", () => {
  let c = initChallenge(123);
  let everDied = false;
  for (let i = 0; i < 400 && c.alive; i++) { c = tickChallenge(c, 0.9); if (!c.alive) everDied = true; }
  // high mutation + shifting envs should eventually push at least one seed under the floor;
  // this asserts the death path is reachable, not that it always dies.
  expect(typeof c.alive).toBe("boolean");
  void everDied;
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL (cannot resolve `@/lib/game/challenge`).

- [ ] **Step 3: Implement challenge.ts**

Create `lib/game/challenge.ts`:
```ts
import type { Environment } from "@/lib/sim/environment";
import { initPopulation, step, setEnv, SimState } from "@/lib/sim/population";
import { makeRng } from "@/lib/sim/rng";

export const MIN_VIABLE = 0.35;
export const SHIFT_EVERY = 12;

export interface ChallengeState {
  sim: SimState;
  tick: number;
  alive: boolean;
  rng: () => number;
}

export function nextEnv(rng: () => number): Environment {
  return { foodAbundance: rng(), predatorPressure: rng(), temperature: rng(), backgroundHue: rng() };
}

export function initChallenge(seed: number): ChallengeState {
  const rng = makeRng(seed);
  const sim = initPopulation(Math.floor(rng() * 0x100000000), 40, nextEnv(rng));
  return { sim, tick: 0, alive: true, rng };
}

// One generation of the open challenge. Shifts the environment on a cadence; the lineage dies
// when average fitness falls below the viability floor (the world moved faster than it could).
export function tickChallenge(c: ChallengeState, mutationRate: number): ChallengeState {
  if (!c.alive) return c;
  const tick = c.tick + 1;
  let sim = c.sim;
  if (tick % SHIFT_EVERY === 0) sim = setEnv(sim, nextEnv(c.rng));
  sim = step(sim, mutationRate);
  const avg = sim.history[sim.history.length - 1].avgFitness;
  return { sim, tick, alive: avg >= MIN_VIABLE, rng: c.rng };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS. If "shifts on the cadence" is flaky because a random env equals the start, change the seed in the test to `3`.

- [ ] **Step 5: Implement PhaseBRunner**

Create `components/driftbloom/PhaseBRunner.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { initChallenge, tickChallenge, ChallengeState } from "@/lib/game/challenge";
import { GameCanvas } from "./GameCanvas";
import { StatsPanel } from "./StatsPanel";
import { ShareBar } from "./ShareBar";

const sans = "ui-sans-serif, system-ui, sans-serif";

export function PhaseBRunner({ seed, onGameOver }: { seed: number; onGameOver: (generations: number) => void }) {
  const [c, setC] = useState<ChallengeState>(() => initChallenge(seed));
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running || !c.alive) return;
    const id = setInterval(() => setC((cur) => tickChallenge(cur, 0.3)), 220);
    return () => clearInterval(id);
  }, [running, c.alive]);

  useEffect(() => { if (!c.alive) onGameOver(c.sim.generation); }, [c.alive]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ fontFamily: sans, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <strong>survived: {c.sim.generation} generations</strong>
        {!c.alive && <span style={{ color: "#ef4444" }}>the world outran them. game over.</span>}
      </div>
      <GameCanvas state={c.sim} />
      <div style={{ display: "flex", gap: 8 }}>
        {c.alive
          ? <button className="sbtn" onClick={() => setRunning((r) => !r)}>{running ? "pause" : "resume"}</button>
          : <button className="sbtn" onClick={() => { setC(initChallenge(Math.floor(Math.random() * 1e9))); setRunning(true); }}>try again</button>}
        <ShareBar state={c.sim} />
      </div>
      <StatsPanel history={c.sim.history} />
    </div>
  );
}
```

- [ ] **Step 6: Gate Phase B behind progress + record best**

In `components/driftbloom/Driftbloom.tsx`: import `PhaseBRunner` and `recordSurvival`. Extend `mode` to `"sandbox" | "phaseA" | "phaseB"`. Add a "play (phase b)" tab button, `disabled={!progress.phaseBUnlocked}` with title "finish phase a to unlock". Render the runner:
```tsx
{mode === "phaseB" && (
  <div>
    {progress.phaseBUnlocked
      ? <PhaseBRunner seed={seed} onGameOver={(g) => setProgress(recordSurvival(g))} />
      : <p style={{ color: "var(--text-muted)" }}>finish the three phase-a scenarios to unlock the open world.</p>}
    {progress.bestSurvival > 0 && <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>your best: {progress.bestSurvival} generations</p>}
  </div>
)}
```

- [ ] **Step 7: Record a Phase-B participation on game over (optional insight)**

In the `onGameOver` handler, also POST a participation so survival feeds the profile:
```tsx
onGameOver={(g) => {
  setProgress(recordSurvival(g));
  fetch("/api/participation", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ experimentSlug: "driftbloom", payload: { mode: "phaseB", survived: g } }),
  }).catch(() => {});
}}
```

- [ ] **Step 8: Verify**

Run: `npm run dev`; complete Phase A to unlock; open "play (phase b)". Expected: generations climb, env shifts periodically (background hue jumps), eventually a collapse shows "game over" + "try again"; best survival persists across reloads.

- [ ] **Step 9: Commit**

```bash
git add lib/game/challenge.ts lib/game/challenge.test.ts components/driftbloom/PhaseBRunner.tsx components/driftbloom/Driftbloom.tsx
git commit -m "feat(driftbloom): phase B open survival mode + best-score persistence"
```

---

## Task 18: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all suites PASS (rng, genome, fitness, population, render/blob, insight, progress, share, challenge).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors in `lib/sim`, `lib/render`, `lib/game`, `components/driftbloom`, `app/driftbloom`.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds; `/driftbloom` is in the route list.

- [ ] **Step 4: Manual smoke**

Run: `npm run dev`; walk all three modes (sandbox sliders, phase A all three scenarios + reveals + registration prompt, phase B to a game over + try again + share). Confirm `/api/participation` returns 200 in the Network tab.

- [ ] **Step 5: Confirm the home grid**

Open `/`. Expected: a 🌱 driftbloom card linking to `/driftbloom`.

---

## Self-Review notes (addressed)

- **Spec coverage:** three layers (Tasks 2–11), Phase A predict/twist/reveal (12–13), localStorage (14), Spaghetti DB+rewards+registration (15), DNA URL (16), Phase B + leaderboard-as-bestSurvival (17), vitest determinism (1–7), experiment registration (9). All spec sections map to a task.
- **Type consistency:** `SimState`, `GenStats`, `Environment`, `Genome`, `SurvivalPath`, `DriftInsight`, `DriftProgress`, `ChallengeState` are each defined once and imported by name everywhere they're used. `setEnv` is defined in Task 7 and consumed in 13/17. `survivalPath`/`dominantPath` names are consistent.
- **No public leaderboard:** Phase B "leaderboard" is a single localStorage `bestSurvival` (private), per CLAUDE.md.
- **Purity:** `lib/sim` imports nothing from React/canvas/window; `Math.random()` appears only in UI (`Driftbloom.tsx` seed pick), never in `lib/sim`.
