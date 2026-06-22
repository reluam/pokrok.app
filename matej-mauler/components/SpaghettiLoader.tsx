// Fullscreen loading state shown during route navigation (loading.tsx).
// Pure CSS/SVG, in the same visual language as the homepage noodle game:
// a thick ink strand with a thin paper highlight and an eyed head. The
// spaghetti starts as a point (the tail), grows along a wavy path to a
// second point (the goal) and eats it, then fades and loops.
// Server component (no hooks) so it streams instantly from the prefetch cache.

// The strand path. The CSS .sl-head offset-path MUST match this string exactly.
const PATH = "M30 40 C 50 12 70 12 90 40 C 110 68 130 68 150 40 C 170 12 190 12 210 40";

export function SpaghettiLoader({ label = "twirling the noodles…" }: { label?: string }) {
  return (
    <div className="sl-wrap" role="status" aria-live="polite" aria-label="loading">
      <div className="sl-stage">
        <svg width="220" height="74" viewBox="0 0 240 80" fill="none" aria-hidden="true">
          {/* tail — the point it grows from */}
          <circle className="sl-start" cx="30" cy="40" r="5" fill="currentColor" />
          {/* goal — the point it grows toward and eats */}
          <circle className="sl-goal" cx="210" cy="40" r="7.5" fill="currentColor" />

          {/* the spaghetti: thick ink body + thin paper highlight (the game's noodle look) */}
          <path className="sl-strand" d={PATH} pathLength={100} stroke="currentColor" strokeWidth="13" strokeLinecap="round" />
          <path className="sl-strand" d={PATH} pathLength={100} stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" />

          {/* eyed head, riding the tip of the strand */}
          <g className="sl-head">
            <circle cx="1.5" cy="-3.2" r="2.1" fill="var(--bg)" />
            <circle cx="2.6" cy="-3.2" r="1" fill="currentColor" />
            <circle cx="1.5" cy="3.2" r="2.1" fill="var(--bg)" />
            <circle cx="2.6" cy="3.2" r="1" fill="currentColor" />
          </g>
        </svg>
      </div>
      <span className="sl-label">{label}</span>
    </div>
  );
}
