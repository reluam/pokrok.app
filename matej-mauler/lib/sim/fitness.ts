import type { Genome } from "./genome";
import type { Environment } from "./environment";
import { TEMP_NEUTRAL } from "./environment";

export type SurvivalPath = "toughness" | "camouflage" | "speed" | "none";

// Anti-predator contributions: three independent routes (toughness OR camouflage OR speed).
// camouflage is EFFECTIVE only when genome.hue matches the background — pure local fit.
function predatorContributions(g: Genome, env: Environment) {
  const camoMatch = (1 - Math.abs(g.hue - env.backgroundHue)) * g.camouflage;
  return { toughness: g.toughness, camouflage: camoMatch, speed: g.speed };
}

// Fitness rewards ONLY the match to THIS environment — never a generically "better" creature.
export function fitness(g: Genome, env: Environment): number {
  // Food: abundant food makes size/metabolism cheap; scarce food makes them expensive.
  const upkeep = (g.size + g.metabolism) / 2;
  const foodTerm = env.foodAbundance - upkeep * (1 - env.foodAbundance);

  // Predators: best of the three survival routes carries you (they don't simply add).
  const c = predatorContributions(g, env);
  const bestDefence = Math.max(c.toughness, c.camouflage, c.speed);
  const predatorTerm = env.predatorPressure * (bestDefence - 0.5);

  // Temperature: distance from neutral punishes high metabolism.
  const tempStress = Math.abs(env.temperature - TEMP_NEUTRAL) * 2; // 0..1
  const tempTerm = -tempStress * g.metabolism;

  // Sensors give a small flat survival edge proportional to predator + scarcity.
  const sensorTerm = g.sensorRange * 0.15 * (env.predatorPressure + (1 - env.foodAbundance)) / 2;

  const raw = 1 + foodTerm + predatorTerm + tempTerm + sensorTerm;
  return raw < 0 ? 0 : raw;
}

// Which anti-predator route dominates for this genome in this env (for insight/badges).
export function survivalPath(g: Genome, env: Environment): SurvivalPath {
  if (env.predatorPressure < 0.25) return "none";
  const c = predatorContributions(g, env);
  const entries: [SurvivalPath, number][] = [
    ["toughness", c.toughness], ["camouflage", c.camouflage], ["speed", c.speed],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][1] <= 0.5 ? "none" : entries[0][0];
}
