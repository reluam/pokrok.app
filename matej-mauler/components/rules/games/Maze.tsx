"use client";

import { useEffect, useRef } from "react";
import { RULES, pixelCanvas, beep, audio, type GameOutcome } from "../theme";
import { MAZE, initMaze, moveMaze, type MazeState } from "@/lib/rules/mazeLogic";
import type { Dir } from "@/lib/rules/chickenLogic";

const TILE = 26;
const W = MAZE[0].length;
const H = MAZE.length;

export default function Maze({ onResolve }: { onResolve: (o: GameOutcome) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef<MazeState>(initMaze());
  const done = useRef(false);

  function render() {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = RULES.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const t = MAZE[y][x];
        // fake walls (2) render IDENTICALLY to real walls (1) — no visual tell
        if (t === 1 || t === 2) ctx.fillStyle = "#3a3a3a"; // wall (real or fake)
        else if (t === 4) ctx.fillStyle = RULES.yellow; // exit
        else ctx.fillStyle = RULES.bg; // open
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    const s = state.current;
    ctx.fillStyle = RULES.green;
    ctx.fillRect(s.x * TILE + 5, s.y * TILE + 5, TILE - 10, TILE - 10);
  }

  function input(dir: Dir) {
    if (done.current) return;
    const prev = { x: state.current.x, y: state.current.y };
    state.current = moveMaze(state.current, dir);
    if (state.current.x !== prev.x || state.current.y !== prev.y) beep(660, 40, audio.muted);
    render();
    if (state.current.status === "won") {
      done.current = true;
      const s = state.current;
      setTimeout(() => onResolve({ won: true, foundHiddenPath: s.foundHiddenPath }), 300);
    }
  }

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) pixelCanvas(canvas, W * TILE, H * TILE);
    render();
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
      };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); input(dir); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tbtn = (d: Dir, label: string) => (
    <button
      onPointerDown={(e) => { e.preventDefault(); input(d); }}
      style={{ fontFamily: RULES.font, fontSize: 14, width: 48, height: 48, background: RULES.dim, color: RULES.white, border: "none" }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "grid", gap: 10, placeItems: "center" }}>
      <p style={{ fontSize: 9, color: RULES.gray }}>reach the exit. (arrows / wasd)</p>
      <canvas ref={ref} style={{ width: "min(90vw, 360px)", imageRendering: "pixelated", border: `2px solid ${RULES.dim}` }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 48px)", gap: 4, touchAction: "none" }}>
        <span />{tbtn("up", "▲")}<span />
        {tbtn("left", "◀")}{tbtn("down", "▼")}{tbtn("right", "▶")}
      </div>
    </div>
  );
}
