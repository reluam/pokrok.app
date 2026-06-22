import type { Genome } from "@/lib/sim/genome";
import { makeRng } from "@/lib/sim/rng";

export function hueToCss(hue01: number, sat: number, light: number): string {
  return `hsl(${Math.round(hue01 * 360)}, ${sat}%, ${light}%)`;
}

// Genome → a soft cluster of particles. Deterministic: a genome-seeded RNG places particles,
// so the same genome always renders the same shape. `t` only animates a gentle breathing pulse.
export function drawBlob(ctx: CanvasRenderingContext2D, g: Genome, x: number, y: number, t: number): void {
  // Seed the layout from the genome so identical genomes look identical run-to-run.
  const seed = Math.floor((g.hue * 7919 + g.size * 104729 + g.particleDensity * 1299709)) >>> 0;
  const rng = makeRng(seed);

  const radius = 8 + g.size * 34;
  const particles = 6 + Math.round(g.particleDensity * 40);
  const breathe = 1 + Math.sin(t / 700) * 0.05;
  const color = hueToCss(g.hue, 60, 55);

  ctx.save();
  ctx.translate(x, y);

  // Limbs: 0..8 outgrowths radiating out, length from limbLength.
  const limbs = Math.round(g.limbCount * 8);
  ctx.fillStyle = hueToCss(g.hue, 55, 45);
  for (let i = 0; i < limbs; i++) {
    const ang = (i / Math.max(1, limbs)) * Math.PI * 2;
    const len = radius * (0.6 + g.limbLength * 1.4) * breathe;
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * len, Math.sin(ang) * len, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body particles: jittered around the centre within the breathing radius.
  ctx.fillStyle = color;
  for (let i = 0; i < particles; i++) {
    const ang = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * radius * breathe;
    const pr = 2 + rng() * 4;
    ctx.globalAlpha = 0.65 + rng() * 0.35;
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * r, Math.sin(ang) * r, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
