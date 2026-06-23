import type { SimState } from "@/lib/sim/population";
import { fitness } from "@/lib/sim/fitness";
import type { Biome, World } from "./world";
import type { Strategy } from "./strategies";

export type LineageKind = "player" | "npc";

export interface Lineage {
  id: string;
  kind: LineageKind;
  strategy: Strategy;  // how this lineage evolves (the player's is intelligent_design)
  color: string;       // css colour for the map
  sim: SimState;       // the lineage's evolving genome cloud
  held: string[];      // biome ids currently occupied
  ap: number;          // adaptation points (player economy)
  alive: boolean;
}

// Colonization thresholds (tunable knobs). Fitness sits roughly in [0, ~2.2].
export const MIN_VIABLE = 0.6;  // below this an incumbent can no longer hold a biome
export const MIN_CLAIM = 0.8;   // a challenger must clear this to take an empty/contested biome
export const FLIP_MARGIN = 0.15; // a challenger must beat the incumbent by this much to flip it
export const MAX_SPREAD_PER_ERA = 1; // a lineage can colonize at most this many NEW biomes per era

// A lineage's strength in a biome = the mean fitness of its population against that biome's env.
export function strengthInBiome(lineage: Lineage, biome: Biome): number {
  const pop = lineage.sim.population;
  if (pop.length === 0) return 0;
  let sum = 0;
  for (const g of pop) sum += fitness(g, biome.env);
  return sum / pop.length;
}

interface Candidate { id: string; strength: number; incumbent: boolean; }

// Resolve who holds each biome after an era. Simultaneous: candidate sets are computed from the
// INPUT held state for ALL biomes first, so resolution is order-independent and deterministic.
// Candidates for a biome = lineages holding it (incumbent) or holding an adjacent biome (challenger).
// Returns NEW lineages with updated `held`. Pure — never mutates the input.
export function resolveColonization(world: World, lineages: Lineage[]): Lineage[] {
  const heldBy = new Map<string, string>(); // biomeId -> lineageId (from input)
  for (const lin of lineages) for (const b of lin.held) heldBy.set(b, lin.id);

  const byId = new Map(lineages.map((l) => [l.id, l]));
  const biomeById = new Map(world.biomes.map((b) => [b.id, b]));
  const inputHeld = new Map(lineages.map((l) => [l.id, new Set(l.held)]));
  const winners = new Map<string, string | undefined>(); // biomeId -> winning lineageId (or empty)

  for (const biome of world.biomes) {
    const incumbentId = heldBy.get(biome.id);
    const candidates: Candidate[] = [];
    for (const lin of lineages) {
      const isIncumbent = incumbentId === lin.id;
      const isAdjacentHolder = lin.held.some((h) => biome.neighbors.includes(h));
      if (!isIncumbent && !isAdjacentHolder) continue;
      candidates.push({ id: lin.id, strength: strengthInBiome(lin, biome), incumbent: isIncumbent });
    }
    if (candidates.length === 0) continue; // stays empty

    // Deterministic ordering: strongest first, ties broken by lineage id.
    candidates.sort((a, b) => (b.strength - a.strength) || (a.id < b.id ? -1 : 1));

    const incumbent = candidates.find((c) => c.incumbent);
    const topChallenger = candidates.find((c) => !c.incumbent);

    let winner: string | undefined;
    if (incumbent && incumbent.strength >= MIN_VIABLE) {
      // Incumbent holds unless a challenger clears the claim bar AND beats it by the flip margin.
      const flips = topChallenger
        && topChallenger.strength >= MIN_CLAIM
        && topChallenger.strength > incumbent.strength + FLIP_MARGIN;
      winner = flips ? topChallenger!.id : incumbent.id;
    } else {
      // Empty or unviable incumbent: strongest challenger that clears the claim bar takes it.
      const claimer = candidates.find((c) => !c.incumbent && c.strength >= MIN_CLAIM);
      if (claimer) {
        winner = claimer.id;
      } else if (incumbent && byId.get(incumbent.id)!.held.length === 1) {
        // Refuge: a lineage never loses its LAST biome to mere unviability — only a stronger
        // rival (above) can flip it, or a catastrophe can wipe it. Keeps it alive to adapt.
        winner = incumbent.id;
      } // otherwise the biome goes empty
    }

    winners.set(biome.id, winner);
  }

  // Cap expansion: a lineage colonizes at most MAX_SPREAD_PER_ERA NEW biomes per era (radiation is
  // gradual). Keep its strongest new claims; revert the rest to the prior incumbent (or empty).
  const newClaims = new Map<string, string[]>();
  for (const [biomeId, w] of winners) {
    if (w && !inputHeld.get(w)!.has(biomeId)) {
      const list = newClaims.get(w) ?? [];
      list.push(biomeId);
      newClaims.set(w, list);
    }
  }
  for (const [lid, biomeIds] of newClaims) {
    if (biomeIds.length <= MAX_SPREAD_PER_ERA) continue;
    const lin = byId.get(lid)!;
    const ranked = [...biomeIds].sort(
      (a, b) => strengthInBiome(lin, biomeById.get(b)!) - strengthInBiome(lin, biomeById.get(a)!),
    );
    for (const denied of ranked.slice(MAX_SPREAD_PER_ERA)) winners.set(denied, heldBy.get(denied));
  }

  const newHeld = new Map<string, string[]>(lineages.map((l) => [l.id, []]));
  for (const [biomeId, w] of winners) if (w) newHeld.get(w)!.push(biomeId);
  return lineages.map((lin) => ({ ...lin, held: newHeld.get(lin.id)! }));
}
