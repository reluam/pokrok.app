"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ABOUT_PROJECTS, ABOUT_CONCEPTS, SPAGHETTI_BLURB, conceptById, projectsUsing } from "@/lib/about";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans = "var(--font-sans)";

type N = { id: string; kind: "project" | "concept"; label: string; color: string; href?: string;
  ax: number; ay: number; x: number; y: number; r: number; ph: number; sp: number };

const UI = {
  cs: { back: "← Spaghetti.ltd", eyebrow: "Mapa Spaghetti · about", open: "Otevřít projekt →", shares: "Objevuje se v", uses: "Postaveno z", hint: "klikni na nody — projekty (barevné) a koncepty, co je spojují" },
  en: { back: "← Spaghetti.ltd", eyebrow: "Map of Spaghetti · about", open: "Open the project →", shares: "Shows up in", uses: "Built from", hint: "click the nodes — projects (coloured) and the concepts that connect them" },
} as const;

export function AboutMap({ lang }: { lang: Lang }) {
  const t = UI[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const selRef = useRef<string | null>(null);
  const hovRef = useRef<string | null>(null);
  useEffect(() => { selRef.current = selected; }, [selected]);
  useEffect(() => { hovRef.current = hover; }, [hover]);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const nodes: N[] = [];
    const byId: Record<string, N> = {};
    const edges: { a: string; b: string; color: string }[] = [];

    const build = () => {
      nodes.length = 0; edges.length = 0;
      const w = cv.clientWidth, h = cv.clientHeight;
      const cx = w / 2, cy = h * 0.5;
      const R1 = Math.max(210, Math.min(360, Math.min(w, h) * 0.32));
      const R2 = R1 + Math.max(120, Math.min(220, Math.min(w, h) * 0.2));
      const ang: Record<string, number> = {};
      ABOUT_PROJECTS.forEach((p, i) => {
        const a = -Math.PI / 2 + (i / ABOUT_PROJECTS.length) * Math.PI * 2;
        ang[p.id] = a;
        const n: N = { id: p.id, kind: "project", label: p.name[lang], color: p.color, href: p.href, ax: cx + Math.cos(a) * R1, ay: cy + Math.sin(a) * R1, x: 0, y: 0, r: 11, ph: i * 1.7, sp: 0.35 + (i % 4) * 0.06 };
        nodes.push(n); byId[p.id] = n;
      });
      ABOUT_CONCEPTS.forEach((c, i) => {
        const ps = projectsUsing(c.id);
        if (ps.length === 0) return;
        let vx = 0, vy = 0;
        ps.forEach((p) => { vx += Math.cos(ang[p.id]); vy += Math.sin(ang[p.id]); });
        const a = Math.hypot(vx, vy) > 0.15 ? Math.atan2(vy, vx) : ang[ps[0].id];
        const spread = R2 + (i % 3) * 26; // mírně různé poloměry, ať se nepřekrývají
        const n: N = { id: c.id, kind: "concept", label: c.name[lang], color: "#8a8170", ax: cx + Math.cos(a) * spread, ay: cy + Math.sin(a) * spread, x: 0, y: 0, r: 6, ph: i * 2.3 + 1, sp: 0.3 + (i % 5) * 0.05 };
        nodes.push(n); byId[c.id] = n;
        ps.forEach((p) => edges.push({ a: p.id, b: c.id, color: p.color }));
      });
    };

    let w = 0, h = 0, cx = 0, cy = 0;
    const resize = () => {
      w = cv.clientWidth; h = cv.clientHeight; cx = w / 2; cy = h * 0.5;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const loop = () => {
      const tt = Date.now() / 1000;
      for (const n of nodes) { n.x = n.ax + Math.sin(tt * n.sp + n.ph) * 4.5; n.y = n.ay + Math.cos(tt * n.sp + n.ph) * 4.5; }
      ctx.clearRect(0, 0, w, h);
      const sel = selRef.current, hov = hovRef.current;
      const focus = sel ?? hov;
      const related = new Set<string>();
      if (focus) { related.add(focus); for (const e of edges) { if (e.a === focus) related.add(e.b); if (e.b === focus) related.add(e.a); } }

      // nudle k centru (projekty) + projekt→koncept
      for (const p of ABOUT_PROJECTS) {
        const pn = byId[p.id]; if (!pn) continue;
        const dim = focus ? !related.has(p.id) : false;
        ctx.globalAlpha = dim ? 0.06 : 0.22;
        noodle(ctx, cx, cy, pn.x, pn.y, p.color, 2, (p.id.length * 7) % 5 - 2, tt);
      }
      for (const e of edges) {
        const A = byId[e.a], B = byId[e.b]; if (!A || !B) continue;
        const dim = focus ? !(related.has(e.a) && related.has(e.b)) : false;
        ctx.globalAlpha = dim ? 0.05 : 0.5;
        noodle(ctx, A.x, A.y, B.x, B.y, e.color, 3, ((e.a.length + e.b.length) % 5) - 2, tt);
      }
      ctx.globalAlpha = 1;

      // nody
      for (const n of nodes) {
        const hot = n.id === focus;
        const dim = focus ? !related.has(n.id) : false;
        ctx.globalAlpha = dim ? 0.28 : 1;
        const r = hot ? n.r + 2.5 : n.r;
        ctx.fillStyle = n.kind === "project" ? n.color : "#fffdf6";
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill();
        ctx.lineWidth = n.kind === "project" ? 2 : 2; ctx.strokeStyle = n.kind === "project" ? "#1a1614" : "#9a917f";
        ctx.stroke();
        // label
        ctx.fillStyle = "#1a1614";
        ctx.font = `${n.kind === "project" ? `800 ${hot ? 14 : 13}px` : `600 ${hot ? 12 : 11}px`} ${getComputedStyle(document.body).fontFamily || "system-ui"}`;
        ctx.textAlign = "center";
        const ly = n.y + r + (n.kind === "project" ? 16 : 13);
        ctx.fillText(n.label, n.x, ly);
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    const pick = (mx: number, my: number): N | null => {
      let best: N | null = null, bd = Infinity;
      for (const n of nodes) { const d = Math.hypot(n.x - mx, n.y - my); if (d < n.r + 12 && d < bd) { best = n; bd = d; } }
      return best;
    };
    const onMove = (e: PointerEvent) => { const p = pick(e.clientX, e.clientY); if ((p?.id ?? null) !== hovRef.current) setHover(p?.id ?? null); cv.style.cursor = p ? "pointer" : "default"; };
    const onClick = (e: MouseEvent) => { const p = pick(e.clientX, e.clientY); setSelected(p ? p.id : null); };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("click", onClick);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("click", onClick); };
  }, [lang]);

  const selProject = ABOUT_PROJECTS.find((p) => p.id === selected) ?? null;
  const selConcept = ABOUT_CONCEPTS.find((c) => c.id === selected) ?? null;

  return (
    <main style={{ position: "fixed", inset: 0, background: "var(--bg)", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      <div style={{ position: "absolute", top: 16, left: 0, right: 0, padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "none" }}>
        <Link href="/" style={{ pointerEvents: "auto", ...{ fontFamily: sans }, fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
        <span style={{ fontFamily: sans, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)" }}>{t.eyebrow}</span>
      </div>

      {/* střed — popisek Spaghetti místo searche */}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "min(380px, 78vw)", textAlign: "center", pointerEvents: "none", zIndex: 2 }}>
        <p style={{ fontSize: 30, margin: "0 0 6px" }}>🍝</p>
        <p style={{ ...display, fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Spaghetti.ltd</p>
        <p style={{ fontFamily: sans, fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>{SPAGHETTI_BLURB[lang]}</p>
      </div>

      <p style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", fontFamily: sans, fontSize: 11, color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap", maxWidth: "92vw", overflow: "hidden", textOverflow: "ellipsis" }}>{t.hint}</p>

      {/* detail nodu */}
      {(selProject || selConcept) && (
        <div style={{ position: "absolute", left: "50%", bottom: 44, transform: "translateX(-50%)", width: "min(440px, 92vw)", maxHeight: "46vh", overflowY: "auto", zIndex: 3, background: "#fff", border: "2.5px solid var(--border)", borderRadius: 16, boxShadow: "5px 5px 0 var(--border)", padding: "16px 18px" }}>
          <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-muted)" }}>×</button>
          {selProject && (
            <>
              <p style={{ ...display, fontSize: 20, fontWeight: 900, margin: "0 0 8px", color: selProject.color, WebkitTextStroke: "0.4px #1a1614" }}>{selProject.name[lang]}</p>
              <p style={{ fontFamily: sans, fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)", margin: "0 0 12px" }}>{selProject.blurb[lang]}</p>
              <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 6px" }}>{t.uses}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {selProject.concepts.map((cid) => { const c = conceptById(cid); return c ? <Chip key={cid} onClick={() => setSelected(cid)}>{c.name[lang]}</Chip> : null; })}
              </div>
              <a href={selProject.href} style={{ display: "inline-block", fontFamily: sans, fontSize: 13, fontWeight: 700, color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: 3 }}>{t.open}</a>
            </>
          )}
          {selConcept && (
            <>
              <p style={{ ...display, fontSize: 19, fontWeight: 900, margin: "0 0 8px" }}>{selConcept.name[lang]}</p>
              <p style={{ fontFamily: sans, fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)", margin: "0 0 12px" }}>{selConcept.blurb[lang]}</p>
              <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 6px" }}>{t.shares}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {projectsUsing(selConcept.id).map((p) => <Chip key={p.id} color={p.color} onClick={() => setSelected(p.id)}>{p.name[lang]}</Chip>)}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}

function Chip({ children, color, onClick }: { children: React.ReactNode; color?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: "var(--text-primary)", background: color ? `${color}22` : "rgba(26,22,20,0.05)", border: `1.5px solid ${color ?? "var(--border)"}`, borderRadius: 999, padding: "3px 11px", cursor: "pointer" }}>{children}</button>
  );
}

// nudle (bezier s prohnutím + jemné houpání)
function noodle(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width: number, side: number, t: number) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1;
  const px = -dy / d, py = dx / d;
  const bow = Math.min(34, d * 0.16) * (side === 0 ? 1 : Math.sign(side)) + Math.sin(t * 0.6 + x1 * 0.01) * 5;
  const mx = (x1 + x2) / 2 + px * bow, my = (y1 + y2) / 2 + py * bow;
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
}
