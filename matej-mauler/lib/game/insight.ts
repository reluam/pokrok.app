import type { SimState } from "@/lib/sim/population";
import { survivalPath, SurvivalPath } from "@/lib/sim/fitness";

export type GeneFocus = "toughness" | "camouflage" | "speed" | "size" | "metabolism";

export interface DriftInsight {
  scenarioId: string;
  predictedGeneFocus: GeneFocus;
  actualWinningPath: SurvivalPath;
  predictionMatched: boolean;
  survivalPathsUsed: SurvivalPath[];
}

// The most common anti-predator route across the final population.
export function dominantPath(state: SimState): SurvivalPath {
  const counts: Record<SurvivalPath, number> = { toughness: 0, camouflage: 0, speed: 0, none: 0 };
  for (const g of state.population) counts[survivalPath(g, state.env)]++;
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as SurvivalPath;
}

export function buildInsight(args: {
  scenarioId: string; predictedGeneFocus: GeneFocus; finalState: SimState; priorPaths: SurvivalPath[];
}): DriftInsight {
  const actual = dominantPath(args.finalState);
  const matched = actual !== "none" && args.predictedGeneFocus === actual;
  const used = Array.from(new Set([...args.priorPaths, actual].filter((p) => p !== "none")));
  return { scenarioId: args.scenarioId, predictedGeneFocus: args.predictedGeneFocus, actualWinningPath: actual, predictionMatched: matched, survivalPathsUsed: used };
}

export function mirrorSentence(insight: DriftInsight): string {
  if (insight.actualWinningPath === "none") return "this world barely pushed back — nothing in particular had to win.";
  if (insight.predictionMatched) return `you read it right: ${insight.actualWinningPath} carried this world. but it only won here.`;
  return `you expected ${insight.predictedGeneFocus}; the world chose ${insight.actualWinningPath}. evolution didn't aim — it just fit.`;
}
