"use client";

import { useEffect, useRef, useState } from "react";
import type { NodeDef, Bilingual } from "@/lib/encyclopedia/types";
import type { Lang } from "@/lib/dictionaries";
import type { Theme } from "./Shell";
import { scenarios, pickUnseen, type Scenario } from "@/lib/odds";

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
  cs: { shuffle: "↻ klikni a zamíchej", draw: "↻ klikni a táhni další los", chance: "Šance:" },
  en: { shuffle: "↻ click to shuffle", draw: "↻ click to draw another", chance: "Odds:" },
} as const;

/** Plain realm: znak termínu uprostřed stránky — nebo míchací citáty a losování šancí. */
export function PlainRealm({ node, lang, theme }: { node: NodeDef; lang: Lang; theme: Theme }) {
  const dk = theme === "dark";
  const [D, setD] = useState(460);
  useEffect(() => {
    const onR = () => setD(Math.min(540, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.68)));
    onR(); window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const isQuotes = node.slug === "citaty";
  const isOdds = node.slug === "pravdepodobnost";
  const glyph = node.plain?.glyph ?? "✦";
  const short = glyph.length <= 3;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      <div key={node.slug} style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%)", width: D, height: D, display: "grid", placeItems: "center", animation: "encyPlainIn 420ms cubic-bezier(0.22,1,0.36,1)" }}>
        {isQuotes ? (
          <QuoteStage lang={lang} D={D} dark={dk} />
        ) : isOdds ? (
          <OddsStage lang={lang} D={D} dark={dk} />
        ) : (
          <GlyphStage glyph={glyph} short={short} D={D} accent={node.plain?.accent} dark={dk} />
        )}
      </div>
      <style>{`
        @keyframes encyPlainIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.88); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        @keyframes encyPlainFloat { 0%,100% { transform: translateY(-4px); } 50% { transform: translateY(4px); } }
        @keyframes encyQuoteIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes encyGlyphPop { 0% { transform: scale(1); } 35% { transform: scale(1.18) rotate(-4deg); } 70% { transform: scale(0.94) rotate(2deg); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
}

/** Znak tématu — klik s ním pošťouchne (drobná radost). */
function GlyphStage({ glyph, short, D, accent, dark }: { glyph: string; short: boolean; D: number; accent?: string; dark: boolean }) {
  const [pop, setPop] = useState(0);
  return (
    <button onClick={() => setPop((p) => p + 1)}
      style={{ pointerEvents: "auto", background: "none", border: "none", cursor: "pointer", padding: 20 }}>
      <span key={pop} style={{
        display: "inline-block",
        fontFamily: "var(--font-display)",
        fontSize: short ? D * 0.36 : Math.min(D * 0.105, 42),
        fontWeight: 700, letterSpacing: short ? "-0.02em" : "0.08em",
        color: accent ?? (dark ? "#ece9e4" : "#1a1614"),
        textAlign: "center", lineHeight: 1.1, padding: "0 10px",
        animation: pop ? "encyGlyphPop 420ms cubic-bezier(0.34,1.56,0.64,1)" : "encyPlainFloat 5s ease-in-out infinite",
        userSelect: "none",
      }}>{glyph}</span>
    </button>
  );
}

/** Losovací talíř pravděpodobností — 137 šancí z lib/odds. */
function OddsStage({ lang, D, dark }: { lang: Lang; D: number; dark: boolean }) {
  const ink = dark ? "#ece9e4" : "#1a1614";
  const soft = dark ? "rgba(236,233,228,0.6)" : "rgba(26,22,20,0.55)";
  const [sc, setSc] = useState<Scenario>(scenarios[0]); // deterministicky pro SSR
  const seen = useRef<string[]>([scenarios[0].id]);
  const draw = () => {
    const next = pickUnseen(seen.current, sc.id);
    seen.current = [...seen.current, next.id].slice(-60);
    setSc(next);
  };
  return (
    <button onClick={draw}
      style={{ pointerEvents: "auto", width: "100%", height: "100%", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: D * 0.14 }}>
      <span key={`e-${sc.id}`} style={{ fontSize: Math.min(46, D * 0.1), lineHeight: 1, animation: "encyQuoteIn 320ms ease" }}>{sc.emoji}</span>
      <span key={`q-${sc.id}`} style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: Math.max(14, Math.min(19, D * 0.039)), fontWeight: 600, lineHeight: 1.4, color: ink, textAlign: "center", animation: "encyQuoteIn 320ms ease" }}>
        {sc.question[lang]}
      </span>
      <span key={`o-${sc.id}`} style={{ fontFamily: "var(--font-display)", fontSize: Math.min(30, D * 0.062), fontWeight: 800, letterSpacing: "-0.01em", color: "#d8402c", animation: "encyQuoteIn 380ms ease" }}>
        {UI[lang].chance} {sc.odds}
      </span>
      <span key={`x-${sc.id}`} style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.5, color: soft, textAlign: "center", maxWidth: "92%", animation: "encyQuoteIn 440ms ease" }}>
        {sc.explanation[lang]}
      </span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: soft, marginTop: 4 }}>{UI[lang].draw}</span>
    </button>
  );
}

function QuoteStage({ lang, D, dark }: { lang: Lang; D: number; dark: boolean }) {
  const ink = dark ? "#ece9e4" : "#1a1614";
  const soft = dark ? "rgba(236,233,228,0.6)" : "rgba(26,22,20,0.55)";
  const [idx, setIdx] = useState(0);
  const next = () => setIdx((i) => { let n = i; while (n === i) n = Math.floor(Math.random() * QUOTES.length); return n; });
  const q = QUOTES[idx];
  return (
    <button onClick={next}
      style={{ pointerEvents: "auto", width: "100%", height: "100%", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: D * 0.14 }}>
      <span aria-hidden style={{ fontFamily: "var(--font-display)", fontSize: 44, lineHeight: 0.5, color: soft }}>„</span>
      <span key={idx} style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: Math.max(15, Math.min(21, D * 0.043)), fontWeight: 600, lineHeight: 1.45, color: ink, textAlign: "center", animation: "encyQuoteIn 320ms ease" }}>
        {q.q[lang]}
      </span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, color: soft }}>— {q.a[lang]}</span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: soft, marginTop: 6 }}>{UI[lang].shuffle}</span>
    </button>
  );
}
