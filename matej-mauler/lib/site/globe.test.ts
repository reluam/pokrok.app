import { describe, expect, it } from "vitest";
import { angularDistance, isVisible, project, projectPolygon, shortestRotation } from "./globe";

const R = 100;

describe("ortografická projekce", () => {
  it("bod uprostřed rotace padne do středu kotouče", () => {
    const p = project({ lon: 20, lat: 30 }, { lon0: 20, lat0: 30 }, R);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(0, 6);
    expect(p.cosc).toBeCloseTo(1, 6);
  });

  it("bod 90° na východ padne na pravý okraj kotouče", () => {
    const p = project({ lon: 90, lat: 0 }, { lon0: 0, lat0: 0 }, R);
    expect(p.x).toBeCloseTo(R, 6);
    expect(p.y).toBeCloseTo(0, 6);
    expect(p.cosc).toBeCloseTo(0, 6);
  });

  it("severní bod jde v SVG nahoru, tedy do záporného y", () => {
    const p = project({ lon: 0, lat: 30 }, { lon0: 0, lat0: 0 }, R);
    expect(p.y).toBeLessThan(0);
  });

  it("bod na odvrácené straně koule není vidět", () => {
    expect(isVisible({ lon: 180, lat: 0 }, { lon0: 0, lat0: 0 })).toBe(false);
    expect(isVisible({ lon: 0, lat: 0 }, { lon0: 0, lat0: 0 })).toBe(true);
  });

  it("projekce nikdy nevyjde mimo kotouč, ani za obzorem", () => {
    for (let lon = -180; lon <= 180; lon += 7) {
      for (let lat = -90; lat <= 90; lat += 7) {
        const p = project({ lon, lat }, { lon0: 33, lat0: -12 }, R);
        expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(R + 1e-9);
      }
    }
  });
});

describe("projectPolygon", () => {
  const square: [number, number][] = [[-10, -10], [10, -10], [10, 10], [-10, 10]];

  it("polygon vepředu je celý vidět a vrací uzavřenou cestu", () => {
    const out = projectPolygon(square, { lon0: 0, lat0: 0 }, R);
    expect(out.visibility).toBe("full");
    expect(out.path.startsWith("M ")).toBe(true);
    expect(out.path.endsWith(" Z")).toBe(true);
  });

  it("polygon za obzorem je schovaný", () => {
    const out = projectPolygon(square, { lon0: 180, lat0: 0 }, R);
    expect(out.visibility).toBe("hidden");
  });

  it("polygon na hraně obzoru je částečný a drží se uvnitř kotouče", () => {
    const out = projectPolygon(square, { lon0: 85, lat0: 0 }, R);
    expect(out.visibility).toBe("partial");
    const nums = out.path.match(/-?\d+(\.\d+)?/g)!.map(Number);
    for (let i = 0; i < nums.length; i += 2) {
      expect(Math.hypot(nums[i], nums[i + 1])).toBeLessThanOrEqual(R + 0.01);
    }
  });
});

describe("rotační pomocníci", () => {
  it("shortestRotation jde kratší cestou přes nulu", () => {
    expect(shortestRotation(350, 10)).toBe(370);
    expect(shortestRotation(10, 350)).toBe(-10);
    expect(shortestRotation(0, 90)).toBe(90);
    expect(shortestRotation(0, 180)).toBe(180);
  });

  it("angularDistance měří úhel mezi dvěma natočeními", () => {
    expect(angularDistance({ lon0: 0, lat0: 0 }, { lon0: 0, lat0: 0 })).toBeCloseTo(0, 6);
    expect(angularDistance({ lon0: 0, lat0: 0 }, { lon0: 90, lat0: 0 })).toBeCloseTo(90, 6);
    expect(angularDistance({ lon0: 0, lat0: 0 }, { lon0: 180, lat0: 0 })).toBeCloseTo(180, 6);
  });
});

