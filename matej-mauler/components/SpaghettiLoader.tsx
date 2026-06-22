// Fullscreen loading state shown during route navigation (loading.tsx).
// Pure CSS/SVG — a fork twirling a ball of spaghetti, with rising steam.
// Server component (no hooks) so it streams instantly from the prefetch cache.

export function SpaghettiLoader({ label = "twirling the noodles…" }: { label?: string }) {
  return (
    <div className="sl-wrap" role="status" aria-live="polite" aria-label="loading">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        {/* steam */}
        <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5">
          <path className="sl-steam" d="M50 26 q-4 -6 0 -12 q4 -6 0 -12" />
          <path className="sl-steam s2" d="M60 24 q-4 -6 0 -12 q4 -6 0 -12" />
          <path className="sl-steam s3" d="M70 26 q-4 -6 0 -12 q4 -6 0 -12" />
        </g>

        <g className="sl-bob">
          {/* fork (static) */}
          <g stroke="currentColor" strokeLinecap="round" fill="none">
            <line x1="49" y1="30" x2="49" y2="52" strokeWidth="2.4" />
            <line x1="56.5" y1="30" x2="56.5" y2="52" strokeWidth="2.4" />
            <line x1="63.5" y1="30" x2="63.5" y2="52" strokeWidth="2.4" />
            <line x1="71" y1="30" x2="71" y2="52" strokeWidth="2.4" />
            <line x1="60" y1="52" x2="60" y2="104" strokeWidth="3.4" />
          </g>

          {/* twirled noodle ball (rotates) */}
          <g className="sl-twirl" stroke="currentColor" strokeLinecap="round" fill="none">
            <circle cx="60" cy="50" r="9"  strokeWidth="4.5" strokeDasharray="34 14" />
            <circle cx="60" cy="50" r="16" strokeWidth="4.5" strokeDasharray="55 22" opacity="0.85" />
            <circle cx="60" cy="50" r="23" strokeWidth="4.5" strokeDasharray="78 30" opacity="0.6" />
            {/* loose dangling ends */}
            <path d="M60 73 q8 8 2 16 q-6 8 4 14" strokeWidth="4" opacity="0.7" />
            <path d="M44 64 q-9 5 -8 14 q1 9 -7 12" strokeWidth="4" opacity="0.55" />
          </g>
        </g>
      </svg>
      <span className="sl-label">{label}</span>
    </div>
  );
}
