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
