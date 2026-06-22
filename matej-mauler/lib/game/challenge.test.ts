import { expect, test } from "vitest";
import { initChallenge, tickChallenge, SHIFT_EVERY, MIN_VIABLE, ChallengeState } from "@/lib/game/challenge";
import { Genome, GENE_KEYS } from "@/lib/sim/genome";
import type { SimState, GenStats } from "@/lib/sim/population";

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

test("tickChallenge on same input is idempotent (Strict Mode safe)", () => {
  const c = initChallenge(42);
  const a = tickChallenge(c, 0.3);
  const b = tickChallenge(c, 0.3);
  expect(a.rngState).toBe(b.rngState);
  expect(a.sim.population).toEqual(b.sim.population);
});

test("lineage dies when avgFitness is below MIN_VIABLE", () => {
  // Directly test the death mechanic by constructing a population of genomes
  // that are maximally unfit for their environment, so tickChallenge produces
  // avgFitness below MIN_VIABLE and sets alive = false.
  //
  // We build a population where every genome has high size + high metabolism
  // (punished by scarce food and extreme temp), zero defence traits (punished
  // by max predators), in an environment that punishes all of those.
  // Genome that is maximally punished: big, fast-metabolism, no defence, wrong hue.
  // fitness(badGenome, hostileEnv) = max(0, 1 + (-1) + (-0.5) + (-1) + 0) = 0
  const badGenome: Genome = {
    size: 1, limbCount: 0, limbLength: 0, hue: 1, particleDensity: 0,
    metabolism: 1, speed: 0, toughness: 0, sensorRange: 0, camouflage: 0,
  };

  // Hostile env: no food, max predators, extreme temp, backgroundHue opposite to hue.
  const hostileEnv = { foodAbundance: 0, predatorPressure: 1, temperature: 1, backgroundHue: 0 };

  // Build a SimState with a uniform bad population.
  const population: Genome[] = Array.from({ length: 40 }, () => ({ ...badGenome }));
  const means = {} as Record<keyof Genome, number>;
  for (const k of GENE_KEYS) means[k] = badGenome[k];
  const history: GenStats[] = [{
    generation: 10, avgFitness: 0.1, maxFitness: 0.1, population: 40, means,
  }];
  const sim: SimState = { generation: 10, population, env: hostileEnv, rngState: 12345, history };

  // Wrap in a ChallengeState and tick once.
  let c: ChallengeState = { sim, tick: 5, alive: true, rngState: 777 };
  c = tickChallenge(c, 0.01); // low mutation to keep traits bad

  // The population is deeply unfit — avgFitness must be below MIN_VIABLE, so alive = false.
  // This assertion would FAIL if the `alive = avg >= MIN_VIABLE` line were removed.
  expect(c.alive).toBe(false);
  const lastAvg = c.sim.history[c.sim.history.length - 1].avgFitness;
  expect(lastAvg).toBeLessThan(MIN_VIABLE);
});
