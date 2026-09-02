import { describe, expect, it } from "vitest";
import { CONTINENTS, nearestContinent, rotationFor } from "./continents";
import { angularDistance } from "./globe";

describe("kontinenty", () => {
  it("jsou čtyři a mají čekaná id", () => {
    expect(CONTINENTS.map((c) => c.id)).toEqual(["home", "work", "ideas", "contact"]);
  });

  it("každý má aspoň 8 bodů obrysu a rozumné souřadnice", () => {
    for (const c of CONTINENTS) {
      expect(c.points.length).toBeGreaterThanOrEqual(8);
      for (const [lon, lat] of c.points) {
        expect(lon).toBeGreaterThanOrEqual(-180);
        expect(lon).toBeLessThanOrEqual(360);
        expect(lat).toBeGreaterThan(-85);
        expect(lat).toBeLessThan(85);
      }
    }
  });

  it("žádné dva kontinenty neleží na sobě", () => {
    for (const a of CONTINENTS) {
      for (const b of CONTINENTS) {
        if (a.id === b.id) continue;
        expect(angularDistance(rotationFor(a.id), rotationFor(b.id))).toBeGreaterThan(60);
      }
    }
  });

  it("obrys leží kolem svého centroidu, ne někde jinde", () => {
    for (const c of CONTINENTS) {
      const [clon, clat] = c.centroid;
      for (const [lon, lat] of c.points) {
        expect(Math.abs(lon - clon)).toBeLessThan(50);
        expect(Math.abs(lat - clat)).toBeLessThan(50);
      }
    }
  });

  it("rotationFor vrací centroid kontinentu", () => {
    expect(rotationFor("work")).toEqual({ lon0: 90, lat0: -10 });
  });

  it("nearestContinent přichytí natočení k nejbližšímu kontinentu", () => {
    expect(nearestContinent({ lon0: 84, lat0: -4 }).id).toBe("work");
    expect(nearestContinent({ lon0: 355, lat0: 12 }).id).toBe("home");
    expect(nearestContinent({ lon0: 190, lat0: 18 }).id).toBe("ideas");
  });
});
