/**
 * Ortografická projekce koule — matematika glóbusu na osobním webu.
 * Čisté funkce bez Reactu, takže se dají testovat samy o sobě.
 *
 * Rotace = bod, který je právě uprostřed přivrácený k divákovi. Body za obzorem
 * (cosc <= 0) se v ortografické projekci promítají do stejného kotouče jako
 * přední polokoule, proto se u polygonů tlačí na okraj — jinak by tvar
 * při zajíždění za obzor přeskočil na druhou stranu.
 */

export type GeoPoint = { lon: number; lat: number };
export type Rotation = { lon0: number; lat0: number };
export type Projected = { x: number; y: number; cosc: number };

const RAD = Math.PI / 180;
const round = (n: number) => Math.round(n * 100) / 100;

export function project(p: GeoPoint, r: Rotation, radius: number): Projected {
  const lat = p.lat * RAD;
  const lat0 = r.lat0 * RAD;
  const d = (p.lon - r.lon0) * RAD;

  const cosc = Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * Math.cos(lat) * Math.cos(d);
  const x = radius * Math.cos(lat) * Math.sin(d);
  const y = radius * (Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * Math.cos(lat) * Math.cos(d));

  // SVG má y dolů, zeměpisná šířka nahoru → znaménko se otáčí
  return { x, y: -y, cosc };
}

export function isVisible(p: GeoPoint, r: Rotation): boolean {
  return project(p, r, 1).cosc > 0;
}

export function projectPolygon(
  points: [number, number][],
  r: Rotation,
  radius: number,
): { path: string; visibility: "full" | "partial" | "hidden" } {
  let seen = 0;
  const xy = points.map(([lon, lat]) => {
    const p = project({ lon, lat }, r, radius);
    if (p.cosc > 0) {
      seen += 1;
      return [p.x, p.y] as const;
    }
    // za obzorem: přitiskni bod na okraj kotouče, ať obrys neuteče přes kouli
    const len = Math.hypot(p.x, p.y) || 1;
    return [(p.x / len) * radius, (p.y / len) * radius] as const;
  });

  const visibility = seen === 0 ? "hidden" : seen === points.length ? "full" : "partial";
  const path =
    xy.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${round(x)} ${round(y)}`).join(" ") + " Z";

  return { path, visibility };
}

/**
 * Otevřená čára (poledník, rovnoběžka) — na rozdíl od polygonu se neuzavírá a
 * úseky za obzorem se vynechají, ne přitisknou na okraj. Vrací jednu SVG cestu
 * s tolika podcestami, na kolik viditelných kusů se čára rozpadne.
 */
export function projectArc(
  points: [number, number][],
  r: Rotation,
  radius: number,
): string {
  const parts: string[] = [];
  let open = false;
  for (const [lon, lat] of points) {
    const p = project({ lon, lat }, r, radius);
    if (p.cosc <= 0) {
      open = false;
      continue;
    }
    parts.push(`${open ? "L" : "M"} ${round(p.x)} ${round(p.y)}`);
    open = true;
  }
  return parts.join(" ");
}

/** Cíl posunutý o násobek 360°, aby se koule točila kratší cestou. */
export function shortestRotation(fromLon: number, toLon: number): number {
  let delta = (toLon - fromLon) % 360;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return fromLon + delta;
}

/** Úhel mezi dvěma natočeními ve stupních — řídí délku animace. */
export function angularDistance(a: Rotation, b: Rotation): number {
  const cosc =
    Math.sin(a.lat0 * RAD) * Math.sin(b.lat0 * RAD) +
    Math.cos(a.lat0 * RAD) * Math.cos(b.lat0 * RAD) * Math.cos((b.lon0 - a.lon0) * RAD);
  return Math.acos(Math.min(1, Math.max(-1, cosc))) / RAD;
}
