import type { ReactNode } from "react";

// Ručně kreslené obdélníky s lehkým chvěním (z ziju.life). ViewBox 300x200,
// roztažený přes preserveAspectRatio="none". Funguje nejlíp na ~čtvercové / portrait karty.
const BORDER_PATHS = [
  "M 14 10 Q 150 8 288 12 Q 294 100 290 190 Q 150 194 12 190 Q 8 100 14 10 Z",
  "M 10 12 Q 160 10 294 10 Q 292 102 296 188 Q 150 192 14 192 Q 10 102 10 12 Z",
  "M 12 9 Q 170 12 290 10 Q 294 106 292 190 Q 148 192 10 191 Q 12 104 12 9 Z",
];

export function HandDrawnCard({
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
      <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" preserveAspectRatio="none">
        <path d={path} fill={fill} />
      </svg>
      <div className={`relative ${innerClassName}`}>{children}</div>
      <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" preserveAspectRatio="none">
        <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Kreslený rámeček pro široké/nízké prvky (tlačítka, hledání, chipy).
// Path je laděný na poměr 300×64; stroke nescaluje (non-scaling-stroke), takže
// nedeformuje tloušťku napříč velikostmi.
const FRAME_PATH = "M 14 11 Q 150 6 286 11 Q 294 32 289 53 Q 150 59 13 54 Q 6 32 14 11 Z";

export function HandDrawnFrame({
  children,
  className = "",
  innerClassName = "",
  fill = "#fff",
  stroke = "#171717",
  strokeWidth = 2.2,
  shadow = true,
  shadowOffset = 3,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  shadow?: boolean;
  shadowOffset?: number;
}) {
  return (
    <span className={`hd-frame ${className}`}>
      {shadow && (
        <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 64" preserveAspectRatio="none" style={{ transform: `translate(${shadowOffset}px, ${shadowOffset}px)` }}>
          <path d={FRAME_PATH} fill="rgba(23,23,23,0.92)" />
        </svg>
      )}
      <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 64" preserveAspectRatio="none">
        <path d={FRAME_PATH} fill={fill} />
      </svg>
      <span className={`relative block ${innerClassName}`}>{children}</span>
      <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 64" preserveAspectRatio="none">
        <path d={FRAME_PATH} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}
