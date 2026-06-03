"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { stages, journeyUi } from "@/lib/journeyLife";
import type { Lang } from "@/lib/dictionaries";

const N = stages.length;

export function JourneyLife({ lang }: { lang: Lang }) {
  const t = journeyUi[lang];
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const beingRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
        const sF = p * (N - 1);
        const i = Math.min(N - 1, Math.round(sF));
        const left = 50 + 30 * Math.sin(p * Math.PI * (N - 1));
        if (beingRef.current) beingRef.current.style.left = `${left}%`;
        if (trailRef.current) trailRef.current.style.backgroundPositionX = `${-p * 1200}px`;
        if (bgRef.current) {
          const h = stages[i].hue;
          bgRef.current.style.background = `radial-gradient(120% 80% at ${left}% 42%, hsl(${h} 42% 20%), hsl(${(h + 25) % 360} 55% 6%) 70%)`;
        }
        if (i !== idxRef.current) { idxRef.current = i; setIdx(i); }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const stage = stages[idx];
  const homeHref = lang === "cs" ? "/cs" : "/";

  return (
    <>
      {/* fixed scéna */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>
        <div ref={bgRef} style={{ position: "absolute", inset: 0, transition: "background 700ms ease", background: "radial-gradient(120% 80% at 50% 42%, hsl(280 42% 20%), hsl(305 55% 6%) 70%)" }} />
        {/* hvězdný prach */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.5, backgroundImage: "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 85% 20%, rgba(255,255,255,0.5), transparent)" }} />
        {/* klikatá cesta (pohyblivá tečkovaná stopa) */}
        <div ref={trailRef} style={{ position: "absolute", left: 0, right: 0, top: "50%", height: "3px", backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 14px, transparent 14px 30px)", backgroundSize: "30px 3px", opacity: 0.4 }} />

        {/* postava */}
        <div ref={beingRef} style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", transition: "left 120ms linear" }}>
          <div key={idx} className="j-pop j-bob" style={{ fontSize: "clamp(64px, 12vw, 110px)", lineHeight: 1, filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.5))" }}>{stage.emoji}</div>
        </div>

        {/* text stádia */}
        <div key={`p${idx}`} className="j-fade" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: "12vh", width: "min(560px, 88vw)", textAlign: "center", color: "#fff", zIndex: 2 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>
            {stage.age[lang]} · {idx + 1} {t.of} {N}
          </p>
          <h2 className="journey-serif" style={{ fontSize: "clamp(32px, 6vw, 52px)", fontStyle: "italic", lineHeight: 1.1, marginBottom: "14px", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>{stage.title[lang]}</h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.88)", textShadow: "0 1px 10px rgba(0,0,0,0.5)" }}>{stage.text[lang]}</p>
        </div>

        {/* progress rail */}
        <div style={{ position: "absolute", right: "18px", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "7px", zIndex: 2 }}>
          {stages.map((_, i) => (
            <div key={i} style={{ width: i === idx ? "9px" : "6px", height: i === idx ? "9px" : "6px", borderRadius: "50%", background: i <= idx ? "#fff" : "rgba(255,255,255,0.3)", transition: "all 200ms ease" }} />
          ))}
        </div>

        {/* back + title */}
        <div style={{ position: "absolute", top: "18px", left: "20px", zIndex: 3 }}>
          <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>{t.back}</Link>
        </div>
        <div style={{ position: "absolute", top: "16px", left: "50%", transform: "translateX(-50%)", zIndex: 3, textAlign: "center" }}>
          <p className="journey-serif" style={{ fontSize: "16px", color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>{t.title}</p>
        </div>

        {/* scroll hint */}
        {idx === 0 && (
          <div style={{ position: "absolute", bottom: "3vh", left: "50%", transform: "translateX(-50%)", zIndex: 3, fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(255,255,255,0.6)", animation: "j-bob 2s ease-in-out infinite" }}>
            {t.scrollHint}
          </div>
        )}
      </div>

      {/* spacer pro scroll */}
      <div style={{ height: `${N * 100}vh` }} />
    </>
  );
}
