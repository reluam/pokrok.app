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
  } else if (game === "invaders") {
    ctx.fillStyle = RULES.green; // invaders descending untouched
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) ctx.fillRect(20 + c * 22, 10 + r * 14 + p * 30, 9, 7);
    ctx.fillStyle = RULES.white; // a cannon that never fires
    ctx.fillRect(W / 2 - 7, H - 14, 14, 6);
  } else if (game === "simon") {
    // four pads; a marker landing on whichever one it likes
    const pads = [[W / 2 - 24, H / 2 - 24], [W / 2 + 4, H / 2 - 24], [W / 2 - 24, H / 2 + 4], [W / 2 + 4, H / 2 + 4]];
    ctx.fillStyle = RULES.dim;
    for (const [px, py] of pads) ctx.fillRect(px, py, 20, 20);
    ctx.fillStyle = RULES.green;
    const [gx, gy] = pads[Math.floor(p * 4) % 4];
    ctx.fillRect(gx, gy, 20, 20);
  } else if (game === "ttt") {
    ctx.strokeStyle = RULES.gray; // a small 3×3 grid in the centre
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 22, H / 2 - 22, 44, 44);
    ctx.strokeStyle = RULES.green; // three X marks running down the left margin, outside the grid
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const cy = H / 2 - 22 + 8 + i * 14;
      ctx.beginPath();
      ctx.moveTo(14, cy - 4); ctx.lineTo(22, cy + 4);
      ctx.moveTo(22, cy - 4); ctx.lineTo(14, cy + 4);
      ctx.stroke();
    }
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

export function Reveal({ game, found, side = "left", onContinue, onRetry }: { game: string; found: boolean; side?: "left" | "right"; onContinue: () => void; onRetry: () => void }) {
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
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <PixelButton onClick={onContinue}>continue</PixelButton>
        <PixelButton color={RULES.gray} onClick={onRetry}>retry</PixelButton>
      </div>
    </div>
  );
}
