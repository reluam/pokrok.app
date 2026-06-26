import { expect, test } from "vitest";
import type { Genome } from "@/lib/sim/genome";
import type { Environment } from "@/lib/sim/environment";
import { traitDemands, coachingHints, SHOWN_TRAITS } from "@/lib/game/hints";

const gene = (o: Partial<Genome>): Genome => ({
  size: 0.5, limbCount: 0.5, limbLength: 0.5, hue: 0.5, particleDensity: 0.5,
  metabolism: 0.5, speed: 0.5, toughness: 0.5, sensorRange: 0.5, camouflage: 0.5, ...o,
});
const env = (o: Partial<Environment>): Environment => ({ foodAbundance: 0.5, predatorPressure: 0.5, temperature: 0.5, backgroundHue: 0.5, ...o });

test("traitDemands lists the shown traits with current + demand in 0..1", () => {
  const d = traitDemands(gene({}), env({}));
  expect(d.map((t) => t.gene).sort()).toEqual([...SHOWN_TRAITS].map((t) => t.gene).sort());
  for (const t of d) {
    expect(t.current).toBeGreaterThanOrEqual(0);
    expect(t.current).toBeLessThanOrEqual(1);
    expect(t.demand).toBeGreaterThanOrEqual(0);
    expect(t.demand).toBeLessThanOrEqual(1);
  }
});

test("armor demand rises with predator pressure", () => {
  const lo = traitDemands(gene({}), env({ predatorPressure: 0.1 })).find((t) => t.gene === "toughness")!.demand;
  const hi = traitDemands(gene({}), env({ predatorPressure: 0.9 })).find((t) => t.gene === "toughness")!.demand;
  expect(hi).toBeGreaterThan(lo);
});

test("body-size demand rises with food abundance", () => {
  const lo = traitDemands(gene({}), env({ foodAbundance: 0.1 })).find((t) => t.gene === "size")!.demand;
  const hi = traitDemands(gene({}), env({ foodAbundance: 0.9 })).find((t) => t.gene === "size")!.demand;
  expect(hi).toBeGreaterThan(lo);
});

test("coachingHints warns when the genome is a poor fit for the world", () => {
  // defenseless creature in a predator-heavy, mismatched world
  const unfit = gene({ toughness: 0, camouflage: 0, speed: 0, hue: 1, size: 1, metabolism: 1 });
  const hints = coachingHints(unfit, env({ predatorPressure: 1, foodAbundance: 0.1, temperature: 1, backgroundHue: 0 }));
  expect(hints.length).toBeGreaterThan(0);
  expect(hints.join(" ")).toMatch(/fit|adapt|fade|defen|food|armor|camouflage|speed/i);
});

test("coachingHints is deterministic and lowercase", () => {
  const g = gene({ toughness: 0.2 });
  const e = env({ predatorPressure: 0.9 });
  const a = coachingHints(g, e);
  expect(a).toEqual(coachingHints(g, e));
  for (const h of a) expect(h).toBe(h.toLowerCase());
});
