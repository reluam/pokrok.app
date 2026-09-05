import { describe, expect, it } from "vitest";
import { buildExperienceMetadata } from "./experienceMetadata";

describe("metadata experiencí", () => {
  it("titulek nese jméno experience i značku", () => {
    const m = buildExperienceMetadata("/sound", "en");
    expect(m.title).toContain("Spaghetti.ltd");
    expect(m.description!.length).toBeGreaterThan(20);
  });

  it("čeština a angličtina se liší", () => {
    const cs = buildExperienceMetadata("/milans-world", "cs");
    const en = buildExperienceMetadata("/milans-world", "en");
    expect(cs.title).not.toBe(en.title);
    expect(cs.title).toContain("Milanův svět");
  });

  it("canonical ukazuje na routu a hreflang na obě varianty", () => {
    const m = buildExperienceMetadata("/radio", "en");
    expect(m.alternates!.canonical).toBe("/radio");
    expect(m.alternates!.languages).toEqual({
      en: "/radio?lang=en",
      cs: "/radio?lang=cs",
      "x-default": "/radio",
    });
  });

  it("neznámá routa nespadne, vrátí holou značku", () => {
    const m = buildExperienceMetadata("/neexistuje", "en");
    expect(m.title).toBe("Spaghetti.ltd");
  });
});
