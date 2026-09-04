import { describe, expect, it } from "vitest";
import { CONTINENTS } from "./continents";
import { COUNTRIES, countryShape, pointInPolygon, polygonArea } from "./countries";

const langs = ["cs", "en"] as const;
const work = CONTINENTS.find((c) => c.id === "work")!;

describe("země kontinentu Práce", () => {
  it("je jich šest a mají unikátní id", () => {
    expect(COUNTRIES).toHaveLength(6);
    expect(new Set(COUNTRIES.map((c) => c.id)).size).toBe(6);
  });

  it("každá říká, co jsem tam dělal, v obou jazycích", () => {
    for (const c of COUNTRIES) {
      expect(c.org.length).toBeGreaterThan(2);
      for (const l of langs) expect(c.body[l].length).toBeGreaterThan(20);
    }
  });

  it("pozice ani roky v datovém modelu nejsou — náplň, ne pozice", () => {
    for (const c of COUNTRIES) {
      expect(c).not.toHaveProperty("role");
      expect(c).not.toHaveProperty("period");
      expect(c).not.toHaveProperty("current");
    }
  });

  it("plocha země roste s délkou působení", () => {
    const sorted = [...COUNTRIES].sort((a, b) => a.months - b.months);
    for (let i = 1; i < sorted.length; i += 1) {
      expect(polygonArea(countryShape(sorted[i]))).toBeGreaterThanOrEqual(
        polygonArea(countryShape(sorted[i - 1])) - 1e-9,
      );
    }
  });

  it("Beats for Love je největší pevnina", () => {
    const areas = COUNTRIES.map((c) => ({ id: c.id, a: polygonArea(countryShape(c)) }));
    areas.sort((x, y) => y.a - x.a);
    expect(areas[0].id).toBe("b4l");
  });

  it("i nejmenší země unese popisek — aspoň pětina plochy té největší", () => {
    const areas = COUNTRIES.map((c) => polygonArea(countryShape(c)));
    expect(Math.min(...areas) / Math.max(...areas)).toBeGreaterThan(0.19);
  });

  it("všechny země leží uvnitř kontinentu Práce", () => {
    for (const c of COUNTRIES) {
      for (const p of countryShape(c)) {
        expect(pointInPolygon(p, work.points), `${c.id} přetéká přes okraj`).toBe(true);
      }
    }
  });

  it("žádné dvě země se nepřekrývají v sídle té druhé", () => {
    for (const a of COUNTRIES) {
      for (const b of COUNTRIES) {
        if (a.id === b.id) continue;
        expect(pointInPolygon(b.seat, countryShape(a)), `${b.id} sedí v ${a.id}`).toBe(false);
      }
    }
  });
});
