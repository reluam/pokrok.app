import { angularDistance, type Rotation } from "./globe";

/**
 * Čtyři kontinenty = čtyři sekce webu. Centroidy jsou rozsazené po ~90°, aby při
 * otáčení bylo znát, že se projelo přes oceán. Obrysy jsou psané rukou (ne
 * generované), aby měla každá pevnina svou siluetu — jsou to data, ne magie
 * v komponentě. Souřadnice jsou [lon, lat] ve stupních.
 */

export type ContinentId = "home" | "work" | "ideas" | "contact";

export type Continent = {
  id: ContinentId;
  centroid: [number, number];
  points: [number, number][];
};

export const CONTINENTS: Continent[] = [
  {
    id: "home",
    centroid: [0, 15],
    points: [
      [-34, 10], [-28, 26], [-14, 34], [2, 36], [16, 30], [26, 20],
      [30, 6], [22, -6], [8, -12], [-8, -10], [-20, -2], [-30, 2],
    ],
  },
  {
    // největší pevnina — musí unést šest zemí (viz lib/site/countries.ts)
    id: "work",
    centroid: [90, -10],
    points: [
      [52, -4], [58, 12], [70, 20], [84, 24], [98, 22], [112, 14], [124, 2],
      [126, -14], [118, -28], [102, -36], [86, -38], [70, -32], [58, -20],
    ],
  },
  {
    id: "ideas",
    centroid: [180, 20],
    points: [
      [150, 14], [154, 30], [166, 40], [180, 42], [194, 36], [206, 26],
      [210, 12], [202, 0], [188, -4], [172, -2], [158, 4],
    ],
  },
  {
    id: "contact",
    centroid: [270, -15],
    points: [
      [248, -6], [254, 4], [266, 8], [278, 4], [286, -8],
      [284, -22], [272, -28], [258, -24], [250, -16],
    ],
  },
];

/**
 * Obrysy nahoře jsou psané v „malém" měřítku, ať se dobře čtou jako data.
 * Tady se roztáhnou kolem centroidu na velikost, kterou má pevnina na stránce:
 * aktivní kontinent musí unést celý sloupec textu, který na něm leží.
 * Víc než 1.2 nejde — sousedi jsou po 90° a začali by se dotýkat.
 */
const SPREAD = 1.2;

export function continentShape(c: Continent): [number, number][] {
  const [clon, clat] = c.centroid;
  return c.points.map(([lon, lat]) => [
    clon + (lon - clon) * SPREAD,
    clat + (lat - clat) * SPREAD,
  ]);
}

export function rotationFor(id: ContinentId): Rotation {
  const c = CONTINENTS.find((x) => x.id === id) ?? CONTINENTS[0];
  return { lon0: c.centroid[0], lat0: c.centroid[1] };
}

/** Po puštění tažení koule dosedne sem — nikdy nezůstane stát na oceánu. */
export function nearestContinent(r: Rotation): Continent {
  let best = CONTINENTS[0];
  let bestDist = Infinity;
  for (const c of CONTINENTS) {
    const d = angularDistance(r, rotationFor(c.id));
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}
