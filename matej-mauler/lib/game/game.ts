import type { Environment } from "@/lib/sim/environment";
import { initPopulation, step, setEnv } from "@/lib/sim/population";
import { makeRng } from "@/lib/sim/rng";
import { generateWorld, World } from "./world";
import { Lineage, resolveColonization } from "./lineage";
import { PlayerAction, actionCost, applyPush } from "./actions";

// ---- tunable knobs -------------------------------------------------------
export const BIOME_COUNT = 6;
export const NUM_LINEAGES = 4;     // 1 player + 3 npc
export const POP = 30;
export const MAX_ERAS = 20;        // doomsday clock
export const START_AP = 4;
export const AP_BASE = 1;          // income floor per era
export const AP_PER_BIOME = 1;     // income per biome held
export const MUTATION_RATE = 0.25;

const LINEAGE_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706"]; // player first

export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  world: World;
  lineages: Lineage[];
  era: number;
  maxEras: number;
  status: GameStatus;
  log: string[];
  rngState: number;
}

// Average each environment field over a set of biomes (a lineage's "range").
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

// The env a lineage is selected against: the blend of biomes it holds plus their neighbours
// (its range edge). Blind for NPCs; the player additionally biases genes via directed pushes.
export function rangeEnv(world: World, lineage: Lineage): Environment {
  const range = new Set<string>(lineage.held);
  for (const b of world.biomes) if (lineage.held.includes(b.id)) for (const n of b.neighbors) range.add(n);
  return blendEnv(world, [...range]) ?? lineage.sim.env;
}

export function initGame(seed: number): GameState {
  const rng = makeRng(seed);
  const world = generateWorld(Math.floor(rng() * 0x100000000), BIOME_COUNT);
  const popSeed = Math.floor(rng() * 0x100000000); // shared → identical starting clouds

  const lineages: Lineage[] = [];
  for (let i = 0; i < NUM_LINEAGES; i++) {
    const startBiome = world.biomes[Math.floor((i * BIOME_COUNT) / NUM_LINEAGES)];
    const sim = initPopulation(popSeed, POP, startBiome.env);
    lineages.push({
      id: i === 0 ? "player" : `npc${i}`,
      kind: i === 0 ? "player" : "npc",
      color: LINEAGE_COLORS[i % LINEAGE_COLORS.length],
      sim,
      held: [startBiome.id],
      ap: i === 0 ? START_AP : 0,
      alive: true,
    });
  }

  return { world, lineages, era: 0, maxEras: MAX_ERAS, status: "playing", log: [], rngState: Math.floor(rng() * 0x100000000) };
}

// Pure status check from the held distribution + the clock.
export function evaluateStatus(game: GameState): GameStatus {
  const total = game.world.biomes.length;
  const player = game.lineages.find((l) => l.kind === "player")!;
  const playerHeld = player.held.length;
  const npcMax = Math.max(0, ...game.lineages.filter((l) => l.kind === "npc").map((l) => l.held.length));

  if (playerHeld >= total) return "won";
  if (npcMax >= total) return "lost";
  if (playerHeld === 0) return "lost";
  if (game.era >= game.maxEras) return playerHeld > npcMax ? "won" : "lost";
  return "playing";
}

// One era: apply player actions → evolve every alive lineage against its range → resolve biome
// contests → award AP income → advance clock → re-evaluate status. Pure & deterministic.
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

  // 2. evolve every alive lineage against its range env.
  lineages = lineages.map((l) => {
    if (!l.alive || l.held.length === 0) return l;
    const evolved = step(setEnv(l.sim, rangeEnv(game.world, l)), MUTATION_RATE);
    return { ...l, sim: evolved };
  });

  // 3. resolve who holds each biome; 4. extinction = no biomes left.
  lineages = resolveColonization(game.world, lineages).map((l) => ({ ...l, alive: l.held.length > 0 }));

  // 5. AP income to the player from biomes held.
  const p = lineages.find((l) => l.kind === "player")!;
  p.ap += AP_BASE + p.held.length * AP_PER_BIOME;

  const next: GameState = {
    ...game,
    lineages,
    era: game.era + 1,
    rngState: Math.floor(rng() * 0x100000000),
    log: [...game.log, `era ${game.era + 1}: you hold ${p.held.length}/${game.world.biomes.length} biomes`],
  };
  return { ...next, status: evaluateStatus(next) };
}
