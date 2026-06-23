import { expect, test } from "vitest";
import { makeRng } from "@/lib/sim/rng";
import { initPopulation } from "@/lib/sim/population";
import { generateWorld } from "@/lib/game/world";
import { Lineage } from "@/lib/game/lineage";
import {
  shiftClimate, rollCatastrophe, applyCatastrophe, CATASTROPHE_FROM,
} from "@/lib/game/events";

const env = { foodAbundance: 0.5, predatorPressure: 0.5, temperature: 0.5, backgroundHue: 0.5 };
function lin(id: string, kind: "player" | "npc", held: string[]): Lineage {
  return { id, kind, color: "#000", sim: initPopulation(1, 5, env), held, ap: 0, alive: held.length > 0 };
}

test("shiftClimate is deterministic, perturbs envs, and preserves ids/adjacency within 0..1", () => {
  const w = generateWorld(3, 6);
  const a = shiftClimate(w, makeRng(99));
  const b = shiftClimate(w, makeRng(99));
  expect(a).toEqual(b);                       // deterministic
  expect(a).not.toEqual(w);                   // something changed
  expect(a.biomes.map((x) => x.id)).toEqual(w.biomes.map((x) => x.id)); // ids preserved
  for (let i = 0; i < a.biomes.length; i++) {
    expect(a.biomes[i].neighbors).toEqual(w.biomes[i].neighbors);       // topology preserved
    for (const v of Object.values(a.biomes[i].env)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  }
});

test("rollCatastrophe returns null before the catastrophe era and is deterministic", () => {
  const w = generateWorld(1, 6);
  const ls = [lin("player", "player", ["b0"]), lin("npc1", "npc", ["b1"])];
  expect(rollCatastrophe(CATASTROPHE_FROM - 1, w, ls, makeRng(5))).toBeNull();
  expect(rollCatastrophe(8, w, ls, makeRng(5))).toEqual(rollCatastrophe(8, w, ls, makeRng(5)));
});

test("rollCatastrophe does fire on some seeds once the catastrophe era is reached", () => {
  const w = generateWorld(1, 6);
  const ls = [lin("player", "player", ["b0"]), lin("npc1", "npc", ["b1"])];
  const fired = Array.from({ length: 30 }, (_, s) => rollCatastrophe(8, w, ls, makeRng(s + 1))).some((c) => c !== null);
  expect(fired).toBe(true);
});

test("applyCatastrophe asteroid removes the struck biome from whoever holds it", () => {
  const ls = [lin("player", "player", ["b0", "b1"]), lin("npc1", "npc", ["b2"])];
  const { lineages } = applyCatastrophe({ kind: "asteroid", biomeId: "b1" }, ls);
  expect(lineages.find((l) => l.id === "player")!.held).toEqual(["b0"]);
  expect(lineages.find((l) => l.id === "npc1")!.held).toEqual(["b2"]);
});

test("applyCatastrophe plague knocks a lineage back (halves its range; a single-biome lineage is wiped)", () => {
  const ls = [lin("player", "player", ["b0", "b1", "b2"]), lin("npc1", "npc", ["b3"])];
  const knocked = applyCatastrophe({ kind: "plague", lineageId: "player" }, ls).lineages.find((l) => l.id === "player")!;
  expect(knocked.held.length).toBeLessThan(3);
  const wiped = applyCatastrophe({ kind: "plague", lineageId: "npc1" }, ls).lineages.find((l) => l.id === "npc1")!;
  expect(wiped.held).toEqual([]);
  expect(wiped.alive).toBe(false);
});

test("applyCatastrophe massExtinction makes every holder lose at least one biome", () => {
  const ls = [lin("player", "player", ["b0", "b1"]), lin("npc1", "npc", ["b2", "b3"])];
  const { lineages } = applyCatastrophe({ kind: "massExtinction" }, ls);
  expect(lineages.find((l) => l.id === "player")!.held.length).toBe(1);
  expect(lineages.find((l) => l.id === "npc1")!.held.length).toBe(1);
});

test("applyCatastrophe does not mutate the input lineages", () => {
  const ls = [lin("player", "player", ["b0", "b1"])];
  const snap = JSON.stringify(ls);
  applyCatastrophe({ kind: "asteroid", biomeId: "b1" }, ls);
  expect(JSON.stringify(ls)).toBe(snap);
});
