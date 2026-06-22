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

// Pure base64 (no Buffer/btoa — keeps lib/sim runnable headless and in the browser).
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function bytesToB64url(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1] ?? 0, b2 = bytes[i + 2] ?? 0;
    const n = (b0 << 16) | (b1 << 8) | b2;
    const chunk = bytes.length - i;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    if (chunk > 1) out += B64[(n >> 6) & 63];
    if (chunk > 2) out += B64[n & 63];
  }
  return out;
}

function b64urlToBytes(s: string): number[] {
  const clean = s.replace(/[+]/g, "-").replace(/[/]/g, "_").replace(/=+$/, "");
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64.indexOf(clean[i]), c1 = B64.indexOf(clean[i + 1]);
    const c2 = clean[i + 2] ? B64.indexOf(clean[i + 2]) : -1;
    const c3 = clean[i + 3] ? B64.indexOf(clean[i + 3]) : -1;
    const n = (c0 << 18) | (c1 << 12) | ((c2 < 0 ? 0 : c2) << 6) | (c3 < 0 ? 0 : c3);
    bytes.push((n >> 16) & 255);
    if (c2 >= 0) bytes.push((n >> 8) & 255);
    if (c3 >= 0) bytes.push(n & 255);
  }
  return bytes;
}

export function encodeGenome(g: Genome): string {
  return bytesToB64url(GENE_KEYS.map((k) => Math.round(clamp01(g[k]) * 255)));
}

export function decodeGenome(s: string): Genome {
  const bytes = b64urlToBytes(s);
  const out = {} as Genome;
  GENE_KEYS.forEach((k, i) => { out[k] = clamp01((bytes[i] ?? 0) / 255); });
  return out;
}
