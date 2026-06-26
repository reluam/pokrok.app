"use client";
import { useState } from "react";
import { randomGenome } from "@/lib/sim/genome";
import { makeRng } from "@/lib/sim/rng";
import { TUTORIAL_STEPS, TutorialArt } from "@/lib/game/tutorial";
import { BlobView } from "./BlobView";
import { SpaghettiHelix } from "./SpaghettiHelix";
import { GeneDial } from "./GeneDial";
import { FONT_DISPLAY, FONT_SANS, C, hexA } from "./theme";

const sampleGenomes = [11, 23, 47, 5].map((s) => randomGenome(makeRng(s)));
const lineageColors = ["#2f6fed", "#e85d75", "#28a76a", "#e8a23d"];

function Illustration({ art }: { art: TutorialArt }) {
  if (art === "creatures") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 30 }}>🛸</span>
        {sampleGenomes.slice(0, 3).map((g, i) => (
          <div key={i} style={{ background: hexA(lineageColors[i], 0.1), borderRadius: 14 }}><BlobView genome={g} size={62} /></div>
        ))}
      </div>
    );
  }
  if (art === "helix") return <SpaghettiHelix width={300} height={84} />;
  if (art === "dial") return <GeneDial label="armor" value={0.45} demand={0.82} color="#2f6fed" canPush={false} onPush={() => {}} />;
  if (art === "map") {
    return (
      <svg width={240} height={110} viewBox="0 0 240 110">
        {[[70, 55], [150, 45], [120, 80]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={34} fill="rgba(150,200,120,0.5)" stroke="rgba(120,170,90,0.7)" strokeWidth={2} />
        ))}
        {[[60, 50, "#2f6fed"], [82, 62, "#2f6fed"], [150, 40, "#e85d75"], [160, 55, "#e85d75"], [120, 84, "#28a76a"], [134, 74, "#e8a23d"]].map(([x, y, c], i) => (
          <circle key={`d${i}`} cx={x as number} cy={y as number} r={4} fill={c as string} />
        ))}
      </svg>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 38 }}>🏆</span>
      <div style={{ background: hexA("#2f6fed", 0.1), borderRadius: 14 }}><BlobView genome={sampleGenomes[0]} size={64} /></div>
    </div>
  );
}

export function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const step = TUTORIAL_STEPS[i];
  const last = i === TUTORIAL_STEPS.length - 1;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,22,20,0.5)", backdropFilter: "blur(3px)", display: "grid", placeItems: "center", zIndex: 100, padding: 20, fontFamily: FONT_SANS }}>
      <div className="db-pop" style={{ background: "#fff", color: C.text, borderRadius: 22, padding: "20px 22px 18px", width: "min(500px, 94vw)", display: "grid", gap: 14, boxShadow: "0 24px 70px rgba(26,22,20,0.4)", border: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>field study — how to play</strong>
          <button onClick={onDone} style={{ border: "none", background: "none", color: C.muted, fontSize: 13, cursor: "pointer", padding: 4 }}>skip ✕</button>
        </div>

        <div style={{ height: 130, display: "grid", placeItems: "center", background: "rgba(26,22,20,0.035)", borderRadius: 16, overflow: "hidden" }}>
          <Illustration art={step.art} />
        </div>

        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {TUTORIAL_STEPS.map((_, k) => (
            <span key={k} style={{ width: k === i ? 18 : 7, height: 7, borderRadius: 999, background: k === i ? "#16a34a" : "rgba(26,22,20,0.15)", transition: "all .2s ease" }} />
          ))}
        </div>

        <p style={{ margin: 0, lineHeight: 1.55, fontSize: 15, minHeight: 66 }}>{step.text}</p>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {i > 0 && (
            <button onClick={() => setI((x) => x - 1)} style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.text2, borderRadius: 999, padding: "9px 16px", fontWeight: 600, cursor: "pointer", fontFamily: FONT_SANS }}>back</button>
          )}
          <span style={{ flex: 1 }} />
          <button className="db-advance" onClick={() => (last ? onDone() : setI((x) => x + 1))} style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, color: "#fff", background: "#16a34a", border: "none", borderRadius: 999, padding: "10px 22px", cursor: "pointer", letterSpacing: "-0.01em" }}>
            {last ? "start playing" : "next"} <span className="arr">▶</span>
          </button>
        </div>
      </div>
    </div>
  );
}
