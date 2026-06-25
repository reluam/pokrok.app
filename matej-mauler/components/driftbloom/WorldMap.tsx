"use client";
import { useEffect, useRef, useState } from "react";
import type { Environment } from "@/lib/sim/environment";
import type { GameState } from "@/lib/game/game";
import { makeRng } from "@/lib/sim/rng";
import { dominantOnBiome } from "@/lib/game/lineage";
import { STRATEGY_LABELS } from "@/lib/game/strategies";
import { FONT_SANS, C, hexA } from "./theme";

const DOTS_SCALE = 16;

interface Pt { x: number; y: number; }

function terrain(env: Environment): { color: string; icon: string; name: string } {
  const { temperature: t, foodAbundance: f } = env;
  if (t < 0.3) return { color: "rgb(216,230,238)", icon: "❄️", name: "frozen" };
  if (t > 0.72) return { color: "rgb(226,201,148)", icon: "🏜️", name: "scorched" };
  if (f > 0.6) return { color: "rgb(126,168,99)", icon: "🌴", name: "lush" };
  return { color: "rgb(171,198,138)", icon: "🌿", name: "temperate" };
}

// Organic continent layout: phyllotaxis fills a disc (no donut hole), lightly jittered per world.
function layout(game: GameState, W: number, H: number): { pos: Pt[]; region: number } {
  const n = game.world.biomes.length;
  const cx = W / 2, cy = H / 2;
  const spread = Math.min(W, H) * 0.42;
  const seed = n * 97 + game.world.biomes.reduce((s, b) => s + b.name.length, 0);
  const rng = makeRng(seed);
  const pos = game.world.biomes.map((_, i) => {
    const r = Math.sqrt((i + 0.5) / n) * spread;
    const th = i * 2.399963 + (rng() - 0.5) * 0.5;
    return { x: cx + Math.cos(th) * r + (rng() - 0.5) * 16, y: cy + Math.sin(th) * r + (rng() - 0.5) * 16 };
  });
  return { pos, region: Math.min(W, H) * 0.135 };
}

