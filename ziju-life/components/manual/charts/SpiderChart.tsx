"use client";

import { useState } from "react";
import { WHEEL_AREAS } from "../shared";

// ── SpiderChart (read-only display) ──────────────────────────────────────────

export function SpiderChart({ vals, goalVals, size = 220 }: { vals: Record<string, number>; goalVals?: Record<string, number>; size?: number }) {
  const C = size / 2;
  const R = C - 44;
  const N = WHEEL_AREAS.length;
  const pt = (i: number, v: number): [number, number] => {
    const a = (2 * Math.PI * i) / N - Math.PI / 2;
    const r = (v / 10) * R;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[2, 4, 6, 8, 10].map((v) => (
        <polygon key={v} points={WHEEL_AREAS.map((_, i) => pt(i, v).join(",")).join(" ")}
          fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="0.5" />
      ))}
      {WHEEL_AREAS.map((_, i) => {
        const [x, y] = pt(i, 10);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />;
      })}
      {goalVals && (
        <polygon points={WHEEL_AREAS.map((a, i) => pt(i, goalVals[a.key] ?? 5).join(",")).join(" ")}
          fill="rgba(78,205,196,0.07)" stroke="#4ECDC4" strokeWidth="1" strokeDasharray="3 2" />
      )}
      <polygon points={WHEEL_AREAS.map((a, i) => pt(i, vals[a.key] ?? 5).join(",")).join(" ")}
        fill="rgba(255,140,66,0.12)" stroke="#FF8C42" strokeWidth="1.5" />
      {WHEEL_AREAS.map((a, i) => {
        const ang = (2 * Math.PI * i) / N - Math.PI / 2;
        const lx = C + (R + 28) * Math.cos(ang);
        const ly = C + (R + 28) * Math.sin(ang);
        return (
          <text key={a.key} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="9.5" fill="#888" fontFamily="system-ui">{a.short}</text>
        );
      })}
      {WHEEL_AREAS.map((a, i) => {
        const [x, y] = pt(i, vals[a.key] ?? 5);
        return <circle key={a.key} cx={x} cy={y} r="3" fill="#FF8C42" />;
      })}
    </svg>
  );
}

// ── InteractiveSpider (clickable) ────────────────────────────────────────────

export function InteractiveSpider({
  vals,
  prevVals,
  onChange,
  size = 260,
}: {
  vals: Record<string, number>;
  prevVals?: Record<string, number>;
  onChange?: (key: string, score: number) => void;
  size?: number;
}) {
  const C = size / 2;
  const R = C - 48;
  const N = WHEEL_AREAS.length;

  const pt = (i: number, v: number): [number, number] => {
    const a = (2 * Math.PI * i) / N - Math.PI / 2;
    const r = (v / 10) * R;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - C;
    const y = e.clientY - rect.top - C;

    let clickAngle = Math.atan2(y, x);
    let closest = 0;
    let minDiff = Infinity;
    WHEEL_AREAS.forEach((_, i) => {
      const axisAngle = (2 * Math.PI * i) / N - Math.PI / 2;
      let diff = Math.abs(clickAngle - axisAngle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff < minDiff) { minDiff = diff; closest = i; }
    });

    const dist = Math.sqrt(x * x + y * y);
    const score = Math.min(10, Math.max(1, Math.round((dist / R) * 10)));
    onChange(WHEEL_AREAS[closest].key, score);
  }

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      onClick={handleClick}
      className={onChange ? "cursor-pointer" : undefined}
    >
      {[2, 4, 6, 8, 10].map((v) => (
        <polygon key={v}
          points={WHEEL_AREAS.map((_, i) => pt(i, v).join(",")).join(" ")}
          fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="0.5" />
      ))}
      {WHEEL_AREAS.map((_, i) => {
        const [x, y] = pt(i, 10);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />;
      })}
      {prevVals && (
        <polygon
          points={WHEEL_AREAS.map((a, i) => pt(i, prevVals[a.key] ?? 5).join(",")).join(" ")}
          fill="rgba(0,0,0,0.04)" stroke="rgba(0,0,0,0.18)" strokeWidth="1" strokeDasharray="3 2" />
      )}
      <polygon
        points={WHEEL_AREAS.map((a, i) => pt(i, vals[a.key] ?? 5).join(",")).join(" ")}
        fill="rgba(255,140,66,0.13)" stroke="#FF8C42" strokeWidth="1.5" />
      {WHEEL_AREAS.map((a, i) => {
        const [x, y] = pt(i, vals[a.key] ?? 5);
        const ang = (2 * Math.PI * i) / N - Math.PI / 2;
        const lx = C + (R + 30) * Math.cos(ang);
        const ly = C + (R + 30) * Math.sin(ang);
        const score = vals[a.key] ?? 5;
        return (
          <g key={a.key}>
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fill="#888" fontFamily="system-ui">{a.short}</text>
            <circle cx={x} cy={y} r="4" fill="#FF8C42" />
            <text x={x} y={y - 8} textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fontWeight="700" fill="#FF8C42" fontFamily="system-ui">{score}</text>
          </g>
        );
      })}
    </svg>
  );
}
