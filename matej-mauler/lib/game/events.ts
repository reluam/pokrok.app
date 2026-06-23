import { clamp01 } from "@/lib/sim/genome";
import { biomeName, World } from "./world";
import { Lineage } from "./lineage";

// ---- tunable knobs -------------------------------------------------------
export const CLIMATE_DRIFT = 0.2;       // max per-field shift on a climate change
export const CATASTROPHE_FROM = 3;      // no catastrophes before this era
export const CATASTROPHE_CHANCE = 0.5;  // per-era probability once past CATASTROPHE_FROM

export type Catastrophe =
  | { kind: "asteroid"; biomeId: string }   // scours one biome — its holder loses it
  | { kind: "plague"; lineageId: string }   // knocks one lineage back (halves its range)
  | { kind: "massExtinction" };             // every lineage loses a biome

// Climate change: nudge every biome's environment fields, recompute its name. Ids + adjacency
// are preserved. Deterministic given the rng. Returns a NEW world.
export function shiftClimate(world: World, rng: () => number): World {
  return {
    biomes: world.biomes.map((b) => {
      const env = {
        foodAbundance: clamp01(b.env.foodAbundance + (rng() * 2 - 1) * CLIMATE_DRIFT),
        predatorPressure: clamp01(b.env.predatorPressure + (rng() * 2 - 1) * CLIMATE_DRIFT),
        temperature: clamp01(b.env.temperature + (rng() * 2 - 1) * CLIMATE_DRIFT),
        backgroundHue: clamp01(b.env.backgroundHue + (rng() * 2 - 1) * CLIMATE_DRIFT),
      };
      return { ...b, env, name: biomeName(env) };
    }),
  };
}

// Decide whether (and which) catastrophe strikes this era. Deterministic given the rng.
export function rollCatastrophe(era: number, world: World, lineages: Lineage[], rng: () => number): Catastrophe | null {
  if (era < CATASTROPHE_FROM) return null;
  if (rng() >= CATASTROPHE_CHANCE) return null;

  const r = rng();
  if (r < 0.45) {
    const held = [...new Set(lineages.flatMap((l) => l.held))];
    const pool = held.length > 0 ? held : world.biomes.map((b) => b.id);
    return { kind: "asteroid", biomeId: pool[Math.floor(rng() * pool.length)] };
  }
  if (r < 0.8) {
    const alive = lineages.filter((l) => l.held.length > 0);
    if (alive.length === 0) return null;
    return { kind: "plague", lineageId: alive[Math.floor(rng() * alive.length)].id };
  }
  return { kind: "massExtinction" };
}

// Execute a catastrophe descriptor. Pure & deterministic (no rng) — returns new lineages + a
// human-readable message for the event log.
export function applyCatastrophe(cat: Catastrophe, lineages: Lineage[]): { lineages: Lineage[]; message: string } {
  const withHeld = (held: (l: Lineage) => string[]) =>
    lineages.map((l) => { const h = held(l); return { ...l, held: h, alive: h.length > 0 }; });

  switch (cat.kind) {
    case "asteroid":
      return {
        lineages: withHeld((l) => l.held.filter((b) => b !== cat.biomeId)),
        message: `an asteroid scours ${cat.biomeId} — its occupants are gone.`,
      };
    case "plague":
      return {
        lineages: withHeld((l) => (l.id === cat.lineageId ? l.held.slice(0, Math.floor(l.held.length / 2)) : l.held)),
        message: `a plague tears through ${cat.lineageId}.`,
      };
    case "massExtinction":
      return {
        lineages: withHeld((l) => l.held.slice(0, Math.max(0, l.held.length - 1))),
        message: `a mass extinction — every lineage loses ground.`,
      };
  }
}
