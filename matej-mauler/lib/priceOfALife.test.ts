import { expect, test } from "vitest";
import { computeMirror, SCENARIOS, type Decision } from "./priceOfALife";

const bySlug = Object.fromEntries(SCENARIOS.map((s) => [s.slug, s.pricePerLife]));
const dec = (slug: string, funded: boolean): Decision => ({ slug, funded, pricePerLife: bySlug[slug] });

test("ten scenarios span at least four orders of magnitude", () => {
  const prices = SCENARIOS.map((s) => s.pricePerLife);
  expect(SCENARIOS).toHaveLength(10);
  expect(Math.max(...prices) / Math.min(...prices)).toBeGreaterThan(10_000);
});

test("floor = dearest funded, ceiling = cheapest skipped", () => {
  // fund the two cheapest, skip the rest
  const decisions = SCENARIOS.map((s) => dec(s.slug, s.pricePerLife <= 5_600));
  const m = computeMirror(decisions);
  expect(m.fundedCount).toBe(2);
  expect(m.impliedFloor).toBe(5_600); // traffic lights
  expect(m.impliedCeiling).toBe(144_000); // icu beds, cheapest skipped
  expect(m.contradictions).toBe(0); // a clean threshold
});

test("a skipped life cheaper than a funded one is a contradiction", () => {
  // fund the rare drug ($34M), skip everything cheaper
  const decisions = SCENARIOS.map((s) => dec(s.slug, s.slug === "rare-drug"));
  const m = computeMirror(decisions);
  expect(m.impliedFloor).toBe(34_000_000);
  expect(m.contradictions).toBe(9);
  expect(m.contradictionSlugs).toContain("vaccination");
});

test("distanceBias = skipped the far cheapest life while funding something dearer", () => {
  const biased = computeMirror(SCENARIOS.map((s) => dec(s.slug, s.slug !== "vaccination")));
  expect(biased.distanceBias).toBe(true);

  const fundedVaccine = computeMirror(SCENARIOS.map((s) => dec(s.slug, true)));
  expect(fundedVaccine.distanceBias).toBe(false);
});

test("fundedSpanRatio reflects the cheapest-to-dearest funded ratio", () => {
  const m = computeMirror([dec("vaccination", true), dec("rare-drug", true), dec("icu-beds", false)]);
  expect(m.fundedSpanRatio).toBeCloseTo(34_000_000 / 1_500, 5);

  const one = computeMirror(SCENARIOS.map((s) => dec(s.slug, s.slug === "icu-beds")));
  expect(one.fundedSpanRatio).toBe(1);
});

test("edge cases: funded-all and skipped-all stay coherent", () => {
  const all = computeMirror(SCENARIOS.map((s) => dec(s.slug, true)));
  expect(all.skippedCount).toBe(0);
  expect(all.impliedCeiling).toBe(Infinity);
  expect(all.contradictions).toBe(0);

  const none = computeMirror(SCENARIOS.map((s) => dec(s.slug, false)));
  expect(none.fundedCount).toBe(0);
  expect(none.impliedFloor).toBe(0);
  expect(none.fundedSpanRatio).toBe(0);
});
