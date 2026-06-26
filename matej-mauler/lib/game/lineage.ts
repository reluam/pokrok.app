import type { SimState } from "@/lib/sim/population";
import { fitness } from "@/lib/sim/fitness";
import { clamp01 } from "@/lib/sim/genome";
import type { Biome, World } from "./world";
import type { Strategy } from "./strategies";

export type LineageKind = "player" | "npc";

export interface Lineage {
  id: string;
  kind: LineageKind;
  strategy: Strategy;  // how this lineage evolves (the player's is intelligent_design)
  color: string;       // css colour for the map
  sim: SimState;       // the lineage's evolving genome cloud
  presence: Record<string, number>; // biomeId → 0..1 establishment weight (a shifting balance)
  ap: number;          // adaptation points (player economy)
  alive: boolean;
}

// ---- presence dynamics knobs ---------------------------------------------
export const MIN_VIABLE = 0.6;        // strength at/below this is "unsuited" → no competitive weight
export const GOOD_FIT = 1.6;          // strength considered fully suited
export const GROWTH_RATE = 0.2;       // how fast presence chases its competitive share (slow = gradual)
export const SPREAD_THRESHOLD = 0.2;  // presence above this seeds pioneers into neighbours
export const SEED = 0.08;             // pioneer presence seeded into a neighbour
export const MIN_PRESENCE = 0.02;     // below this a lineage is gone from a biome

// A lineage's strength in a biome = the mean fitness of its population against that biome's env.
export function strengthInBiome(lineage: Lineage, biome: Biome): number {
  const pop = lineage.sim.population;
  if (pop.length === 0) return 0;
  let sum = 0;
  for (const g of pop) sum += fitness(g, biome.env);
  return sum / pop.length;
}

// How well-suited a strength is (0 at the viability floor, 1 at full fitness).
const suitability = (s: number): number => clamp01((s - MIN_VIABLE) / (GOOD_FIT - MIN_VIABLE));

export function isAlive(lineage: Lineage): boolean {
  return Object.values(lineage.presence).some((p) => p > 0);
}

// The lineage with the highest presence on a biome (ties broken by id), or null if uninhabited.
export function dominantOnBiome(lineages: Lineage[], biomeId: string): Lineage | null {
  let best: Lineage | null = null, bestP = 0;
  for (const l of lineages) {
    const p = l.presence[biomeId] ?? 0;
    if (p > bestP || (p === bestP && best && l.id < best.id)) { bestP = p; best = l; }
  }
  return bestP > 0 ? best : null;
}

// How many biomes a lineage is the strict leader of.
export function dominatedCount(world: World, lineages: Lineage[], lineageId: string): number {
  return world.biomes.filter((b) => dominantOnBiome(lineages, b.id)?.id === lineageId).length;
}

// One era of the territorial balance. Each biome's occupants chase a competitive share of it
// (presence × suitability, normalised), so the balance keeps shifting with fitness — like the real
// world. Established lineages seed pioneers into neighbours; unfit ones fade out gradually. Pure.
export function updatePresence(world: World, lineages: Lineage[]): Lineage[] {
  const biomeById = new Map(world.biomes.map((b) => [b.id, b]));
  // working copy of presence
  const pres = new Map<string, Map<string, number>>();
  for (const l of lineages) pres.set(l.id, new Map(Object.entries(l.presence)));

  // 1. spread: established lineages seed pioneers into adjacent biomes.
  for (const l of lineages) {
    const mine = pres.get(l.id)!;
    for (const [biomeId, p] of [...mine]) {
      if (p <= SPREAD_THRESHOLD) continue;
      for (const nb of biomeById.get(biomeId)?.neighbors ?? []) {
        if ((mine.get(nb) ?? 0) < SEED) mine.set(nb, SEED);
      }
    }
  }

  // 2. competitive update per biome: presence chases its share of the biome.
  const strengthCache = new Map<string, number>(); // `${id}@${biomeId}` → strength
  const strengthOf = (l: Lineage, b: Biome) => {
    const key = `${l.id}@${b.id}`;
    let s = strengthCache.get(key);
    if (s === undefined) { s = strengthInBiome(l, b); strengthCache.set(key, s); }
    return s;
  };
  for (const b of world.biomes) {
    const occupants = lineages.filter((l) => (pres.get(l.id)!.get(b.id) ?? 0) > 0);
    if (occupants.length === 0) continue;
    const weights = occupants.map((l) => (pres.get(l.id)!.get(b.id) ?? 0) * suitability(strengthOf(l, b)));
    const sumW = weights.reduce((a, c) => a + c, 0);
    occupants.forEach((l, i) => {
      const cur = pres.get(l.id)!.get(b.id) ?? 0;
      const target = sumW > 0 ? weights[i] / sumW : 0;
      pres.get(l.id)!.set(b.id, cur + (target - cur) * GROWTH_RATE);
    });
  }

  // 3. cleanup: drop negligible presence.
  return lineages.map((l) => {
    const presence: Record<string, number> = {};
    for (const [biomeId, p] of pres.get(l.id)!) if (p >= MIN_PRESENCE) presence[biomeId] = p;
    return { ...l, presence, alive: Object.keys(presence).length > 0 };
  });
}
