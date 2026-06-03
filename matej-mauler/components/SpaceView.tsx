"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { objects, spaceUi } from "@/lib/space";
import type { Lang } from "@/lib/dictionaries";

export function SpaceView({ lang }: { lang: Lang }) {
  const t = spaceUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const stars = Array.from({ length: 260 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.2,
      o: Math.random() * 0.5 + 0.2, sp: Math.random() * 1.5 + 0.3, ph: Math.random() * 6.28,
    }));
    let raf = 0;
    const draw = () => {
      const w = cv.width, h = cv.height;
      ctx.clearRect(0, 0, w, h);
      // jemný galaktický pruh
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

  const obj = objects.find((o) => o.id === sel) ?? null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "radial-gradient(120% 100% at 35% 30%, #0b1026, #04060f 75%)", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />

      {/* objekty */}
      {objects.map((o) => (
        <button key={o.id} onClick={() => setSel(o.id)} title={o.name[lang]}
          style={{
            position: "absolute", left: `${o.x}%`, top: `${o.y}%`, transform: "translate(-50%,-50%)",
            background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
            fontSize: `${o.size}px`, lineHeight: 1, filter: sel === o.id ? "drop-shadow(0 0 16px rgba(255,255,255,0.8))" : "drop-shadow(0 0 8px rgba(150,170,255,0.5))",
            transition: "filter 200ms ease", animation: `spaceFloat ${4 + (o.size % 5)}s ease-in-out infinite`,
          }}>
          <span>{o.emoji}</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "rgba(255,255,255,0.75)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{o.name[lang]}</span>
        </button>
      ))}

      {/* header */}
      <div style={{ position: "absolute", top: "18px", left: "20px", right: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 5 }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>{t.back}</Link>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.5)" }}>{t.eyebrow}</span>
      </div>
      <div style={{ position: "absolute", top: "44px", left: "20px", zIndex: 5 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,6vw,44px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>{t.title}</h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "rgba(255,255,255,0.6)", maxWidth: "320px", marginTop: "4px" }}>{t.intro}</p>
      </div>

      {!sel && (
        <div style={{ position: "absolute", bottom: "4vh", left: "50%", transform: "translateX(-50%)", zIndex: 5, fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{t.tapHint}</div>
      )}

      {/* fact panel */}
      {obj && (
        <div onClick={() => setSel(null)} style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "6vh" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(540px, 90vw)", background: "rgba(12,16,38,0.92)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "18px", padding: "22px 24px", color: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
              <span style={{ fontSize: "34px" }}>{obj.emoji}</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800 }}>{obj.name[lang]}</h2>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.9)" }}>{obj.fact[lang]}</p>
            <button onClick={() => setSel(null)} style={{ marginTop: "16px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", padding: "8px 18px", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>{t.close}</button>
          </div>
        </div>
      )}

      <style>{`@keyframes spaceFloat { 0%,100% { margin-top: -4px; } 50% { margin-top: 4px; } }`}</style>
    </div>
  );
}
