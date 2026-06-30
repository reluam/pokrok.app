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
  expect(badge("drew_a_line").evaluate(ctx({ fundedCount: 3, skippedCount: 7 }))).toBe(true);
  expect(badge("drew_a_line").evaluate(ctx({ fundedCount: 10, skippedCount: 0 }))).toBe(false);
  expect(badge("drew_a_line").evaluate(ctx({ fundedCount: 0, skippedCount: 10 }))).toBe(false);
});

test("broke_your_own_rule needs a contradiction", () => {
  expect(badge("broke_your_own_rule").evaluate(ctx({ contradictions: 2 }))).toBe(true);
  expect(badge("broke_your_own_rule").evaluate(ctx({ contradictions: 0 }))).toBe(false);
});

test("distance_changed_math reads the proximity-bias flag", () => {
  expect(badge("distance_changed_math").evaluate(ctx({ distanceBias: true }))).toBe(true);
  expect(badge("distance_changed_math").evaluate(ctx({ distanceBias: false }))).toBe(false);
});

test("priced_lives_100x_apart needs a ≥100× funded span", () => {
  expect(badge("priced_lives_100x_apart").evaluate(ctx({ fundedSpanRatio: 150 }))).toBe(true);
  expect(badge("priced_lives_100x_apart").evaluate(ctx({ fundedSpanRatio: 99 }))).toBe(false);
});
