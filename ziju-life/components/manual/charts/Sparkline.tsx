"use client";

import { WHEEL_AREAS, type CheckinEntry } from "../shared";

// ── Sparkline ────────────────────────────────────────────────────────────────

export function Sparkline({ checkins }: { checkins: CheckinEntry[] }) {
  if (checkins.length < 2) return null;
  const W = 240;
  const H = 56;
  const PAD = 6;
  const w = W - PAD * 2;
  const h = H - PAD * 2;
  const scores = checkins.map((c) => c.score).filter((s): s is number => s !== null);
  if (scores.length < 2) return null;
  const xStep = w / Math.max(scores.length - 1, 1);
  const yScale = (s: number) => PAD + h - ((s - 1) / 9) * h;
  const pts = scores.map((s, i) => `${PAD + i * xStep},${yScale(s)}`).join(" ");
  const last = scores[scores.length - 1];
  const lx = PAD + (scores.length - 1) * xStep;
  const ly = yScale(last);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {[1, 5, 10].map((v) => (
        <line key={v} x1={PAD} y1={yScale(v)} x2={W - PAD} y2={yScale(v)}
          stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      ))}
      <polyline points={pts} fill="none" stroke="#FF8C42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {scores.map((s, i) => (
        <circle key={i} cx={PAD + i * xStep} cy={yScale(s)} r="2.5"
          fill={i === scores.length - 1 ? "#FF8C42" : "white"}
          stroke="#FF8C42" strokeWidth="1.5" />
      ))}
      <text x={lx + 6} y={ly + 1} fontSize="10" fill="#FF8C42" fontWeight="700" dominantBaseline="middle">
        {last}
      </text>
    </svg>
  );
}

// ── AreaSparklines ───────────────────────────────────────────────────────────

export function AreaSparklines({ checkins }: { checkins: CheckinEntry[] }) {
  const withAreas = checkins.filter((c) => c.area_scores && Object.keys(c.area_scores).length > 0);
  if (withAreas.length < 2) return null;

  return (
    <div>
      <p className="text-sm text-foreground/40 mb-3">Vývoj oblastí (posledních {withAreas.length} týdnů)</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {WHEEL_AREAS.map((area) => {
          const scores = withAreas.map((c) => c.area_scores?.[area.key] ?? 5);
          const W = 80; const H = 28; const PAD = 2;
          const w = W - PAD * 2; const h = H - PAD * 2;
          const xStep = w / Math.max(scores.length - 1, 1);
          const yScale = (s: number) => PAD + h - ((s - 1) / 9) * h;
          const pts = scores.map((s, i) => `${PAD + i * xStep},${yScale(s)}`).join(" ");
          const last = scores[scores.length - 1];
          const prev = scores[scores.length - 2];
          const delta = last - prev;

          return (
            <div key={area.key} className="flex items-center gap-2">
              <div className="w-14 text-xs text-foreground/50 font-medium truncate">{area.short}</div>
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
                <polyline points={pts} fill="none" stroke="#FF8C42" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                <circle cx={PAD + (scores.length - 1) * xStep} cy={yScale(last)} r="2.5" fill="#FF8C42" />
              </svg>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-bold text-foreground/70">{last}</span>
                {delta !== 0 && (
                  <span className={`text-xs font-semibold ${delta > 0 ? "text-green-500" : "text-red-400"}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
