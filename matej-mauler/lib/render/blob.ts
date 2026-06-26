import type { Genome } from "@/lib/sim/genome";
import { makeRng } from "@/lib/sim/rng";

export function hueToCss(hue01: number, sat: number, light: number, alpha = 1): string {
  return `hsla(${Math.round(hue01 * 360)}, ${sat}%, ${light}%, ${alpha})`;
}

// Genome → a "spaghettoid": a tangle of noodle strands with googly eyes — the spaghetti-rendered
// stand-in for a living thing (Spaghetti.ltd: life is tangled, like spaghetti). Deterministic per
// genome; `t` only animates breathing + eyes. Gene → trait mapping stays legible:
//   size→body · particleDensity→strand count + sauce · toughness→noodle thickness · hue→noodle tint
//   speed→wiggle + stretch · sensorRange→eye size · limbCount/limbLength→stray noodle ends
//   metabolism→steam + glow · camouflage→translucency (blends in).
export function drawBlob(ctx: CanvasRenderingContext2D, g: Genome, x: number, y: number, t: number): void {
  const seed = Math.floor(g.hue * 7919 + g.size * 104729 + g.particleDensity * 1299709) >>> 0;
  const rng = makeRng(seed);

  const R = 9 + g.size * 27;
  const strands = 4 + Math.round(g.particleDensity * 8);
  const thick = 1.6 + g.toughness * 3.2;
  const wiggle = 0.2 + g.speed * 0.6;
  const elong = 1 + g.speed * 0.32;
  const breathe = 1 + Math.sin(t / 700) * 0.05;
  const noodleH = Math.round(38 + g.hue * 55);
  const noodle = `hsla(${noodleH}, 72%, 72%, ${1 - g.camouflage * 0.45})`;

  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = "round";

  // steam (metabolism)
  if (g.metabolism > 0.3) {
    ctx.strokeStyle = `rgba(255,255,255,${0.15 + g.metabolism * 0.35})`;
    ctx.lineWidth = 2;
    for (let s = -1; s <= 1; s += 2) {
      ctx.beginPath();
      ctx.moveTo(s * R * 0.3, -R * 0.9);
      ctx.quadraticCurveTo(s * R * 0.3 + Math.sin(t / 300) * 4, -R * 1.3, s * R * 0.3, -R * 1.7);
      ctx.stroke();
    }
  }

  ctx.shadowColor = hueToCss(g.hue, 80, 60); ctx.shadowBlur = g.metabolism * 9;

  // stray noodle ends (limbs)
  const limbs = Math.round(g.limbCount * 6);
  ctx.strokeStyle = noodle; ctx.lineWidth = thick;
  for (let i = 0; i < limbs; i++) {
    const ang = (i / Math.max(1, limbs)) * Math.PI * 2 + rng();
    const len = R * (0.95 + g.limbLength * 1.1) * breathe;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * R * 0.6 * elong, Math.sin(ang) * R * 0.6);
    ctx.quadraticCurveTo(
      Math.cos(ang) * len * elong + Math.sin(t / 400 + i) * wiggle * 6, Math.sin(ang) * len,
      Math.cos(ang + 0.4) * len * elong, Math.sin(ang + 0.4) * len,
    );
    ctx.stroke();
  }

  // body: an overlapping nest of noodle loops
  for (let k = 0; k < strands; k++) {
    const ox = (rng() - 0.5) * R * 0.5, oy = (rng() - 0.5) * R * 0.5;
    const rr = R * (0.42 + rng() * 0.5) * breathe;
    ctx.beginPath();
    ctx.ellipse(ox * elong, oy, rr * elong, rr * (0.66 + rng() * 0.3), rng() * Math.PI, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // sauce specks
  const sauce = 2 + Math.round(g.particleDensity * 5);
  ctx.fillStyle = "rgba(200,60,40,0.82)";
  for (let i = 0; i < sauce; i++) {
    const ang = rng() * Math.PI * 2, r = Math.sqrt(rng()) * R * 0.6;
    ctx.beginPath(); ctx.arc(Math.cos(ang) * r * elong, Math.sin(ang) * r, 1.6 + rng() * 1.4, 0, Math.PI * 2); ctx.fill();
  }

  // googly eyes (sensorRange)
  const eye = 2.6 + g.sensorRange * 3.6;
  const look = Math.sin(t / 520) * eye * 0.25;
  for (const sx of [-1, 1]) {
    const ex = sx * R * 0.32, ey = -R * 0.42 * breathe;
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex, ey, eye, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1a1614"; ctx.beginPath(); ctx.arc(ex + look, ey, eye * 0.5, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}
