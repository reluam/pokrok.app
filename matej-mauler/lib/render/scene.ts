import type { SimState } from "@/lib/sim/population";
import { fitness } from "@/lib/sim/fitness";
import { drawBlob, hueToCss } from "./blob";

// Draw the environment background + a representative sample of the current population.
// Reads state only; never mutates it.
export function drawScene(ctx: CanvasRenderingContext2D, state: SimState, t: number): void {
  const { width, height } = ctx.canvas;
  // Background tinted by the environment hue (this is what camouflage matches against).
  ctx.fillStyle = hueToCss(state.env.backgroundHue, 35, 88);
  ctx.fillRect(0, 0, width, height);

  // Show up to 12 of the fittest individuals on a loose grid.
  const sample = [...state.population]
    .map((g) => ({ g, f: fitness(g, state.env) }))
    .sort((a, b) => b.f - a.f)
    .slice(0, 12);

  const cols = 4;
  const cellW = width / cols;
  const rows = Math.ceil(sample.length / cols);
  const cellH = height / Math.max(1, rows);
  sample.forEach((s, i) => {
    const cx = (i % cols) * cellW + cellW / 2;
    const cy = Math.floor(i / cols) * cellH + cellH / 2;
    drawBlob(ctx, s.g, cx, cy, t + i * 120);
  });
}
