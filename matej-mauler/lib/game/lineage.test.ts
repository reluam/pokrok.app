import { expect, test } from "vitest";
import type { Genome } from "@/lib/sim/genome";
import type { Environment } from "@/lib/sim/environment";
import { initPopulation } from "@/lib/sim/population";
import { fitness } from "@/lib/sim/fitness";
import type { Biome, World } from "@/lib/game/world";
import {
  Lineage,
  strengthInBiome,
  resolveColonization,
  MIN_CLAIM,
  MIN_VIABLE,
} from "@/lib/game/lineage";

const gene = (o: Partial<Genome>): Genome => ({
  size: 0.5, limbCount: 0.5, limbLength: 0.5, hue: 0.5, particleDensity: 0.5,
  metabolism: 0.5, speed: 0.5, toughness: 0.5, sensorRange: 0.5, camouflage: 0.5, ...o,
});

// predator-heavy, neutral-temp biome where camouflage that matches `hue` is the route to strength.
const predEnv = (hue: number, temperature = 0.5): Environment => ({
  foodAbundance: 0.5, predatorPressure: 1, temperature, backgroundHue: hue,
});

const biome = (id: string, env: Environment, neighbors: string[]): Biome => ({ id, name: id, env, neighbors });

function lineageOf(id: string, kind: "player" | "npc", g: Genome, held: string[]): Lineage {
  const sim = initPopulation(1, 10, predEnv(0));
  return { id, kind, color: "#000", sim: { ...sim, population: sim.population.map(() => ({ ...g })) }, held, ap: 0, alive: true };
}

// strong when hue matches background (camo is the SOLE route — sensor edge zeroed), weak when it doesn't.
const camo0 = gene({ camouflage: 1, hue: 0, toughness: 0, speed: 0, sensorRange: 0 });
const camo1 = gene({ camouflage: 1, hue: 1, toughness: 0, speed: 0, sensorRange: 0 });

test("strengthInBiome is the mean fitness of the population vs the biome env", () => {
  const lin = lineageOf("p", "player", camo0, ["b0"]);
  const b = biome("b0", predEnv(0), []);
  const expected = lin.sim.population.reduce((s, g) => s + fitness(g, b.env), 0) / lin.sim.population.length;
  expect(strengthInBiome(lin, b)).toBeCloseTo(expected, 10);
});

test("strong genome clears MIN_CLAIM in a matching biome; the same genome is weak in a mismatched one", () => {
  const lin = lineageOf("p", "player", camo0, ["b0"]);
  expect(strengthInBiome(lin, biome("m", predEnv(0), []))).toBeGreaterThanOrEqual(MIN_CLAIM);
  expect(strengthInBiome(lin, biome("x", predEnv(1), []))).toBeLessThan(MIN_CLAIM);
});

test("a viable adjacent lineage colonizes an empty biome", () => {
  const world: World = { biomes: [biome("b0", predEnv(0), ["b1"]), biome("b1", predEnv(0), ["b0"])] };
  const player = lineageOf("p", "player", camo0, ["b0"]);
  const out = resolveColonization(world, [player]);
  expect(new Set(out[0].held)).toEqual(new Set(["b0", "b1"]));
});

test("an incumbent keeps its biome against a challenger that cannot clear the claim bar", () => {
  const world: World = { biomes: [biome("b0", predEnv(0), ["b1"]), biome("b1", predEnv(1), ["b0"])] };
  const player = lineageOf("p", "player", camo0, ["b0"]); // strong in b0, weak in b1
  const npc = lineageOf("n", "npc", camo1, ["b1"]);       // strong in b1, weak in b0
  const out = resolveColonization(world, [player, npc]);
  expect(out.find((l) => l.id === "p")!.held).toEqual(["b0"]);
  expect(out.find((l) => l.id === "n")!.held).toEqual(["b1"]);
});

test("a clearly stronger challenger flips a biome from the incumbent", () => {
  const world: World = { biomes: [biome("b0", predEnv(0), ["b1"]), biome("b1", predEnv(0), ["b0"])] };
  const player = lineageOf("p", "player", camo0, ["b0"]); // strong in both b0 and b1
  const npc = lineageOf("n", "npc", camo1, ["b1"]);       // weak in b1 (hue mismatch)
  const out = resolveColonization(world, [player, npc]);
  expect(new Set(out.find((l) => l.id === "p")!.held)).toEqual(new Set(["b0", "b1"]));
  expect(out.find((l) => l.id === "n")!.held).toEqual([]);
});

test("an unviable incumbent drops its biome (it goes empty) when nobody else qualifies", () => {
  const harsh: Environment = { foodAbundance: 0.5, predatorPressure: 1, temperature: 1, backgroundHue: 1 };
  const world: World = { biomes: [biome("b0", predEnv(0), ["b1"]), biome("b1", harsh, ["b0"])] };
  const weak = gene({ camouflage: 0, toughness: 0, speed: 0, size: 1, metabolism: 1, hue: 0 });
  const npc = lineageOf("n", "npc", weak, ["b1"]);
  expect(strengthInBiome(npc, world.biomes[1])).toBeLessThan(MIN_VIABLE);
  const out = resolveColonization(world, [npc]);
  expect(out[0].held).toEqual([]);
});

test("resolveColonization is pure (does not mutate input) and deterministic", () => {
  const world: World = { biomes: [biome("b0", predEnv(0), ["b1"]), biome("b1", predEnv(0), ["b0"])] };
  const lineages = [lineageOf("p", "player", camo0, ["b0"])];
  const snapshot = JSON.stringify(lineages);
  const a = resolveColonization(world, lineages);
  const b = resolveColonization(world, lineages);
  expect(JSON.stringify(lineages)).toBe(snapshot);
  expect(a).toEqual(b);
});
