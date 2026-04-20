import type { ReactNode } from "react";

// Three variants of hand-drawn rectangle paths with slight wobbles
// ViewBox 300x200, stretched to card via preserveAspectRatio="none"
const BORDER_PATHS = [
  "M 14 10 Q 150 8 288 12 Q 294 100 290 190 Q 150 194 12 190 Q 8 100 14 10 Z",
  "M 10 12 Q 160 10 294 10 Q 292 102 296 188 Q 150 192 14 192 Q 10 102 10 12 Z",
  "M 12 9 Q 170 12 290 10 Q 294 106 292 190 Q 148 192 10 191 Q 12 104 12 9 Z",
];

export default function HandDrawnCard({
  children,
  variant = 0,
  className = "",
  innerClassName = "",
  shadow = true,
  shadowOffset = 4,
  fill = "#FDFBF7",
  stroke = "#171717",
  strokeWidth = 2,
}: {
  children: ReactNode;
  variant?: number;
  className?: string;
  innerClassName?: string;
  shadow?: boolean;
  /** Shadow offset in pixels (x & y). Default 4. Bigger cards need bigger offset. */
  shadowOffset?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  const path = BORDER_PATHS[variant % 3];
  return (
    <div className={`group relative ${className}`}>
      {shadow && (
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ transform: `translate(${shadowOffset}px, ${shadowOffset}px)` }}
          viewBox="0 0 300 200"
          preserveAspectRatio="none"
        >
          <path d={path} fill="rgba(23,23,23,0.9)" />
        </svg>
      )}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 300 200"
        preserveAspectRatio="none"
      >
        <path d={path} fill={fill} />
      </svg>
      <div className={`relative ${innerClassName}`}>{children}</div>
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 300 200"
        preserveAspectRatio="none"
      >
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
