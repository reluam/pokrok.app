"use client";

import { useEffect, useRef, useState } from "react";
import { RULES, pixelCanvas, useFixedLoop, beep, audio, type GameOutcome } from "../theme";
import {
  initFlappy,
  flapFlappy,
  stepFlappy,
  WIDTH,
  HEIGHT,
  BIRD_X,
  BIRD_R,
  PILLAR_W,
  WARN_Y,
  LIMIT,
  type FlappyState,
} from "@/lib/rules/flappyLogic";

const SCALE = 3;

export default function Flappy({ onResolve }: { onResolve: (o: GameOutcome) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line react-hooks/purity
  const state = useRef<FlappyState>(initFlappy((Date.now() & 0xffff) || 1));
  const [active, setActive] = useState(true);
  const [remaining, setRemaining] = useState(Math.ceil(LIMIT / 1000));
  const [clickVisible, setClickVisible] = useState(false);
  const [started, setStarted] = useState(false);
  const remRef = useRef(remaining);
  const clickRef = useRef(false);
  const startedRef = useRef(false);
  const done = useRef(false);

  function flap() {
    if (done.current) return;
    flapFlappy(state.current);
    beep(700, 30, audio.muted);
  }

  function finish() {
    if (done.current) return;
    done.current = true;
    setActive(false);
    const s = state.current;
    beep(s.status === "won" ? 760 : 180, 180, audio.muted);
    setTimeout(() => onResolve({ won: s.status === "won", foundHiddenPath: s.foundHiddenPath }), 450);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); flap(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useFixedLoop(
    () => {
      if (done.current) return;
      stepFlappy(state.current, 1000 / 60);
      if (state.current.status !== "playing") finish();
    },
    () => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const s = state.current;
      ctx.fillStyle = RULES.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // pillars — bottom column (from `top` to floor) + a ceiling pipe (0 → `ceil`) on later ones
      ctx.fillStyle = "#1c3a1c";
      for (const p of s.pillars) {
        ctx.fillRect(p.x * SCALE, p.top * SCALE, PILLAR_W * SCALE, (HEIGHT - p.top) * SCALE);
        if (p.ceil > 0) ctx.fillRect(p.x * SCALE, 0, PILLAR_W * SCALE, p.ceil * SCALE);
      }
      // bird
      ctx.fillStyle = RULES.yellow;
      ctx.fillRect((BIRD_X - BIRD_R) * SCALE, (s.birdY - BIRD_R) * SCALE, BIRD_R * 2 * SCALE, BIRD_R * 2 * SCALE);

      // HUD state (throttled to changes)
      if (s.started !== startedRef.current) { startedRef.current = s.started; setStarted(s.started); }
      const rem = Math.max(0, Math.ceil((LIMIT - s.elapsed) / 1000));
      if (rem !== remRef.current) { remRef.current = rem; setRemaining(rem); }
      const low = s.status === "playing" && !s.landed && s.birdY + BIRD_R > WARN_Y;
      const blink = low && Math.floor(performance.now() / 240) % 2 === 0;
      if (blink !== clickRef.current) { clickRef.current = blink; setClickVisible(blink); }
    },
    active,
  );

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) pixelCanvas(canvas, WIDTH * SCALE, HEIGHT * SCALE);
  }, []);

  return (
    <div style={{ display: "grid", gap: 10, placeItems: "center" }}>
      <p style={{ fontSize: 9, color: RULES.gray }}>survive 15 seconds. (space / tap)</p>
      <div style={{ position: "relative", touchAction: "none" }}>
        <canvas
          ref={ref}
          onPointerDown={(e) => { e.preventDefault(); flap(); }}
          style={{ width: "min(92vw, 460px)", display: "block", imageRendering: "pixelated", border: `2px solid ${RULES.dim}`, cursor: "pointer" }}
        />
        <span style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", fontFamily: RULES.font, fontSize: 13, color: RULES.white }}>{remaining}</span>
        {!started && (
          <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontFamily: RULES.font, fontSize: 11, color: RULES.green }}>click to start</span>
        )}
        {clickVisible && (
          <span style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", fontFamily: RULES.font, fontSize: 13, color: "#ff5b5b" }}>CLICK</span>
        )}
      </div>
    </div>
  );
}
