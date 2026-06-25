"use client";
import { FONT_SANS, C } from "./theme";

// A circular gene control: the ring shows how much you've invested (usefulness), the marker shows
// what THIS environment demands (pressure). +/− sit in the middle. The gap is the tension.
export function GeneDial({ label, value, demand, color, canPush, onPush }: {
  label: string; value: number; demand: number; color: string; canPush: boolean; onPush: (dir: 1 | -1) => void;
}) {
  const S = 86, c = S / 2, R = 32, C2 = 2 * Math.PI * R;
  const ang = (-90 + demand * 360) * (Math.PI / 180);
  const mx = c + Math.cos(ang) * R, my = c + Math.sin(ang) * R;
  const short = value + 0.04 < demand;

  return (
    <div style={{ fontFamily: FONT_SANS, display: "grid", justifyItems: "center", gap: 3 }}>
      <div style={{ position: "relative", width: S, height: S }}>
        <svg width={S} height={S}>
          <circle cx={c} cy={c} r={R} fill="none" stroke="rgba(26,22,20,0.08)" strokeWidth={8} />
          <circle className="db-ring" cx={c} cy={c} r={R} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
            strokeDasharray={C2} strokeDashoffset={C2 * (1 - value)} transform={`rotate(-90 ${c} ${c})`} />
          {short && <circle cx={mx} cy={my} r={6.5} fill="none" stroke="#e0567a" strokeWidth={1.5} opacity={0.5} />}
          <circle cx={mx} cy={my} r={4} fill={short ? "#e0567a" : "#1a1614"} stroke="#fff" strokeWidth={1.5} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <button className="sbtn db-dialbtn" disabled={!canPush} onClick={() => onPush(-1)} style={{ padding: "0 7px", lineHeight: "20px", fontWeight: 700 }}>−</button>
          <button className="sbtn db-dialbtn" disabled={!canPush} onClick={() => onPush(1)} style={{ padding: "0 7px", lineHeight: "20px", fontWeight: 700 }}>+</button>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{label}</span>
      <span style={{ fontSize: 10, color: short ? "#e0567a" : C.muted }}>{Math.round(value * 100)} · wants {Math.round(demand * 100)}</span>
    </div>
  );
}
