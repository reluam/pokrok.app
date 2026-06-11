"use client";

import { useEffect, useRef, useState } from "react";
import { getNode, titleOf } from "@/lib/encyclopedia/graph";
import type { NodeDef } from "@/lib/encyclopedia/types";
import type { Lang } from "@/lib/dictionaries";

type Ep = {
  slug: string; kind: "up" | "next" | "side"; red: boolean; label: string;
  xf: number;            // x jako podíl šířky
  yf?: number;           // y jako podíl výšky (strany)
  yPx?: number;          // y od horního okraje (↑)
  yBottomPx?: number;    // y od dolního okraje (↓)
};

type Geom = { sx: number; sy: number; c1x: number; c1y: number; c2x: number; c2y: number; ex: number; ey: number; len: number };

const rnd = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const easeInOut = (p: number) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

/** Geometrie i-té špagety v čase tt (vlnění je deterministické). */
function strandGeom(i: number, ep: Ep, w: number, h: number, tt: number): Geom {
  const cx = w / 2, cy = h * 0.52;
  const R0x = Math.min(w * 0.3, 330), R0y = Math.min(h * 0.27, 240);
  const ex = ep.xf * w;
  const ey = ep.yPx ?? (ep.yBottomPx !== undefined ? h - ep.yBottomPx : (ep.yf ?? 0.5) * h);
  const a = Math.atan2(ey - cy, ex - cx);
  let sx = cx + Math.cos(a) * R0x, sy = cy + Math.sin(a) * R0y;
  const dist = Math.hypot(ex - cx, ey - cy);
  if (Math.hypot(ex - sx, ey - sy) > dist) { sx = cx + (ex - cx) * 0.45; sy = cy + (ey - cy) * 0.45; }
  const dx = ex - sx, dy = ey - sy, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const amp = Math.min(46, Math.max(10, len * 0.22));
  const w1 = ((rnd(i * 3 + 7) - 0.5) * 2 + 0.45 * Math.sin(tt * (0.25 + rnd(i * 11 + 29) * 0.3) + rnd(i * 7 + 3) * 6.28)) * amp;
  const w2 = ((rnd(i * 5 + 19) - 0.5) * 2 + 0.45 * Math.sin(tt * (0.25 + rnd(i * 11 + 29) * 0.3) + rnd(i * 7 + 3) * 6.28 + 2.2)) * amp;
  return { sx, sy, c1x: sx + dx * 0.33 + nx * w1, c1y: sy + dy * 0.33 + ny * w1, c2x: sx + dx * 0.66 + nx * w2, c2y: sy + dy * 0.66 + ny * w2, ex, ey, len };
}

/** Bod na kubické Bézierově křivce v parametru p ∈ [0,1]. */
function bezAt(g: Geom, p: number): [number, number] {
  const u = 1 - p;
  const x = u * u * u * g.sx + 3 * u * u * p * g.c1x + 3 * u * p * p * g.c2x + p * p * p * g.ex;
  const y = u * u * u * g.sy + 3 * u * u * p * g.c1y + 3 * u * p * p * g.c2y + p * p * p * g.ey;
  return [x, y];
}

/** Jednotný kabát hesla: ze středu vedou špagety k okolním tématům.
    Klik na nudli (±7 px) i na její konec vyšle po špagetě kuličku — a v cíli se heslo otevře. */
