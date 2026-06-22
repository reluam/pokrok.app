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
