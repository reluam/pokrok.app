import type { Environment } from "@/lib/sim/environment";
import { initPopulation, step, setEnv, SimState } from "@/lib/sim/population";
import { makeRng } from "@/lib/sim/rng";

export const MIN_VIABLE = 0.35;
export const SHIFT_EVERY = 12;

export interface ChallengeState {
  sim: SimState;
  tick: number;
  alive: boolean;
  rngState: number;
}

export function nextEnv(rng: () => number): Environment {
  return { foodAbundance: rng(), predatorPressure: rng(), temperature: rng(), backgroundHue: rng() };
}

export function initChallenge(seed: number): ChallengeState {
  const rng = makeRng(seed);
  const sim = initPopulation(Math.floor(rng() * 0x100000000), 40, nextEnv(rng));
  return { sim, tick: 0, alive: true, rngState: Math.floor(rng() * 0x100000000) };
}

// One generation of the open challenge. Shifts the environment on a cadence; the lineage dies
// when average fitness falls below the viability floor (the world moved faster than it could).
export function tickChallenge(c: ChallengeState, mutationRate: number): ChallengeState {
  if (!c.alive) return c;
  const rng = makeRng(c.rngState);
  const tick = c.tick + 1;
  let sim = c.sim;
  if (tick % SHIFT_EVERY === 0) sim = setEnv(sim, nextEnv(rng));
  sim = step(sim, mutationRate);
  const avg = sim.history[sim.history.length - 1].avgFitness;
  return { sim, tick, alive: avg >= MIN_VIABLE, rngState: Math.floor(rng() * 0x100000000) };
}
