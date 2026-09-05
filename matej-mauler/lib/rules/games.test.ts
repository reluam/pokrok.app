import { describe, expect, it } from "vitest";
import { RULES_GAMES, RULES_GAME_KEYS, revealLineFor } from "./games";

const langs = ["cs", "en"] as const;

describe("registr her v Pravidlech", () => {
  it("je jich devět a mají unikátní klíče", () => {
    expect(RULES_GAMES).toHaveLength(9);
    expect(new Set(RULES_GAME_KEYS).size).toBe(9);
  });

  it("každá hra má název i pointu v obou jazycích", () => {
    for (const g of RULES_GAMES) {
      for (const l of langs) {
        expect(g.title[l].length, `${g.key} title.${l}`).toBeGreaterThan(2);
        expect(g.revealLine[l].length, `${g.key} revealLine.${l}`).toBeGreaterThan(10);
      }
    }
  });

  it("čeština není jen opsaná angličtina", () => {
    for (const g of RULES_GAMES) {
      expect(g.revealLine.cs, g.key).not.toBe(g.revealLine.en);
    }
  });

  it("revealLineFor vrací jazyk, co si řekneš", () => {
    expect(revealLineFor("chicken", "cs")).toBe("Přes tu silnici jsi jít nemusel.");
    expect(revealLineFor("chicken", "en")).toBe("You didn't have to cross the road.");
  });

  it("neznámá hra nespadne, vrátí náhradní hlášku v daném jazyce", () => {
    expect(revealLineFor("neexistuje", "cs")).toBe("Byla tam ještě jiná cesta.");
    expect(revealLineFor("neexistuje", "en")).toBe("There was another way.");
  });

  // Badge zůstávají anglicky schválně: BadgeDef je string v celé rewards vrstvě.
  it("badge mají anglické texty a stabilní slugy", () => {
    for (const g of RULES_GAMES) {
      expect(typeof g.badge.name).toBe("string");
      expect(g.badge.slug.length).toBeGreaterThan(3);
    }
    expect(new Set(RULES_GAMES.map((g) => g.badge.slug)).size).toBe(9);
  });
});
