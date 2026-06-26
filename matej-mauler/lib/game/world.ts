import type { Environment } from "@/lib/sim/environment";
import { makeRng } from "@/lib/sim/rng";

export interface Biome {
  id: string;
  name: string;
  env: Environment;
  neighbors: string[];
}

export interface World {
  biomes: Biome[];
}

// Flavourful name derived deterministically from the biome's environment character.
export function biomeName(env: Environment): string {
  const temp =
    env.temperature < 0.33 ? "frozen" : env.temperature > 0.66 ? "scorched" : "temperate";
  const land =
    env.foodAbundance < 0.33 ? "waste" : env.foodAbundance > 0.66 ? "jungle" : "steppe";
  const edge = env.predatorPressure > 0.66 ? "savage " : "";
  return `${edge}${temp} ${land}`.trim();
}

// Deterministic world: `count` biomes (random Environments) on a ring + a few cross-chords,
// so lineages can radiate between adjacent biomes. Same seed → identical world.
export function generateWorld(seed: number, count = 6): World {
  const rng = makeRng(seed);
  const biomes: Biome[] = [];
  for (let i = 0; i < count; i++) {
    const env: Environment = {
      foodAbundance: rng(),
      predatorPressure: rng(),
      temperature: rng(),
      backgroundHue: rng(),
    };
    biomes.push({ id: `b${i}`, name: biomeName(env), env, neighbors: [] });
  }

  // Symmetric neighbour set: add an undirected edge once, mirror it on both endpoints.
  const addEdge = (a: number, b: number) => {
    if (a === b) return;
    if (!biomes[a].neighbors.includes(biomes[b].id)) biomes[a].neighbors.push(biomes[b].id);
    if (!biomes[b].neighbors.includes(biomes[a].id)) biomes[b].neighbors.push(biomes[a].id);
  };

  // Ring guarantees the world is connected and every biome has >= 2 neighbours.
  for (let i = 0; i < count; i++) addEdge(i, (i + 1) % count);

  // A few deterministic chords for non-trivial topology (skip when too small to matter).
  const chords = Math.floor(count / 3);
  for (let c = 0; c < chords; c++) {
    const a = Math.floor(rng() * count);
    const b = Math.floor(rng() * count);
    addEdge(a, b);
  }

  return { biomes };
}

export function getBiome(world: World, id: string): Biome | undefined {
  return world.biomes.find((b) => b.id === id);
}
