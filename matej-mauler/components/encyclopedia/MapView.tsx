"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { graphData, titleOf } from "@/lib/encyclopedia/graph";
import type { Lang } from "@/lib/dictionaries";

export const REALM_COL: Record<string, string> = {
  space: "#8b9cf6", plain: "#4daf7c",
  hitchhiker: "#2ea36b", futurama: "#18b5c4", simpsons: "#f2b71e", reddwarf: "#d0392f",
  southpark: "#e8772e", office: "#3b7dd8", topgear: "#5a6b7a", rickmorty: "#7ec850",
};
export const RED_COL = "#8a90a0";

type MapNode = { slug: string; label: string; realm: string | null; depth: number; x: number; y: number; r: number };
type Edge = { a: number; b: number; red: boolean };

const UI = {
  cs: { back: "← Spaghetti.ltd", eyebrow: "Absurdní encyklopedie", title: "Mapa všeho", legend: { worlds: "barva = svět", red: "neprobádáno" }, hint: "obecné nahoře · konkrétní dole · klikni a jdi" },
  en: { back: "← Spaghetti.ltd", eyebrow: "The Absurd Encyclopedia", title: "Map of everything", legend: { worlds: "colour = world", red: "uncharted" }, hint: "general up top · specific below · click to go" },
} as const;

/** Mapová projekce sdílených dat grafu (graph.ts). */
function buildGraph(lang: Lang): { nodes: MapNode[]; edges: Edge[]; maxDepth: number } {
  const g = graphData();
  const nodes: MapNode[] = g.nodes.map((n) => ({
    slug: n.slug, label: titleOf(n.slug, lang), realm: n.realm, depth: n.depth, x: 0, y: 0,
    r: n.slug === "brana" ? 10 : n.realm ? 7 : 5,
  }));
  const idx = Object.fromEntries(nodes.map((n, i) => [n.slug, i]));
  const edges: Edge[] = g.edges.map((e) => ({ a: idx[e.a], b: idx[e.b], red: e.red }));
  return { nodes, edges, maxDepth: g.maxDepth };
}

/** Rozmístění: y podle hloubky, x relaxací k sousedům + rozestupy v řadě. Deterministické. */
function layout(nodes: MapNode[], edges: Edge[], maxDepth: number, w: number, h: number) {
  const padT = 96, padB = 86, padX = 70;
  const rowH = (h - padT - padB) / Math.max(1, maxDepth);
  const rows: MapNode[][] = [];
  nodes.forEach((n) => { (rows[n.depth] ??= []).push(n); });
  rows.forEach((row) => {
    row.sort((a, b) => (a.realm ?? "z").localeCompare(b.realm ?? "z") || a.slug.localeCompare(b.slug));
    row.forEach((n, i) => {
      n.y = padT + n.depth * rowH;
      n.x = row.length === 1 ? w / 2 : padX + (i / (row.length - 1)) * (w - padX * 2);
    });
  });
  const nb: number[][] = nodes.map(() => []);
  edges.forEach((e) => { nb[e.a].push(e.b); nb[e.b].push(e.a); });
  for (let it = 0; it < 140; it++) {
    nodes.forEach((n, i) => {
      if (n.slug === "brana" || nb[i].length === 0) return;
      const target = nb[i].reduce((s, j) => s + nodes[j].x, 0) / nb[i].length;
      n.x += (target - n.x) * 0.3;
    });
    rows.forEach((row) => {
      const minGap = Math.min(110, Math.max(54, (w - padX * 2) / Math.max(1, row.length - 1)));
      row.sort((a, b) => a.x - b.x);
      for (let i = 1; i < row.length; i++) {
        const gap = row[i].x - row[i - 1].x;
        if (gap < minGap) { const push = (minGap - gap) / 2; row[i - 1].x -= push; row[i].x += push; }
      }
      row.forEach((n) => { n.x = Math.max(padX, Math.min(w - padX, n.x)); });
    });
  }
}

