"use client";

import { useMemo } from "react";

const rnd = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Barvy rajčatové omáčky (světlé/tmavé téma). */
export const sauceFill = (dark: boolean): [string, string] => dark ? ["#92271a", "#691b0f"] : ["#d8402c", "#ad2614"];

export const seedOf = (slug: string) => slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 997;

/** Organický blob (catmull-rom přes roztřesenou elipsu) — SVG path v souřadnicích kolem (100,100). */
export function blobPath(seed: number, rx: number, ry: number, jit = 0.14): string {
  const N = 12;
  const pts = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const j = 1 - jit + rnd(seed * 13 + i * 17) * jit * 2;
    return [100 + Math.cos(a) * rx * j, 100 + Math.sin(a) * ry * j] as const;
  });
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + " Z";
}

/** Kápnutá rajčatová omáčka uprostřed stránky — stage hesla. Obsah (děti) leží na ní. */
export function SauceStage({ size, seed, dark, children }: { size: number; seed: number; dark: boolean; children?: React.ReactNode }) {
  const path = useMemo(() => blobPath(seed, 88, 88), [seed]);
  const drops = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const a = rnd(seed * 7 + i * 13) * Math.PI * 2;
    const dist = 102 + rnd(seed * 3 + i * 29) * 26;
    return { x: 100 + Math.cos(a) * dist, y: 100 + Math.sin(a) * dist, r: 2.5 + rnd(seed + i * 41) * 6 };
  }), [seed]);
  const [c1, c2] = sauceFill(dark);
  return (
    <div style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%)", width: size, height: size, animation: "encySauceIn 480ms cubic-bezier(0.22,1,0.36,1)" }}>
      <svg viewBox="-35 -35 270 270" style={{ position: "absolute", inset: "-17.5%", width: "135%", height: "135%", overflow: "visible", filter: dark ? "drop-shadow(0 22px 46px rgba(0,0,0,0.5))" : "drop-shadow(0 22px 46px rgba(150,35,12,0.32))" }}>
        <defs>
          <radialGradient id={`sauce-${seed}`} cx="40%" cy="34%" r="78%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </radialGradient>
        </defs>
        <path d={path} fill={`url(#sauce-${seed})`} />
        {drops.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={c2} opacity={0.92} />)}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>{children}</div>
      <style>{`@keyframes encySauceIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.82); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }`}</style>
    </div>
  );
}

/** Omáčka pro canvas realmy (zvuk, hudba) — kreslí se pod hřiště. */
export function drawSauceCanvas(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, seed: number, dark: boolean) {
  const N = 14;
  const [c1, c2] = sauceFill(dark);
  const g = ctx.createRadialGradient(cx - rx * 0.18, cy - ry * 0.22, 0, cx, cy, Math.max(rx, ry) * 1.05);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.beginPath();
  const pt = (i: number): [number, number] => {
    const a = (i / N) * Math.PI * 2;
    const j = 0.88 + rnd(seed * 13 + (((i % N) + N) % N) * 17) * 0.24;
    return [cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j];
  };
  const first = pt(0);
  ctx.moveTo(first[0], first[1]);
  for (let i = 0; i < N; i++) {
    const p0 = pt(i - 1), p1 = pt(i), p2 = pt(i + 1), p3 = pt(i + 2);
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  ctx.closePath(); ctx.fill();
  // kapky kolem
  ctx.fillStyle = c2;
  for (let i = 0; i < 4; i++) {
    const a = rnd(seed * 7 + i * 13) * Math.PI * 2;
    const dx = Math.cos(a) * (rx * 1.16 + rnd(seed * 3 + i * 29) * 30);
    const dy = Math.sin(a) * (ry * 1.16 + rnd(seed * 5 + i * 31) * 26);
    ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 2.5 + rnd(seed + i * 41) * 6, 0, 7); ctx.fill();
  }
}
