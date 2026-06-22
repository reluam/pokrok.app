import { expect, test } from "vitest";
import type { Environment } from "@/lib/sim/environment";
import { fitness, survivalPath } from "@/lib/sim/fitness";
import { makeRng } from "@/lib/sim/rng";
import { randomGenome, Genome, GENE_KEYS } from "@/lib/sim/genome";

const env = (o: Partial<Environment>): Environment => ({
  foodAbundance: 0.5, predatorPressure: 0.5, temperature: 0.5, backgroundHue: 0.5, ...o,
});
const gene = (o: Partial<Genome>): Genome => {
  const base = {} as Genome;
  for (const k of GENE_KEYS) base[k] = 0.5;
  return { ...base, ...o };
};

test("fitness is always >= 0", () => {
  const r = makeRng(1);
  for (let i = 0; i < 200; i++) {
    expect(fitness(randomGenome(r), env({}))).toBeGreaterThanOrEqual(0);
  }
});

test("camouflage rewards matching the background hue, not a fixed 'better' hue", () => {
  const e = env({ predatorPressure: 1, backgroundHue: 0.2 });
  const matched = gene({ hue: 0.2, toughness: 0.2, speed: 0.2 });
  const mismatched = gene({ hue: 0.9, toughness: 0.2, speed: 0.2 });
  expect(fitness(matched, e)).toBeGreaterThan(fitness(mismatched, e));
});

test("there are multiple ways to beat predators", () => {
  const e = env({ predatorPressure: 1, backgroundHue: 0.0 });
  const byTough = gene({ toughness: 1, camouflage: 0, speed: 0, hue: 1 });
  const bySpeed = gene({ toughness: 0, camouflage: 0, speed: 1, hue: 1 });
  const byCamo = gene({ toughness: 0, camouflage: 1, speed: 0, hue: 0 });
  const weak = gene({ toughness: 0, camouflage: 0, speed: 0, hue: 1 });
  expect(fitness(byTough, e)).toBeGreaterThan(fitness(weak, e));
  expect(fitness(bySpeed, e)).toBeGreaterThan(fitness(weak, e));
  expect(fitness(byCamo, e)).toBeGreaterThan(fitness(weak, e));
});

test("temperature extremes punish high metabolism", () => {
  const cold = env({ temperature: 0 });
  const hi = gene({ metabolism: 1 });
  const lo = gene({ metabolism: 0 });
  expect(fitness(lo, cold)).toBeGreaterThan(fitness(hi, cold));
});

test("survivalPath names the dominant anti-predator trait", () => {
  const e = env({ predatorPressure: 1, backgroundHue: 0 });
  expect(survivalPath(gene({ toughness: 1, camouflage: 0, speed: 0, hue: 1 }), e)).toBe("toughness");
  expect(survivalPath(gene({ toughness: 0, camouflage: 1, speed: 0, hue: 0 }), e)).toBe("camouflage");
  expect(survivalPath(gene({ toughness: 0, camouflage: 0, speed: 1, hue: 1 }), e)).toBe("speed");
});
