"use client";
import { useEffect, useRef } from "react";
import type { Environment } from "@/lib/sim/environment";
import type { GameState } from "@/lib/game/game";
import { makeRng } from "@/lib/sim/rng";
import { dominantOnBiome } from "@/lib/game/lineage";

const DOTS_SCALE = 16; // dots per lineage at full presence

function hexA(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Terrain tint from a biome's environment — icy / desert / grassland / jungle / barren.
function terrainColor(env: Environment): string {
  const { temperature: t, foodAbundance: f } = env;
  let c: [number, number, number];
  if (t < 0.3) c = [216, 230, 238];        // icy
  else if (t > 0.72) c = [226, 201, 148];  // desert sand
  else c = [171, 198, 138];                // grassland
  if (f > 0.6 && t >= 0.3 && t <= 0.72) c = [126, 168, 99]; // jungle
  if (f < 0.28) c = c.map((x) => Math.min(255, x + 16)) as [number, number, number]; // barren, paler
  return `rgb(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0})`;
}

interface Pt { x: number; y: number; }

// Organic continent layout: phyllotaxis fills a disc (no donut hole), lightly jittered per world.
function layout(game: GameState, W: number, H: number): Pt[] {
  const n = game.world.biomes.length;
  const cx = W / 2, cy = H / 2;
  const spread = Math.min(W, H) * 0.34;
  const seed = n * 97 + game.world.biomes.reduce((s, b) => s + b.name.length, 0);
  const rng = makeRng(seed);
  return game.world.biomes.map((_, i) => {
    const r = Math.sqrt((i + 0.5) / n) * spread;
    const th = i * 2.399963 + (rng() - 0.5) * 0.5;
    return { x: cx + Math.cos(th) * r + (rng() - 0.5) * 16, y: cy + Math.sin(th) * r + (rng() - 0.5) * 16 };
  });
}

function draw(ctx: CanvasRenderingContext2D, W: number, H: number, game: GameState, t: number) {
  const biomes = game.world.biomes;
  const pos = layout(game, W, H);
  const idx = new Map(biomes.map((b, i) => [b.id, i]));
  const region = Math.min(W, H) * 0.135;

  // ---- water ----
  const sea = ctx.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, "#1b4a73"); sea.addColorStop(1, "#0f3559");
  ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 26) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, y + Math.sin(x / 60 + t / 1400 + y) * 2);
    ctx.stroke();
  }

  // ---- continent silhouette (merged soft blobs → coastline) ----
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.fillStyle = "#caa86e"; // beach/coast under the land
  pos.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, region * 1.5, 0, Math.PI * 2); ctx.fill(); });
  ctx.beginPath(); ctx.arc(W / 2, H / 2, region * 1.7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.shadowColor = "rgba(40,80,40,0.35)"; ctx.shadowBlur = 26;
  ctx.fillStyle = "#9bbf72"; // base land
  pos.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, region * 1.32, 0, Math.PI * 2); ctx.fill(); });
  ctx.beginPath(); ctx.arc(W / 2, H / 2, region * 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ---- adjacency routes ----
  ctx.strokeStyle = "rgba(60,45,25,0.28)"; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
  biomes.forEach((b, i) => b.neighbors.forEach((nb) => {
    const j = idx.get(nb)!; if (j <= i) return;
    ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke();
  }));
  ctx.setLineDash([]);

  // ---- biome regions: terrain disc + dominant glow + presence dots ----
  biomes.forEach((b, i) => {
    const p = pos[i];
    const dom = dominantOnBiome(game.lineages, b.id);

    const terr = ctx.createRadialGradient(p.x, p.y, region * 0.2, p.x, p.y, region);
    terr.addColorStop(0, terrainColor(b.env)); terr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = terr; ctx.beginPath(); ctx.arc(p.x, p.y, region, 0, Math.PI * 2); ctx.fill();

    if (dom) {
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, region * 1.05);
      glow.addColorStop(0, hexA(dom.color, 0.28)); glow.addColorStop(1, hexA(dom.color, 0));
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y, region * 1.05, 0, Math.PI * 2); ctx.fill();
    }

    const rng = makeRng(i * 1000 + 7);
    game.lineages.forEach((l) => {
      const pr = l.presence[b.id] ?? 0; if (pr <= 0) return;
      const count = Math.max(1, Math.round(pr * DOTS_SCALE));
      for (let k = 0; k < count; k++) {
        const ang = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * region * 0.78;
        const jitter = Math.sin(t / 600 + k * 1.7) * 0.7;
        ctx.fillStyle = l.color;
        ctx.beginPath(); ctx.arc(p.x + Math.cos(ang) * rr, p.y + Math.sin(ang) * rr + jitter, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath(); ctx.arc(p.x + Math.cos(ang) * rr - 0.7, p.y + Math.sin(ang) * rr + jitter - 0.7, 0.9, 0, Math.PI * 2); ctx.fill();
      }
    });

    // label pill
    const label = b.name + (b.id === game.homeBiome ? "  ★" : "");
    ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif"; ctx.textAlign = "center";
    const w = ctx.measureText(label).width + 14, ly = p.y + region + 6;
    ctx.fillStyle = "rgba(20,30,40,0.72)";
    roundRect(ctx, p.x - w / 2, ly, w, 17, 8); ctx.fill();
    if (dom) { ctx.fillStyle = dom.color; ctx.beginPath(); ctx.arc(p.x - w / 2 + 7, ly + 8.5, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#fff"; ctx.fillText(label, p.x + (dom ? 5 : 0), ly + 12);
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function WorldMap({ game }: { game: GameState }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef(game);
  useEffect(() => { gameRef.current = game; });

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let raf = 0;
    const loop = (t: number) => { draw(ctx, c.width, c.height, gameRef.current, t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas ref={ref} width={820} height={620}
      style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: 14 }} />
  );
}
