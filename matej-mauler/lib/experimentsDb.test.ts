import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { experiments } from "./experiments";
import { DRAFT_SLUGS } from "./experimentsDb";

describe("drafty", () => {
  it("zná ty, které kód seeduje jako draft", () => {
    expect([...DRAFT_SLUGS].sort()).toEqual(["about", "decision-maker", "life-manual"]);
  });

  // Pojistka proti rozejití: seed je syrové SQL, DRAFT_SLUGS je konstanta.
  // Kdyby někdo přidal draft do seedu a zapomněl na konstantu, výpadek DB
  // by ho zveřejnil. Tenhle test to chytí.
  it("seznam sedí se seedem v SQL", () => {
    const src = readFileSync(new URL("./experimentsDb.ts", import.meta.url), "utf8");
    const seeded = [...src.matchAll(/VALUES \('([a-z0-9-]+)'/g)]
      .map((m) => m[1])
      .filter((slug) => {
        const at = src.indexOf(`VALUES ('${slug}'`);
        return src.slice(at, at + 900).includes("'draft'");
      });
    expect(seeded.length).toBeGreaterThan(0);
    for (const slug of seeded) expect(DRAFT_SLUGS.has(slug)).toBe(true);
  });
});

describe("offline fallback", () => {
  it("označený je jen Milanův svět", () => {
    expect(experiments.filter((e) => e.offline).map((e) => e.slug)).toEqual(["milans-world"]);
  });

  it("každý offline experiment má href, není wip a má texty v obou jazycích", async () => {
    const { dictionaries } = await import("./dictionaries");
    for (const e of experiments.filter((x) => x.offline)) {
      expect(e.href).toBeTruthy();
      expect(e.wip).toBeFalsy();
      for (const l of ["cs", "en"] as const) {
        expect(dictionaries[l].experiments.find((x) => x.slug === e.slug)).toBeDefined();
      }
    }
  });
});
