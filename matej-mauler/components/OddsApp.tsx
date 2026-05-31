"use client";

import { useState } from "react";
import Link from "next/link";
import { scenarios, pickRandom, oddsUi, contextLine, type Scenario } from "@/lib/odds";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

export function OddsApp({ lang }: { lang: Lang }) {
  const t = oddsUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";

  const [current, setCurrent] = useState<Scenario | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const roll = (exclude?: string) => {
    setCurrent(pickRandom(exclude));
    setAnimKey((k) => k + 1);
  };

  const pick = (s: Scenario) => {
    setCurrent(s);
    setAnimKey((k) => k + 1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Back */}
      <div style={{ padding: "20px 24px 0" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>
          {t.back}
        </Link>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)", marginBottom: "14px" }}>
            {t.eyebrow}
          </p>
          <h1 style={{ ...display, fontSize: "clamp(36px, 8vw, 60px)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em", marginBottom: "14px" }}>
            {t.title}
          </h1>
          <p style={{ ...serifItalic, fontSize: "18px", color: "var(--text-secondary)", lineHeight: 1.4, maxWidth: "420px", margin: "0 auto" }}>
            {t.intro}
          </p>
        </div>

        {/* Result */}
        {current && (
          <div key={animKey} style={{
            background: "#fff",
            border: "2.5px solid var(--border)",
            borderRadius: "20px",
            boxShadow: "6px 6px 0 var(--border)",
            padding: "32px 28px",
            marginBottom: "24px",
            textAlign: "center",
            animation: "oddsPop 0.45s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            <span style={{ fontSize: "52px", display: "block", marginBottom: "16px", lineHeight: 1 }}>{current.emoji}</span>
            <p style={{ ...display, fontSize: "20px", fontWeight: 800, lineHeight: 1.25, marginBottom: "20px", color: "var(--text-primary)" }}>
              {current.question[lang]}
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "6px" }}>
              {t.chanceLabel}
            </p>
            <p style={{ ...display, fontSize: "clamp(30px, 7vw, 46px)", fontWeight: 900, color: "var(--text-primary)", marginBottom: "8px", letterSpacing: "-0.01em" }}>
              {current.odds}
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-muted)", marginBottom: "22px" }}>
              {t.contextPrefix} {contextLine(current.oneIn, lang)}.
            </p>
            <p style={{ ...serifItalic, fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {current.explanation[lang]}
            </p>
          </div>
        )}

        {/* Roll button */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <button
            onClick={() => roll(current?.id)}
            style={{
              background: "var(--text-primary)", color: "var(--bg)",
              border: "2.5px solid var(--text-primary)", borderRadius: "12px",
              boxShadow: "4px 4px 0 var(--text-primary)",
              padding: "14px 30px", fontFamily: "var(--font-sans)",
              fontSize: "15px", fontWeight: 700, cursor: "pointer",
              transition: "transform 140ms ease, box-shadow 140ms ease",
            }}
            onMouseEnter={(e) => { const el = e.currentTarget; el.style.transform = "translate(-2px,-2px)"; el.style.boxShadow = "6px 6px 0 var(--text-primary)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget; el.style.transform = ""; el.style.boxShadow = "4px 4px 0 var(--text-primary)"; }}
          >
            {current ? t.rollAgain : t.roll}
          </button>
        </div>

        {/* Pick a scenario */}
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", letterSpacing: "0.04em" }}>
          {t.pickPrompt}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px", marginBottom: "32px" }}>
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => pick(s)}
              style={{
                background: current?.id === s.id ? "#DBEAFE" : "#fff",
                border: "2px solid var(--border)", borderRadius: "14px",
                boxShadow: "3px 3px 0 var(--border)",
                padding: "14px 16px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "12px", textAlign: "left",
                transition: "transform 140ms ease, box-shadow 140ms ease, background 140ms ease",
              }}
              onMouseEnter={(e) => { const el = e.currentTarget; el.style.transform = "translate(-2px,-2px)"; el.style.boxShadow = "5px 5px 0 var(--border)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget; el.style.transform = ""; el.style.boxShadow = "3px 3px 0 var(--border)"; }}
            >
              <span style={{ fontSize: "24px", lineHeight: 1, flexShrink: 0 }}>{s.emoji}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.3 }}>
                {s.question[lang]}
              </span>
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <p style={{ ...serifItalic, fontSize: "13px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
          {t.disclaimer}
        </p>
      </div>

      <style>{`
        @keyframes oddsPop {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
