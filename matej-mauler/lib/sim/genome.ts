import { nextGaussian } from "./rng";

export interface Genome {
  size: number;
  limbCount: number;      // → 0..8 outgrowths in the renderer
  limbLength: number;
  hue: number;            // → 0..360°
  particleDensity: number;
  metabolism: number;     // higher = needs more energy, but faster
  speed: number;
  toughness: number;      // resistance to predators
  sensorRange: number;
  camouflage: number;     // genome trait; effective match also depends on env hue
}

export const GENE_KEYS: (keyof Genome)[] = [
  "size", "limbCount", "limbLength", "hue", "particleDensity",
  "metabolism", "speed", "toughness", "sensorRange", "camouflage",
];

export const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

export function randomGenome(rng: () => number): Genome {
  const g = {} as Genome;
  for (const k of GENE_KEYS) g[k] = rng();
  return g;
}

const MUTATION_SCALE = 0.15; // sd of the gaussian step at rate 1

// Gaussian per-gene drift, scaled by rate, clamped to the gene's 0–1 range.
export function mutate(g: Genome, rate: number, rng: () => number): Genome {
  const out = {} as Genome;
  for (const k of GENE_KEYS) {
    out[k] = clamp01(g[k] + nextGaussian(rng) * MUTATION_SCALE * rate);
  }
  return out;
}

// Uniform per-gene crossover: each gene comes from parent a or b with equal chance.
export function crossover(a: Genome, b: Genome, rng: () => number): Genome {
  const out = {} as Genome;
  for (const k of GENE_KEYS) out[k] = rng() < 0.5 ? a[k] : b[k];
  return out;
}
