"use client";

import { useEffect, useState } from "react";
import type { NodeDef, Bilingual } from "@/lib/encyclopedia/types";
import type { Lang } from "@/lib/dictionaries";
import type { Theme } from "./Shell";

const QUOTES: { q: Bilingual; a: Bilingual }[] = [
  { q: { cs: "Buď tou změnou, kterou chceš vidět ve světě.", en: "Be the change you wish to see in the world." }, a: { cs: "Gándhí (nikdy to neřekl)", en: "Gandhi (never said it)" } },
  { q: { cs: "Myslím, tedy jsem.", en: "I think, therefore I am." }, a: { cs: "René Descartes", en: "René Descartes" } },
  { q: { cs: "Génius je z 1 % inspirace a z 99 % potu.", en: "Genius is 1% inspiration and 99% perspiration." }, a: { cs: "Thomas Edison", en: "Thomas Edison" } },
  { q: { cs: "Problém citátů na internetu je, že nikdy nevíte, jestli jsou pravé.", en: "The trouble with quotes on the internet is that you never know if they're genuine." }, a: { cs: "Abraham Lincoln", en: "Abraham Lincoln" } },
  { q: { cs: "Nepanikař.", en: "Don't panic." }, a: { cs: "Douglas Adams", en: "Douglas Adams" } },
  { q: { cs: "Bez hudby by byl život omyl.", en: "Without music, life would be a mistake." }, a: { cs: "Friedrich Nietzsche", en: "Friedrich Nietzsche" } },
  { q: { cs: "To je jeden malý krok pro člověka, jeden velký skok pro lidstvo.", en: "That's one small step for man, one giant leap for mankind." }, a: { cs: "Neil Armstrong", en: "Neil Armstrong" } },
  { q: { cs: "Vesmír je velký. Vážně velký.", en: "Space is big. Really big." }, a: { cs: "Douglas Adams", en: "Douglas Adams" } },
  { q: { cs: "Vím, že nic nevím.", en: "I know that I know nothing." }, a: { cs: "Sókratés", en: "Socrates" } },
];

const UI = {
  cs: { shuffle: "↻ klikni a zamíchej" },
  en: { shuffle: "↻ click to shuffle" },
} as const;

/** Plain realm: kulatý talíř uprostřed — znak tématu, nebo míchací talíř citátů. */
export function PlainRealm({ node, lang, theme }: { node: NodeDef; lang: Lang; theme: Theme }) {
  const dk = theme === "dark";
  const [D, setD] = useState(460);
  useEffect(() => {
    const onR = () => setD(Math.min(540, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.68)));
    onR(); window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const isQuotes = node.slug === "citaty";
  const glyph = node.plain?.glyph ?? "✦";
  const short = glyph.length <= 3;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      <div key={node.slug} style={{
        position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%)",
        width: D, height: D, borderRadius: "50%",
        background: dk
          ? "radial-gradient(120% 100% at 35% 30%, #1c1d28, #101118 75%)"
          : "radial-gradient(120% 100% at 35% 30%, #fffdf6, #f1ece0 75%)",
        boxShadow: dk
          ? "0 30px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.1)"
          : "0 30px 90px rgba(26,22,20,0.22), 0 0 0 1px rgba(26,22,20,0.08)",
        display: "grid", placeItems: "center", animation: "encyPlainIn 460ms cubic-bezier(0.22,1,0.36,1)",
      }}>
        {isQuotes ? (
          <QuoteStage lang={lang} dark={dk} D={D} />
        ) : (
          <span style={{
            fontFamily: short ? "var(--font-display)" : "var(--font-display)",
            fontSize: short ? D * 0.34 : Math.min(D * 0.11, 44),
            fontWeight: 700, letterSpacing: short ? "-0.02em" : "0.08em",
            color: node.plain?.accent ?? (dk ? "#ece9e4" : "#1a1614"),
            textAlign: "center", lineHeight: 1.1, padding: "0 24px",
            animation: "encyPlainFloat 5s ease-in-out infinite", userSelect: "none",
          }}>{glyph}</span>
        )}
      </div>
      <style>{`
        @keyframes encyPlainIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.85); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        @keyframes encyPlainFloat { 0%,100% { transform: translateY(-4px); } 50% { transform: translateY(4px); } }
        @keyframes encyQuoteIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

function QuoteStage({ lang, dark, D }: { lang: Lang; dark: boolean; D: number }) {
  const [idx, setIdx] = useState(0);
  const next = () => setIdx((i) => { let n = i; while (n === i) n = Math.floor(Math.random() * QUOTES.length); return n; });
  const q = QUOTES[idx];
  const ink = dark ? "#ece9e4" : "#1a1614";
  return (
    <button onClick={next}
      style={{ pointerEvents: "auto", width: "100%", height: "100%", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: D * 0.13 }}>
      <span aria-hidden style={{ fontFamily: "var(--font-display)", fontSize: 44, lineHeight: 0.5, color: dark ? "rgba(236,233,228,0.35)" : "rgba(26,22,20,0.3)" }}>„</span>
      <span key={idx} style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: Math.max(15, Math.min(22, D * 0.045)), fontWeight: 600, lineHeight: 1.45, color: ink, textAlign: "center", animation: "encyQuoteIn 320ms ease" }}>
        {q.q[lang]}
      </span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, color: dark ? "rgba(236,233,228,0.6)" : "rgba(26,22,20,0.55)" }}>— {q.a[lang]}</span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: dark ? "rgba(236,233,228,0.4)" : "rgba(26,22,20,0.4)", marginTop: 6 }}>{UI[lang].shuffle}</span>
    </button>
  );
}
