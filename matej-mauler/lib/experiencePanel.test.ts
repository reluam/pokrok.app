import { describe, expect, it } from "vitest";
import { EXPERIENCES, experienceForPath } from "./experiencePanel";

const langs = ["cs", "en"] as const;

describe("registr experiencí", () => {
  it("každá experience má titulek v obou jazycích", () => {
    for (const e of EXPERIENCES) {
      for (const l of langs) expect(e.title[l].length).toBeGreaterThan(0);
    }
  });

  it("popis i návod jsou v obou jazycích", () => {
    for (const e of EXPERIENCES) {
      for (const l of langs) {
        if (e.description) expect(e.description[l].length).toBeGreaterThan(20);
        for (const g of e.guide ?? []) expect(g[l].length).toBeGreaterThan(10);
      }
    }
  });

  it("routy a slugy jsou unikátní", () => {
    expect(new Set(EXPERIENCES.map((e) => e.route)).size).toBe(EXPERIENCES.length);
    expect(new Set(EXPERIENCES.map((e) => e.slug)).size).toBe(EXPERIENCES.length);
  });

  // /rules v registru není — experiment Pravidla se do panelu nikdy nezaregistroval,
  // takže na něm žádný panel nevisí a nemá kde poznámku ukázat. Až se přidá,
  // musí dostat enOnly (nebo českou verzi) a tenhle test na to upozorní.
  it("enOnly nese jen life-manual; rules zatím v registru není", () => {
    expect(EXPERIENCES.filter((e) => e.enOnly).map((e) => e.route)).toEqual(["/life-manual"]);
    expect(EXPERIENCES.some((e) => e.route === "/rules")).toBe(false);
  });

  it("hledání podle cesty snese lomítko na konci", () => {
    expect(experienceForPath("/sound")?.slug).toBe("sound");
    expect(experienceForPath("/sound/")?.slug).toBe("sound");
    expect(experienceForPath("/neexistuje")).toBeUndefined();
  });
});
