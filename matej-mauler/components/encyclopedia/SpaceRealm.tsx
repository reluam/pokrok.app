"use client";

import { useEffect, useRef, useState } from "react";
import { OBJECTS } from "@/lib/space";
import { SpaceBody } from "@/components/SpaceBody";
import type { NodeDef } from "@/lib/encyclopedia/types";
import type { Lang } from "@/lib/dictionaries";
import type { Theme } from "./Shell";

export type NavDir = "dive" | "rise" | "jump";

/** Vesmírný realm: tmavé kulaté okénko do vesmíru uprostřed stránky.
    Subjekt hesla uvnitř, špagety a text řeší jednotný shell. */
export function SpaceRealm({ node, dir, theme }: { node: NodeDef; lang?: Lang; dir: NavDir; theme: Theme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [D, setD] = useState(480);

  useEffect(() => {
    const onR = () => setD(Math.min(560, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.72)));
    onR(); window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = D * dpr; cv.height = D * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const stars = Array.from({ length: 130 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.2,
      o: Math.random() * 0.5 + 0.2, sp: Math.random() * 1.5 + 0.3, ph: Math.random() * 6.28,
    }));
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, D, D);
      const g = ctx.createLinearGradient(0, D * 0.2, D, D * 0.8);
      g.addColorStop(0, "rgba(80,60,140,0.0)"); g.addColorStop(0.5, "rgba(120,90,180,0.10)"); g.addColorStop(1, "rgba(80,60,140,0.0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, D, D);
      const tt = Date.now() / 1000;
      for (const s of stars) {
        const o = s.o * (0.5 + 0.5 * Math.sin(tt * s.sp + s.ph));
        ctx.beginPath(); ctx.arc(s.x * D, s.y * D, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,225,255,${o})`; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [D]);

  const anim = dir === "dive" ? "encyDive 460ms cubic-bezier(0.22,1,0.36,1)" : dir === "rise" ? "encyRise 460ms cubic-bezier(0.22,1,0.36,1)" : "encyFade 380ms ease";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%)",
        width: D, height: D, borderRadius: "50%", overflow: "hidden",
        background: "radial-gradient(120% 100% at 35% 30%, #0b1026, #04060f 75%)",
        boxShadow: theme === "light"
          ? "0 30px 90px rgba(26,22,20,0.3), 0 0 0 1px rgba(26,22,20,0.08)"
          : "0 30px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)",
      }}>
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        {node.subject && (
          <div key={node.slug} style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", animation: anim }}>
            <div style={{ opacity: 0.95 }}>
              <SpaceBody kind={OBJECTS[node.subject.object].kind} px={Math.round(D * 0.5)} tint={OBJECTS[node.subject.object].tint} detail />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spacePulse { 0%,100% { transform: scale(0.95); opacity: 0.7; } 50% { transform: scale(1.08); opacity: 1; } }
        @keyframes spaceSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spaceOrbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spaceTwinkle { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes encyDive { from { transform: scale(0.55); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes encyRise { from { transform: scale(1.45); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes encyFade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
