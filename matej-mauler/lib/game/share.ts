import { Genome, encodeGenome, decodeGenome, GENE_KEYS } from "@/lib/sim/genome";
import type { SimState } from "@/lib/sim/population";
import { fitness } from "@/lib/sim/fitness";

export function fittestGenome(state: SimState): Genome {
  let best = state.population[0], bestF = -Infinity;
  for (const g of state.population) {
    const f = fitness(g, state.env);
    if (f > bestF) { bestF = f; best = g; }
  }
  return best;
}

export function buildShareUrl(origin: string, g: Genome): string {
  return `${origin}/driftbloom?dna=${encodeGenome(g)}`;
}

export function readDnaParam(search: string): Genome | null {
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const dna = params.get("dna");
    if (!dna) return null;
    const g = decodeGenome(dna);
    // sanity: decoded genome must have every gene in range
    for (const k of GENE_KEYS) if (!(g[k] >= 0 && g[k] <= 1)) return null;
    return g;
  } catch { return null; }
}
