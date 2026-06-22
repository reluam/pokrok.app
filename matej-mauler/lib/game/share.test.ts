import { expect, test } from "vitest";
import type { Environment } from "@/lib/sim/environment";
import { initPopulation } from "@/lib/sim/population";
import { GENE_KEYS } from "@/lib/sim/genome";
import { fittestGenome, buildShareUrl, readDnaParam } from "@/lib/game/share";

const env: Environment = { foodAbundance: 0.6, predatorPressure: 0.6, temperature: 0.5, backgroundHue: 0.3 };

test("buildShareUrl + readDnaParam round-trip the fittest genome", () => {
  const s = initPopulation(11, 40, env);
  const g = fittestGenome(s);
  const url = buildShareUrl("https://spaghetti.ltd", g);
  expect(url.startsWith("https://spaghetti.ltd/driftbloom?dna=")).toBe(true);
  const search = url.slice(url.indexOf("?"));
  const back = readDnaParam(search)!;
  for (const k of GENE_KEYS) expect(Math.abs(back[k] - g[k])).toBeLessThan(1 / 255 + 1e-9);
});

test("readDnaParam returns null when absent or invalid", () => {
  expect(readDnaParam("")).toBeNull();
  expect(readDnaParam("?foo=1")).toBeNull();
});
