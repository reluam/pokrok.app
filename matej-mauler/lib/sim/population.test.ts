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
