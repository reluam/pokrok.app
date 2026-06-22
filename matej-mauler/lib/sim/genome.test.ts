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
