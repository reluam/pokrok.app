"use client";

const sans = "ui-sans-serif, system-ui, sans-serif";

// A circular gene control: the ring shows how much you've invested (usefulness), the marker shows
// what THIS environment demands (pressure). +/− sit in the middle. The gap between fill and marker
// is the tension you're balancing.
export function GeneDial({ label, value, demand, color, canPush, onPush }: {
  label: string; value: number; demand: number; color: string; canPush: boolean; onPush: (dir: 1 | -1) => void;
}) {
  const S = 92, c = S / 2, R = 34, C = 2 * Math.PI * R;
  const ang = (-90 + demand * 360) * (Math.PI / 180);
  const mx = c + Math.cos(ang) * R, my = c + Math.sin(ang) * R;
  const short = value + 0.03 < demand; // notably under-supplied for this world

  return (
    <div style={{ fontFamily: sans, display: "grid", justifyItems: "center", gap: 2 }}>
      <div style={{ position: "relative", width: S, height: S }}>
        <svg width={S} height={S}>
          <circle cx={c} cy={c} r={R} fill="none" stroke="var(--card, #ececec)" strokeWidth={8} />
          <circle cx={c} cy={c} r={R} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - value)} transform={`rotate(-90 ${c} ${c})`} />
          <circle cx={mx} cy={my} r={4} fill={short ? "#dc2626" : "#111"} stroke="#fff" strokeWidth={1.5} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <button className="sbtn" disabled={!canPush} onClick={() => onPush(-1)} style={{ padding: "0 7px", lineHeight: "20px", fontWeight: 700 }}>−</button>
          <button className="sbtn" disabled={!canPush} onClick={() => onPush(1)} style={{ padding: "0 7px", lineHeight: "20px", fontWeight: 700 }}>+</button>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 10, color: short ? "#dc2626" : "var(--text-muted)" }}>{Math.round(value * 100)} · wants {Math.round(demand * 100)}</span>
    </div>
  );
}
