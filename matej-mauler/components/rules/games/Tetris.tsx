"use client";

import { useEffect, useRef, useState } from "react";
import { RULES, pixelCanvas, type GameOutcome } from "../theme";
import {
  initTetris,
  tickTetris,
  moveTetris,
  rotateTetris,
  dropTetris,
  WIDTH,
  HEIGHT,
  SCORE_TARGET,
  type TetrisState,
} from "@/lib/rules/tetrisLogic";

const TILE = 16;
const COLORS = ["", RULES.green, RULES.yellow, "#4dd2ff", "#ff6bd6", "#ff8a3d", "#b388ff", "#7CFC00"];
const GRAVITY_MS = 700; // tuned with scoring so a clean run hits 1000 in ~5 min

export default function Tetris({ onResolve }: { onResolve: (o: GameOutcome) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef<TetrisState>(initTetris(Date.now() & 0xffff));
  const [score, setScore] = useState(0);
  const done = useRef(false);

  function commit(next: TetrisState) {
    state.current = next;
    setScore(next.score);
    render();
    if (next.status === "won" && !done.current) {
      done.current = true;
      const s = next;
      setTimeout(() => onResolve({ won: true, foundHiddenPath: s.foundHiddenPath }), 350);
    }
  }

  function render() {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = state.current;
    ctx.fillStyle = RULES.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < HEIGHT; y++)
      for (let x = 0; x < WIDTH; x++)
        if (s.board[y][x]) {
          ctx.fillStyle = COLORS[s.board[y][x]];
          ctx.fillRect(x * TILE, y * TILE, TILE - 1, TILE - 1);
        }
    ctx.fillStyle = COLORS[s.piece.kind];
    for (const [x, y] of s.piece.cells)
      if (x >= 0 && x < WIDTH && y >= 0) ctx.fillRect(x * TILE, y * TILE, TILE - 1, TILE - 1);
  }

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) pixelCanvas(canvas, WIDTH * TILE, HEIGHT * TILE);
    render();
    const id = setInterval(() => {
      if (!done.current) commit(tickTetris(state.current));
    }, GRAVITY_MS);
    const handler = (e: KeyboardEvent) => {
      if (done.current) return;
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); commit(moveTetris(state.current, "left")); }
      else if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); commit(moveTetris(state.current, "right")); }
      else if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); commit(moveTetris(state.current, "down")); }
      else if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); commit(rotateTetris(state.current)); }
      else if (e.key === " ") { e.preventDefault(); commit(dropTetris(state.current)); }
    };
    window.addEventListener("keydown", handler);
    return () => { clearInterval(id); window.removeEventListener("keydown", handler); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tbtn = (label: string, fn: () => TetrisState) => (
    <button
      onPointerDown={(e) => { e.preventDefault(); if (!done.current) commit(fn()); }}
      style={{ fontFamily: RULES.font, fontSize: 13, width: 56, height: 48, background: RULES.dim, color: RULES.white, border: "none" }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "grid", gap: 10, placeItems: "center" }}>
      <p style={{ fontSize: 10, color: RULES.green }}>score {score} / {SCORE_TARGET}</p>
      <p style={{ fontSize: 8, color: RULES.gray }}>clear lines to 1000. (← → ↓ move · ↑ rotate · space drop)</p>
      <canvas ref={ref} style={{ width: "min(70vw, 220px)", imageRendering: "pixelated", border: `2px solid ${RULES.dim}` }} />
      <div style={{ display: "flex", gap: 4, touchAction: "none" }}>
        {tbtn("◀", () => moveTetris(state.current, "left"))}
        {tbtn("▶", () => moveTetris(state.current, "right"))}
        {tbtn("↻", () => rotateTetris(state.current))}
        {tbtn("▼", () => dropTetris(state.current))}
      </div>
    </div>
  );
}
