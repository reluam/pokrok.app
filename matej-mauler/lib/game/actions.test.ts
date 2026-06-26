import { expect, test } from "vitest";
import type { Genome } from "@/lib/sim/genome";
import { applyPush, actionCost, PUSH_COST } from "@/lib/game/actions";

const gene = (o: Partial<Genome>): Genome => ({
  size: 0.5, limbCount: 0.5, limbLength: 0.5, hue: 0.5, particleDensity: 0.5,
  metabolism: 0.5, speed: 0.5, toughness: 0.5, sensorRange: 0.5, camouflage: 0.5, ...o,
});

test("applyPush raises the targeted gene by amount and leaves others untouched", () => {
  const pop = [gene({ toughness: 0.4 }), gene({ toughness: 0.6 })];
  const out = applyPush(pop, "toughness", 0.2);
  expect(out[0].toughness).toBeCloseTo(0.6, 10);
  expect(out[1].toughness).toBeCloseTo(0.8, 10);
  expect(out[0].speed).toBe(0.5); // unrelated gene unchanged
});

test("applyPush clamps to 0..1 and accepts negative amounts", () => {
  const pop = [gene({ camouflage: 0.95 }), gene({ camouflage: 0.1 })];
  expect(applyPush(pop, "camouflage", 0.2)[0].camouflage).toBe(1);
  expect(applyPush(pop, "camouflage", -0.2)[1].camouflage).toBeCloseTo(0, 10);
});

test("applyPush does not mutate the input population", () => {
  const pop = [gene({ size: 0.3 })];
  const snapshot = JSON.stringify(pop);
  applyPush(pop, "size", 0.3);
  expect(JSON.stringify(pop)).toBe(snapshot);
});

test("actionCost returns PUSH_COST for a pushTrait action", () => {
  expect(actionCost({ type: "pushTrait", gene: "speed", amount: 0.1 })).toBe(PUSH_COST);
});
