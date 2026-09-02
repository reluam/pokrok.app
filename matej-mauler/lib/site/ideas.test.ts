import { describe, expect, it } from "vitest";
import { IDEAS } from "./ideas";

const langs = ["cs", "en"] as const;

describe("nápady", () => {
  it("jsou aspoň tři a mají unikátní id", () => {
    expect(IDEAS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(IDEAS.map((i) => i.id)).size).toBe(IDEAS.length);
  });

  it("každý nápad má název, co to je a proč by měl existovat — v obou jazycích", () => {
    for (const idea of IDEAS) {
      for (const l of langs) {
        expect(idea.title[l].length).toBeGreaterThan(3);
        expect(idea.what[l].length).toBeGreaterThan(20);
        expect(idea.why[l].length).toBeGreaterThan(40);
      }
    }
  });

  it("v datech nezůstal PLACEHOLDER", () => {
    // Záměrně červený, dokud Matěj nedodá texty. Nemergovat, dokud tenhle test padá.
    for (const idea of IDEAS) {
      const all = [idea.title, idea.what, idea.why, idea.hard ?? { cs: "", en: "" }];
      for (const bi of all) {
        for (const l of langs) expect(bi[l]).not.toContain("PLACEHOLDER");
      }
    }
  });
});
