"use client";

import { useEffect, useMemo, useState } from "react";
import { OBJECTS } from "@/lib/space";
import { SpaceBody } from "@/components/SpaceBody";
import type { NodeDef } from "@/lib/encyclopedia/types";
import type { Lang } from "@/lib/dictionaries";
import type { Theme } from "./Shell";

export type NavDir = "dive" | "rise" | "jump";

/** Vesmírný realm: těleso hesla uprostřed stránky.
    Klik na něj cykluje zajímavosti. Špagety a text řeší shell. */
export function SpaceRealm({ node, lang = "cs", dir, theme }: { node: NodeDef; lang?: Lang; dir: NavDir; theme: Theme }) {
  const [D, setD] = useState(480);
  useEffect(() => {
    const onR = () => setD(Math.min(560, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.72)));
    onR(); window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  // hvězdné drobky pro hesla bez tělesa (vesmír)
  const specks = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    x: 18 + ((i * 37) % 64), y: 18 + ((i * 53) % 64), r: 1 + ((i * 7) % 3), d: (i % 5) * 0.4,
  })), []);

  const anim = dir === "dive" ? "encyDive 460ms cubic-bezier(0.22,1,0.36,1)" : dir === "rise" ? "encyRise 460ms cubic-bezier(0.22,1,0.36,1)" : "encyFade 380ms ease";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%)", width: D, height: D }}>
        <div key={node.slug} style={{ position: "absolute", inset: 0, animation: anim }}>
          {node.subject ? (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <Subject node={node} lang={lang} D={D} />
            </div>
          ) : (
            specks.map((s, i) => (
              <span key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, borderRadius: "50%", background: theme === "dark" ? "#fff" : "#1a1614", boxShadow: theme === "dark" ? "0 0 6px 1px rgba(255,240,220,0.8)" : "0 0 5px 1px rgba(26,22,20,0.25)", animation: `spaceTwinkle ${2.2 + (i % 3) * 0.6}s ease-in-out ${s.d}s infinite` }} />
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes spacePulse { 0%,100% { transform: scale(0.95); opacity: 0.7; } 50% { transform: scale(1.08); opacity: 1; } }
        @keyframes spaceSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spaceOrbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spaceTwinkle { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes encyBubble { from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.85); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
        @keyframes encyTap { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(5px); } }
        @keyframes encyDive { from { transform: scale(0.55); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes encyRise { from { transform: scale(1.45); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes encyFade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

/** Subjekt hesla — klik cykluje zajímavosti v bublině. Stav se resetuje remountem (key na rodiči). */
function Subject({ node, lang, D }: { node: NodeDef; lang: Lang; D: number }) {
  const [fi, setFi] = useState(-1);
  const feats = node.features ?? [];
  return (
    <button
      onClick={() => feats.length && setFi((i) => (i + 1) % feats.length)}
      title={feats.length ? "👆" : undefined}
      style={{ pointerEvents: feats.length ? "auto" : "none", position: "relative", background: "none", border: "none", cursor: feats.length ? "pointer" : "default", padding: 0 }}>
      <SpaceBody kind={OBJECTS[node.subject!.object].kind} px={Math.round(D * 0.46)} tint={OBJECTS[node.subject!.object].tint} detail />
      {fi >= 0 && feats[fi] && (
        <span key={fi} style={{ position: "absolute", left: "50%", bottom: "calc(100% + 2px)", transform: "translateX(-50%)", whiteSpace: "nowrap", background: "rgba(253,240,224,0.95)", color: "#1a1614", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, borderRadius: 999, padding: "6px 14px", boxShadow: "0 6px 18px rgba(70,12,4,0.35)", animation: "encyBubble 360ms cubic-bezier(0.34,1.56,0.64,1)" }}>
          ✦ {feats[fi][lang]} <span style={{ opacity: 0.45, fontWeight: 600 }}>{fi + 1}/{feats.length}</span>
        </span>
      )}
      {fi < 0 && feats.length > 0 && (
        <span style={{ position: "absolute", left: "50%", top: "calc(100% + 4px)", transform: "translateX(-50%)", fontSize: 15, animation: "encyTap 1.8s ease-in-out infinite" }}>👆</span>
      )}
    </button>
  );
}
