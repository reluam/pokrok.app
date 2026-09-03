import { describe, expect, it } from "vitest";
import { radiusForViewport } from "@/components/site/Globe";

/**
 * Koule je větší než okno: obzor smí prořezat jen rohy. Kdyby byl poloměr
 * menší než půlka delší strany, uřízl by i střed hran; kdyby byl větší než
 * půlka úhlopříčky, nebyl by vidět vůbec.
 */
describe("poloměr planety podle okna", () => {
  const viewports: [number, number][] = [
    [1440, 900], [1280, 800], [390, 844], [768, 1024], [2560, 1440], [900, 900],
  ];

  it("obzor prořízne rohy, ale ne střed hran", () => {
    for (const [w, h] of viewports) {
      const r = radiusForViewport(w, h);
      const halfDiagonal = Math.hypot(w, h) / 2;
      const halfLongSide = Math.max(w, h) / 2;
      expect(r, `${w}×${h}: koule nesmí uříznout střed hrany`).toBeGreaterThan(halfLongSide);
      expect(r, `${w}×${h}: v rozích musí být obzor vidět`).toBeLessThan(halfDiagonal);
    }
  });
});
