import { expect, test } from "vitest";
import type { Genome } from "@/lib/sim/genome";
import { Lineage } from "@/lib/game/lineage";
import {
  initGame, tickEra, evaluateStatus, GameState,
  NUM_LINEAGES, BIOME_COUNT, MAX_ERAS,
} from "@/lib/game/game";

const playerOf = (g: GameState): Lineage => g.lineages.find((l) => l.kind === "player")!;
const npcsOf = (g: GameState): Lineage[] => g.lineages.filter((l) => l.kind === "npc");
const geneMean = (lin: Lineage, gene: keyof Genome): number =>
  lin.sim.population.reduce((s, x) => s + x[gene], 0) / lin.sim.population.length;

// clone a game and give each lineage exclusive presence on a set of biomes (= dominance)
function withOwns(g: GameState, owns: string[][], era = g.era): GameState {
  return {
    ...g, era,
    lineages: g.lineages.map((l, i) => {
      const presence: Record<string, number> = {};
      for (const b of owns[i]) presence[b] = 1;
      return { ...l, presence, alive: owns[i].length > 0 };
    }),
  };
}

function runToEnd(seed: number): GameState {
  let g = initGame(seed);
  let guard = 0;
  while (g.status === "playing" && guard++ < 200) g = tickEra(g, []);
  return g;
}

test("initGame is deterministic and well-formed, everyone on one home continent", () => {
  const g = initGame(123);
  expect(g).toEqual(initGame(123));
  expect(g.world.biomes).toHaveLength(BIOME_COUNT);
  expect(g.lineages).toHaveLength(NUM_LINEAGES);
  expect(g.lineages.filter((l) => l.kind === "player")).toHaveLength(1);
  expect(g.status).toBe("playing");
  expect(g.era).toBe(0);
  for (const l of g.lineages) expect(Object.keys(l.presence)).toEqual([g.homeBiome]); // all start together
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

test("NPCs evolve under their own strategies every playing era, with no player input", () => {
  let g = initGame(11);
  const before = npcsOf(g).map((l) => JSON.stringify(l.sim.population));
  let ran = 0;
  for (let i = 0; i < 5 && g.status === "playing"; i++) { g = tickEra(g, []); ran++; }
  expect(ran).toBeGreaterThanOrEqual(1);
  for (const l of npcsOf(g).filter((x) => x.alive)) expect(l.sim.generation).toBe(ran);
  expect(npcsOf(g).map((l) => JSON.stringify(l.sim.population))).not.toEqual(before);
});

test("a full run is deterministic and exhibits climate shifts and catastrophes across seeds", () => {
  expect(runToEnd(7)).toEqual(runToEnd(7));

  let climateSeen = false, catastropheSeen = false;
  for (let s = 1; s < 40 && !(climateSeen && catastropheSeen); s++) {
    const g = runToEnd(s);
    if (JSON.stringify(g.world) !== JSON.stringify(initGame(s).world)) climateSeen = true;
    if (g.log.some((line) => /asteroid|plague|extinction/.test(line))) catastropheSeen = true;
  }
  expect(climateSeen).toBe(true);
  expect(catastropheSeen).toBe(true);
});

test("evaluateStatus: player dominating every biome is a win", () => {
  const g = initGame(1);
  const all = g.world.biomes.map((b) => b.id);
  expect(evaluateStatus(withOwns(g, [all, [], [], []]))).toBe("won");
});

test("evaluateStatus: player extinct (no presence) before the clock is a loss", () => {
  const g = initGame(1);
  const b = g.world.biomes.map((x) => x.id);
  expect(evaluateStatus(withOwns(g, [[], [b[0]], [b[1]], [b[2]]], 5))).toBe("lost");
});

test("evaluateStatus: an alive-but-trailing player keeps playing (no instant conquest loss)", () => {
  const g = initGame(1);
  const all = g.world.biomes.map((b) => b.id);
  // rival dominates every biome, but the player still clings to b0 → still in the fight, mid-clock
  const clinging: GameState = {
    ...g, era: 5, status: "playing",
    lineages: g.lineages.map((l, i) => {
      if (i === 0) return { ...l, presence: { [all[0]]: 0.1 }, alive: true };       // player clings
      if (i === 1) return { ...l, presence: Object.fromEntries(all.map((b) => [b, 1])), alive: true }; // rival leads all
      return { ...l, presence: {}, alive: false };
    }),
  };
  expect(evaluateStatus(clinging)).toBe("playing");
});

test("evaluateStatus: at the clock, the player wins only by leading in biomes dominated", () => {
  const g = initGame(1);
  const b = g.world.biomes.map((x) => x.id);
  const leads = [[b[0], b[1], b[2]], [b[3]], [b[4]], [b[5]]];
  const trails = [[b[0]], [b[1], b[2], b[3]], [b[4]], [b[5]]];
  expect(evaluateStatus(withOwns(g, leads, MAX_ERAS))).toBe("won");
  expect(evaluateStatus(withOwns(g, trails, MAX_ERAS))).toBe("lost");
});
