import { expect, test } from "vitest";
import { computeMirror, SCENARIOS, type Decision } from "./priceOfALife";

const dec = (slug: string, funded: boolean): Decision => ({ slug, funded });
const fundAll = (pred: (slug: string) => boolean): Decision[] =>
  SCENARIOS.map((s) => dec(s.slug, pred(s.slug)));

test("20 scenarios in 10 matched pairs, each pair equal-priced", () => {
  expect(SCENARIOS).toHaveLength(20);
  const byPair = new Map<string, number[]>();
  for (const s of SCENARIOS) {
    expect(s.pricePerLife).toBe(s.cost / s.lives);
    byPair.set(s.pairId, [...(byPair.get(s.pairId) ?? []), s.pricePerLife]);
  }
  expect(byPair.size).toBe(10);
  for (const prices of byPair.values()) {
    expect(prices).toHaveLength(2);
    expect(prices[0]).toBe(prices[1]); // the two halves share a price
  }
});

test("funding both halves of every pair → no flips", () => {
  const m = computeMirror(fundAll(() => true));
  expect(m.fundedCount).toBe(20);
  expect(m.flips).toBe(0);
  expect(m.comfortFlips).toBe(0);
  expect(m.pairs.every((p) => p.status === "both")).toBe(true);
});

test("funding only the relatable half of each pair → 9 flips, all comfort", () => {
  const relatable = new Set(SCENARIOS.filter((s) => s.relatable).map((s) => s.slug));
  const m = computeMirror(fundAll((slug) => relatable.has(slug)));
  // 9 pairs have a clear relatable side; the ambulance/class pair has neither, so both its
  // halves are skipped together → not a flip.
  expect(m.flips).toBe(9);
  expect(m.comfortFlips).toBe(9);
  const split = m.pairs.find((p) => p.pairId === "guardrail")!;
  expect(split.status).toBe("split");
  expect(split.fundedWho).toBe("schoolchildren");
  expect(split.skippedWho).toBe("mine workers");
  expect(split.comfort).toBe(true);
});

test("a flip toward the LESS relatable side is not a comfort flip", () => {
  // fund only the non-relatable halves (the ambulance pair, both non-relatable, funds together)
  const relatable = new Set(SCENARIOS.filter((s) => s.relatable).map((s) => s.slug));
  const m = computeMirror(fundAll((slug) => !relatable.has(slug)));
  expect(m.flips).toBe(9);
  expect(m.comfortFlips).toBe(0);
});

test("pairs come back sorted ascending by price", () => {
  const m = computeMirror(fundAll(() => false));
  const prices = m.pairs.map((p) => p.price);
  expect(prices).toEqual([...prices].sort((a, b) => a - b));
  expect(m.fundedCount).toBe(0);
  expect(m.flips).toBe(0);
});
