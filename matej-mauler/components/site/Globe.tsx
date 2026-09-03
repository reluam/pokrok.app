"use client";

import { project, projectPolygon, type Rotation } from "@/lib/site/globe";

/**
 * Planeta pod celou stránkou. Komponenta nezná obsah — dostane tvary, rozměry
 * a natočení, vrací kresbu a hlásí kliky nahoru.
 *
 * Koule je schválně větší než viewport: stojíme těsně nad povrchem, takže
 * obzor prořízne jen rohy. Uprostřed je zakřivení skoro nulové, a proto na
 * pevnině může ležet normální rovný text (sází ho GlobeShell nad tímhle SVG).
 * Že je to koule, se pozná z rohů a z toho, jak se při otáčení pevniny sunou
 * a smršťují k obzoru.
 *
 * Tvary se kreslí od nejvzdálenějšího k nejbližšímu (podle cosc svého sídla),
 * aby se ty vepředu překryly přes ty u obzoru.
 */

export type GlobeShape = {
  id: string;
  label: string;
  points: [number, number][];
  /** Kam se sází popisek — obvykle centroid. */
  seat: [number, number];
  /** Cíl odkazu. Kontinenty ho mají (jsou to routy), země ne. */
  href?: string;
};

/**
 * Poloměr koule z rozměrů okna. Musí být větší než půlka delší strany (jinak
 * by obzor uřízl i střed hran) a menší než půlka úhlopříčky (jinak by nebyl
 * vidět vůbec) — mezi tím prořízne přesně rohy.
 */
export function radiusForViewport(width: number, height: number): number {
  const halfDiagonal = Math.hypot(width, height) / 2;
  const halfLongSide = Math.max(width, height) / 2;
  return Math.max(halfLongSide * 1.04, halfDiagonal * 0.93);
}

export function Globe({
  rotation,
  shapes,
  activeId,
  onSelect,
  width,
  height,
  radius,
  ariaLabel,
  regions = [],
  activeRegionId = null,
  onSelectRegion,
}: {
  rotation: Rotation;
  shapes: GlobeShape[];
  activeId: string | null;
  onSelect: (id: string) => void;
  width: number;
  height: number;
  radius: number;
  ariaLabel: string;
  /** Země uvnitř aktivního kontinentu. Kreslí se až v přiblížení. */
  regions?: GlobeShape[];
  activeRegionId?: string | null;
  onSelectRegion?: (id: string) => void;
}) {
  const drawn = shapes
    .map((s) => {
      const poly = projectPolygon(s.points, rotation, radius);
      const seat = project({ lon: s.seat[0], lat: s.seat[1] }, rotation, radius);
      return { shape: s, poly, seat };
    })
    .filter((d) => d.poly.visibility !== "hidden")
    .sort((a, b) => a.seat.cosc - b.seat.cosc);

  return (
    <svg
      className="mm-globe"
      viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      role="group"
      aria-label={ariaLabel}
    >
      <defs>
        {/* Ztmavení jen u obzoru. Uprostřed nic — tam leží text a stín by ho kalil. */}
        <radialGradient id="mm-globe-shade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-text)" stopOpacity="0" />
          <stop offset="80%" stopColor="var(--color-text)" stopOpacity="0" />
          <stop offset="94%" stopColor="var(--color-text)" stopOpacity="0.04" />
          <stop offset="100%" stopColor="var(--color-text)" stopOpacity="0.11" />
        </radialGradient>
      </defs>

      <circle className="mm-globe-ocean" cx={0} cy={0} r={radius} />

      {drawn.map(({ shape, poly, seat }) => {
        const isActive = shape.id === activeId;
        // popisek jen u kontinentů stranou — nad aktivním leží nadpis textu,
        // dva nápisy přes sebe by se praly
        const showLabel = !isActive && seat.cosc > 0.3;
        return (
          // <a>, ne <g>: kontinent je fokusovatelný a bez JS vede na svou routu.
          // Klik odchytáváme, href zůstává kvůli „otevřít v novém tabu".
          <a
            key={shape.id}
            href={shape.href}
            className={`mm-continent${isActive ? " is-active" : ""}`}
            aria-label={shape.label}
            aria-current={isActive ? "page" : undefined}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              onSelect(shape.id);
            }}
          >
            <path className="mm-continent-land" d={poly.path} />
            {showLabel && (
              <text className="mm-continent-label" x={seat.x} y={seat.y} textAnchor="middle">
                {shape.label}
              </text>
            )}
          </a>
        );
      })}

      {regions.map((r) => {
        const poly = projectPolygon(r.points, rotation, radius);
        if (poly.visibility === "hidden") return null;
        const seat = project({ lon: r.seat[0], lat: r.seat[1] }, rotation, radius);
        return (
          // aria-hidden schválně: každá země má v panelu svoje <button> (viz
          // WorkPanel), takže druhá sada tabstopů v SVG by jen zdvojila cestu
          // klávesnicí.
          <g
            key={r.id}
            aria-hidden="true"
            className={`mm-country${r.id === activeRegionId ? " is-active" : ""}`}
            onClick={(e) => {
              e.stopPropagation(); // klik na zemi nesmí probublat na kontinent pod ní
              onSelectRegion?.(r.id);
            }}
          >
            <path className="mm-country-land" d={poly.path} />
            {seat.cosc > 0.4 && (
              <text className="mm-country-label" x={seat.x} y={seat.y} textAnchor="middle">
                {r.label}
              </text>
            )}
          </g>
        );
      })}

      {/* stínování až nakonec, aby leželo přes pevniny */}
      <circle className="mm-globe-shade" cx={0} cy={0} r={radius} fill="url(#mm-globe-shade)" />
      <circle className="mm-globe-rim" cx={0} cy={0} r={radius} />
    </svg>
  );
}
