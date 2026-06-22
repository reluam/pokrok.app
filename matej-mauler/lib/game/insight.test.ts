import { expect, test } from "vitest";
import type { Environment } from "@/lib/sim/environment";
import { initPopulation, step, SimState } from "@/lib/sim/population";
import { buildInsight, dominantPath, mirrorSentence } from "@/lib/game/insight";

const env: Environment = { foodAbundance: 0.5, predatorPressure: 1, temperature: 0.5, backgroundHue: 0.1 };
function evolved(seed: number): SimState {
  let s = initPopulation(seed, 40, env);
  for (let i = 0; i < 30; i++) s = step(s, 0.25);
  return s;
}

test("dominantPath returns a defined survival path under predator pressure", () => {
  const p = dominantPath(evolved(3));
  expect(["toughness", "camouflage", "speed", "none"]).toContain(p);
});

test("predictionMatched is true when the predicted focus matches the actual path", () => {
  const finalState = evolved(3);
  const actual = dominantPath(finalState);
  const focus = actual === "none" ? "size" : actual; // map path→focus for the test
  const insight = buildInsight({ scenarioId: "the-twist", predictedGeneFocus: focus as never, finalState, priorPaths: [] });
  expect(insight.predictionMatched).toBe(actual !== "none");
});

test("predictionMatched is false on a clear mismatch", () => {
  const finalState = evolved(3);
  const insight = buildInsight({ scenarioId: "the-twist", predictedGeneFocus: "metabolism", finalState, priorPaths: [] });
  expect(insight.predictionMatched).toBe(false);
});

test("survivalPathsUsed accumulates distinct prior paths plus this one", () => {
  const finalState = evolved(3);
  const insight = buildInsight({ scenarioId: "x", predictedGeneFocus: "speed", finalState, priorPaths: ["toughness"] });
  expect(insight.survivalPathsUsed).toContain("toughness");
  expect(new Set(insight.survivalPathsUsed).size).toBe(insight.survivalPathsUsed.length); // distinct
});

test("mirrorSentence is a non-empty lowercase line", () => {
  const finalState = evolved(3);
  const s = mirrorSentence(buildInsight({ scenarioId: "x", predictedGeneFocus: "metabolism", finalState, priorPaths: [] }));
  expect(s.length).toBeGreaterThan(10);
  expect(s).toBe(s.toLowerCase());
});
