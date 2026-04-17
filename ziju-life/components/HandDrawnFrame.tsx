import type { ReactNode } from "react";

// Wobbly rectangular frame paths (3 variants) — viewBox 200x200
const FRAME_PATHS = [
  "M 14 10 Q 100 6 188 14 Q 194 100 190 190 Q 100 194 12 190 Q 8 100 14 10 Z",
  "M 10 12 Q 100 8 192 10 Q 190 100 194 188 Q 100 194 14 192 Q 10 100 10 12 Z",
  "M 12 8 Q 100 14 190 10 Q 194 104 192 190 Q 96 194 10 192 Q 8 96 12 8 Z",
];

export default function HandDrawnFrame({
  children,
  variant = 0,
  className = "",
  innerRadius = "rounded-xl",
}: {
  children: ReactNode;
  variant?: number;
  className?: string;
  innerRadius?: string;
}) {
  const path = FRAME_PATHS[variant % 3];
  return (
    <div className={`relative ${className}`}>
      {/* Shadow — offset behind */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none translate-x-1 translate-y-1"
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
      >
        <path d={path} fill="rgba(23,23,23,0.9)" />
      </svg>

      {/* Inner content — image with padding so it sits inside the frame */}
      <div className="relative w-full h-full p-2">
        <div className={`w-full h-full overflow-hidden ${innerRadius}`}>
          {children}
        </div>
      </div>

      {/* Border — on top */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
      >
        <path
          d={path}
          fill="none"
          stroke="#171717"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
