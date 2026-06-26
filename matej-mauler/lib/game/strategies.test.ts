import { expect, test } from "vitest";
import { GENE_KEYS } from "@/lib/sim/genome";
import type { Environment } from "@/lib/sim/environment";
import { fitness } from "@/lib/sim/fitness";
import { initPopulation, SimState } from "@/lib/sim/population";
import { Strategy, evolveByStrategy, STRATEGY_LABELS } from "@/lib/game/strategies";

// a sharply-gradiented environment so directed strategies have a clear optimum to climb toward.
const env: Environment = { foodAbundance: 0.2, predatorPressure: 1, temperature: 1, backgroundHue: 0 };
const start = (): SimState => initPopulation(42, 40, env);

const meanFitness = (sim: SimState, e: Environment): number =>
  sim.population.reduce((s, g) => s + fitness(g, e), 0) / sim.population.length;

const avgDistFromHalf = (sim: SimState): number => {
  let sum = 0, n = 0;
  for (const g of sim.population) for (const k of GENE_KEYS) { sum += Math.abs(g[k] - 0.5); n++; }
  return sum / n;
};

const ALL: Strategy[] = ["intelligent_design", "gene_eye", "group_selection", "lamarck", "organism"];

test("every strategy is deterministic and advances exactly one generation", () => {
  for (const s of ALL) {
    const a = evolveByStrategy(s, start(), env);
    const b = evolveByStrategy(s, start(), env);
    expect(a).toEqual(b);
    expect(a.generation).toBe(start().generation + 1);
  }
});

test("every strategy has a human-readable label", () => {
  for (const s of ALL) expect(STRATEGY_LABELS[s].length).toBeGreaterThan(0);
});

function runStrategy(s: Strategy, eras: number): SimState {
  let sim = start();
  for (let i = 0; i < eras; i++) sim = evolveByStrategy(s, sim, env);
  return sim;
}

test("gene's-eye view climbs toward higher fitness (greedy local optimization)", () => {
  const before = meanFitness(start(), env);
  const after = meanFitness(runStrategy("gene_eye", 6), env);
  expect(after).toBeGreaterThan(before);
});

test("lamarckism adapts to the current environment faster than plain selection", () => {
  const base = meanFitness(start(), env);
  const lamarckGain = meanFitness(evolveByStrategy("lamarck", start(), env), env) - base;
  const organismGain = meanFitness(evolveByStrategy("organism", start(), env), env) - base;
  expect(lamarckGain).toBeGreaterThan(organismGain);
});

test("group selection trends toward generalists (closer to mid) than the gene's-eye specialist", () => {
  const group = avgDistFromHalf(runStrategy("group_selection", 6));
  const geneEye = avgDistFromHalf(runStrategy("gene_eye", 6));
  expect(group).toBeLessThan(geneEye);
});
