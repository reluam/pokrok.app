# Driftbloom — design spec

_Date: 2026-06-22 · Status: approved, ready for implementation plan_

## What it is

An evolution sim that teaches one counterintuitive truth: **evolution has no goal.**
Selection optimizes for the *local* environment — not toward "better", "more complex",
or any destination. A second truth rides along for free: in small populations, **drift**
fixes non-optimal genes by chance.

The experiment has two phases over **identical mechanics**:

- **Phase A (5–15 min, "understanding"):** guided scenarios. The player *predicts* the
  outcome, then watches it unfold, then sees the diff. The gap between prediction and
  reality is the aha moment.
- **Phase B ("for the win"):** open challenge. Adapt a lineage to shifting environments,
  survive as long as possible, collect, share DNA.

This is a Spaghetti experiment (slug `driftbloom`, route `/driftbloom`), built **inside the
existing matej-mauler Next.js 16 repo** as a new experiment route — not a fresh scaffold.

## Core architectural rule: three hard-separated layers

Data flows **one way: simulation → render.** UI drives inputs. If render ever needs to
mutate the simulation, the design is wrong — stop and flag it.

### 1. `lib/sim/` — pure simulation

No React, no canvas, no `window`, no `Math.random()`. Deterministic up to a seeded RNG:
**same seed = same run.** Runnable headless (for tests/reproducibility).

- `rng.ts` — mulberry32 (or splitmix32). Seed is a number. Returns a `() => number`.
- `genome.ts`:
  ```ts
  export interface Genome {
    size: number; limbCount: number; limbLength: number; hue: number;
    particleDensity: number; metabolism: number; speed: number;
    toughness: number; sensorRange: number; camouflage: number; // all 0–1
  }
  export const GENE_KEYS: (keyof Genome)[];
  export function randomGenome(rng: () => number): Genome;
  export function mutate(g: Genome, rate: number, rng: () => number): Genome; // gaussian shift, clamp 0–1
  export function crossover(a: Genome, b: Genome, rng: () => number): Genome;  // per-gene random parent
  export function encodeGenome(g: Genome): string; // short base64
  export function decodeGenome(s: string): Genome;
  ```
- `environment.ts`:
  ```ts
  export interface Environment {
    foodAbundance: number; predatorPressure: number;
    temperature: number; backgroundHue: number; // all 0–1
  }
  ```
