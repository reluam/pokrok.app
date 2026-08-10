"use client";

import { useEffect, useRef, useState } from "react";
import { RULES, pixelCanvas, useFixedLoop, beep, audio, type GameOutcome } from "../theme";
import {
  initRacing,
  setVelRacing,
  stepRacing,
  WIDTH,
  HEIGHT,
  FINISH_Y,
  FINISH_X0,
  FINISH_X1,
  CP,
  CP_R,
  type RacingState,
} from "@/lib/rules/racingLogic";

const SCALE = 3;
const SPEED = 0.05;

export default function Racing({ onResolve }: { onResolve: (o: GameOutcome) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef<RacingState>(initRacing());
  const held = useRef({ up: false, down: false, left: false, right: false });
  const lapRef = useRef(0);
  const [active] = useState(true);
  const done = useRef(false);

  function finish() {
    if (done.current) return;
    done.current = true;
    const s = state.current;
    beep(760, 200, audio.muted);
    setTimeout(() => onResolve({ won: true, foundHiddenPath: s.foundHiddenPath }), 450);
  }

  useEffect(() => {
    const set = (k: string, v: boolean) => {
      if (k === "ArrowUp" || k === "w") held.current.up = v;
      else if (k === "ArrowDown" || k === "s") held.current.down = v;
      else if (k === "ArrowLeft" || k === "a") held.current.left = v;
      else if (k === "ArrowRight" || k === "d") held.current.right = v;
      else return;
    };
    const down = (e: KeyboardEvent) => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault(); set(e.key, true); };
    const up = (e: KeyboardEvent) => set(e.key, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useFixedLoop(
    (dt) => {
      if (done.current) return;
      const h = held.current;
      let vx = (h.right ? 1 : 0) - (h.left ? 1 : 0);
      let vy = (h.down ? 1 : 0) - (h.up ? 1 : 0);
      const m = Math.hypot(vx, vy) || 1;
      vx = (vx / m) * SPEED; vy = (vy / m) * SPEED;
      setVelRacing(state.current, vx, vy);
      stepRacing(state.current, dt);
      if (state.current.lap !== lapRef.current) { lapRef.current = state.current.lap; beep(560, 60, audio.muted); }
      if (state.current.status === "won") finish();
    },
    () => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const s = state.current;
      ctx.fillStyle = RULES.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // decorative oval track: a gray band with a darker infield
      ctx.strokeStyle = "#2c2c2c"; ctx.lineWidth = 16 * SCALE;
      ctx.beginPath();
      ctx.ellipse((WIDTH / 2) * SCALE, (HEIGHT / 2) * SCALE, 44 * SCALE, 34 * SCALE, 0, 0, Math.PI * 2);
      ctx.stroke();
      // finish line
      ctx.fillStyle = RULES.white;
      for (let x = FINISH_X0; x < FINISH_X1; x += 6) ctx.fillRect(x * SCALE, (FINISH_Y - 1) * SCALE, 3 * SCALE, 2 * SCALE);
      // checkpoint
      ctx.strokeStyle = RULES.yellow; ctx.lineWidth = 2 * SCALE;
      ctx.beginPath(); ctx.arc(CP.x * SCALE, CP.y * SCALE, CP_R * SCALE, 0, Math.PI * 2); ctx.stroke();
      if (s.cpTouched) { ctx.fillStyle = RULES.yellow; ctx.beginPath(); ctx.arc(CP.x * SCALE, CP.y * SCALE, 3 * SCALE, 0, Math.PI * 2); ctx.fill(); }
      // car
      ctx.fillStyle = RULES.green;
      ctx.fillRect((s.car.x - 3) * SCALE, (s.car.y - 3) * SCALE, 6 * SCALE, 6 * SCALE);
    },
    active,
  );

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) pixelCanvas(canvas, WIDTH * SCALE, HEIGHT * SCALE);
  }, []);

  const btnStyle = { fontFamily: RULES.font, fontSize: 14, width: 48, height: 48, background: RULES.dim, color: RULES.white, border: "none" } as const;
  const hold = (k: "up" | "down" | "left" | "right") => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); held.current[k] = true; },
    onPointerUp: () => { held.current[k] = false; },
    onPointerLeave: () => { held.current[k] = false; },
  });

  return (
    <div style={{ display: "grid", gap: 10, placeItems: "center" }}>
      <p style={{ fontSize: 9, color: RULES.gray }}>three laps of the track. (arrows / wasd)</p>
      <canvas ref={ref} style={{ width: "min(88vw, 380px)", imageRendering: "pixelated", border: `2px solid ${RULES.dim}` }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 48px)", gap: 4, justifyContent: "center", touchAction: "none" }}>
        <span />
        <button style={btnStyle} {...hold("up")}>▲</button>
        <span />
        <button style={btnStyle} {...hold("left")}>◀</button>
        <button style={btnStyle} {...hold("down")}>▼</button>
        <button style={btnStyle} {...hold("right")}>▶</button>
      </div>
    </div>
  );
}