export function MapView({ lang }: { lang: Lang }) {
  const u = UI[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => { if (localStorage.getItem("ency-theme") === "dark") { const r = requestAnimationFrame(() => setTheme("dark")); return () => cancelAnimationFrame(r); } }, []);
  const dk = theme === "dark";

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const { nodes, edges, maxDepth } = buildGraph(lang);
    let hovered: MapNode | null = null;

    const fit = () => {
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout(nodes, edges, maxDepth, innerWidth, innerHeight);
      draw();
    };
    const draw = () => {
      const w = innerWidth, h = innerHeight;
      const g = ctx.createRadialGradient(w * 0.35, h * 0.3, 0, w * 0.35, h * 0.3, Math.max(w, h));
      if (dk) { g.addColorStop(0, "#0b1026"); g.addColorStop(0.75, "#04060f"); }
      else { g.addColorStop(0, "#fffdf6"); g.addColorStop(0.75, "#f1ece0"); }
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      for (const e of edges) {
        const a = nodes[e.a], b = nodes[e.b];
        const hot = hovered && (a === hovered || b === hovered);
        ctx.strokeStyle = dk ? (hot ? "rgba(255,224,150,0.85)" : "rgba(241,208,138,0.22)") : (hot ? "rgba(140,95,10,0.9)" : "rgba(176,124,24,0.3)");
        ctx.lineWidth = hot ? 1.5 : 1;
        ctx.setLineDash(e.red ? [3, 4] : []);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.setLineDash([]);

      for (const n of nodes) {
        const hot = n === hovered;
        const col = n.realm ? REALM_COL[n.realm] : RED_COL;
        if (n.realm) {
          ctx.globalAlpha = hot ? 1 : 0.92;
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(n.x, n.y, hot ? n.r + 2 : n.r, 0, 7); ctx.fill();
          if (hot) { ctx.strokeStyle = dk ? "rgba(255,255,255,0.8)" : "rgba(26,22,20,0.7)"; ctx.lineWidth = 1.5; ctx.stroke(); }
        } else {
          ctx.globalAlpha = hot ? 0.95 : 0.6;
          ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.setLineDash([2.5, 3]);
          ctx.beginPath(); ctx.arc(n.x, n.y, hot ? n.r + 2 : n.r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.globalAlpha = n.realm ? (hot ? 1 : 0.78) : (hot ? 0.9 : 0.42);
        ctx.fillStyle = dk ? "#fff" : "#1a1614"; ctx.font = `${hot ? 700 : 500} 10.5px system-ui`; ctx.textAlign = "center";
        ctx.fillText(n.label, n.x, n.y + n.r + 13);
        ctx.globalAlpha = 1;
      }
    };
    const pick = (x: number, y: number) => nodes.find((n) => Math.hypot(n.x - x, n.y - y + 4) < Math.max(14, n.r + 9)) ?? null;
    const onMove = (e: PointerEvent) => { const p = pick(e.clientX, e.clientY); if (p !== hovered) { hovered = p; setHover(p?.slug ?? null); draw(); } };
    const onClick = (e: MouseEvent) => { const p = pick(e.clientX, e.clientY); if (p) location.assign(p.slug === "brana" ? "/" : `/${p.slug}`); };
    fit();
    addEventListener("resize", fit);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("click", onClick);
    return () => { removeEventListener("resize", fit); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("click", onClick); };
  }, [lang, dk]);

  return (
    <div style={{ position: "fixed", inset: 0, background: dk ? "#04060f" : "#f7f3ea" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, cursor: hover ? "pointer" : "default" }} />

      <div style={{ position: "absolute", top: 16, left: 20, zIndex: 5 }}>
        <Link href="/" style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: dk ? "rgba(255,255,255,0.7)" : "rgba(26,22,20,0.65)", textDecoration: "none" }}>{u.back}</Link>
      </div>
      <div style={{ position: "absolute", top: 14, left: 0, right: 0, textAlign: "center", zIndex: 4, pointerEvents: "none" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.28em", color: dk ? "rgba(255,255,255,0.45)" : "rgba(26,22,20,0.45)" }}>{u.eyebrow}</p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: dk ? "#fff" : "#1a1614", letterSpacing: "-0.02em" }}>{u.title}</p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: dk ? "rgba(255,255,255,0.45)" : "rgba(26,22,20,0.5)", marginTop: 2 }}>{u.hint}</p>
      </div>

      <div style={{ position: "absolute", bottom: 16, left: 20, zIndex: 5, display: "flex", gap: 14, alignItems: "center", fontFamily: "var(--font-sans)", fontSize: 11, color: dk ? "rgba(255,255,255,0.65)" : "rgba(26,22,20,0.65)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {["futurama", "simpsons", "reddwarf", "southpark", "office", "topgear", "rickmorty", "hitchhiker", "space"].map((r) => (
            <span key={r} style={{ width: 9, height: 9, borderRadius: "50%", background: REALM_COL[r] }} />
          ))}
          {u.legend.worlds}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", border: `1.4px dashed ${RED_COL}` }} /> {u.legend.red}
        </span>
      </div>
    </div>
  );
}
