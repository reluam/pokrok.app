"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { stages, journeyUi } from "@/lib/journeyLife";
import type { Lang } from "@/lib/dictionaries";

const N = stages.length;

/* Horizontální scrollytelling: vertikální scroll posouvá "obraz" života
   doleva, postava jde po cestě a u každé zastávky se objeví text. */
export function HumanJourney({ lang }: { lang: Lang }) {
  const t = journeyUi[lang];
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const beingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const track = trackRef.current;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const dist = track.offsetHeight - window.innerHeight;
        const p = dist > 0 ? Math.min(1, Math.max(0, -rect.top / dist)) : 0;
        const i = Math.min(N - 1, Math.round(p * (N - 1)));
        if (stripRef.current) stripRef.current.style.transform = `translateX(-${p * (N - 1) * 100}vw)`;
        // postava lehce stoupá a klesá podél cesty
        if (beingRef.current) beingRef.current.style.top = `${44 + 3.5 * Math.sin(p * Math.PI * (N - 1) * 2)}%`;
        if (bgRef.current) {
          const h = stages[i].hue;
          bgRef.current.style.background = `radial-gradient(130% 90% at 50% 46%, hsl(${h} 42% 20%), hsl(${(h + 25) % 360} 55% 6%) 70%)`;
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
    <div ref={trackRef} style={{ height: `${N * 100}vh`, position: "relative" }}>
      {/* přilepená scéna */}
      <div style={{ position: "sticky", top: 0, height: "100dvh", overflow: "hidden" }}>
        {/* pozadí – prolíná barvu podle stádia */}
        <div ref={bgRef} style={{ position: "absolute", inset: 0, transition: "background 700ms ease", background: "radial-gradient(130% 90% at 50% 46%, hsl(280 42% 20%), hsl(305 55% 6%) 70%)" }} />
        {/* hvězdný prach */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.5, backgroundImage: "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 85% 20%, rgba(255,255,255,0.5), transparent)" }} />

        {/* posuvný pruh – celý "obraz" života vedle sebe */}
        <div ref={stripRef} style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${N * 100}vw`, display: "flex", willChange: "transform" }}>
          {/* cesta (tečkovaná linka přes celý pruh) */}
          <div style={{ position: "absolute", left: 0, right: 0, top: "46%", height: "3px", backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 16px, transparent 16px 34px)", opacity: 0.45 }} />
          {stages.map((s, i) => (
            <div key={s.id} style={{ position: "relative", width: "100vw", height: "100%", flexShrink: 0 }}>
              {/* velký průsvitný emoji na pozadí scény */}
              <div style={{ position: "absolute", top: "46%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "min(40vh, 340px)", opacity: 0.06, lineHeight: 1, filter: "grayscale(1)", pointerEvents: "none" }}>{s.emoji}</div>
              {/* zastávka na cestě */}
              <div style={{ position: "absolute", top: "46%", left: "50%", transform: "translate(-50%,-50%)", width: "14px", height: "14px", borderRadius: "50%", background: i <= idx ? "#fff" : "rgba(255,255,255,0.35)", boxShadow: "0 0 0 4px rgba(255,255,255,0.12)", transition: "background 200ms" }} />
              {/* text stádia */}
              <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: "57%", width: "min(560px, 86vw)", textAlign: "center", color: "#fff" }}>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>{s.age[lang]} · {i + 1} {t.of} {N}</p>
                <h2 className="journey-serif" style={{ fontSize: "clamp(30px, 5.5vw, 50px)", fontStyle: "italic", lineHeight: 1.1, marginBottom: "14px", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>{s.title[lang]}</h2>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.88)", textShadow: "0 1px 10px rgba(0,0,0,0.5)" }}>{s.text[lang]}</p>
              </div>
            </div>
          ))}
        </div>

        {/* postava – pevně uprostřed, kamera ji následuje */}
        <div ref={beingRef} style={{ position: "absolute", top: "44%", left: "50%", transform: "translate(-50%,-100%)", textAlign: "center", zIndex: 2, transition: "top 120ms linear" }}>
          <div key={idx} className="j-pop j-bob" style={{ fontSize: "clamp(54px, 10vw, 92px)", lineHeight: 1, filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.5))" }}>{stage.emoji}</div>
        </div>

        {/* postup (vodorovně dole) */}
        <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", zIndex: 3 }}>
          {stages.map((_, i) => (
            <div key={i} style={{ width: i === idx ? "9px" : "6px", height: i === idx ? "9px" : "6px", borderRadius: "50%", background: i <= idx ? "#fff" : "rgba(255,255,255,0.3)", transition: "all 200ms ease" }} />
          ))}
        </div>

        {/* zpět + název */}
        <div style={{ position: "absolute", top: "18px", left: "20px", zIndex: 4 }}>
          <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>{t.back}</Link>
        </div>
        <div style={{ position: "absolute", top: "16px", left: "50%", transform: "translateX(-50%)", zIndex: 4, textAlign: "center" }}>
          <p className="journey-serif" style={{ fontSize: "16px", color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>{t.title}</p>
        </div>

        {/* nápověda ke scrollování */}
        {idx === 0 && (
          <div style={{ position: "absolute", bottom: "44px", left: "50%", transform: "translateX(-50%)", zIndex: 4, fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(255,255,255,0.6)", animation: "j-bob 2s ease-in-out infinite" }}>{t.scrollHint}</div>
        )}
      </div>
    </div>
  );
}
