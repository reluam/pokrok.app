import type { Genome } from "@/lib/sim/genome";
import { clamp01 } from "@/lib/sim/genome";
import type { Environment } from "@/lib/sim/environment";
import { fitness } from "@/lib/sim/fitness";
import { MIN_VIABLE } from "./lineage";

// The genes the player tunes, with friendly names. Cosmetic genes (limbs, texture) are not shown.
export interface ShownTrait { gene: keyof Genome; label: string; }
export const SHOWN_TRAITS: ShownTrait[] = [
  { gene: "size", label: "body size" },
  { gene: "metabolism", label: "metabolism" },
  { gene: "toughness", label: "armor" },
  { gene: "camouflage", label: "camouflage" },
  { gene: "hue", label: "coloration" },
  { gene: "speed", label: "speed" },
  { gene: "sensorRange", label: "senses" },
];

export interface TraitDemand extends ShownTrait { current: number; demand: number; }

// What value this environment "wants" for a trait (0..1) — the pressure side of the scale.
function demandFor(gene: keyof Genome, env: Environment): number {
  const tempStress = Math.abs(env.temperature - 0.5) * 2;
  switch (gene) {
    case "size": return env.foodAbundance;                                  // big bodies only pay off with food
    case "metabolism": return clamp01(env.foodAbundance * (1 - tempStress)); // costly when scarce / extreme
    case "toughness": return env.predatorPressure;                          // a defense route
    case "camouflage": return env.predatorPressure;                         // a defense route (needs matching coloration)
    case "hue": return env.backgroundHue;                                   // match the ground to hide
    case "speed": return env.predatorPressure;                             // a defense route
    case "sensorRange": return clamp01((env.predatorPressure + (1 - env.foodAbundance)) / 2);
    default: return 0.5;
  }
}

export function traitDemands(genome: Genome, env: Environment): TraitDemand[] {
  return SHOWN_TRAITS.map((t) => ({ ...t, current: genome[t.gene], demand: demandFor(t.gene, env) }));
}

// Coaching: a few lowercase lines telling the player what this world is asking of them. The game
// "teaches" the genes by naming the gap between the creature and the environment.
export function coachingHints(genome: Genome, env: Environment): string[] {
  const hints: string[] = [];

  if (fitness(genome, env) < MIN_VIABLE) {
    hints.push("genetically you're a poor fit for this world — adapt fast or you'll fade.");
  }

  // a defense gap is the most urgent thing under predators (any one of armor/camo/speed works)
  const bestDefense = Math.max(genome.toughness, (1 - Math.abs(genome.hue - env.backgroundHue)) * genome.camouflage, genome.speed);
  if (env.predatorPressure > 0.5 && bestDefense < 0.5) {
    hints.push("predators are fierce here — pick a defense: armor, camouflage (match the ground), or speed.");
  }
  if (env.predatorPressure > 0.4 && genome.camouflage > 0.5 && Math.abs(genome.hue - env.backgroundHue) > 0.3) {
    hints.push("your camouflage doesn't match the ground — shift your coloration to blend in.");
  }
  if (env.foodAbundance < 0.4 && (genome.size + genome.metabolism) / 2 > 0.6) {
    hints.push("food is scarce — a big, hungry body is a liability here.");
  }
  const tempStress = Math.abs(env.temperature - 0.5) * 2;
  if (tempStress > 0.5 && genome.metabolism > 0.6) {
    hints.push("the temperature is brutal on a fast metabolism — dial it down.");
  }

  if (hints.length === 0) hints.push("you're reasonably suited here — press the advantage and spread.");
  return hints.slice(0, 3);
}
