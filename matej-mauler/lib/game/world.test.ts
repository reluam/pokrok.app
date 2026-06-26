import { expect, test } from "vitest";
import { generateWorld, getBiome } from "@/lib/game/world";

test("generateWorld is deterministic for a given seed", () => {
  expect(generateWorld(42, 6)).toEqual(generateWorld(42, 6));
});

test("generateWorld produces the requested count with unique ids", () => {
  const w = generateWorld(1, 6);
  expect(w.biomes).toHaveLength(6);
  const ids = new Set(w.biomes.map((b) => b.id));
  expect(ids.size).toBe(6);
});

test("every biome env field is in 0..1 and has a non-empty name", () => {
  const w = generateWorld(7, 6);
  for (const b of w.biomes) {
    for (const v of [b.env.foodAbundance, b.env.predatorPressure, b.env.temperature, b.env.backgroundHue]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(b.name.length).toBeGreaterThan(0);
  }
});

test("adjacency is symmetric, has no self-loops, and connects the world (min 2 neighbors)", () => {
  const w = generateWorld(3, 6);
  const byId = new Map(w.biomes.map((b) => [b.id, b]));
  for (const b of w.biomes) {
    expect(b.neighbors).not.toContain(b.id); // no self-loop
    expect(new Set(b.neighbors).size).toBe(b.neighbors.length); // no duplicates
    expect(b.neighbors.length).toBeGreaterThanOrEqual(2); // ring guarantees >=2
    for (const n of b.neighbors) {
      expect(byId.get(n)?.neighbors).toContain(b.id); // symmetric
    }
  }
});

test("getBiome returns the matching biome or undefined", () => {
  const w = generateWorld(9, 6);
  expect(getBiome(w, w.biomes[0].id)?.id).toBe(w.biomes[0].id);
  expect(getBiome(w, "nope")).toBeUndefined();
});
