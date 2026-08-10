"use client";

import { useEffect, useRef, useState } from "react";
import { RULES, beep, audio, type GameOutcome } from "../theme";
import { initSimon, pressSimon, type SimonState } from "@/lib/rules/simonLogic";

const PAD_COLORS = [RULES.green, RULES.yellow, "#4dd2ff", "#ff6bd6"];
const TONES = [440, 550, 660, 770];

export default function SimonSays({ onResolve }: { onResolve: (o: GameOutcome) => void }) {
  // eslint-disable-next-line react-hooks/purity
  const state = useRef<SimonState>(initSimon((Date.now() & 0xffff) || 1));
  const timers = useRef<number[]>([]);
  const [mode, setMode] = useState<"show" | "input">("show");
  const [lit, setLit] = useState<number | null>(null);
  const done = useRef(false);

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  function showSequence() {
    clearTimers();
    setMode("show");
    setLit(null);
    let t = 350;
    for (const pad of state.current.sequence) {
      const at = t;
      timers.current.push(window.setTimeout(() => { setLit(pad); beep(TONES[pad], 220, audio.muted); }, at));
      timers.current.push(window.setTimeout(() => setLit(null), at + 360));
      t += 520;
    }
    timers.current.push(window.setTimeout(() => setMode("input"), t));
  }

  function click(pad: number) {
    if (mode !== "input" || done.current) return;
    setLit(pad);
    beep(TONES[pad], 150, audio.muted);
    window.setTimeout(() => setLit((v) => (v === pad ? null : v)), 160);
    const before = state.current.sequence.length;
    pressSimon(state.current, pad);
    const s = state.current;
    if (s.status === "won") {
      done.current = true;
      setMode("show");
      setTimeout(() => onResolve({ won: true, foundHiddenPath: s.foundHiddenPath }), 450);
      return;
    }
    if (s.input.length === 0 && s.sequence.length > before) showSequence(); // round done, next sequence
  }

  useEffect(() => {
    const id = window.setTimeout(showSequence, 0); // defer so we don't setState synchronously in the effect
    timers.current.push(id);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "grid", gap: 14, placeItems: "center" }}>
      <p style={{ fontSize: 9, color: RULES.gray }}>{mode === "show" ? "watch…" : "repeat the pattern. (tap the pads)"}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 82px)", gridTemplateRows: "repeat(2, 82px)", gap: 8, touchAction: "none" }}>
        {[0, 1, 2, 3].map((pad) => (
          <button
            key={pad}
            onPointerDown={(e) => { e.preventDefault(); click(pad); }}
            aria-label={`pad ${pad + 1}`}
            style={{
              width: 82,
              height: 82,
              border: "none",
              background: PAD_COLORS[pad],
              opacity: lit === pad ? 1 : 0.28,
              cursor: mode === "input" ? "pointer" : "default",
              transition: "opacity 80ms linear",
            }}
          />
        ))}
      </div>
    </div>
  );
}
