import { expect, test } from "vitest";
import { priceOfALifeBadges } from "./price-of-a-life";
import type { RewardContext } from "./types";

const ctx = (insight: Record<string, unknown>): RewardContext => ({
  participation: { experimentSlug: "price-of-a-life", insight },
  stats: { distinctExperiments: 1, thisExperimentCount: 1 },
});
const badge = (slug: string) => priceOfALifeBadges.find((b) => b.slug === slug)!;

test("badges sum to exactly 100 XP", () => {
  expect(priceOfALifeBadges.reduce((s, b) => s + b.xp, 0)).toBe(100);
});

test("saw_your_price needs the mirror reached", () => {
  expect(badge("saw_your_price").evaluate(ctx({ reachedMirror: true }))).toBe(true);
  expect(badge("saw_your_price").evaluate(ctx({}))).toBe(false);
});

test("drew_a_line needs both a fund and a skip", () => {
  expect(badge("drew_a_line").evaluate(ctx({ fundedCount: 8, skippedCount: 12 }))).toBe(true);
  expect(badge("drew_a_line").evaluate(ctx({ fundedCount: 20, skippedCount: 0 }))).toBe(false);
  expect(badge("drew_a_line").evaluate(ctx({ fundedCount: 0, skippedCount: 20 }))).toBe(false);
});

test("same_price_different_answer needs one flip", () => {
  expect(badge("same_price_different_answer").evaluate(ctx({ flips: 1 }))).toBe(true);
  expect(badge("same_price_different_answer").evaluate(ctx({ flips: 0 }))).toBe(false);
});

test("who_not_how_much needs a pattern (≥2 flips)", () => {
  expect(badge("who_not_how_much").evaluate(ctx({ flips: 2 }))).toBe(true);
  expect(badge("who_not_how_much").evaluate(ctx({ flips: 1 }))).toBe(false);
});

test("you_paid_for_the_familiar needs ≥2 comfort flips", () => {
  expect(badge("you_paid_for_the_familiar").evaluate(ctx({ comfortFlips: 2 }))).toBe(true);
  expect(badge("you_paid_for_the_familiar").evaluate(ctx({ comfortFlips: 1 }))).toBe(false);
});
