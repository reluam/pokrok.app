import { describe, expect, it } from "vitest";
import { TIMELINE } from "./timeline";

const langs = ["cs", "en"] as const;

describe("TIMELINE", () => {
  it("má šest položek od nejnovější po nejstarší", () => {
    expect(TIMELINE.map((t) => t.org)).toEqual([
      "Teya",
      "NetDirect (FLO)",
      "Kinder Fest",
      "MarketPUBG",
      "Mladá fronta",
      "Beats for Love",
    ]);
  });

  it("každá položka má vyplněné roky, žádné TODO", () => {
    for (const t of TIMELINE) {
      expect(t.period.length).toBeGreaterThan(3);
      expect(t.period).not.toContain("TODO");
      for (const l of langs) {
        expect(t.role[l]).not.toContain("TODO");
        expect(t.body[l].length).toBeGreaterThan(20);
      }
    }
  });

  it("běžící role jsou dvě — Teya i Beats for Love", () => {
    expect(TIMELINE.filter((t) => t.current).map((t) => t.org)).toEqual(["Teya", "Beats for Love"]);
  });

  it("neúspěchy zůstávají holé, bez přilepeného ponaučení — pravidlo 8", () => {
    const byId = (id: string) => TIMELINE.find((t) => t.id === id)!;
    expect(byId("kinder-fest").body.en).toContain("It ended badly.");
    expect(byId("marketpubg").body.en).toContain("It didn't make it.");
  });

  it("id jsou unikátní", () => {
    const ids = TIMELINE.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
