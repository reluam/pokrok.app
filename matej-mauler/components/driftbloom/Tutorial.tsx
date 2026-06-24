"use client";
import { useState } from "react";
import { TUTORIAL_STEPS } from "@/lib/game/tutorial";

const sans = "ui-sans-serif, system-ui, sans-serif";

// A simple stepped overlay. onDone fires when the player finishes (or skips) the coaching cards.
export function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const last = i === TUTORIAL_STEPS.length - 1;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", zIndex: 100, padding: 20 }}>
      <div style={{ fontFamily: sans, background: "var(--bg,#fff)", color: "var(--text-primary,#111)", borderRadius: 16, padding: "22px 22px 18px", width: "min(440px, 94vw)", display: "grid", gap: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <strong style={{ fontSize: 15 }}>how to play — {i + 1}/{TUTORIAL_STEPS.length}</strong>
          <button className="sbtn" onClick={onDone} style={{ fontSize: 12 }}>skip</button>
        </div>
        <p style={{ margin: 0, lineHeight: 1.55 }}>{TUTORIAL_STEPS[i]}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {i > 0 && <button className="sbtn" onClick={() => setI((x) => x - 1)}>back</button>}
          {last
            ? <button className="sbtn" onClick={onDone} style={{ fontWeight: 700 }}>start playing ▶</button>
            : <button className="sbtn" onClick={() => setI((x) => x + 1)} style={{ fontWeight: 700 }}>next</button>}
        </div>
      </div>
    </div>
  );
}
