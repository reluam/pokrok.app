import { describe, expect, it } from "vitest";
import { EXPERIENCES, experienceForPath, type PanelTheme } from "./experiencePanel";

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

  it("enOnly nesou ty dvě, co nemají českou verzi obsahu", () => {
    expect(EXPERIENCES.filter((e) => e.enOnly).map((e) => e.route).sort())
      .toEqual(["/life-manual", "/rules"]);
  });

  it("pravidla jsou v registru, takže na nich visí panel", () => {
    const rules = experienceForPath("/rules");
    expect(rules?.slug).toBe("rules");
    for (const l of ["cs", "en"] as const) expect(rules!.description![l].length).toBeGreaterThan(20);
  });

  it("hledání podle cesty snese lomítko na konci", () => {
    expect(experienceForPath("/sound")?.slug).toBe("sound");
    expect(experienceForPath("/sound/")?.slug).toBe("sound");
    expect(experienceForPath("/neexistuje")).toBeUndefined();
  });
});

describe("témata panelu", () => {
  const KEYS: (keyof PanelTheme)[] = [
    "bg", "surface", "ink", "inkSoft", "inkMuted", "accent",
    "border", "borderSoft", "hover", "fontDisplay", "fontBody",
  ];

  it("téma je celé, nebo žádné — půlka by nechala míchat cizí paletu se Spaghetti", () => {
    for (const e of EXPERIENCES) {
      if (!e.theme) continue;
      for (const k of KEYS) {
        expect(e.theme[k], `${e.route} → ${k}`).toBeTruthy();
      }
    }
  });

  it("téma mají experience s vlastní grafikou", () => {
    expect(EXPERIENCES.filter((e) => e.theme).map((e) => e.route).sort())
      .toEqual(["/milans-world", "/rules"]);
  });

  it("fonty odkazují na proměnné, které deklaruje root layout", async () => {
    const { readFileSync } = await import("node:fs");
    const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
    for (const e of EXPERIENCES) {
      if (!e.theme) continue;
      for (const f of [e.theme.fontDisplay, e.theme.fontBody]) {
        const v = f.match(/var\((--[a-z-]+)\)/)?.[1];
        if (v) expect(layout, `${e.route}: ${v}`).toContain(`variable: "${v}"`);
      }
    }
  });
});
