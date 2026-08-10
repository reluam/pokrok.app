import { Genome, GENE_KEYS, clamp01 } from "@/lib/sim/genome";
import type { Environment } from "@/lib/sim/environment";
import { fitness } from "@/lib/sim/fitness";
import { SimState, step, setEnv, age } from "@/lib/sim/population";

// How a lineage evolves. The player is intelligent_design (directed pushes applied separately,
// then a normal selection step); the rivals each embody a different theory of evolution.
export type Strategy =
  | "intelligent_design" // you — selection acts after your manual gene pushes
  | "gene_eye"           // selfish gene: greedy per-gene climb to the local optimum
  | "group_selection"    // generalist cohesion: spreads wide, never peak-fit
  | "lamarck"            // organism molded directly by the current environment, fast
  | "organism";          // plain modern-synthesis natural selection (baseline)

export const STRATEGY_LABELS: Record<Strategy, string> = {
  intelligent_design: "intelligent design",
  gene_eye: "gene's-eye view",
  group_selection: "group selection",
  lamarck: "lamarckism",
  organism: "natural selection",
};

const MUT = 0.25;
const DELTA = 0.05; // finite-difference probe for the per-gene fitness gradient

// Nudge every genome along the per-gene fitness gradient (estimated at the population mean).
// This is "directed adaptation toward the environment" — its rate distinguishes the strategies.
function gradientNudge(pop: Genome[], env: Environment, rate: number): Genome[] {
  const mean = {} as Genome;
  for (const k of GENE_KEYS) mean[k] = pop.reduce((s, g) => s + g[k], 0) / pop.length;
  const dir = {} as Record<keyof Genome, number>;
  for (const k of GENE_KEYS) {
    const up = { ...mean, [k]: clamp01(mean[k] + DELTA) };
    const dn = { ...mean, [k]: clamp01(mean[k] - DELTA) };
    dir[k] = Math.sign(fitness(up, env) - fitness(dn, env));
  }
  return pop.map((g) => {
    const o = { ...g };
    for (const k of GENE_KEYS) o[k] = clamp01(g[k] + dir[k] * rate);
    return o;
  });
}

// Pull each genome toward the population mean (cohesion) and toward 0.5 (generalist hedging):
// the group acts as a unit and avoids brittle specialization.
function groupAdjust(pop: Genome[]): Genome[] {
  const mean = {} as Genome;
  for (const k of GENE_KEYS) mean[k] = pop.reduce((s, g) => s + g[k], 0) / pop.length;
  return pop.map((g) => {
    const o = { ...g };
    for (const k of GENE_KEYS) {
      let v = g[k] + (mean[k] - g[k]) * 0.3; // cohesion
      v = v + (0.5 - v) * 0.1;               // generalist pull
      o[k] = clamp01(v);
    }
    return o;
  });
}

const withPop = (sim: SimState, pop: Genome[]): SimState => ({ ...sim, population: pop });

// Evolve a lineage one era under its strategy. Pure & deterministic (threads sim.rngState via step).
export function evolveByStrategy(strategy: Strategy, sim: SimState, env: Environment): SimState {
  switch (strategy) {
    case "gene_eye":
      // greedy local optimization: directed nudge, then selection.
      return step(setEnv(withPop(sim, gradientNudge(sim.population, env, 0.06)), env), 0.12);
    case "lamarck":
      // strong directed tracking of the current environment; selection is almost incidental.
      return step(setEnv(withPop(sim, gradientNudge(sim.population, env, 0.25)), env), 0.05);
    case "group_selection":
      // cohesion + generalist hedging, then selection.
      return step(setEnv(withPop(sim, groupAdjust(sim.population)), env), MUT);
    case "intelligent_design":
      // the designer's genome is stable — it changes ONLY via the player's manual pushes (applied
      // in tickEra before this). Just age it so the body keeps maturing; no selection drift.
      return age(setEnv(sim, env));
    case "organism":
    default:
      // plain natural selection (baseline rival).
      return step(setEnv(sim, env), MUT);
  }
}