export function Strands({ node, lang, dark, upTarget, onUp, onNext, onSide }: {
  node: NodeDef; lang: Lang; dark: boolean; upTarget: string | null;
  onUp: () => void; onNext: () => void; onSide: (slug: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState(-1);

  // koncové body špaget — relativní pozice, ať se renderují už na serveru
  const eps: Ep[] = [];
  if (upTarget) eps.push({ slug: upTarget, kind: "up", xf: 0.5, yPx: 100, red: !getNode(upTarget), label: titleOf(upTarget, lang) });
  if (node.next) eps.push({ slug: node.next, kind: "next", xf: 0.5, yBottomPx: 52, red: !getNode(node.next), label: titleOf(node.next, lang) });
  const sats = node.satellites ?? [];
  const right = sats.filter((_, i) => i % 2 === 0), left = sats.filter((_, i) => i % 2 === 1);
  const yFor = (i: number, n: number) => n === 1 ? 0.5 : 0.3 + (0.42 * i) / (n - 1);
  right.forEach((s, i) => eps.push({ slug: s.to, kind: "side", xf: 0.89, yf: yFor(i, right.length), red: !getNode(s.to), label: s.label?.[lang] ?? titleOf(s.to, lang) }));
  left.forEach((s, i) => eps.push({ slug: s.to, kind: "side", xf: 0.11, yf: yFor(i, left.length), red: !getNode(s.to), label: s.label?.[lang] ?? titleOf(s.to, lang) }));

  // jízda po nudli: { i, start, dur } — po dojetí se naviguje
  const travel = useRef<{ i: number; start: number; dur: number } | null>(null);
  const live = useRef({ eps, dark, hover, onUp, onNext, onSide });
  useEffect(() => { live.current = { eps, dark, hover, onUp, onNext, onSide }; });
  useEffect(() => { travel.current = null; }, [node.slug]); // nové heslo = čistý stav

  const startTravel = (i: number) => {
    if (travel.current) return;
    const { eps: E } = live.current;
    const g = strandGeom(i, E[i], innerWidth, innerHeight, Date.now() / 1000);
    travel.current = { i, start: performance.now(), dur: Math.min(850, Math.max(420, g.len * 1.15)) };
  };
  const startRef = useRef(startTravel);
  useEffect(() => { startRef.current = startTravel; });

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const fit = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fit(); addEventListener("resize", fit);

    // klik na nudli kdekoliv po její délce (±7 px) — jen mimo interaktivní prvky
    const hitTest = (x: number, y: number): number => {
      const { eps: E } = live.current;
      const w = innerWidth, h = innerHeight, tt = Date.now() / 1000;
      let best = -1, bestD = 7 * 7;
      E.forEach((ep, i) => {
        const g = strandGeom(i, ep, w, h, tt);
        const steps = Math.max(16, Math.min(36, Math.round(g.len / 18)));
        for (let s = 0; s <= steps; s++) {
          const [px, py] = bezAt(g, s / steps);
          const d = (px - x) * (px - x) + (py - y) * (py - y);
          if (d < bestD) { bestD = d; best = i; }
        }
      });
      return best;
    };
    const isInteractive = (t: EventTarget | null) => t instanceof Element && !!t.closest("button, a, input, kbd");
    const onMove = (e: PointerEvent) => {
      if (isInteractive(e.target)) { document.body.style.cursor = ""; return; }
      const i = hitTest(e.clientX, e.clientY);
      document.body.style.cursor = i >= 0 ? "pointer" : "";
      setHover((h2) => (h2 === i ? h2 : i));
    };
    const onClick = (e: MouseEvent) => {
      if (isInteractive(e.target)) return;
      const i = hitTest(e.clientX, e.clientY);
      if (i >= 0) startRef.current(i);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("click", onClick);

    let raf = 0;
    const loop = () => {
      const { eps: E, dark: dk, hover: hv, onUp: up, onNext: next, onSide: side } = live.current;
      const w = innerWidth, h = innerHeight;
      ctx.clearRect(0, 0, w, h);
      const tt = Date.now() / 1000;
      const tr = travel.current;
      ctx.lineCap = "round";

      E.forEach((ep, i) => {
        const g = strandGeom(i, ep, w, h, tt);
        const hot = hv === i || tr?.i === i;
        ctx.strokeStyle = dk
          ? (hot ? "rgba(255,224,150,0.9)" : "rgba(241,208,138,0.4)")
          : (hot ? "rgba(140,95,10,0.95)" : "rgba(176,124,24,0.5)");
        ctx.lineWidth = hot ? 2.6 : ep.kind === "next" ? 2.3 : ep.kind === "up" ? 1.9 : 1.6;
        ctx.setLineDash(ep.red ? [4, 5] : []);
        ctx.beginPath();
        ctx.moveTo(g.sx, g.sy);
        ctx.bezierCurveTo(g.c1x, g.c1y, g.c2x, g.c2y, g.ex, g.ey);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // kulička jedoucí po nudli — v cíli se otevře heslo
      if (tr) {
        const p = Math.min(1, (performance.now() - tr.start) / tr.dur);
        const ep = E[tr.i];
        if (!ep) { travel.current = null; }
        else {
          const g = strandGeom(tr.i, ep, w, h, tt);
          const [bx, by] = bezAt(g, easeInOut(p));
          const ball = dk ? "#ffe9b0" : "#b8821a";
          ctx.beginPath(); ctx.arc(bx, by, 11, 0, 7);
          ctx.fillStyle = dk ? "rgba(255,233,176,0.25)" : "rgba(184,130,26,0.22)"; ctx.fill();
          ctx.beginPath(); ctx.arc(bx, by, 6, 0, 7);
          ctx.fillStyle = ball; ctx.fill();
          if (p >= 1) {
            travel.current = null;
            document.body.style.cursor = "";
            if (ep.kind === "up") up(); else if (ep.kind === "next") next(); else side(ep.slug);
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", fit);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onClick);
      document.body.style.cursor = "";
    };
  }, []);

  const pasta = dark ? "#e8c476" : "#a87718";
  const ink = dark ? "rgba(255,255,255,0.85)" : "rgba(26,22,20,0.82)";
  const inkSoft = dark ? "rgba(255,255,255,0.45)" : "rgba(26,22,20,0.45)";

  return (
    <>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 3, pointerEvents: "none" }} />
      <div key={node.slug} style={{ position: "fixed", inset: 0, zIndex: 9, pointerEvents: "none", animation: "encyStrIn 460ms ease" }}>
        {eps.map((ep, i) => (
          <button key={`${ep.slug}-${ep.kind}`} title={ep.label}
            onClick={() => startTravel(i)}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)}
            style={{
              position: "absolute", left: `${ep.xf * 100}%`,
              ...(ep.yPx !== undefined ? { top: ep.yPx } : ep.yBottomPx !== undefined ? { bottom: ep.yBottomPx } : { top: `${(ep.yf ?? 0.5) * 100}%` }),
              transform: ep.yBottomPx !== undefined ? "translate(-50%,50%)" : "translate(-50%,-50%)",
              pointerEvents: "auto", background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: ep.kind === "next" ? "column-reverse" : "column", alignItems: "center", gap: 6, padding: 6,
            }}>
            {ep.red ? (
              <span style={{ width: 26, height: 26, borderRadius: "50%", border: `1.5px dashed ${inkSoft}`, display: "grid", placeItems: "center", color: inkSoft, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, background: dark ? "rgba(8,10,20,0.45)" : "rgba(255,255,255,0.6)" }}>?</span>
            ) : (
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: pasta, boxShadow: hover === i ? `0 0 10px 2px ${pasta}` : `0 0 0 3px ${dark ? "rgba(232,196,118,0.18)" : "rgba(168,119,24,0.16)"}` }} />
            )}
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 600, color: hover === i ? (dark ? "#fff" : "#1a1614") : ink, letterSpacing: "0.03em", whiteSpace: "nowrap", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", textShadow: dark ? "0 1px 6px rgba(0,0,0,0.7)" : "0 1px 4px rgba(255,255,255,0.8)" }}>
              {ep.kind === "up" ? `↑ ${ep.label}` : ep.kind === "next" ? `↓ ${ep.label}` : ep.label}
            </span>
          </button>
        ))}
      </div>
      <style>{`@keyframes encyStrIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </>
  );
}
