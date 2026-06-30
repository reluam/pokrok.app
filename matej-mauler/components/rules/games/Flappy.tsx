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
  GAP_H,
  PIPE_W,
  type FlappyState,
} from "@/lib/rules/flappyLogic";

const SCALE = 3; // internal px → bigger canvas buffer for crisper pixels

export default function Flappy({ onResolve }: { onResolve: (o: GameOutcome) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line react-hooks/purity
  const state = useRef<FlappyState>(initFlappy((Date.now() & 0xffff) || 1));
  const [active, setActive] = useState(true);
  const done = useRef(false);

  function flap() {
    if (done.current) return;
    flapFlappy(state.current);
    beep(720, 30, audio.muted);
  }

  function finish() {
    if (done.current) return;
    done.current = true;
    setActive(false);
    const s = state.current;
    if (s.status === "lost") beep(180, 160, audio.muted);
    setTimeout(() => onResolve({ won: s.status === "won", foundHiddenPath: s.foundHiddenPath }), 400);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        flap();
      }
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
      // pipes — note their tops start at SKY, leaving the top of the screen permanently clear
      ctx.fillStyle = "#1c3a1c";
      for (const p of s.pipes) {
        const x = p.x * SCALE;
        const w = PIPE_W * SCALE;
        const top = (p.gapY - GAP_H / 2) * SCALE;
        const bot = (p.gapY + GAP_H / 2) * SCALE;
        ctx.fillRect(x, s.sky * SCALE, w, top - s.sky * SCALE);
        ctx.fillRect(x, bot, w, HEIGHT * SCALE - bot);
      }
      // bird
      ctx.fillStyle = RULES.yellow;
      ctx.fillRect((BIRD_X - BIRD_R) * SCALE, (s.birdY - BIRD_R) * SCALE, BIRD_R * 2 * SCALE, BIRD_R * 2 * SCALE);
      // score
      ctx.fillStyle = RULES.gray;
      ctx.fillRect(4, 4, (s.passed / s.total) * (WIDTH * SCALE - 8), 3);
    },
    active,
  );

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) pixelCanvas(canvas, WIDTH * SCALE, HEIGHT * SCALE);
  }, []);

  return (
    <div style={{ display: "grid", gap: 10, placeItems: "center", touchAction: "none" }}>
      <p style={{ fontSize: 9, color: RULES.gray }}>flap through the gaps. (space / tap)</p>
      <canvas
        ref={ref}
        onPointerDown={(e) => { e.preventDefault(); flap(); }}
        style={{ width: "min(92vw, 460px)", imageRendering: "pixelated", border: `2px solid ${RULES.dim}`, cursor: "pointer" }}
      />
    </div>
  );
}
