import type { BadgeDef } from "./types";

// "the rules" — three games where following the rules is optional. insight shape:
// { chicken, maze, tetris: "found"|"normal", foundCount }. Badges name what the player NOTICED,
// never completion. The pool sums to exactly 100 XP (studio rule).
type RulesInsight = {
  chicken?: "found" | "normal";
  maze?: "found" | "normal";
  tetris?: "found" | "normal";
};
const ins = (ctx: { participation: { insight?: Record<string, unknown> | null } }): RulesInsight =>
  (ctx.participation.insight as RulesInsight | null) ?? {};

export const rulesBadges: BadgeDef[] = [
  {
    slug: "noticed_rules_optional",
    experimentSlug: "rules",
    name: "you started reading rules as suggestions",
    description: "three games handed you their rules, and three times there was another way out. you noticed.",
    criteriaKey: "completed_the_rules",
    xp: 40,
    evaluate: () => true, // reaching the ending means you were shown the other way every time
  },
  {
    slug: "found_edge",
    experimentSlug: "rules",
    name: "you walked around the whole problem",
    description: "you found the safe shoulder and strolled past the traffic — you didn't have to cross the road at all.",
    criteriaKey: "chicken_edge_found",
    xp: 20,
    evaluate: (ctx) => ins(ctx).chicken === "found",
  },
  {
    slug: "found_fake_wall",
    experimentSlug: "rules",
    name: "you poked a wall instead of trusting it",
    description: "one wall in the maze only looked solid. you tested it — and it let you through.",
    criteriaKey: "maze_fake_wall_found",
    xp: 20,
    evaluate: (ctx) => ins(ctx).maze === "found",
  },
  {
    slug: "found_bigger_field",
    experimentSlug: "rules",
    name: "you moved where the rules swore you couldn't",
    description: "you slid a piece clean off the edge of the board. the field was always bigger than it looked.",
    criteriaKey: "tetris_offedge_found",
    xp: 20,
    evaluate: (ctx) => ins(ctx).tetris === "found",
  },
];
