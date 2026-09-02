"use client";

import { project, projectPolygon, type Rotation } from "@/lib/site/globe";

/**
 * Koule v SVG. Komponenta nezná obsah — dostane tvary a natočení, vrací kresbu
 * a hlásí kliky nahoru. Poloměr je v SVG jednotkách konstantní; skutečnou
 * velikost na stránce řídí CSS, takže mobil a desktop sdílí jednu geometrii.
 *
 * Tvary se kreslí od nejvzdálenějšího k nejbližšímu (podle cosc svého sídla),
 * aby se ty vepředu překryly přes ty u obzoru.
 */

export const GLOBE_RADIUS = 100;

export type GlobeShape = {
  id: string;
  label: string;
  points: [number, number][];
  /** Kam se sází popisek — obvykle centroid. */
  seat: [number, number];
  /** Cíl odkazu. Kontinenty ho mají (jsou to routy), země ne. */
  href?: string;
};

const PAD = 4;
const VIEW = GLOBE_RADIUS + PAD;

export function Globe({
  rotation,
  shapes,
  activeId,
  onSelect,
  zoom = 1,
  className,
  ariaLabel,
}: {
  rotation: Rotation;
  shapes: GlobeShape[];
  activeId: string | null;
  onSelect: (id: string) => void;
  /** 1 = celá koule, >1 = přiblížení na aktivní kontinent. */
  zoom?: number;
  className?: string;
  ariaLabel: string;
}) {
  const drawn = shapes
    .map((s) => {
      const poly = projectPolygon(s.points, rotation, GLOBE_RADIUS);
      const seat = project({ lon: s.seat[0], lat: s.seat[1] }, rotation, GLOBE_RADIUS);
      return { shape: s, poly, seat };
    })
    .filter((d) => d.poly.visibility !== "hidden")
    .sort((a, b) => a.seat.cosc - b.seat.cosc);

  return (
    <svg
      className={`mm-globe${className ? ` ${className}` : ""}`}
      viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
      role="group"
      aria-label={ariaLabel}
    >
      <g style={{ transform: `scale(${zoom})` }} className="mm-globe-world">
        <circle className="mm-globe-ocean" cx={0} cy={0} r={GLOBE_RADIUS} />

        {drawn.map(({ shape, poly, seat }) => {
          const isActive = shape.id === activeId;
          // popisek se vypisuje, jen když sídlo míří dost k divákovi — u obzoru
          // by se stlačil do čárky a překryl se sousedem
          const showLabel = seat.cosc > 0.42;
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

        <circle className="mm-globe-rim" cx={0} cy={0} r={GLOBE_RADIUS} />
      </g>
    </svg>
  );
}
