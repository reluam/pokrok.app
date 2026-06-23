import { expect, test } from "vitest";
import { driftbloomBadges } from "./driftbloom";
import type { RewardContext } from "./types";

const ctx = (insight: Record<string, unknown>): RewardContext => ({
  participation: { experimentSlug: "driftbloom", insight },
  stats: { distinctExperiments: 1, thisExperimentCount: 1 },
});

const badge = (slug: string) => driftbloomBadges.find((b) => b.slug === slug)!;

test("the win badge fires only on a won campaign", () => {
  expect(badge("out_designed_selection").evaluate(ctx({ won: true }))).toBe(true);
  expect(badge("out_designed_selection").evaluate(ctx({ won: false }))).toBe(false);
});

test("the loss-insight badge fires only on a lost campaign", () => {
  expect(badge("watched_no_goal").evaluate(ctx({ won: false }))).toBe(true);
  expect(badge("watched_no_goal").evaluate(ctx({ won: true }))).toBe(false);
});

test("every badge is scoped to driftbloom with self-knowledge copy and positive xp", () => {
  for (const b of driftbloomBadges) {
    expect(b.experimentSlug).toBe("driftbloom");
    expect(b.description.length).toBeGreaterThan(10);
    expect(b.xp).toBeGreaterThan(0);
  }
});
