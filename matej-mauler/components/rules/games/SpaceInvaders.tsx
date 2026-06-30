"use client";

import { useEffect, useRef, useState } from "react";
import { RULES, pixelCanvas, useFixedLoop, beep, audio, type GameOutcome } from "../theme";
import {
  initInvaders,
  moveInvaders,
  fireInvaders,
  stepInvaders,
  WIDTH,
  HEIGHT,
  INV_W,
  INV_H,
  PLAYER_Y,
  PLAYER_W,
  type InvadersState,
} from "@/lib/rules/invadersLogic";

const SCALE = 3;
const MOVE = 0.06; // units per ms

export default function SpaceInvaders({ onResolve }: { onResolve: (o: GameOutcome) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line react-hooks/purity
  const state = useRef<InvadersState>(initInvaders((Date.now() & 0xffff) || 1));
  const dir = useRef(0);
  const [active, setActive] = useState(true);
  const done = useRef(false);

  function fire() {
    if (done.current) return;
    const before = state.current.playerBullet;
    fireInvaders(state.current);
    if (state.current.playerBullet && state.current.playerBullet !== before) beep(620, 30, audio.muted);
  }

  function finish() {
    if (done.current) return;
    done.current = true;
    setActive(false);
    const s = state.current;
    beep(s.status === "won" ? 720 : 180, 160, audio.muted);
    setTimeout(() => onResolve({ won: s.status === "won", foundHiddenPath: s.foundHiddenPath }), 400);
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") dir.current = -1;
      else if (e.key === "ArrowRight" || e.key === "d") dir.current = 1;
      else if (e.key === " ") { e.preventDefault(); fire(); }
    };
    const up = (e: KeyboardEvent) => {
      if ((e.key === "ArrowLeft" || e.key === "a") && dir.current === -1) dir.current = 0;
      if ((e.key === "ArrowRight" || e.key === "d") && dir.current === 1) dir.current = 0;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useFixedLoop(
    (dt) => {
      if (done.current) return;
      if (dir.current) moveInvaders(state.current, dir.current * MOVE * dt);
      stepInvaders(state.current, dt);
      if (state.current.status !== "playing") finish();
    },
    () => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const s = state.current;
      ctx.fillStyle = RULES.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = RULES.green;
      for (const inv of s.invaders)
        if (inv.alive) ctx.fillRect((inv.x - INV_W / 2) * SCALE, (inv.y - INV_H / 2) * SCALE, INV_W * SCALE, INV_H * SCALE);
      // player cannon
      ctx.fillStyle = RULES.white;
      ctx.fillRect((s.px - PLAYER_W / 2) * SCALE, PLAYER_Y * SCALE, PLAYER_W * SCALE, 5 * SCALE);
      // bullets
      if (s.playerBullet) {
        ctx.fillStyle = RULES.yellow;
        ctx.fillRect((s.playerBullet.x - 1) * SCALE, s.playerBullet.y * SCALE, 2 * SCALE, 4 * SCALE);
      }
      ctx.fillStyle = "#ff5b5b";
      for (const b of s.invaderBullets) ctx.fillRect((b.x - 1) * SCALE, b.y * SCALE, 2 * SCALE, 4 * SCALE);
    },
    active,
  );

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) pixelCanvas(canvas, WIDTH * SCALE, HEIGHT * SCALE);
  }, []);

  const btnStyle = { fontFamily: RULES.font, fontSize: 14, width: 56, height: 48, background: RULES.dim, color: RULES.white, border: "none" } as const;

  return (
    <div style={{ display: "grid", gap: 10, placeItems: "center" }}>
      <p style={{ fontSize: 9, color: RULES.gray }}>shoot them before they land. (← → move · space fire)</p>
      <canvas ref={ref} style={{ width: "min(88vw, 380px)", imageRendering: "pixelated", border: `2px solid ${RULES.dim}` }} />
      <div style={{ display: "flex", gap: 6, touchAction: "none" }}>
        <button style={btnStyle} onPointerDown={(e) => { e.preventDefault(); dir.current = -1; }} onPointerUp={() => { dir.current = 0; }} onPointerLeave={() => { dir.current = 0; }}>◀</button>
        <button style={btnStyle} onPointerDown={(e) => { e.preventDefault(); dir.current = 1; }} onPointerUp={() => { dir.current = 0; }} onPointerLeave={() => { dir.current = 0; }}>▶</button>
        <button style={btnStyle} onPointerDown={(e) => { e.preventDefault(); fire(); }}>↑</button>
      </div>
    </div>
  );
}
