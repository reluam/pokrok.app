import type { Genome } from "@/lib/sim/genome";
import { makeRng } from "@/lib/sim/rng";

export function hueToCss(hue01: number, sat: number, light: number, alpha = 1): string {
  return `hsla(${Math.round(hue01 * 360)}, ${sat}%, ${light}%, ${alpha})`;
}

// Genome → a soft cluster of particles drawn as a little organism. Deterministic: a genome-seeded
// RNG places the particles, so the same genome always renders the same creature; `t` only drives a
// gentle breathing pulse. Each gene maps to a legible visual trait so you can "read" the genome:
//   size→body radius · hue→colour · limbCount→0..8 limbs · limbLength→limb reach · speed→elongation
//   + faster breathing · metabolism→glow · toughness→armoured outline · camouflage→translucency
//   · sensorRange→eye-stalks · particleDensity→body texture.
export function drawBlob(ctx: CanvasRenderingContext2D, g: Genome, x: number, y: number, t: number): void {
  const seed = Math.floor(g.hue * 7919 + g.size * 104729 + g.particleDensity * 1299709) >>> 0;
  const rng = makeRng(seed);

  const radius = 9 + g.size * 30;
  const particles = 6 + Math.round(g.particleDensity * 40);
  const breathe = 1 + Math.sin(t / 700) * (0.04 + g.speed * 0.06); // faster genomes pulse harder
  const elong = 1 + g.speed * 0.45; // speed → streamlined / elongated body
  const body = hueToCss(g.hue, 58, 55, 1 - g.camouflage * 0.5); // camouflage → blends in (translucent)

  ctx.save();
  ctx.translate(x, y);

  // metabolism → warm glow
  ctx.shadowBlur = g.metabolism * 16;
  ctx.shadowColor = hueToCss(g.hue, 90, 60);

  // limbs: 0..8 outgrowths radiating out, length from limbLength.
  const limbs = Math.round(g.limbCount * 8);
  ctx.fillStyle = hueToCss(g.hue, 52, 42);
  for (let i = 0; i < limbs; i++) {
    const ang = (i / Math.max(1, limbs)) * Math.PI * 2;
    const len = radius * (0.6 + g.limbLength * 1.5) * breathe;
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * len * elong, Math.sin(ang) * len, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // body particles, jittered around the centre within the breathing radius.
  ctx.fillStyle = body;
  for (let i = 0; i < particles; i++) {
    const ang = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * radius * breathe;
    const pr = 2 + rng() * 4;
    ctx.globalAlpha = 0.6 + rng() * 0.4;
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * r * elong, Math.sin(ang) * r, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // toughness → an armoured outline ring.
  if (g.toughness > 0.05) {
    ctx.lineWidth = 1 + g.toughness * 4;
    ctx.strokeStyle = hueToCss(g.hue, 35, 28);
    ctx.beginPath();
    ctx.arc(0, 0, radius * breathe * 1.08 * elong, 0, Math.PI * 2);
    ctx.stroke();
  }

  // sensorRange → a pair of eye-stalks up top.
  if (g.sensorRange > 0.35) {
    ctx.fillStyle = "#111";
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * radius * 0.35, -radius * 0.7 * breathe, 1.5 + g.sensorRange * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
