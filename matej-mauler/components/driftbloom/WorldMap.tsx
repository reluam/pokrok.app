"use client";
import { useEffect, useRef } from "react";
import type { GameState } from "@/lib/game/game";
import { makeRng } from "@/lib/sim/rng";
import { dominantOnBiome } from "@/lib/game/lineage";

const DOTS_SCALE = 30; // dots per lineage at full presence

function hexA(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// The world as a Plague-Inc-style map: biome regions on a ring (with adjacency), each filled with
// coloured dots — one colour per lineage, count ∝ its presence. Mingled colours = a contested biome.
function draw(ctx: CanvasRenderingContext2D, W: number, H: number, game: GameState, t: number) {
  ctx.clearRect(0, 0, W, H);
  const biomes = game.world.biomes;
  const n = biomes.length;
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.33, region = Math.min(W, H) * 0.14;
  const pos = biomes.map((_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  });
  const idx = new Map(biomes.map((b, i) => [b.id, i]));

  // adjacency edges
  ctx.strokeStyle = "rgba(120,120,120,0.3)"; ctx.lineWidth = 1.5;
  biomes.forEach((b, i) => b.neighbors.forEach((nb) => {
    const j = idx.get(nb)!;
    if (j > i) { ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke(); }
  }));

  biomes.forEach((b, i) => {
    const p = pos[i];
    const dom = dominantOnBiome(game.lineages, b.id);

    // region disc, tinted by the dominant lineage
    ctx.beginPath(); ctx.arc(p.x, p.y, region, 0, Math.PI * 2);
    ctx.fillStyle = dom ? hexA(dom.color, 0.1) : "rgba(150,150,150,0.07)";
    ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = dom ? dom.color : "rgba(150,150,150,0.4)"; ctx.stroke();

    // dots — deterministic positions per biome (seeded), count by presence, colour by lineage
    const rng = makeRng(idx.get(b.id)! * 1000 + 7);
    game.lineages.forEach((l) => {
      const pr = l.presence[b.id] ?? 0;
      if (pr <= 0) return;
      const count = Math.max(1, Math.round(pr * DOTS_SCALE));
      ctx.fillStyle = l.color;
      for (let k = 0; k < count; k++) {
        const ang = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * region * 0.82;
        const jitter = Math.sin(t / 600 + k) * 0.6;
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(ang) * rr, p.y + Math.sin(ang) * rr + jitter, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // label + home marker
    ctx.fillStyle = "rgba(90,90,90,0.95)";
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(b.name + (b.id === game.homeBiome ? " ★" : ""), p.x, p.y + region + 13);
  });
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

  return <canvas ref={ref} width={760} height={560} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />;
}
