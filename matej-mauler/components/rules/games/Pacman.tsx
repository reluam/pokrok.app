"use client";

import { useEffect, useRef } from "react";
import { RULES, pixelCanvas, beep, audio, type GameOutcome } from "../theme";
import { initPacman, setDirPacman, stepPacman, MAZE, W, H, type Dir, type PacmanState } from "@/lib/rules/pacmanLogic";

const TILE = 22;
const TICK_MS = 200;

export default function Pacman({ onResolve }: { onResolve: (o: GameOutcome) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef<PacmanState>(initPacman());
  const done = useRef(false);

  function render() {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = state.current;
    ctx.fillStyle = RULES.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const t = MAZE[y][x];
        if (t === 1) { ctx.fillStyle = "#20204a"; ctx.fillRect(x * TILE, y * TILE, TILE, TILE); }
        else if (s.dots.has(`${x},${y}`)) { ctx.fillStyle = RULES.gray; ctx.fillRect(x * TILE + TILE / 2 - 2, y * TILE + TILE / 2 - 2, 4, 4); }
      }
    // ghosts
    for (const g of s.ghosts) { ctx.fillStyle = "#ff5b5b"; ctx.fillRect(g.x * TILE + 3, g.y * TILE + 3, TILE - 6, TILE - 6); }
    // pac
    ctx.fillStyle = RULES.yellow;
    ctx.beginPath();
    ctx.arc(s.pac.x * TILE + TILE / 2, s.pac.y * TILE + TILE / 2, TILE / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function input(dir: Dir) {
    if (done.current) return;
    setDirPacman(state.current, dir);
  }

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) pixelCanvas(canvas, W * TILE, H * TILE);
    render();
    const id = setInterval(() => {
      if (done.current) return;
      stepPacman(state.current);
      render();
      const s = state.current;
      if (s.status !== "playing") {
        done.current = true;
        beep(s.status === "won" ? 720 : 180, 160, audio.muted);
        setTimeout(() => onResolve({ won: s.status === "won", foundHiddenPath: s.foundHiddenPath }), 400);
      }
    }, TICK_MS);
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); input(dir); }
    };
    window.addEventListener("keydown", onKey);
    return () => { clearInterval(id); window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const btnStyle = { fontFamily: RULES.font, fontSize: 14, width: 48, height: 48, background: RULES.dim, color: RULES.white, border: "none" } as const;
  const tbtn = (d: Dir, label: string) => (
    <button style={btnStyle} onPointerDown={(e) => { e.preventDefault(); input(d); }}>{label}</button>
  );

  return (
    <div style={{ display: "grid", gap: 10, placeItems: "center" }}>
      <p style={{ fontSize: 9, color: RULES.gray }}>eat the dots, dodge the ghost. (arrows / wasd)</p>
      <canvas ref={ref} style={{ width: "min(88vw, 340px)", imageRendering: "pixelated", border: `2px solid ${RULES.dim}` }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 48px)", gap: 4, justifyContent: "center", touchAction: "none" }}>
        <span />{tbtn("up", "▲")}<span />
        {tbtn("left", "◀")}{tbtn("down", "▼")}{tbtn("right", "▶")}
      </div>
    </div>
  );
}
