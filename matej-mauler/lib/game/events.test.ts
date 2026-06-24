import { expect, test } from "vitest";
import { makeRng } from "@/lib/sim/rng";
import { initPopulation } from "@/lib/sim/population";
import { generateWorld } from "@/lib/game/world";
import { Lineage, isAlive } from "@/lib/game/lineage";
import {
  shiftClimate, rollCatastrophe, applyCatastrophe, CATASTROPHE_FROM,
} from "@/lib/game/events";

const env = { foodAbundance: 0.5, predatorPressure: 0.5, temperature: 0.5, backgroundHue: 0.5 };
function lin(id: string, kind: "player" | "npc", presence: Record<string, number>): Lineage {
  return { id, kind, strategy: "organism", color: "#000", sim: initPopulation(1, 5, env), presence, ap: 0, alive: Object.keys(presence).length > 0 };
}

test("shiftClimate is deterministic, perturbs envs, and preserves ids/adjacency within 0..1", () => {
  const w = generateWorld(3, 6);
  const a = shiftClimate(w, makeRng(99));
  const b = shiftClimate(w, makeRng(99));
  expect(a).toEqual(b);
  expect(a).not.toEqual(w);
  expect(a.biomes.map((x) => x.id)).toEqual(w.biomes.map((x) => x.id));
  for (let i = 0; i < a.biomes.length; i++) {
    expect(a.biomes[i].neighbors).toEqual(w.biomes[i].neighbors);
    for (const v of Object.values(a.biomes[i].env)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  }
});

test("rollCatastrophe returns null before the catastrophe era and is deterministic", () => {
  const w = generateWorld(1, 6);
  const ls = [lin("player", "player", { b0: 0.5 }), lin("npc1", "npc", { b1: 0.5 })];
  expect(rollCatastrophe(CATASTROPHE_FROM - 1, w, ls, makeRng(5))).toBeNull();
  expect(rollCatastrophe(8, w, ls, makeRng(5))).toEqual(rollCatastrophe(8, w, ls, makeRng(5)));
});

test("rollCatastrophe does fire on some seeds once the catastrophe era is reached", () => {
  const w = generateWorld(1, 6);
  const ls = [lin("player", "player", { b0: 0.5 }), lin("npc1", "npc", { b1: 0.5 })];
  const fired = Array.from({ length: 30 }, (_, s) => rollCatastrophe(8, w, ls, makeRng(s + 1))).some((c) => c !== null);
  expect(fired).toBe(true);
});

test("applyCatastrophe asteroid removes the struck biome from everyone's presence", () => {
  const ls = [lin("player", "player", { b0: 0.6, b1: 0.4 }), lin("npc1", "npc", { b2: 0.5 })];
  const { lineages } = applyCatastrophe({ kind: "asteroid", biomeId: "b1" }, ls);
  expect(lineages.find((l) => l.id === "player")!.presence).toEqual({ b0: 0.6 });
  expect(lineages.find((l) => l.id === "npc1")!.presence).toEqual({ b2: 0.5 });
});

test("applyCatastrophe plague knocks a lineage back (and can wipe a barely-present one)", () => {
  const ls = [lin("player", "player", { b0: 0.8, b1: 0.6 }), lin("npc1", "npc", { b2: 0.05 })];
  const out = applyCatastrophe({ kind: "plague", lineageId: "player" }, ls).lineages;
  const knocked = out.find((l) => l.id === "player")!;
  expect(knocked.presence.b0).toBeLessThan(0.8); // reduced
  const wiped = applyCatastrophe({ kind: "plague", lineageId: "npc1" }, ls).lineages.find((l) => l.id === "npc1")!;
  expect(isAlive(wiped)).toBe(false); // 0.05 * 0.35 falls below the floor
});

test("applyCatastrophe massExtinction halves everyone's presence", () => {
  const ls = [lin("player", "player", { b0: 0.8 }), lin("npc1", "npc", { b1: 0.6 })];
  const { lineages } = applyCatastrophe({ kind: "massExtinction" }, ls);
  expect(lineages.find((l) => l.id === "player")!.presence.b0).toBeCloseTo(0.4, 10);
  expect(lineages.find((l) => l.id === "npc1")!.presence.b1).toBeCloseTo(0.3, 10);
});

test("applyCatastrophe does not mutate the input lineages", () => {
  const ls = [lin("player", "player", { b0: 0.6, b1: 0.4 })];
  const snap = JSON.stringify(ls);
  applyCatastrophe({ kind: "asteroid", biomeId: "b1" }, ls);
  expect(JSON.stringify(ls)).toBe(snap);
});
