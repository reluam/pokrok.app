import { Genome, clamp01 } from "@/lib/sim/genome";

// The player's intelligent-design lever: a directed mutation that nudges one gene across the
// whole population, plus (later) abilities. AP is spent per action.
export type PlayerAction = { type: "pushTrait"; gene: keyof Genome; amount: number };

export const PUSH_COST = 2;

export function actionCost(a: PlayerAction): number {
  return a.type === "pushTrait" ? PUSH_COST : 0;
}

// Directed mutation: shift the targeted gene by `amount` (may be negative) across the population,
// clamped to 0..1. Pure — returns a new population, never mutates the input.
export function applyPush(pop: Genome[], gene: keyof Genome, amount: number): Genome[] {
  return pop.map((g) => ({ ...g, [gene]: clamp01(g[gene] + amount) }));
}
