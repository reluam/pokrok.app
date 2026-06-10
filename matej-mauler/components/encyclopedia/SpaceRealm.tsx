"use client";

import { useEffect, useRef, useState } from "react";
import { OBJECTS } from "@/lib/space";
import { SpaceBody } from "@/components/SpaceBody";
import { getNode, titleOf } from "@/lib/encyclopedia/graph";
import type { NodeDef } from "@/lib/encyclopedia/types";
import type { Lang } from "@/lib/dictionaries";

export type NavDir = "dive" | "rise" | "jump";

const RED_BADGE = { cs: "neprobádáno", en: "uncharted" } as const;

/** Vesmírný realm: hvězdné pozadí + subjekt uprostřed + klikatelné satelity kolem. */
export function SpaceRealm({ node, lang, dir, onNavigate }: { node: NodeDef; lang: Lang; dir: NavDir; onNavigate: (slug: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [subjectPx, setSubjectPx] = useState(300);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const resize = () => {
      cv.width = window.innerWidth; cv.height = window.innerHeight;
      setSubjectPx(Math.min(340, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.42)));
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

  const anim = dir === "dive" ? "encyDive 460ms cubic-bezier(0.22,1,0.36,1)" : dir === "rise" ? "encyRise 460ms cubic-bezier(0.22,1,0.36,1)" : "encyFade 380ms ease";

  return (
    <div style={{ position: "fixed", inset: 0, background: "radial-gradient(120% 100% at 35% 30%, #0b1026, #04060f 75%)", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />

      <div key={node.slug} style={{ position: "absolute", inset: 0, animation: anim }}>
        {/* subjekt — centrální vizuál pod textem, neklikatelný */}
        {node.subject && (
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none", opacity: 0.92 }}>
            <SpaceBody kind={OBJECTS[node.subject.object].kind} px={node.subject.size ?? subjectPx} tint={OBJECTS[node.subject.object].tint} detail />
          </div>
        )}

        {/* satelity — synapse kolem subjektu, nikdy pod textem */}
        {(node.satellites ?? []).map((s, i) => {
          const target = getNode(s.to);
          const red = !target;
          const label = s.label?.[lang] ?? titleOf(s.to, lang);
          const def = s.object ? OBJECTS[s.object] : null;
          return (
            <button key={`${s.to}-${i}`} onClick={() => onNavigate(s.to)} title={label}
              style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%,-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 6, animation: `encyFloat ${4 + (i % 4)}s ease-in-out infinite`, opacity: red ? 0.75 : 1 }}>
              {s.emoji ? (
                <span style={{ fontSize: (s.size ?? 40) * 0.85, lineHeight: 1, filter: "drop-shadow(0 0 14px rgba(255,255,255,0.35))" }}>{s.emoji}</span>
              ) : def ? (
                <SpaceBody kind={def.kind} px={s.size ?? 40} tint={def.tint} />
              ) : red ? (
                <span style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px dashed rgba(255,255,255,0.5)", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700 }}>?</span>
              ) : (
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", boxShadow: "0 0 12px 3px rgba(255,255,255,0.65)" }} />
              )}
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: red ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.85)", letterSpacing: "0.04em", whiteSpace: "nowrap", textShadow: "0 1px 6px rgba(0,0,0,0.7)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
                {label}
              </span>
              {red && (
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", marginTop: -5 }}>{RED_BADGE[lang]}</span>
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes spacePulse { 0%,100% { transform: scale(0.95); opacity: 0.7; } 50% { transform: scale(1.08); opacity: 1; } }
        @keyframes spaceSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spaceOrbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spaceTwinkle { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes encyFloat { 0%,100% { margin-top: -3px; } 50% { margin-top: 3px; } }
        @keyframes encyDive { from { transform: scale(0.55); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes encyRise { from { transform: scale(1.45); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes encyFade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
