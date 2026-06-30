"use client";

import { useEffect, useRef, useState } from "react";
import { RULES, pixelCanvas, beep, audio, type GameOutcome } from "../theme";
import { initTTT, placeTTT, SIZE, X, O, isInner, type TTTState } from "@/lib/rules/tttLogic";

const TILE = 42; // internal px per cell

export default function TicTacToe({ onResolve }: { onResolve: (o: GameOutcome) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<TTTState>(initTTT());
  const done = useRef(false);

  function render(s: TTTState) {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = RULES.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // faint grid for the whole 5×5
    ctx.strokeStyle = RULES.dim;
    ctx.lineWidth = 1;
    for (let i = 0; i <= SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * TILE, 0); ctx.lineTo(i * TILE, SIZE * TILE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * TILE); ctx.lineTo(SIZE * TILE, i * TILE); ctx.stroke();
    }
    // the "official" 3×3 grid, brighter
    ctx.strokeStyle = RULES.gray;
    ctx.lineWidth = 2;
    ctx.strokeRect(1 * TILE, 1 * TILE, 3 * TILE, 3 * TILE);
    // marks
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const cx = x * TILE + TILE / 2;
        const cy = y * TILE + TILE / 2;
        const r = TILE / 2 - 9;
        if (s.cells[y][x] === X) {
          ctx.strokeStyle = RULES.green; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx + r, cy + r);
          ctx.moveTo(cx + r, cy - r); ctx.lineTo(cx - r, cy + r); ctx.stroke();
        } else if (s.cells[y][x] === O) {
          ctx.strokeStyle = RULES.gray; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        }
      }
  }

  function click(e: React.PointerEvent<HTMLCanvasElement>) {
    if (done.current) return;
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor(((e.clientX - rect.left) / rect.width) * SIZE);
    const gy = Math.floor(((e.clientY - rect.top) / rect.height) * SIZE);
    const next = placeTTT(state, gx, gy);
    if (next === state) return; // illegal move
    beep(isInner(gx, gy) ? 500 : 680, 30, audio.muted);
    setState(next);
    if (next.status !== "playing") {
      done.current = true;
      setTimeout(() => onResolve({ won: next.status === "won", foundHiddenPath: next.foundHiddenPath }), 350);
    }
  }

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) pixelCanvas(canvas, SIZE * TILE, SIZE * TILE);
    render(state);
  }, [state]);

  return (
    <div style={{ display: "grid", gap: 10, placeItems: "center" }}>
      <p style={{ fontSize: 9, color: RULES.gray }}>three in a row beats the machine. (click / tap)</p>
      <canvas
        ref={ref}
        onPointerDown={click}
        style={{ width: "min(80vw, 300px)", imageRendering: "pixelated", border: `2px solid ${RULES.dim}`, touchAction: "none", cursor: "pointer" }}
      />
    </div>
  );
}
