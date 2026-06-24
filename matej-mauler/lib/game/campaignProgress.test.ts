import { beforeEach, expect, test, vi } from "vitest";
import {
  loadCampaignProgress, saveCampaignProgress, markTutorialDone, recordCampaignResult,
} from "@/lib/game/campaignProgress";

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

test("defaults: tutorial not done, no wins", () => {
  const p = loadCampaignProgress();
  expect(p.tutorialDone).toBe(false);
  expect(p.wins).toBe(0);
  expect(p.bestBiomes).toBe(0);
});

test("saveCampaignProgress round-trips", () => {
  saveCampaignProgress({ tutorialDone: true, wins: 2, bestBiomes: 5 });
  expect(loadCampaignProgress()).toEqual({ tutorialDone: true, wins: 2, bestBiomes: 5 });
});

test("markTutorialDone persists the flag", () => {
  expect(markTutorialDone().tutorialDone).toBe(true);
  expect(loadCampaignProgress().tutorialDone).toBe(true);
});

test("recordCampaignResult counts wins and keeps the best biome count", () => {
  recordCampaignResult({ won: true, playerBiomes: 3 });
  let p = recordCampaignResult({ won: false, playerBiomes: 5 });
  expect(p.wins).toBe(1);
  expect(p.bestBiomes).toBe(5);
  p = recordCampaignResult({ won: true, playerBiomes: 2 });
  expect(p.wins).toBe(2);
  expect(p.bestBiomes).toBe(5);
});
