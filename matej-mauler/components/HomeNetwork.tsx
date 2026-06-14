"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExperimentPreview } from "./ExperimentPreview";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SPAGHETTI_BLURB } from "@/lib/about";
import type { Dictionary, Lang } from "@/lib/dictionaries";
import type { PublicExperiment } from "@/lib/experimentsDb";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans = "var(--font-sans)";
const BW = 212; // šířka banner-nodu

/** Homepage jako about-síť: uprostřed Spaghetti.ltd, kolem projekty (jejich malůvky).
    Levý sloupec = info (o Spaghetti, nebo o najetém projektu + Vstoupit). */
export function HomeNetwork({ dict, lang, items }: { dict: Dictionary; lang: Lang; items: PublicExperiment[] }) {
  const [focus, setFocus] = useState<string | null>(null);
  const focused = items.find((i) => i.slug === focus) ?? null;
  const a = dict.about;

  const netRef = useRef<HTMLDivElement>(null);
  const [lay, setLay] = useState<{ cx: number; cy: number; pts: { slug: string; x: number; y: number; color: string }[]; narrow: boolean }>({ cx: 0, cy: 0, pts: [], narrow: false });
  useEffect(() => {
    const compute = () => {
      const el = netRef.current; if (!el) return;
      const narrow = window.innerWidth < 880;
      if (narrow) { setLay({ cx: 0, cy: 0, pts: [], narrow: true }); return; }
      const w = el.clientWidth, h = el.clientHeight;
      const cx = w / 2, cy = h / 2;
      const Rx = Math.max(250, Math.min(w * 0.34, 380));
      const Ry = Math.max(190, Math.min(h * 0.33, 300));
      const pts = items.map((it, i) => {
        const ang = -Math.PI / 2 + (i / Math.max(1, items.length)) * Math.PI * 2;
        return { slug: it.slug, x: cx + Math.cos(ang) * Rx, y: cy + Math.sin(ang) * Ry, color: it.color };
      });
      setLay({ cx, cy, pts, narrow: false });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [items]);

  const enterLabel = lang === "cs" ? "Vstoupit →" : "Enter →";

  const info = focused ? (
    <div key={focused.slug} style={{ animation: "homeInfoIn 300ms cubic-bezier(.2,.7,.3,1)" }}>
      <p style={{ fontFamily: sans, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--text-muted)", margin: "0 0 8px" }}>{lang === "cs" ? "Projekt" : "Project"}</p>
      <h2 style={{ ...display, fontSize: "clamp(26px,3.4vw,36px)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.05, margin: "0 0 14px", color: focused.color, WebkitTextStroke: "0.5px #1a1614" }}>{focused.title}</h2>
      <p style={{ fontFamily: sans, fontSize: 15, lineHeight: 1.65, color: "var(--text-secondary)", margin: "0 0 22px" }}>{focused.description}</p>
      <a href={focused.href} {...(focused.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        style={{ display: "inline-block", background: "var(--text-primary)", color: "var(--bg)", border: "2px solid var(--text-primary)", borderRadius: 999, boxShadow: "3px 3px 0 var(--border)", padding: "11px 24px", fontFamily: sans, fontSize: 14, fontWeight: 800, textDecoration: "none" }}>{enterLabel}</a>
    </div>
  ) : (
    <div style={{ animation: "homeInfoIn 300ms cubic-bezier(.2,.7,.3,1)" }}>
      <p style={{ fontSize: 34, margin: "0 0 6px", lineHeight: 1 }}>🍝</p>
      <h1 style={{ ...display, fontSize: "clamp(30px,4vw,44px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1, margin: "0 0 14px" }}>Spaghetti<span style={{ color: "var(--text-muted)" }}>.ltd</span></h1>
      <p style={{ ...display, fontStyle: "italic", fontSize: 16, lineHeight: 1.55, color: "var(--text-primary)", margin: "0 0 18px" }}>{SPAGHETTI_BLURB[lang]}</p>
      <p style={{ fontFamily: sans, fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", margin: "0 0 12px" }}>{a.p1}</p>
      <p style={{ fontFamily: sans, fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", margin: "0 0 12px" }}>{a.p2}</p>
      <p style={{ fontFamily: sans, fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", margin: 0 }}>
        {a.p3a}<a href="mailto:matej@ziju.life" style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>{a.writeMe}</a>{a.p3b}
      </p>
      <Link href="/songs" style={{ display: "inline-block", marginTop: 18, fontFamily: sans, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: 3 }}>{lang === "cs" ? "Songs →" : "Songs →"}</Link>
    </div>
  );

  const bannerNode = (it: PublicExperiment, style: React.CSSProperties) => (
    <a key={it.slug} href={it.href} {...(it.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onMouseEnter={() => setFocus(it.slug)} onFocus={() => setFocus(it.slug)}
      className="home-node"
      style={{ width: BW, borderRadius: 16, overflow: "hidden", border: `2.5px solid ${focus === it.slug ? "var(--text-primary)" : "var(--border)"}`, boxShadow: focus === it.slug ? "5px 5px 0 var(--border)" : "3px 3px 0 var(--border)", textDecoration: "none", background: "#fff", display: "block", ...style }}>
      <ExperimentPreview slug={it.slug} title={it.title} color={it.color} lang={lang} />
    </a>
  );

  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <div style={{ position: "absolute", top: 16, right: 18, zIndex: 30 }}><LanguageSwitcher lang={lang} labels={dict.switcher} /></div>

      <div style={{ flex: 1, display: "flex", alignItems: "stretch", flexWrap: "wrap" }}>
        {/* levý sloupec — texty */}
        <aside style={{ flex: "0 0 380px", maxWidth: "100%", padding: "clamp(28px,5vh,64px) 32px", display: "flex", alignItems: "center", borderRight: "1.5px solid rgba(26,22,20,0.08)" }}>
          <div style={{ maxWidth: 420 }}>{info}</div>
        </aside>

        {/* síť projektů */}
        <section ref={netRef} onMouseLeave={() => setFocus(null)} style={{ flex: 1, minWidth: 320, position: "relative", minHeight: "min(100dvh, 720px)" }}>
          {lay.narrow ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", alignContent: "center", padding: "30px 22px", minHeight: "100%" }}>
              <div style={{ width: "100%", textAlign: "center", marginBottom: 4 }}>
                <span style={{ ...display, fontSize: 20, fontWeight: 900 }}>🍝 Spaghetti.ltd</span>
              </div>
              {items.map((it) => bannerNode(it, {}))}
            </div>
          ) : (
            <>
              <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                {lay.pts.map((p) => {
                  const mx = (lay.cx + p.x) / 2, my = (lay.cy + p.y) / 2;
                  const dx = p.x - lay.cx, dy = p.y - lay.cy, d = Math.hypot(dx, dy) || 1;
                  const bow = 26 * ((p.slug.length % 2) ? 1 : -1);
                  const cxp = mx + (-dy / d) * bow, cyp = my + (dx / d) * bow;
                  const on = focus === p.slug;
                  return <path key={p.slug} d={`M ${lay.cx} ${lay.cy} Q ${cxp} ${cyp} ${p.x} ${p.y}`} fill="none" stroke={p.color} strokeWidth={on ? 4 : 2.5} strokeLinecap="round" opacity={focus && !on ? 0.18 : on ? 0.95 : 0.5} />;
                })}
              </svg>

              {/* centrální Spaghetti node */}
              <div onMouseEnter={() => setFocus(null)} style={{ position: "absolute", left: lay.cx, top: lay.cy, transform: "translate(-50%,-50%)", width: 132, height: 132, borderRadius: "50%", background: "#fff", border: "2.5px solid var(--text-primary)", boxShadow: "5px 5px 0 var(--border)", display: "grid", placeItems: "center", textAlign: "center", zIndex: 2 }}>
                <div>
                  <p style={{ fontSize: 26, margin: "0 0 2px", lineHeight: 1 }}>🍝</p>
                  <p style={{ ...display, fontSize: 15, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>Spaghetti<span style={{ color: "var(--text-muted)" }}>.ltd</span></p>
                </div>
              </div>

              {lay.pts.map((p) => { const it = items.find((x) => x.slug === p.slug)!; return bannerNode(it, { position: "absolute", left: p.x, top: p.y, transform: "translate(-50%,-50%)", zIndex: focus === p.slug ? 3 : 1 }); })}
            </>
          )}
        </section>
      </div>
      <style>{`@keyframes homeInfoIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .home-node { transition: transform .14s ease, box-shadow .14s ease; }
        .home-node:hover { transform: translate(-50%,-50%) scale(1.03); }
        @media (max-width: 879px) { .home-node:hover { transform: scale(1.03); } }`}</style>
    </main>
  );
}
