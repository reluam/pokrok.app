"use client";

import { useEffect, useRef, useState } from "react";
import { graphData } from "@/lib/encyclopedia/graph";
import { titleOf } from "@/lib/encyclopedia/graph";
import { REALM_COL, RED_COL } from "./MapView";
import type { Lang } from "@/lib/dictionaries";
import type { Theme } from "./Shell";

type GNode = {
  slug: string; label: string; realm: string | null; depth: number;
  angle: number; px: number; py: number; r: number; ph: number; sp: number;
};

/** Brána: celá síť rozhozená radiálně kolem středového textu.
    Obecné u středu, konkrétní na okraji — klikni kamkoliv a jdi. */
export function GateMap({ lang, theme, onNavigate }: { lang: Lang; theme: Theme; onNavigate: (slug: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const themeRef = useRef<Theme>(theme);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    /* ── radiální strom: úhlové výseče ∝ počtu listů ── */
    const g = graphData();
    const children: Record<string, string[]> = {};
    g.nodes.forEach((n) => { if (n.parent) (children[n.parent] ??= []).push(n.slug); });
    Object.values(children).forEach((c) => c.sort());
    const leavesMemo: Record<string, number> = {};
    const leaves = (slug: string): number => leavesMemo[slug] ??= (children[slug]?.length ? children[slug].reduce((s, c) => s + leaves(c), 0) : 1);

    const angle: Record<string, number> = {};
    const assign = (slug: string, a0: number, a1: number) => {
      angle[slug] = (a0 + a1) / 2;
      const kids = children[slug] ?? [];
      const total = kids.reduce((s, c) => s + leaves(c), 0);
      let a = a0;
      for (const c of kids) { const span = ((a1 - a0) * leaves(c)) / total; assign(c, a, a + span); a += span; }
    };
    // kořenové větve (vesmír, zvuk) dostanou výseče celého kruhu s mezerou
    const roots = (children["brana"] ?? []).sort((a, b) => leaves(b) - leaves(a));
    const gap = 0.35, totalLeaves = roots.reduce((s, r) => s + leaves(r), 0);
    let a = -Math.PI / 2 + gap / 2;
    for (const r of roots) { const span = (Math.PI * 2 - gap * roots.length) * (leaves(r) / totalLeaves); assign(r, a, a + span); a += span + gap; }

    // deterministický „náhodný" rozcuch — ať je to splácané jako špagety, ne jako orloj
    const rnd = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

    const nodes: (GNode & { rj: number })[] = g.nodes.filter((n) => n.slug !== "brana").map((n, i) => ({
      slug: n.slug, label: titleOf(n.slug, lang), realm: n.realm, depth: n.depth,
      angle: (angle[n.slug] ?? 0) + (rnd(i + 1) - 0.5) * 0.11,
      rj: 0.93 + rnd(i + 53) * 0.14, // jitter poloměru
      px: 0, py: 0, r: n.realm ? 6 : 4.5, ph: (i * 2.399) % 6.28, sp: 0.4 + ((i * 7) % 10) / 14,
    }));
    const bySlug = Object.fromEntries(nodes.map((n) => [n.slug, n]));

    // parametry pramenů: každá synapse je vlastní nudle s vlastním prohnutím a tempem
    const strands = g.edges.map((_, i) => ({
      o1: (rnd(i * 3 + 7) - 0.5) * 2, o2: (rnd(i * 5 + 19) - 0.5) * 2,
      ph: rnd(i * 7 + 3) * 6.28, sp: 0.2 + rnd(i * 11 + 29) * 0.35,
    }));

    const stars = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.2, o: Math.random() * 0.5 + 0.15, sp: Math.random() * 1.5 + 0.3, ph: Math.random() * 6.28 }));
    let w = 0, h = 0, cx = 0, cy = 0;
    const resize = () => { w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); cx = w / 2; cy = h * 0.52; };
    resize(); addEventListener("resize", resize);

    const ring = (d: number) => {
      const t = g.maxDepth > 1 ? Math.pow((d - 1) / (g.maxDepth - 1), 0.72) : 0;
      // vnitřní prstenec musí obejít středový blok (logo + search + text)
      const bx = Math.min(w * 0.34, 375), by = Math.min(h * 0.3, 262);
      return { rx: bx + Math.max(0, w / 2 - 60 - bx) * t, ry: by + Math.max(0, h / 2 - 60 - by) * t };
    };

    let hovered: GNode | null = null;
    const pick = (x: number, y: number) => nodes.find((n) => Math.hypot(n.px - x, n.py - y) < Math.max(15, n.r + 10)) ?? null;
    const onMove = (e: PointerEvent) => { const p = pick(e.clientX, e.clientY); if (p !== hovered) { hovered = p; setHover(p?.slug ?? null); } };
    const onClick = (e: MouseEvent) => { const p = pick(e.clientX, e.clientY); if (p) onNavigate(p.slug); };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("click", onClick);

    let raf = 0;
    const loop = () => {
      const tt = Date.now() / 1000;
      const rot = tt * 0.008; // celý talíř se líně otáčí — jako míchání hrnce
      // pozice (jemné plutí)
      for (const n of nodes) {
        const { rx, ry } = ring(n.depth);
        n.px = cx + Math.cos(n.angle + rot) * rx * n.rj + Math.sin(tt * n.sp + n.ph) * 4.5;
        n.py = cy + Math.sin(n.angle + rot) * ry * n.rj + Math.cos(tt * n.sp + n.ph) * 4.5;
      }
      const pos = (slug: string) => slug === "brana" ? { px: cx, py: cy } : bySlug[slug];

      const dk = themeRef.current === "dark";
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createRadialGradient(w * 0.35, h * 0.3, 0, w * 0.35, h * 0.3, Math.max(w, h));
      if (dk) { bg.addColorStop(0, "#0b1026"); bg.addColorStop(0.75, "#04060f"); }
      else { bg.addColorStop(0, "#fffdf6"); bg.addColorStop(0.75, "#f1ece0"); }
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      if (dk) {
        ctx.fillStyle = "#fff";
        for (const s of stars) { ctx.globalAlpha = s.o * (0.5 + 0.5 * Math.sin(tt * s.sp + s.ph)); ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
      }

      // synapse = špagety: zvlněné prameny v těstovinové barvě, každý se vlní vlastním tempem
      ctx.lineCap = "round";
      g.edges.forEach((e, i) => {
        const pa = pos(e.a), pb = pos(e.b); if (!pa || !pb) return;
        const hot = hovered && (pa === hovered || pb === hovered);
        const p = strands[i];
        const dx = pb.px - pa.px, dy = pb.py - pa.py, len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const amp = Math.min(58, Math.max(12, len * 0.17));
        const w1 = (p.o1 + 0.45 * Math.sin(tt * p.sp + p.ph)) * amp;
        const w2 = (p.o2 + 0.45 * Math.sin(tt * p.sp + p.ph + 2.2)) * amp;
        ctx.strokeStyle = dk ? (hot ? "rgba(255,224,150,0.9)" : e.tree ? "rgba(241,208,138,0.3)" : "rgba(241,208,138,0.15)") : (hot ? "rgba(140,95,10,0.95)" : e.tree ? "rgba(176,124,24,0.42)" : "rgba(176,124,24,0.2)");
        ctx.lineWidth = hot ? 2.4 : e.tree ? 1.7 : 1.2;
        ctx.setLineDash(e.red ? [4, 5] : []);
        ctx.beginPath();
        ctx.moveTo(pa.px, pa.py);
        ctx.bezierCurveTo(pa.px + dx * 0.33 + nx * w1, pa.py + dy * 0.33 + ny * w1, pa.px + dx * 0.66 + nx * w2, pa.py + dy * 0.66 + ny * w2, pb.px, pb.py);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      const small = w < 620;
      for (const n of nodes) {
        const hot = n === hovered;
        const col = n.realm ? REALM_COL[n.realm] : RED_COL;
        if (n.realm) {
          ctx.globalAlpha = hot ? 1 : 0.9;
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(n.px, n.py, hot ? n.r + 2.5 : n.r, 0, 7); ctx.fill();
          if (hot) { ctx.strokeStyle = dk ? "rgba(255,255,255,0.85)" : "rgba(26,22,20,0.7)"; ctx.lineWidth = 1.5; ctx.stroke(); }
        } else {
          ctx.globalAlpha = hot ? 0.95 : 0.55;
          ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.setLineDash([2.5, 3]);
          ctx.beginPath(); ctx.arc(n.px, n.py, hot ? n.r + 2 : n.r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        }
        if (n.realm || hot || !small) {
          ctx.globalAlpha = n.realm ? (hot ? 1 : 0.7) : (hot ? 0.9 : 0.38);
          ctx.fillStyle = dk ? "#fff" : "#1a1614"; ctx.font = `${hot ? 700 : 500} ${small ? 9 : 10}px system-ui`; ctx.textAlign = "center";
          ctx.fillText(n.label, n.px, n.py + n.r + 12);
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("click", onClick); };
  }, [lang, onNavigate]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, background: theme === "dark" ? "#04060f" : "#f7f3ea", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, cursor: hover ? "pointer" : "default" }} />
    </div>
  );
}
