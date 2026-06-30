"use client";

import { useEffect, useRef } from "react";
import { RULES, PixelButton, pixelCanvas } from "./theme";
import { revealLineFor } from "@/lib/rules/games";

// A tiny looping schematic of the alternative path for each game. Games without a custom branch fall
// back to a generic "a dot slips around the barrier" sketch.
function drawReplay(ctx: CanvasRenderingContext2D, game: string, t: number, side: "left" | "right") {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.fillStyle = RULES.bg;
  ctx.fillRect(0, 0, W, H);
  const p = (t % 2000) / 2000; // 0..1 loop
  ctx.fillStyle = RULES.dim;
  if (game === "chicken") {
    for (let y = 8; y < H - 8; y += 8) ctx.fillRect(10, y, W - 20, 4); // road bands
    ctx.fillStyle = RULES.green; // dot walking up the shoulder the player used
    const ex = side === "right" ? W - 11 : 6;
    ctx.fillRect(ex, H - 10 - p * (H - 16), 5, 5);
  } else if (game === "maze") {
    ctx.fillRect(W / 2 - 3, 8, 6, H - 16); // a corridor
    ctx.fillStyle = RULES.yellow;
    ctx.fillRect(W / 2 - 4, H / 2 - 3, 8, 6); // the fake wall tile
    ctx.fillStyle = RULES.green;
    ctx.fillRect(W / 2 - 2, H - 10 - p * (H - 16), 5, 5); // dot passing through
  } else if (game === "tetris") {
    ctx.fillStyle = RULES.green; // a piece sliding off the right edge
    const x = 10 + p * (W + 10);
    ctx.fillRect(x, H / 2 - 4, 8, 8);
  } else if (game === "flappy") {
    ctx.fillStyle = RULES.dim; // pipes that stop short of the top
    for (let i = 0; i < 3; i++) ctx.fillRect(24 + i * 34, 34, 10, H - 34);
    ctx.fillStyle = RULES.yellow; // bird cruising the open sky along the very top
    ctx.fillRect(8 + p * (W - 24), 8, 6, 6);
  } else {
    // generic: a barrier across the middle, a dot going around its end
    ctx.fillRect(20, H / 2 - 3, W - 52, 6);
    ctx.fillStyle = RULES.green;
    const a = p * 2;
    const x = a < 1 ? 20 + a * (W - 40) : W - 20;
    const y = a < 1 ? H / 2 - 18 : H / 2 - 18 + (a - 1) * 30;
    ctx.fillRect(x - 2, y - 2, 5, 5);
  }
}

export function Reveal({ game, found, side = "left", onContinue }: { game: string; found: boolean; side?: "left" | "right"; onContinue: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = pixelCanvas(canvas, 120, 120);
    let raf = 0;
    const loop = (now: number) => {
      drawReplay(ctx, game, now, side);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [game, side]);

  return (
    <div style={{ display: "grid", gap: 22, placeItems: "center", maxWidth: 520, lineHeight: 1.9 }}>
      <p style={{ fontSize: 13, color: found ? RULES.green : RULES.white }}>
        {found ? "You found the way." : "There was another way."}
      </p>
      <canvas ref={ref} style={{ width: 180, height: 180, imageRendering: "pixelated", background: RULES.bg }} />
      <p style={{ fontSize: 11, color: RULES.green }}>{revealLineFor(game)}</p>
      <PixelButton onClick={onContinue}>continue</PixelButton>
    </div>
  );
}
