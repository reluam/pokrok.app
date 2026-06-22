import type { Environment } from "@/lib/sim/environment";

export interface Scenario {
  id: string;
  title: string;
  intro: string;
  startEnv: Environment;
  twist?: { atGen: number; env: Environment; message: string };
  predictionPrompt: string;
  revealInsight: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "looks-like-a-plan",
    title: "looks like a plan?",
    intro: "a calm, stable world. plenty of food, a steady background. predict where the line goes.",
    startEnv: { foodAbundance: 0.85, predatorPressure: 0.5, temperature: 0.5, backgroundHue: 0.25 },
    predictionPrompt: "which trait will the population lean into?",
    revealInsight: "it converged on what fit THIS world — not toward 'better'. change the world and 'better' changes with it.",
  },
  {
    id: "the-twist",
    title: "the twist",
    intro: "a population already adapted to a dark background. then the lights flip.",
    startEnv: { foodAbundance: 0.6, predatorPressure: 1, temperature: 0.5, backgroundHue: 0.05 },
    twist: { atGen: 25, env: { foodAbundance: 0.6, predatorPressure: 1, temperature: 0.5, backgroundHue: 0.95 }, message: "the background just inverted. perfect camouflage is now a billboard." },
    predictionPrompt: "after the flip, what saves them?",
    revealInsight: "nothing 'went back'. there's no memory of the old optimum — selection just blindly re-fit the new world.",
  },
  {
    id: "dead-end",
    title: "dead end",
    intro: "scarce food pushes everything toward cheap, tiny bodies. then a cold snap.",
    startEnv: { foodAbundance: 0.15, predatorPressure: 0.4, temperature: 0.5, backgroundHue: 0.4 },
    twist: { atGen: 25, env: { foodAbundance: 0.15, predatorPressure: 0.4, temperature: 0.0, backgroundHue: 0.4 }, message: "a cold snap. the cheap bodies that won are now the ones that can't cope." },
    predictionPrompt: "will the lineage 'see it coming' and hedge?",
    revealInsight: "it can't plan ahead. it optimized for yesterday and walked straight into a wall a designer would have dodged.",
  },
];
