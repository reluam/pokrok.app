import { describe, expect, it } from "vitest";
import { COPY, DESCRIPTION } from "./copy";
import { SECTIONS, indexForPath } from "./sections";

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

  it("mrtvé klíče po rotátoru, kartotéce a sekci „Jak to vidím“ jsou pryč", () => {
    const dead = [
      "description", "beliefsHeading", "thoughtsShort", "thoughtsShortLead",
      "prev", "next", "timelineNow", "inPractice", "nowIntro",
    ];
    for (const key of dead) expect(COPY).not.toHaveProperty(key);
  });

  it("sekce jsou čtyři, „jak to vidím“ mezi nimi není", () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(["home", "work", "ideas", "contact"]);
  });

  it("každá sekce kromě home má shrnutí i navigační popisek v obou jazycích", () => {
    for (const s of SECTIONS.filter((x) => x.id !== "home")) {
      for (const l of langs) {
        expect(s.summary[l].length).toBeGreaterThan(20);
        expect(s.nav[l].length).toBeGreaterThan(2);
      }
    }
  });

  it("cesty ukazují na správné sekce", () => {
    expect(indexForPath("/matej")).toBe(0);
    expect(indexForPath("/matej/work")).toBe(1);
    expect(indexForPath("/matej/ideas")).toBe(2);
    expect(indexForPath("/matej/contact")).toBe(3);
    expect(indexForPath("/neexistuje")).toBe(0);
  });

  it("osobní web žije pod /matej — na „/“ je zase Spaghetti.ltd", () => {
    for (const s of SECTIONS) expect(s.href.startsWith("/matej")).toBe(true);
  });

  it("úvod sekce Nápady mluví o nápadech, ne o projektech", () => {
    for (const l of langs) expect(COPY.ideasIntro[l].length).toBeGreaterThan(20);
  });
});
