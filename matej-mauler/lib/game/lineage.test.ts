import { expect, test } from "vitest";
import type { Genome } from "@/lib/sim/genome";
import type { Environment } from "@/lib/sim/environment";
import { initPopulation } from "@/lib/sim/population";
import { fitness as fitnessOf } from "@/lib/sim/fitness";
import type { Biome, World } from "@/lib/game/world";
import {
  Lineage, strengthInBiome, updatePresence, dominantOnBiome, dominatedCount, isAlive,
} from "@/lib/game/lineage";

const gene = (o: Partial<Genome>): Genome => ({
  size: 0.5, limbCount: 0.5, limbLength: 0.5, hue: 0.5, particleDensity: 0.5,
  metabolism: 0.5, speed: 0.5, toughness: 0.5, sensorRange: 0.5, camouflage: 0.5, ...o,
});

const predEnv = (hue: number): Environment => ({ foodAbundance: 0.5, predatorPressure: 1, temperature: 0.5, backgroundHue: hue });
const biome = (id: string, env: Environment, neighbors: string[]): Biome => ({ id, name: id, env, neighbors });

function lineageOf(id: string, g: Genome, presence: Record<string, number>): Lineage {
  const sim = initPopulation(1, 10, predEnv(0));
  return { id, kind: id === "p" ? "player" : "npc", strategy: "organism", color: "#000",
    sim: { ...sim, population: sim.population.map(() => ({ ...g })) }, presence, ap: 0, alive: Object.keys(presence).length > 0 };
}

// strong vs weak in a predator biome via the camouflage route (sensor edge zeroed)
const camo0 = gene({ camouflage: 1, hue: 0, toughness: 0, speed: 0, sensorRange: 0 }); // fit in predEnv(0)
const camo1 = gene({ camouflage: 1, hue: 1, toughness: 0, speed: 0, sensorRange: 0 }); // marginal in predEnv(0)
const unfit = gene({ camouflage: 0, toughness: 0, speed: 0, size: 1, metabolism: 1, hue: 1, sensorRange: 0 }); // below the viability floor in predEnv(0)

test("strengthInBiome is the mean fitness of the population vs the biome env", () => {
  const lin = lineageOf("p", camo0, { b0: 1 });
  const b = biome("b0", predEnv(0), []);
  const expected = lin.sim.population.reduce((s, g) => s + fitnessOf(g, b.env), 0) / lin.sim.population.length;
  expect(strengthInBiome(lin, b)).toBeCloseTo(expected, 10);
});

test("a fit lineage grows toward dominating its biome over several eras", () => {
  const world: World = { biomes: [biome("b0", predEnv(0), [])] };
  let lins = [lineageOf("p", camo0, { b0: 0.3 }), lineageOf("n", camo1, { b0: 0.3 })];
  for (let i = 0; i < 12; i++) lins = updatePresence(world, lins);
  const p = lins.find((l) => l.id === "p")!;
  const n = lins.find((l) => l.id === "n")!;
  expect(p.presence.b0).toBeGreaterThan(n.presence.b0 ?? 0);
  expect(dominantOnBiome(lins, "b0")!.id).toBe("p");
});

test("an unfit lineage (below the viability floor) fades from a biome gradually, not instantly", () => {
  const world: World = { biomes: [biome("b0", predEnv(0), [])] };
  const before = lineageOf("n", unfit, { b0: 0.8 });
  const afterOne = updatePresence(world, [before])[0];
  expect(afterOne.presence.b0 ?? 0).toBeLessThan(0.8);   // shrinking
  expect(afterOne.presence.b0 ?? 0).toBeGreaterThan(0.3); // but not gone after one era
  let lins = [before];
  for (let i = 0; i < 30; i++) lins = updatePresence(world, lins);
  expect(isAlive(lins[0])).toBe(false); // eventually fades out
});

test("an established lineage spreads presence into adjacent biomes", () => {
  const world: World = { biomes: [biome("b0", predEnv(0), ["b1"]), biome("b1", predEnv(0), ["b0"])] };
  const lin = lineageOf("p", camo0, { b0: 1 });
  const out = updatePresence(world, [lin])[0];
  expect(out.presence.b1 ?? 0).toBeGreaterThan(0); // seeded into the neighbour
});

test("dominatedCount counts only biomes where the lineage is the strict leader", () => {
  const world: World = { biomes: [biome("b0", predEnv(0), []), biome("b1", predEnv(0), [])] };
  const p = lineageOf("p", camo0, { b0: 0.9, b1: 0.1 });
  const n = lineageOf("n", camo0, { b0: 0.1, b1: 0.9 });
  expect(dominatedCount(world, [p, n], "p")).toBe(1);
  expect(dominatedCount(world, [p, n], "n")).toBe(1);
});

test("updatePresence is pure and deterministic", () => {
  const world: World = { biomes: [biome("b0", predEnv(0), ["b1"]), biome("b1", predEnv(0), ["b0"])] };
  const lins = [lineageOf("p", camo0, { b0: 0.5 }), lineageOf("n", camo1, { b0: 0.5 })];
  const snap = JSON.stringify(lins);
  const a = updatePresence(world, lins);
  const b = updatePresence(world, lins);
  expect(JSON.stringify(lins)).toBe(snap);
  expect(a).toEqual(b);
});
