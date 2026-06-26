import type { Environment } from "@/lib/sim/environment";
import { initPopulation } from "@/lib/sim/population";
import { makeRng } from "@/lib/sim/rng";
import { generateWorld, World } from "./world";
import { Lineage, updatePresence, dominatedCount, isAlive } from "./lineage";
import { PlayerAction, actionCost, applyPush } from "./actions";
import { shiftClimate, rollCatastrophe, applyCatastrophe } from "./events";
import { Strategy, evolveByStrategy } from "./strategies";

// ---- tunable knobs -------------------------------------------------------
export const BIOME_COUNT = 6;
export const NUM_LINEAGES = 4;     // 1 player + 3 npc
export const POP = 30;
export const MAX_ERAS = 100;       // a long, learnable contest
export const START_AP = 4;
export const AP_BASE = 1;          // income floor per era
export const AP_PER_BIOME = 1;     // income per biome dominated
export const CLIMATE_EVERY = 10;   // a climate shift every N eras
export const START_PRESENCE = 0.3; // every lineage begins established here on the home biome

const LINEAGE_COLORS = ["#2f6fed", "#e85d75", "#28a76a", "#e8a23d"]; // you (blue), rose, green, amber
// Index → strategy: you (design) vs three rival theories of evolution.
const LINEAGE_STRATEGIES: Strategy[] = ["intelligent_design", "gene_eye", "group_selection", "lamarck"];

export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  world: World;
  lineages: Lineage[];
  era: number;
  maxEras: number;
  status: GameStatus;
  log: string[];
  rngState: number;
  homeBiome: string; // where everyone started (the origin continent)
}

// Average each environment field over a set of biomes (a lineage's range).
function blendEnv(world: World, biomeIds: string[]): Environment | null {
  const set = world.biomes.filter((b) => biomeIds.includes(b.id));
  if (set.length === 0) return null;
  const acc = { foodAbundance: 0, predatorPressure: 0, temperature: 0, backgroundHue: 0 };
  for (const b of set) {
    acc.foodAbundance += b.env.foodAbundance;
    acc.predatorPressure += b.env.predatorPressure;
    acc.temperature += b.env.temperature;
    acc.backgroundHue += b.env.backgroundHue;
  }
  const n = set.length;
  return { foodAbundance: acc.foodAbundance / n, predatorPressure: acc.predatorPressure / n, temperature: acc.temperature / n, backgroundHue: acc.backgroundHue / n };
}

// The env a lineage is selected against: the blend of biomes it lives in plus their neighbours.
export function rangeEnv(world: World, lineage: Lineage): Environment {
  const here = Object.keys(lineage.presence);
  const range = new Set<string>(here);
  for (const b of world.biomes) if (here.includes(b.id)) for (const n of b.neighbors) range.add(n);
  return blendEnv(world, [...range]) ?? lineage.sim.env;
}

export function initGame(seed: number): GameState {
  const rng = makeRng(seed);
  const world = generateWorld(Math.floor(rng() * 0x100000000), BIOME_COUNT);
  const popSeed = Math.floor(rng() * 0x100000000); // shared → identical starting clouds
  const home = world.biomes[0].id; // everyone begins on the origin continent

  const lineages: Lineage[] = [];
  for (let i = 0; i < NUM_LINEAGES; i++) {
    lineages.push({
      id: i === 0 ? "player" : `npc${i}`,
      kind: i === 0 ? "player" : "npc",
      strategy: LINEAGE_STRATEGIES[i % LINEAGE_STRATEGIES.length],
      color: LINEAGE_COLORS[i % LINEAGE_COLORS.length],
      sim: initPopulation(popSeed, POP, world.biomes[0].env),
      presence: { [home]: START_PRESENCE },
      ap: i === 0 ? START_AP : 0,
      alive: true,
    });
  }

  return { world, lineages, era: 0, maxEras: MAX_ERAS, status: "playing", log: [], rngState: Math.floor(rng() * 0x100000000), homeBiome: home };
}

// Pure status check from the dominance distribution + the clock.
export function evaluateStatus(game: GameState): GameStatus {
  const total = game.world.biomes.length;
  const player = game.lineages.find((l) => l.kind === "player")!;
  const playerDom = dominatedCount(game.world, game.lineages, player.id);
  const rivalMax = Math.max(0, ...game.lineages.filter((l) => l.kind === "npc").map((l) => dominatedCount(game.world, game.lineages, l.id)));

  if (playerDom >= total) return "won";          // you dominate the whole world
  if (!isAlive(player)) return "lost";           // wiped off the map
  if (game.era >= game.maxEras) return playerDom > rivalMax ? "won" : "lost"; // clock: lead to win
  return "playing";                              // still alive and contesting — keep going

}

// One era: apply player actions → evolve every living lineage against its range → update the
// territorial balance → award AP → climate/catastrophe → advance clock → re-evaluate. Pure.
export function tickEra(game: GameState, actions: PlayerAction[]): GameState {
  if (game.status !== "playing") return game;
  const rng = makeRng(game.rngState);

  // 1. apply player actions (spend AP in order; skip the unaffordable; apply directed pushes).
  let lineages = game.lineages.map((l) => ({ ...l }));
  const player = lineages.find((l) => l.kind === "player")!;
  for (const a of actions) {
    const cost = actionCost(a);
    if (cost > player.ap) continue;
    player.ap -= cost;
    if (a.type === "pushTrait") player.sim = { ...player.sim, population: applyPush(player.sim.population, a.gene, a.amount) };
  }

  // 2. evolve every living lineage under its own theory of evolution.
  lineages = lineages.map((l) => (isAlive(l) ? { ...l, sim: evolveByStrategy(l.strategy, l.sim, rangeEnv(game.world, l)) } : l));

  // 3. the territorial balance shifts.
  lineages = updatePresence(game.world, lineages);

  // 4. AP income to the player from biomes it dominates.
  const dom = dominatedCount(game.world, lineages, "player");
  lineages = lineages.map((l) => (l.kind === "player" ? { ...l, ap: l.ap + AP_BASE + dom * AP_PER_BIOME } : l));

  const era = game.era + 1;
  const log = [...game.log, `era ${era}: you dominate ${dom}/${game.world.biomes.length} biomes`];

  // 5. climate change on its cadence (reshapes selection going forward).
  let world = game.world;
  if (era % CLIMATE_EVERY === 0) {
    world = shiftClimate(world, rng);
    log.push(`era ${era}: the climate shifts — every biome is changing.`);
  }

  // 6. a catastrophe may strike, erasing ground for one lineage or all (chance over design).
  const cat = rollCatastrophe(era, world, lineages, rng);
  if (cat) {
    const res = applyCatastrophe(cat, lineages);
    lineages = res.lineages;
    log.push(`era ${era}: ${res.message}`);
  }

  const next: GameState = { ...game, world, lineages, era, rngState: Math.floor(rng() * 0x100000000), log };
  return { ...next, status: evaluateStatus(next) };
}
