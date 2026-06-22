import { expect, test } from "vitest";
import { makeRng } from "@/lib/sim/rng";
import { GENE_KEYS, randomGenome, clamp01, mutate, crossover, encodeGenome, decodeGenome } from "@/lib/sim/genome";

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
