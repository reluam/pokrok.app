"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ABOUT_PROJECTS, ABOUT_CONCEPTS, SPAGHETTI_BLURB, MESS_LABEL, conceptById, projectsUsing } from "@/lib/about";
import { RED_COL } from "@/components/encyclopedia/MapView";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans = "var(--font-sans)";

// hex (#rrggbb) → rgba se zadanou průhledností
const hexA = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

type N = { id: string; kind: "project" | "concept"; label: string; color: string; href?: string;
  ax: number; ay: number; x: number; y: number; r: number; ph: number; sp: number };

const UI = {
  cs: { back: "← Spaghetti.ltd", eyebrow: "Mapa Spaghetti · about", open: "Otevřít projekt →", shares: "Objevuje se v", uses: "Postaveno z", hint: "najeď na nody — projekty (barevné) a koncepty, co je spojují" },
  en: { back: "← Spaghetti.ltd", eyebrow: "Map of Spaghetti · about", open: "Open the project →", shares: "Shows up in", uses: "Built from", hint: "hover the nodes — projects (coloured) and the concepts that connect them" },
} as const;

export function AboutMap({ lang }: { lang: Lang }) {
  const t = UI[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const hovRef = useRef<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { hovRef.current = hover; }, [hover]);
  const cancelHide = () => { if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; } };
  const scheduleHide = () => { cancelHide(); hideTimer.current = setTimeout(() => { setHover(null); hideTimer.current = null; }, 150); };

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
        const n: N = { id: p.id, kind: "project", label: p.name[lang], color: p.color, href: p.href, ax: cx + Math.cos(a) * R1, ay: cy + Math.sin(a) * R1, x: 0, y: 0, r: 7, ph: i * 1.7, sp: 0.35 + (i % 4) * 0.06 };
        nodes.push(n); byId[p.id] = n;
      });
      // koncepty: úhel = průměr projektů, co je sdílejí; pak rozestrkat, ať se popisky nepřekrývají
      const cs = ABOUT_CONCEPTS.map((c, i) => {
        const ps = projectsUsing(c.id);
        if (ps.length === 0) return null;
        let vx = 0, vy = 0;
        ps.forEach((p) => { vx += Math.cos(ang[p.id]); vy += Math.sin(ang[p.id]); });
        let a = Math.hypot(vx, vy) > 0.15 ? Math.atan2(vy, vx) : ang[ps[0].id];
        a = (a + Math.PI * 2) % (Math.PI * 2);
        return { c, ps, a, i };
      }).filter((x): x is NonNullable<typeof x> => x !== null).sort((p, q) => p.a - q.a);
      const minGap = Math.min((Math.PI * 2) / cs.length, 0.34); // minimální úhlový rozestup
      for (let k = 1; k < cs.length; k++) { const gap = cs[k].a - cs[k - 1].a; if (gap < minGap) cs[k].a = cs[k - 1].a + minGap; }
      cs.forEach(({ c, ps, a, i }, k) => {
        const spread = R2 + (k % 3) * 30; // mírně různé poloměry, ať dýchají
        const n: N = { id: c.id, kind: "concept", label: c.name[lang], color: RED_COL, ax: cx + Math.cos(a) * spread, ay: cy + Math.sin(a) * spread, x: 0, y: 0, r: 5, ph: i * 2.3 + 1, sp: 0.3 + (i % 5) * 0.05 };
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
      for (const n of nodes) { n.x = n.ax + Math.sin(tt * n.sp + n.ph) * 3; n.y = n.ay + Math.cos(tt * n.sp + n.ph) * 3; }
      ctx.clearRect(0, 0, w, h);
      const focus = hovRef.current;
      const messX = cx + Math.sin(tt * 0.5) * 3, messY = cy + Math.cos(tt * 0.5) * 3;
      const related = new Set<string>();
      if (focus) { related.add(focus); for (const e of edges) { if (e.a === focus) related.add(e.b); if (e.b === focus) related.add(e.a); } }

      // hrany — tenké rovné linky jako v encyklopedii (barva dle projektu): střed→projekt + projekt→koncept
      ctx.lineCap = "round";
      for (const p of ABOUT_PROJECTS) {
        const pn = byId[p.id]; if (!pn) continue;
        const on = focus ? related.has(p.id) : false;
        ctx.globalAlpha = focus && !on ? 0.06 : (on ? 0.85 : 0.32);
        ctx.strokeStyle = p.color; ctx.lineWidth = on ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(messX, messY); ctx.lineTo(pn.x, pn.y); ctx.stroke();
      }
      for (const e of edges) {
        const A = byId[e.a], B = byId[e.b]; if (!A || !B) continue;
        const on = focus ? (related.has(e.a) && related.has(e.b)) : false;
        ctx.globalAlpha = focus && !on ? 0.05 : (on ? 0.85 : 0.32);
        ctx.strokeStyle = e.color; ctx.lineWidth = on ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // nody — úplně stejně jako encyklopedie: projekt = plný kotouč, koncept = čárkovaný prsten
      const fam = getComputedStyle(document.body).fontFamily || "system-ui";
      for (const n of nodes) {
        const hot = n.id === focus;
        const isProj = n.kind === "project";
        const dimMul = focus && !related.has(n.id) ? 0.24 : 1;
        const col = isProj ? n.color : RED_COL;
        const r = hot ? n.r + 2 : n.r;
        if (isProj) {
          ctx.globalAlpha = (hot ? 1 : 0.92) * dimMul;
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill();
          if (hot) { ctx.strokeStyle = "rgba(26,22,20,0.7)"; ctx.lineWidth = 1.5; ctx.stroke(); }
        } else {
          ctx.globalAlpha = (hot ? 0.95 : 0.6) * dimMul;
          ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.setLineDash([2.5, 3]);
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.globalAlpha = (isProj ? (hot ? 1 : 0.78) : (hot ? 0.9 : 0.42)) * dimMul;
        ctx.fillStyle = "#1a1614";
        ctx.font = `${hot ? 700 : 500} 10.5px ${fam}`;
        ctx.textAlign = "center";
        ctx.fillText(n.label, n.x, n.y + r + 13);
        ctx.globalAlpha = 1;
      }

      // centrální node „A mess" — hub, z něj linky na všechny experimenty
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(messX, messY, 20, 0, 7); ctx.fillStyle = "rgba(168,119,24,0.15)"; ctx.fill();
      ctx.beginPath(); ctx.arc(messX, messY, 12, 0, 7); ctx.fillStyle = "#a87718"; ctx.fill();
      ctx.strokeStyle = "rgba(26,22,20,0.55)"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#1a1614"; ctx.font = `800 13.5px ${fam}`; ctx.textAlign = "center";
      ctx.fillText(MESS_LABEL[lang], messX, messY + 12 + 17);

      raf = requestAnimationFrame(loop);
    };
    loop();

    const pick = (mx: number, my: number): N | null => {
      let best: N | null = null, bd = Infinity;
      for (const n of nodes) { const d = Math.hypot(n.x - mx, n.y - my); if (d < n.r + 12 && d < bd) { best = n; bd = d; } }
      return best;
    };
    const onMove = (e: PointerEvent) => {
      const p = pick(e.clientX, e.clientY);
      if (p) { cancelHide(); if (p.id !== hovRef.current) setHover(p.id); setHoverPos({ x: p.x, y: p.y }); cv.style.cursor = "pointer"; }
      else { cv.style.cursor = "default"; if (hovRef.current && !hideTimer.current) scheduleHide(); }
    };
    const onLeave = () => { if (hovRef.current) scheduleHide(); };
    const onClick = (e: MouseEvent) => { const p = pick(e.clientX, e.clientY); const proj = p && ABOUT_PROJECTS.find((x) => x.id === p.id); if (proj) location.assign(proj.href); };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerleave", onLeave);
    cv.addEventListener("click", onClick);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave); cv.removeEventListener("click", onClick); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const hovProject = ABOUT_PROJECTS.find((p) => p.id === hover) ?? null;
  const hovConcept = ABOUT_CONCEPTS.find((c) => c.id === hover) ?? null;
  const accent = hovProject?.color ?? RED_COL;

  // umístění detailu vedle nodu, s clampem do okna
  const W = 300;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const panelLeft = hoverPos
    ? Math.max(12, Math.min(vw - W - 12, hoverPos.x > vw / 2 ? hoverPos.x - 24 - W : hoverPos.x + 24))
    : 12;
  const panelTop = hoverPos ? Math.max(64, Math.min(vh - 230, hoverPos.y - 74)) : 64;

  return (
    <main style={{ position: "fixed", inset: 0, background: "var(--bg)", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      <div style={{ position: "absolute", top: 16, left: 0, right: 0, padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "none" }}>
        <Link href="/" style={{ pointerEvents: "auto", ...{ fontFamily: sans }, fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
        <span style={{ fontFamily: sans, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)" }}>{t.eyebrow}</span>
      </div>

      {/* about — jen text na měkce rozmazaném pozadí, žádný pevný border */}
      <div style={{ position: "absolute", top: "13vh", left: "50%", transform: "translateX(-50%)", width: "min(560px, 90vw)", textAlign: "center", pointerEvents: "none", zIndex: 2 }}>
        <div aria-hidden style={{ position: "absolute", inset: "-26px -44px", background: "rgba(250,250,247,0.5)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", maskImage: "radial-gradient(closest-side, #000 58%, transparent 100%)", WebkitMaskImage: "radial-gradient(closest-side, #000 58%, transparent 100%)" }} />
        <p style={{ position: "relative", fontFamily: sans, fontSize: "clamp(14px, 2.4vw, 16px)", lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>{SPAGHETTI_BLURB[lang]}</p>
      </div>

      <p style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", fontFamily: sans, fontSize: 11, color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap", maxWidth: "92vw", overflow: "hidden", textOverflow: "ellipsis" }}>{t.hint}</p>

      {/* detail nodu — na hover; zůstane i nad panelem (keepalive), po odjetí zmizí */}
      {(hovProject || hovConcept) && (
        <div onMouseEnter={cancelHide} onMouseLeave={scheduleHide} style={{
          position: "absolute", left: panelLeft, top: panelTop, width: W, maxHeight: "min(58vh, 460px)", overflowY: "auto", zIndex: 4,
          background: "rgba(255,253,246,0.96)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(26,22,20,0.1)", borderTop: `3px solid ${accent}`, borderRadius: 16,
          boxShadow: "0 18px 50px -14px rgba(26,22,20,0.32)", padding: "16px 18px 18px",
          animation: "aboutCardIn 180ms cubic-bezier(.2,.7,.3,1)",
        }}>
          {hovProject && (
            <>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: hovProject.color, boxShadow: `0 0 0 3px ${hexA(hovProject.color, 0.18)}` }} />
                <span style={{ fontFamily: sans, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-muted)" }}>{lang === "cs" ? "projekt" : "project"}</span>
              </span>
              <p style={{ ...display, fontSize: 20, fontWeight: 900, margin: "0 0 8px", color: hovProject.color, WebkitTextStroke: "0.4px #1a1614" }}>{hovProject.name[lang]}</p>
              <p style={{ fontFamily: sans, fontSize: 13.5, lineHeight: 1.62, color: "var(--text-secondary)", margin: "0 0 14px" }}>{hovProject.blurb[lang]}</p>
              <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 6px" }}>{t.uses}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {hovProject.concepts.map((cid) => { const c = conceptById(cid); return c ? <Tag key={cid}>{c.name[lang]}</Tag> : null; })}
              </div>
              <a href={hovProject.href} style={{ display: "inline-block", fontFamily: sans, fontSize: 13, fontWeight: 700, color: hovProject.color, textDecoration: "underline", textUnderlineOffset: 3 }}>{t.open}</a>
            </>
          )}
          {hovConcept && (
            <>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "transparent", border: `1.4px dashed ${RED_COL}` }} />
                <span style={{ fontFamily: sans, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-muted)" }}>{lang === "cs" ? "koncept" : "concept"}</span>
              </span>
              <p style={{ ...display, fontSize: 19, fontWeight: 900, margin: "0 0 8px" }}>{hovConcept.name[lang]}</p>
              <p style={{ fontFamily: sans, fontSize: 13.5, lineHeight: 1.62, color: "var(--text-secondary)", margin: "0 0 14px" }}>{hovConcept.blurb[lang]}</p>
              <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 6px" }}>{t.shares}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {projectsUsing(hovConcept.id).map((p) => <Tag key={p.id} color={p.color}>{p.name[lang]}</Tag>)}
              </div>
            </>
          )}
        </div>
      )}
      <style>{`@keyframes aboutCardIn { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: none; } }`}</style>
    </main>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: "var(--text-primary)", background: color ? `${color}22` : "transparent", border: color ? `1.5px solid ${color}` : `1.4px dashed ${RED_COL}`, borderRadius: 999, padding: "3px 11px" }}>{children}</span>
  );
}
