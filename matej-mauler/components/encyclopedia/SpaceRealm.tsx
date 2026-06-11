"use client";

import { useEffect, useMemo, useState } from "react";
import { OBJECTS } from "@/lib/space";
import { SpaceBody } from "@/components/SpaceBody";
import type { NodeDef } from "@/lib/encyclopedia/types";
import type { Lang } from "@/lib/dictionaries";
import type { Theme } from "./Shell";
import { SauceStage, seedOf } from "./Sauce";

export type NavDir = "dive" | "rise" | "jump";

/** Vesmírný realm: kápnutá omáčka uprostřed, na ní subjekt hesla.
    Špagety a text řeší jednotný shell. */
export function SpaceRealm({ node, dir, theme }: { node: NodeDef; lang?: Lang; dir: NavDir; theme: Theme }) {
  const [D, setD] = useState(480);
  useEffect(() => {
    const onR = () => setD(Math.min(560, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.72)));
    onR(); window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  // hvězdné drobky na omáčce pro hesla bez subjektu (vesmír)
  const specks = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    x: 22 + ((i * 37) % 56), y: 22 + ((i * 53) % 56), r: 1 + ((i * 7) % 3), d: (i % 5) * 0.4,
  })), []);

  const anim = dir === "dive" ? "encyDive 460ms cubic-bezier(0.22,1,0.36,1)" : dir === "rise" ? "encyRise 460ms cubic-bezier(0.22,1,0.36,1)" : "encyFade 380ms ease";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      <SauceStage size={D} seed={seedOf(node.slug)} dark={theme === "dark"}>
        <div key={node.slug} style={{ position: "absolute", inset: 0, animation: anim }}>
          {node.subject ? (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <SpaceBody kind={OBJECTS[node.subject.object].kind} px={Math.round(D * 0.46)} tint={OBJECTS[node.subject.object].tint} detail />
            </div>
          ) : (
            specks.map((s, i) => (
              <span key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, borderRadius: "50%", background: "#fff", boxShadow: "0 0 6px 1px rgba(255,240,220,0.8)", animation: `spaceTwinkle ${2.2 + (i % 3) * 0.6}s ease-in-out ${s.d}s infinite` }} />
            ))
          )}
        </div>
      </SauceStage>

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
