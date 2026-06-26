"use client";
import { FONT_DISPLAY, FONT_SANS, C } from "./theme";

// A minimal circular gauge: full thin track, a smooth value arc, a tick for what the environment
// wants, the value as a number in the middle, and slim −/+ below. The arc animates on change.
export function GeneDial({ label, value, demand, color, canPush, onPush }: {
  label: string; value: number; demand: number; color: string; canPush: boolean; onPush: (dir: 1 | -1) => void;
}) {
  const S = 60, c = S / 2, R = 25, CIRC = 2 * Math.PI * R;
  const a = (-90 + demand * 360) * (Math.PI / 180);
  const t1 = { x: c + Math.cos(a) * (R - 5), y: c + Math.sin(a) * (R - 5) };
  const t2 = { x: c + Math.cos(a) * (R + 5), y: c + Math.sin(a) * (R + 5) };
  const short = value + 0.04 < demand;

  return (
    <div className="db-gauge" style={{ fontFamily: FONT_SANS, display: "grid", justifyItems: "center", gap: 4 }}
      title={`${label}: ${Math.round(value * 100)} · this world wants ${Math.round(demand * 100)}`}>
      <div style={{ position: "relative", width: S, height: S }}>
        <svg width={S} height={S}>
          <circle cx={c} cy={c} r={R} fill="none" stroke="rgba(26,22,20,0.07)" strokeWidth={5} />
          <circle className="db-ring" cx={c} cy={c} r={R} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - value)} transform={`rotate(-90 ${c} ${c})`} />
          <line className={short ? "db-pulse" : undefined} x1={t1.x} y1={t1.y} x2={t2.x} y2={t2.y}
            stroke={short ? "#e0567a" : "rgba(26,22,20,0.45)"} strokeWidth={2.5} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, color: short ? "#e0567a" : C.text, letterSpacing: "-0.02em" }}>
            {Math.round(value * 100)}
          </span>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.text2 }}>{label}</span>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="db-gbtn" disabled={!canPush} onClick={() => onPush(-1)} aria-label={`lower ${label}`}>−</button>
        <button className="db-gbtn" disabled={!canPush} onClick={() => onPush(1)} aria-label={`raise ${label}`}>+</button>
      </div>
    </div>
  );
}