- `fitness.ts` — `fitness(g, env) => number >= 0`. **Rewards env-match ONLY**, never a
  generically "better/more complex" creature — that is the whole point. Pressures:
  - lots of food → size/metabolism is cheap; scarce food → expensive.
  - high predator → rewards toughness **OR** camouflage **OR** speed (**multiple paths**, so
    the player's single prediction often fails — that is the aha).
  - temperature extreme → punishes high metabolism.
  - `camouflage_match = 1 - |g.hue - env.backgroundHue|`.
- `population.ts`:
  ```ts
  export interface SimState {
    generation: number; population: Genome[]; // ~30–60
    env: Environment; rngState: number; history: GenStats[];
  }
  export function initPopulation(seed: number, size: number, env: Environment): SimState;
  export function step(state: SimState, mutationRate: number): SimState;
  // eval fitness → select (fitness-proportional / tournament) → reproduce (crossover+mutate) → next gen; append history.
  ```
  Drift is **not** coded specially — keep population small (~30–60) so chance naturally
  fixes non-optimal genes.

### 2. `lib/render/` — canvas readers (mutate nothing)

- `blob.ts` — `drawBlob(ctx, g, x, y, t)`: genome → deterministic particle blob (size→radius,
  limbCount→0–8 outgrowths, limbLength, hue→0–360°, particleDensity→particle count). Soft
  "breathing" animation via `t`. No physics needed for MVP.
- `scene.ts` — `drawScene(ctx, state, t)`: background from `env.backgroundHue` + a
  representative population sample.

### 3. `app/` + `components/driftbloom/` — React UI

- `app/driftbloom/page.tsx` — server component (auth/profile sync if needed), renders the
  client orchestrator.
- `components/driftbloom/`:
  - `Driftbloom.tsx` — orchestrator (phase, current scenario, XP/progress).
  - `GameCanvas.tsx` — canvas + `requestAnimationFrame` loop; holds live `SimState` in a ref,
    reads it each frame, calls `drawScene`.
  - `Controls.tsx` — env sliders, mutation rate, seeded reset, run/step.
  - `PredictionGate.tsx` — Phase A: before running, the player guesses the outcome.
  - `StatsPanel.tsx` — charts from `history` (avg fitness + 2–3 genes; own canvas, no new dep).
  - `ShareBar.tsx` — encode DNA ↔ URL (`?dna=`), copy link.
  - `PhaseBRunner.tsx` — open mode loop + score.

## Persistence — three stores, each doing what it is good at

The Driftbloom prompt said "localStorage only, no DB/auth". CLAUDE.md requires every
experiment to record a personal insight and plug into Spaghetti XP/badges. Reconciliation:

1. **Spaghetti DB** (durable identity / insight / XP / badges): client POSTs to the
   **existing** `app/api/participation/route.ts` with
   `{ experimentSlug: "driftbloom", payload, insight }`. **No new endpoint.** Anonymous-first
   (`sp_anon` session); merges into the account on sign-in automatically via existing
   `resolveParticipationActor` / `syncAuthedUser`.
2. **localStorage** (ephemeral game state): current run, unlocked scenarios, local best
   survival score — instant resume without an account.
3. **URL** (`?dna=`): `encodeGenome` / `decodeGenome` base64 for sharing a line.

## Rewards & registration (CLAUDE.md standing rules)

- `lib/game/insight.ts` builds the personal "mirror" sentence + a structured `insight`
  payload (e.g. `{ scenarioId, predictedGeneFocus, actualWinningPath, predictionMatched,
  survivalPathsUsed }`).
- `lib/rewards/driftbloom.ts` exports `BadgeDef[]`, registered in `lib/rewards/index.ts`
  (seeded into `badges` on `ensure()`). Badges name **what the player learned about
  themselves**, never completion/counts/streaks. Initial two:
  - **"You expected a plan."** — your Phase-A prediction assumed direction/progress, but
    selection chose local fit. (`insight.predictionMatched === false` on a scenario.)
  - **"You found a second way to survive."** — you won a scenario via a different trait path
    (toughness vs camouflage vs speed) than a previous win. (`insight.survivalPathsUsed`
    shows ≥2 distinct paths across the user's runs — read via stats/payload.)
- `<PromptRegistration trigger="on_result">` shown AFTER the first reveal lands. Never gates
  the core; "keep this across the series" framing.

## Phase A — 3 scenarios (data-driven, `lib/game/scenarios.ts`)

```ts
export interface Scenario {
  id: string; title: string; intro: string;
  startEnv: Environment;
  twist?: { atGen: number; env: Environment; message: string };
  predictionPrompt: string; revealInsight: string;
}
```

1. **"Looks like a plan?"** — stable env; player predicts a direction, watches convergence
   to the local optimum. Insight: optimization to local pressure, not toward a "goal".
2. **"The Twist"** — an adapted population, then the env flips (`backgroundHue` inverts). What
   was perfect is now baggage; the creature does not "revert" — it blindly reacts. Insight:
   no trajectory toward a destination.
3. **"Dead End"** — population driven to an extreme; the twist nearly wipes it out. Insight:
   design wouldn't do this; selection (and drift) did.

**Prediction mechanic:** before each run the player guesses (sliders "which gene wins" or
sketch choice). After the run, show predicted vs actual. This is where the aha forms.

## Phase B — open mode

Unlocked after Phase A. Series of random/shifting environments; score = survived generations
+ milestones reached. Leaderboard is **localStorage only** (no public leaderboard — CLAUDE.md).
Share best line via DNA URL.

## Testing — add vitest

The main app has no test runner yet. Add `vitest` + a `test` script. Cover the pure layer:

- Same seed ⇒ identical run (genome sequence + history).
- `mutate` / `crossover` outputs stay clamped 0–1.
- `fitness` rewards env-match (not "complexity") and exposes ≥2 viable survival paths.
- `decodeGenome(encodeGenome(g))` round-trips.

## Build order (Step 1 "scaffold" from the prompt is dropped — already in Next 16)

1. `lib/sim/` complete (rng, genome, environment, fitness, population) + vitest determinism
   tests. **Checkpoint.**
2. `lib/render/` (blob, scene) + a minimal canvas route drawing one random-genome blob, then
   an evolving scene. **Checkpoint.**
3. Wire sim ↔ canvas: step/run button, scene evolves, StatsPanel (avg fitness + 2–3 genes).
   **Checkpoint.**
4. `Controls.tsx`: env sliders, mutation rate, seeded reset. **Checkpoint.**
5. Phase A: `PredictionGate` + 3 scenarios + reveal. **Checkpoint.**
6. Spaghetti integration: participation POST, `lib/rewards/driftbloom.ts` + register,
   `PromptRegistration`, DNA share URL. **Checkpoint.**
7. Phase B open mode + score + localStorage leaderboard. **Checkpoint.**

## Constraints (from the prompt + CLAUDE.md)

- TypeScript strict; no `any` without reason.
- `lib/sim/` stays pure (no React/canvas/`window`/`Math.random`).
- Small focused files; no god component.
- Comment only non-trivial spots (gene→phenotype mapping, fitness, RNG).
- No `Co-Authored-By` trailer in commits (breaks Vercel deploy).
- English-only copy; lowercase, casual, curious-friend voice.
- Register the experiment in `lib/experiments.ts` (emoji + pastel color + `href: "/driftbloom"`).
