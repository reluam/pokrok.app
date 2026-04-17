import type { ReactNode } from "react";

// Slightly irregular circle paths — 3 variants for subtle variety
const CIRCLE_PATHS = [
  "M 30 2 C 50 0 60 14 58 30 C 60 48 48 58 30 58 C 12 58 2 50 4 30 C 0 12 12 2 30 2 Z",
  "M 28 2 C 48 4 60 16 58 32 C 60 50 46 60 28 58 C 10 58 4 48 2 30 C 4 10 14 2 28 2 Z",
  "M 30 2 C 52 4 58 20 60 32 C 58 52 44 58 28 58 C 10 60 2 46 4 28 C 6 10 16 2 30 2 Z",
];

// Wobbly rounded-square paths — 3 variants
const SQUARE_PATHS = [
  "M 14 6 Q 30 4 50 8 Q 56 30 52 52 Q 30 58 10 54 Q 4 28 14 6 Z",
  "M 10 8 Q 30 6 52 6 Q 56 30 54 54 Q 30 58 8 54 Q 6 30 10 8 Z",
  "M 12 6 Q 32 8 52 6 Q 56 28 54 54 Q 30 58 10 56 Q 6 30 12 6 Z",
];

export default function HandDrawnIcon({
  children,
  bg = "#ffe4cc",
  size = 56,
  variant = 0,
  className = "",
  shape = "circle",
}: {
  children: ReactNode;
  bg?: string;
  size?: number;
  variant?: number;
  className?: string;
  shape?: "circle" | "square";
}) {
  const path = (shape === "square" ? SQUARE_PATHS : CIRCLE_PATHS)[variant % 3];
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Shadow */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 translate-x-0.5 translate-y-0.5 pointer-events-none"
        viewBox="0 0 60 60"
      >
        <path d={path} fill="rgba(23,23,23,0.9)" />
      </svg>
      {/* Fill */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        viewBox="0 0 60 60"
      >
        <path d={path} fill={bg} />
      </svg>
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center leading-none">
        {children}
      </div>
      {/* Border */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        viewBox="0 0 60 60"
      >
        <path
          d={path}
          fill="none"
          stroke="#171717"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
