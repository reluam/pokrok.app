"use client";

import { useEffect, useRef } from "react";
import { RULES, PixelButton, pixelCanvas } from "./theme";

const LINES: Record<string, string> = {
  chicken: "You didn't have to cross the road.",
  maze: "Not every wall is real.",
  tetris: "The field was always bigger than it looked.",
};

// A tiny looping schematic of the alternative path for each game.
function drawReplay(ctx: CanvasRenderingContext2D, game: string, t: number) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.fillStyle = RULES.bg;
  ctx.fillRect(0, 0, W, H);
  const p = (t % 2000) / 2000; // 0..1 loop
  ctx.fillStyle = RULES.dim;
  if (game === "chicken") {
    for (let y = 8; y < H - 8; y += 8) ctx.fillRect(10, y, W - 20, 4); // road bands
    ctx.fillStyle = RULES.green; // dot walking up the left edge
    ctx.fillRect(6, H - 10 - p * (H - 16), 5, 5);
  } else if (game === "maze") {
    ctx.fillRect(W / 2 - 3, 8, 6, H - 16); // a corridor
    ctx.fillStyle = RULES.yellow;
    ctx.fillRect(W / 2 - 4, H / 2 - 3, 8, 6); // the fake wall tile
    ctx.fillStyle = RULES.green;
    ctx.fillRect(W / 2 - 2, H - 10 - p * (H - 16), 5, 5); // dot passing through
  } else {
    ctx.fillStyle = RULES.green; // a piece sliding off the right edge
    const x = 10 + p * (W + 10);
    ctx.fillRect(x, H / 2 - 4, 8, 8);
  }
}

export function Reveal({ game, found, onContinue }: { game: "chicken" | "maze" | "tetris"; found: boolean; onContinue: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = pixelCanvas(canvas, 120, 120);
    let raf = 0;
    const loop = (now: number) => {
      drawReplay(ctx, game, now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [game]);

  return (
    <div style={{ display: "grid", gap: 22, placeItems: "center", maxWidth: 520, lineHeight: 1.9 }}>
      <p style={{ fontSize: 13, color: found ? RULES.green : RULES.white }}>
        {found ? "You found the way." : "There was another way."}
      </p>
      <canvas ref={ref} style={{ width: 180, height: 180, imageRendering: "pixelated", background: RULES.bg }} />
      <p style={{ fontSize: 11, color: RULES.green }}>{LINES[game]}</p>
      <PixelButton onClick={onContinue}>continue</PixelButton>
    </div>
  );
}
