"use client";

import { useEffect, useRef, useState } from "react";
import { RULES, pixelCanvas, useFixedLoop, beep, audio, type GameOutcome } from "../theme";
import {
  initChicken,
  stepChicken,
  moveChicken,
  COLS,
  ROWS,
  type ChickenState,
  type Dir,
} from "@/lib/rules/chickenLogic";

const TILE = 22; // internal px per grid cell

export default function Chicken({ onResolve }: { onResolve: (o: GameOutcome) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line react-hooks/purity
  const state = useRef<ChickenState>(initChicken(Date.now() & 0xffff));
  const [active, setActive] = useState(true);
  const done = useRef(false);

  function input(dir: Dir) {
    if (done.current) return;
    const prev = { px: state.current.px, py: state.current.py };
    state.current = moveChicken(state.current, dir);
    if (state.current.px !== prev.px || state.current.py !== prev.py) beep(660, 40, audio.muted);
    if (state.current.status === "won") finish();
  }

  function finish() {
    if (done.current) return;
    done.current = true;
    setActive(false);
    const s = state.current;
    setTimeout(() => onResolve({ won: true, foundHiddenPath: s.foundHiddenPath }), 350);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        input(dir);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFixedLoop(
    (dt) => {
      if (done.current) return;
      const prevY = state.current.py;
      stepChicken(state.current, dt);
      if (state.current.py !== prevY) beep(180, 120, audio.muted); // car hit reset
    },
    () => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const s = state.current;
      ctx.fillStyle = RULES.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // exit strip
      ctx.fillStyle = "#1b1b1b";
      ctx.fillRect(0, 0, COLS * TILE, TILE);
      // cars (middle lanes only)
      ctx.fillStyle = RULES.yellow;
      for (const lane of s.lanes)
        for (const car of lane) ctx.fillRect(car.x * TILE, car.lane * TILE + 4, car.w * TILE - 2, TILE - 8);
      // field borders on BOTH shoulders — drawn over cars so the field reads as framed
      ctx.fillStyle = "#262626";
      ctx.fillRect(0, 0, TILE, ROWS * TILE);
      ctx.fillRect((COLS - 1) * TILE, 0, TILE, ROWS * TILE);
      // player
      ctx.fillStyle = RULES.green;
      ctx.fillRect(s.px * TILE + 3, s.py * TILE + 3, TILE - 6, TILE - 6);
    },
    active,
  );

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) pixelCanvas(canvas, COLS * TILE, ROWS * TILE);
  }, []);

  return (
    <div style={{ display: "grid", gap: 10, placeItems: "center" }}>
      <p style={{ fontSize: 9, color: RULES.gray }}>reach the top. dodge the cars. (arrows / wasd)</p>
      <canvas
        ref={ref}
        style={{ width: "min(90vw, 360px)", imageRendering: "pixelated", border: `2px solid ${RULES.dim}` }}
      />
      <TouchPad onDir={input} />
    </div>
  );
}

function TouchPad({ onDir }: { onDir: (d: Dir) => void }) {
  const btn = (d: Dir, label: string) => (
    <button
      onPointerDown={(e) => { e.preventDefault(); onDir(d); }}
      style={{ fontFamily: RULES.font, fontSize: 14, width: 48, height: 48, background: RULES.dim, color: RULES.white, border: "none" }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 48px)", gap: 4, justifyContent: "center", touchAction: "none" }}>
      <span />{btn("up", "▲")}<span />
      {btn("left", "◀")}{btn("down", "▼")}{btn("right", "▶")}
    </div>
  );
}
