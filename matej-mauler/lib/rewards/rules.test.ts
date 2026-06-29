import { describe, expect, it } from "vitest";
import { rulesBadges } from "./rules";
import type { RewardContext } from "./types";

const ctx = (insight: Record<string, unknown>): RewardContext => ({
  participation: { experimentSlug: "rules", insight },
  stats: { distinctExperiments: 1, thisExperimentCount: 1 },
});
const badge = (slug: string) => rulesBadges.find((b) => b.slug === slug)!;

describe("rulesBadges", () => {
  it("the badges sum to exactly 100 XP", () => {
    expect(rulesBadges.reduce((n, b) => n + b.xp, 0)).toBe(100);
  });

  it("the final badge is awarded for any completed run", () => {
    expect(badge("noticed_rules_optional").evaluate(ctx({ chicken: "normal", maze: "normal", tetris: "normal" }))).toBe(true);
  });

  it("each discovery badge fires only when that path was found", () => {
    expect(badge("found_edge").evaluate(ctx({ chicken: "found" }))).toBe(true);
    expect(badge("found_edge").evaluate(ctx({ chicken: "normal" }))).toBe(false);
    expect(badge("found_fake_wall").evaluate(ctx({ maze: "found" }))).toBe(true);
    expect(badge("found_bigger_field").evaluate(ctx({ tetris: "found" }))).toBe(true);
    expect(badge("found_bigger_field").evaluate(ctx({ tetris: "normal" }))).toBe(false);
  });

  it("every badge is scoped to rules with self-knowledge copy", () => {
    for (const b of rulesBadges) {
      expect(b.experimentSlug).toBe("rules");
      expect(b.description.length).toBeGreaterThan(10);
      expect(b.xp).toBeGreaterThan(0);
    }
  });
});