function draw(ctx: CanvasRenderingContext2D, W: number, H: number, game: GameState, hovered: string | null, t: number) {
  const biomes = game.world.biomes;
  const { pos, region } = layout(game, W, H);
  const idx = new Map(biomes.map((b, i) => [b.id, i]));

  // water
  const sea = ctx.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, "#cdeae6"); sea.addColorStop(1, "#a9d6da");
  ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 26) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, y + Math.sin(x / 60 + t / 1400 + y) * 2);
    ctx.stroke();
  }

  // continent silhouette
  ctx.save();
  ctx.shadowColor = "rgba(40,70,80,0.18)"; ctx.shadowBlur = 20; ctx.shadowOffsetY = 7;
  ctx.fillStyle = "#ecd6a4";
  pos.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, region * 1.5, 0, Math.PI * 2); ctx.fill(); });
  ctx.beginPath(); ctx.arc(W / 2, H / 2, region * 1.7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.shadowColor = "rgba(60,120,70,0.25)"; ctx.shadowBlur = 24;
  ctx.fillStyle = "#bcdc97";
  pos.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, region * 1.32, 0, Math.PI * 2); ctx.fill(); });
  ctx.beginPath(); ctx.arc(W / 2, H / 2, region * 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // routes
  ctx.strokeStyle = "rgba(70,55,30,0.22)"; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
  biomes.forEach((b, i) => b.neighbors.forEach((nb) => {
    const j = idx.get(nb)!; if (j <= i) return;
    ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke();
  }));
  ctx.setLineDash([]);

  biomes.forEach((b, i) => {
    const p = pos[i];
    const dom = dominantOnBiome(game.lineages, b.id);
    const ter = terrain(b.env);
    const isHover = hovered === b.id;

    const terr = ctx.createRadialGradient(p.x, p.y, region * 0.2, p.x, p.y, region);
    terr.addColorStop(0, ter.color); terr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = terr; ctx.beginPath(); ctx.arc(p.x, p.y, region, 0, Math.PI * 2); ctx.fill();

    if (dom) {
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, region * 1.05);
      glow.addColorStop(0, hexA(dom.color, isHover ? 0.4 : 0.28)); glow.addColorStop(1, hexA(dom.color, 0));
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y, region * 1.05, 0, Math.PI * 2); ctx.fill();
    }
    if (isHover) {
      ctx.strokeStyle = "rgba(26,22,20,0.5)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, region * 0.98, 0, Math.PI * 2); ctx.stroke();
    }

    // terrain icon, faint, behind dots
    ctx.globalAlpha = 0.5; ctx.font = `${Math.round(region * 0.5)}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(ter.icon, p.x, p.y - region * 0.18);
    ctx.globalAlpha = 1; ctx.textBaseline = "alphabetic";

    // presence dots
    const rng = makeRng(i * 1000 + 7);
    game.lineages.forEach((l) => {
      const pr = l.presence[b.id] ?? 0; if (pr <= 0) return;
      const count = Math.max(1, Math.round(pr * DOTS_SCALE));
      for (let k = 0; k < count; k++) {
        const ang = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * region * 0.78;
        const jit = Math.sin(t / 600 + k * 1.7) * 0.7;
        ctx.fillStyle = l.color;
        ctx.beginPath(); ctx.arc(p.x + Math.cos(ang) * rr, p.y + Math.sin(ang) * rr + jit, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath(); ctx.arc(p.x + Math.cos(ang) * rr - 0.7, p.y + Math.sin(ang) * rr + jit - 0.7, 0.9, 0, Math.PI * 2); ctx.fill();
      }
    });

    // home marker (names show on hover via the tooltip — keeps the board clean)
    if (b.id === game.homeBiome) {
      ctx.font = "14px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("★", p.x + region * 0.62, p.y - region * 0.62);
      ctx.textBaseline = "alphabetic";
    }
  });

  // soft edge fade — the ocean melts into the page background (no hard rectangle)
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.62);
  vg.addColorStop(0, "rgba(250,250,247,0)"); vg.addColorStop(1, "rgba(250,250,247,0.92)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "62px 1fr", gap: 6, alignItems: "center", fontSize: 11 }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ height: 5, borderRadius: 5, background: "rgba(26,22,20,0.08)", overflow: "hidden" }}>
        <span style={{ display: "block", height: "100%", width: `${Math.round(v * 100)}%`, background: "#16a34a", borderRadius: 5 }} />
      </span>
    </div>
  );
}

export function WorldMap({ game }: { game: GameState }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef(game); useEffect(() => { gameRef.current = game; });
  const [size, setSize] = useState({ w: 600, h: 460 });
  const sizeRef = useRef(size); useEffect(() => { sizeRef.current = size; });
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const hoverRef = useRef(hover); useEffect(() => { hoverRef.current = hover; });

  // size to container
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(320, r.width), h: Math.max(280, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // render loop
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let raf = 0;
    const loop = (t: number) => {
      const { w, h } = sizeRef.current;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, w, h, gameRef.current, hoverRef.current?.id ?? null, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function onMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const { pos, region } = layout(gameRef.current, size.w, size.h);
    let found: string | null = null;
    for (let i = 0; i < pos.length; i++) {
      if (Math.hypot(pos[i].x - x, pos[i].y - y) <= region) { found = game.world.biomes[i].id; break; }
    }
    setHover(found ? { id: found, x, y } : null);
  }

  const hb = hover ? game.world.biomes.find((b) => b.id === hover.id) : null;
  const present = hb ? game.lineages.filter((l) => (l.presence[hb.id] ?? 0) > 0)
    .sort((a, b) => (b.presence[hb.id]! - a.presence[hb.id]!)) : [];

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", height: "100%", minHeight: 280, fontFamily: FONT_SANS }}>
      <canvas ref={canvasRef} onMouseMove={onMove} onMouseLeave={() => setHover(null)}
        style={{ width: "100%", height: "100%", display: "block", cursor: hover ? "pointer" : "default" }} />

      {hb && hover && (
        <div style={{
          position: "absolute", left: Math.min(hover.x + 14, size.w - 210), top: Math.min(hover.y + 14, size.h - 180),
          width: 196, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: "11px 12px",
          boxShadow: "0 10px 30px rgba(26,22,20,0.18)", pointerEvents: "none", display: "grid", gap: 7, zIndex: 5,
        }}>
          <strong style={{ fontSize: 13 }}>{terrain(hb.env).icon} {hb.name}{hb.id === game.homeBiome ? " ★" : ""}</strong>
          <div style={{ display: "grid", gap: 3 }}>
            <Bar label="food" v={hb.env.foodAbundance} />
            <Bar label="predators" v={hb.env.predatorPressure} />
            <Bar label="temperature" v={hb.env.temperature} />
          </div>
          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 6, display: "grid", gap: 3 }}>
            {present.length === 0 && <span style={{ fontSize: 11, color: C.muted }}>uninhabited</span>}
            {present.map((l) => (
              <span key={l.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: l.color }} />
                {l.kind === "player" ? "you" : STRATEGY_LABELS[l.strategy]}
                <span style={{ marginLeft: "auto", color: C.muted }}>{Math.round((l.presence[hb.id] ?? 0) * 100)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
