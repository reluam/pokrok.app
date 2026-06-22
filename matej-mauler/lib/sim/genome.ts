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
