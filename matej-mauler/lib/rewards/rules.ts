import type { BadgeDef, RewardContext } from "./types";
import { RULES_GAMES } from "../rules/games";

// "the rules" — a chain of games where following the rules is optional. insight shape:
// { [gameKey]: "found"|"normal", foundCount }. Badges name what the player NOTICED, never completion.
// The pool sums to exactly 100 XP (studio rule), split so it stays 100 for ANY number of games:
// each discovery badge gets floor(90 / N), the final badge takes the remainder (always ≥ 10).
const DISCOVERY_XP = Math.floor(90 / RULES_GAMES.length);
const FINAL_XP = 100 - DISCOVERY_XP * RULES_GAMES.length;

const ins = (ctx: RewardContext): Record<string, unknown> =>
  (ctx.participation.insight as Record<string, unknown> | null) ?? {};

export const rulesBadges: BadgeDef[] = [
  {
    slug: "noticed_rules_optional",
    experimentSlug: "rules",
    name: "you started reading rules as suggestions",
    description: "every game handed you its rules, and every time there was another way out. you noticed.",
    criteriaKey: "completed_the_rules",
    xp: FINAL_XP,
    evaluate: () => true, // reaching the ending means you were shown the other way every time
  },
  ...RULES_GAMES.map((g): BadgeDef => ({
    slug: g.badge.slug,
    experimentSlug: "rules",
    name: g.badge.name,
    description: g.badge.description,
    criteriaKey: g.badge.criteriaKey,
    xp: DISCOVERY_XP,
    evaluate: (ctx) => ins(ctx)[g.key] === "found",
  })),
];
