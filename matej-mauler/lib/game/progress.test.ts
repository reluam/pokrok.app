import { beforeEach, expect, test, vi } from "vitest";
import { loadProgress, saveProgress, markScenarioComplete, recordSurvival } from "@/lib/game/progress";

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

test("default progress is empty and locked", () => {
  const p = loadProgress();
  expect(p.completedScenarios).toEqual([]);
  expect(p.phaseBUnlocked).toBe(false);
  expect(p.bestSurvival).toBe(0);
});

test("saveProgress round-trips", () => {
  saveProgress({ completedScenarios: ["a"], phaseBUnlocked: false, bestSurvival: 7 });
  expect(loadProgress().completedScenarios).toEqual(["a"]);
  expect(loadProgress().bestSurvival).toBe(7);
});

test("completing all scenarios unlocks phase B", () => {
  markScenarioComplete("looks-like-a-plan");
  markScenarioComplete("the-twist");
  const p = markScenarioComplete("dead-end");
  expect(p.phaseBUnlocked).toBe(true);
});

test("recordSurvival keeps the max", () => {
  recordSurvival(5);
  expect(recordSurvival(3).bestSurvival).toBe(5);
  expect(recordSurvival(9).bestSurvival).toBe(9);
});
