import { describe, expect, it } from "vitest";
import { BELIEFS } from "./beliefs";
import { RULES } from "./thoughts";

const langs = ["cs", "en"] as const;
const all = [...BELIEFS, ...RULES];

describe("Jak to vidím", () => {
  it("tři přesvědčení a pět pravidel", () => {
    expect(BELIEFS).toHaveLength(3);
    expect(RULES).toHaveLength(5);
  });

  it("žádné id se neopakuje napříč vrstvami", () => {
    const ids = all.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("každá položka má claim i support v obou jazycích", () => {
    for (const x of all) {
      for (const l of langs) {
        expect(x.claim[l].length).toBeGreaterThan(10);
        expect(x.support[l].length).toBeGreaterThan(30);
      }
    }
  });

  it("claim je jedna věta zakončená tečkou", () => {
    for (const x of all) {
      for (const l of langs) {
        expect(x.claim[l].endsWith(".")).toBe(true);
        expect(x.claim[l].length).toBeLessThan(60);
      }
    }
  });

  it("'Done beats perfect' si drží přiznání, že to Matějovi pořád nejde", () => {
    const done = RULES.find((r) => r.id === "hotove")!;
    expect(done.support.en).toContain("I'm still bad at this.");
  });

  it("všechno je v první osobě — nejsou to rady čtenáři", () => {
    for (const x of all) {
      expect(x.support.en).toMatch(/\b(I|my|me)\b/);
    }
  });
});
