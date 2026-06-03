"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { objects, spaceUi } from "@/lib/space";
import { SpaceBody } from "./SpaceBody";
import type { Lang } from "@/lib/dictionaries";

export function SpaceView({ lang }: { lang: Lang }) {
  const t = spaceUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [detailPx, setDetailPx] = useState(300);

  // hvězdné pozadí
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const resize = () => {
      cv.width = window.innerWidth; cv.height = window.innerHeight;
      setDetailPx(Math.min(320, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.4)));
    };
    resize(); window.addEventListener("resize", resize);
    const stars = Array.from({ length: 260 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.2,
      o: Math.random() * 0.5 + 0.2, sp: Math.random() * 1.5 + 0.3, ph: Math.random() * 6.28,
    }));
    let raf = 0;
    const draw = () => {
      const w = cv.width, h = cv.height;
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, h * 0.2, w, h * 0.8);
      g.addColorStop(0, "rgba(80,60,140,0.0)"); g.addColorStop(0.5, "rgba(120,90,180,0.10)"); g.addColorStop(1, "rgba(80,60,140,0.0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const tt = Date.now() / 1000;
      for (const s of stars) {
        const o = s.o * (0.5 + 0.5 * Math.sin(tt * s.sp + s.ph));
        ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,225,255,${o})`; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  // v detailu: scroll dolů / swipe nahoru / Esc → zpět na přehled
  useEffect(() => {
    if (!sel) return;
    const onWheel = (e: WheelEvent) => { if (e.deltaY > 8) setSel(null); };
    let startY = 0;
    const onTS = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTM = (e: TouchEvent) => { if (startY - e.touches[0].clientY > 40) setSel(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSel(null); };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTS, { passive: true });
    window.addEventListener("touchmove", onTM, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel); window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchmove", onTM); window.removeEventListener("keydown", onKey);
    };
  }, [sel]);

  const obj = objects.find((o) => o.id === sel) ?? null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "radial-gradient(120% 100% at 35% 30%, #0b1026, #04060f 75%)", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />

      {/* PŘEHLED */}
      <div style={{ position: "absolute", inset: 0, transition: "opacity 300ms ease, filter 300ms ease", opacity: sel ? 0 : 1, filter: sel ? "blur(7px)" : "none", pointerEvents: sel ? "none" : "auto" }}>
        {objects.map((o) => (
          <button key={o.id} onClick={() => setSel(o.id)} title={o.name[lang]}
            style={{ position: "absolute", left: `${o.x}%`, top: `${o.y}%`, transform: "translate(-50%,-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", animation: `spaceFloat ${4 + (o.size % 5)}s ease-in-out infinite` }}>
            <SpaceBody kind={o.kind} px={o.size} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "rgba(255,255,255,0.8)", letterSpacing: "0.04em", whiteSpace: "nowrap", textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}>{o.name[lang]}</span>
          </button>
        ))}
      </div>

      {/* header */}
      <div style={{ position: "absolute", top: "18px", left: "20px", right: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 20 }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>{t.back}</Link>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.5)" }}>{t.eyebrow}</span>
      </div>

      {!sel && (
        <>
          <div style={{ position: "absolute", top: "44px", left: "20px", zIndex: 5 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,6vw,44px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>{t.title}</h1>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "rgba(255,255,255,0.6)", maxWidth: "320px", marginTop: "4px" }}>{t.intro}</p>
          </div>
          <div style={{ position: "absolute", bottom: "4vh", left: "50%", transform: "translateX(-50%)", zIndex: 5, fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{t.tapHint}</div>
        </>
      )}

      {/* DETAIL / přiblížení */}
      {obj && (
        <div style={{ position: "absolute", inset: 0, zIndex: 15, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "70px 20px 40px", animation: "spaceZoom 380ms cubic-bezier(0.22,1,0.36,1)" }}>
          {/* objekt + features kolem */}
          <div style={{ position: "relative", width: detailPx, height: detailPx, display: "grid", placeItems: "center", marginBottom: "26px" }}>
            <SpaceBody kind={obj.kind} px={detailPx} detail />
            {obj.features.map((f, i) => {
              const n = obj.features.length;
              const ang = (-90 + (i - (n - 1) / 2) * 58) * (Math.PI / 180);
              const R = detailPx * 0.62 + 16;
              return (
                <div key={i} style={{
                  position: "absolute",
                  left: `calc(50% + ${Math.cos(ang) * R}px)`,
                  top: `calc(50% + ${Math.sin(ang) * R}px)`,
                  transform: "translate(-50%,-50%)",
                  display: "flex", alignItems: "center", gap: "6px",
                  whiteSpace: "nowrap", pointerEvents: "none",
                  animation: `spaceFade 500ms ease ${0.2 + i * 0.1}s both`,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", boxShadow: "0 0 6px 1px rgba(255,255,255,0.7)" }} />
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "rgba(255,255,255,0.85)", letterSpacing: "0.03em", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>{f[lang]}</span>
                </div>
              );
            })}
          </div>

          {/* text */}
          <div style={{ maxWidth: "560px", textAlign: "center", animation: "spaceRise 500ms ease 0.15s both" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,5vw,34px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: "12px" }}>{obj.name[lang]}</h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.85)" }}>{obj.fact[lang]}</p>
          </div>

          <button onClick={() => setSel(null)} style={{ marginTop: "24px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: "999px", padding: "9px 22px", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, cursor: "pointer", backdropFilter: "blur(6px)" }}>{t.close}</button>
          <div style={{ marginTop: "12px", fontFamily: "var(--font-sans)", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{t.scrollHint}</div>
        </div>
      )}

      <style>{`
        @keyframes spaceFloat { 0%,100% { margin-top: -3px; } 50% { margin-top: 3px; } }
        @keyframes spacePulse { 0%,100% { transform: scale(0.95); opacity: 0.7; } 50% { transform: scale(1.08); opacity: 1; } }
        @keyframes spaceSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spaceOrbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spaceTwinkle { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes spaceZoom { from { transform: scale(0.55); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes spaceFade { from { opacity: 0; transform: translate(-50%,-50%) scale(0.9); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        @keyframes spaceRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
