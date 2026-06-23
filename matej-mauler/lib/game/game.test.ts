import { expect, test } from "vitest";
import type { Genome } from "@/lib/sim/genome";
import { getBiome } from "@/lib/game/world";
import { Lineage } from "@/lib/game/lineage";
import {
  initGame, tickEra, evaluateStatus, GameState,
  NUM_LINEAGES, BIOME_COUNT, MAX_ERAS,
} from "@/lib/game/game";

const playerOf = (g: GameState): Lineage => g.lineages.find((l) => l.kind === "player")!;
const npcsOf = (g: GameState): Lineage[] => g.lineages.filter((l) => l.kind === "npc");
const geneMean = (lin: Lineage, gene: keyof Genome): number =>
  lin.sim.population.reduce((s, x) => s + x[gene], 0) / lin.sim.population.length;

// clone a game and overwrite each lineage's held biomes (for evaluateStatus tests)
function withHeld(g: GameState, held: string[][], era = g.era): GameState {
  return {
    ...g, era,
    lineages: g.lineages.map((l, i) => ({ ...l, held: held[i], alive: held[i].length > 0 })),
  };
}

test("initGame is deterministic and well-formed", () => {
  const g = initGame(123);
  expect(g).toEqual(initGame(123));
  expect(g.world.biomes).toHaveLength(BIOME_COUNT);
  expect(g.lineages).toHaveLength(NUM_LINEAGES);
  expect(g.lineages.filter((l) => l.kind === "player")).toHaveLength(1);
  expect(g.status).toBe("playing");
  expect(g.era).toBe(0);
  const starts = g.lineages.map((l) => l.held);
  for (const h of starts) expect(h).toHaveLength(1);
  expect(new Set(starts.flat()).size).toBe(NUM_LINEAGES); // distinct starting biomes
});

test("all lineages begin from an identical genome cloud (identical start)", () => {
  const g = initGame(5);
  const pops = g.lineages.map((l) => JSON.stringify(l.sim.population));
  expect(new Set(pops).size).toBe(1);
});

test("tickEra is deterministic for the same game + actions", () => {
  const g = initGame(7);
  expect(tickEra(g, [])).toEqual(tickEra(g, []));
});

test("tickEra advances the era by one and evolves the lineages", () => {
  const g = initGame(7);
  const n = tickEra(g, []);
  expect(n.era).toBe(1);
  expect(playerOf(n).sim.generation).toBe(playerOf(g).sim.generation + 1);
});

test("a player pushTrait raises that gene's mean across the player population", () => {
  const g = initGame(7);
  const before = geneMean(playerOf(g), "toughness");
  const n = tickEra(g, [{ type: "pushTrait", gene: "toughness", amount: 0.3 }]);
  expect(geneMean(playerOf(n), "toughness")).toBeGreaterThan(before);
});

test("tickEra does not mutate the input game", () => {
  const g = initGame(7);
  const snap = JSON.stringify(g);
  tickEra(g, [{ type: "pushTrait", gene: "speed", amount: 0.2 }]);
  expect(JSON.stringify(g)).toBe(snap);
});

test("NPCs evolve every era with no player input, and at least one stays alive", () => {
  let g = initGame(11);
  const before = npcsOf(g).map((l) => JSON.stringify(l.sim.population));
  for (let i = 0; i < 8; i++) g = tickEra(g, []);
  const npcs = npcsOf(g);
  expect(npcs.some((l) => l.alive)).toBe(true);
  // every still-alive npc advanced 8 generations and its genome cloud changed (evolution happened)
  for (const l of npcs.filter((x) => x.alive)) expect(l.sim.generation).toBe(8);
  const after = npcs.map((l) => JSON.stringify(l.sim.population));
  expect(after).not.toEqual(before);
});

test("evaluateStatus: player holding every biome is a win", () => {
  const g = initGame(1);
  const all = g.world.biomes.map((b) => b.id);
  const held = [all, [], [], []]; // player holds all
  expect(evaluateStatus(withHeld(g, held))).toBe("won");
});

test("evaluateStatus: player extinct (no biomes) before the clock is a loss", () => {
  const g = initGame(1);
  const b = g.world.biomes.map((x) => x.id);
  const held = [[], [b[0]], [b[1]], [b[2]]]; // player holds nothing
  expect(evaluateStatus(withHeld(g, held, 3))).toBe("lost");
});

test("evaluateStatus: a rival holding every biome is a loss", () => {
  const g = initGame(1);
  const all = g.world.biomes.map((b) => b.id);
  const held = [[], all, [], []]; // npc1 holds all
  expect(evaluateStatus(withHeld(g, held))).toBe("lost");
});

test("evaluateStatus: at the clock, the player wins only by leading in biomes held", () => {
  const g = initGame(1);
  const b = g.world.biomes.map((x) => x.id);
  const leads = [[b[0], b[1], b[2]], [b[3]], [b[4]], [b[5]]];
  const trails = [[b[0]], [b[1], b[2], b[3]], [b[4]], [b[5]]];
  expect(evaluateStatus(withHeld(g, leads, MAX_ERAS))).toBe("won");
  expect(evaluateStatus(withHeld(g, trails, MAX_ERAS))).toBe("lost");
});
