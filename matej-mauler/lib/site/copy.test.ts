import { describe, expect, it } from "vitest";
import { COPY, DESCRIPTION } from "./copy";
import { SECTIONS } from "./sections";
import { projects } from "@/lib/projects";

const langs = ["cs", "en"] as const;

describe("texty rozcestníku", () => {
  it("úvod na hlavní stránce jsou tři odstavce v obou jazycích", () => {
    expect(DESCRIPTION).toHaveLength(3);
    for (const p of DESCRIPTION) {
      for (const l of langs) expect(p[l].length).toBeGreaterThan(20);
    }
  });

  it("první věta drží 'for me' / 'pro mě' — je to Matějova zkušenost, ne tvrzení o životě", () => {
    expect(DESCRIPTION[0].en).toContain("for me");
    expect(DESCRIPTION[0].cs).toContain("pro mě");
  });

  it("metaDescription se vejde do meta tagu a je věcný", () => {
    for (const l of langs) {
      expect(COPY.metaDescription[l].length).toBeGreaterThan(80);
      expect(COPY.metaDescription[l].length).toBeLessThanOrEqual(165);
    }
    expect(COPY.metaDescription.en).toContain("Teya");
  });

  it("mrtvé klíče po rotátoru a kartotéce jsou pryč", () => {
    for (const dead of ["description", "beliefsHeading", "thoughtsShort", "thoughtsShortLead", "prev", "next", "timelineNow"]) {
      expect(COPY).not.toHaveProperty(dead);
    }
    expect(COPY.inPractice.en).toBe("so, in practice");
  });

  it("každá sekce kromě home má shrnutí v obou jazycích", () => {
    for (const s of SECTIONS.filter((x) => x.id !== "home")) {
      for (const l of langs) expect(s.summary[l].length).toBeGreaterThan(20);
    }
  });

  it("projekty přiznávají, v jakém jsou stavu — pravidlo 8", () => {
    const spaghetti = projects.find((p) => p.name === "Spaghetti.ltd")!;
    expect(spaghetti.blurb.en).toContain("unfinished");
    const stats = projects.find((p) => p.name === "Stats & Facts")!;
    expect(stats.url).toBeUndefined();
    expect(stats.blurb.en).toContain("early");
  });

  it("v žádném blurbu nezůstalo TODO", () => {
    for (const p of projects) {
      for (const l of langs) expect(p.blurb[l]).not.toContain("TODO");
    }
  });
});
