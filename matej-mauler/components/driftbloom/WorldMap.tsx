"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Environment } from "@/lib/sim/environment";
import type { GameState } from "@/lib/game/game";
import { makeRng } from "@/lib/sim/rng";
import { dominantOnBiome } from "@/lib/game/lineage";
import { STRATEGY_LABELS } from "@/lib/game/strategies";
import { FONT_SANS, C, hexA } from "./theme";

const DOTS_SCALE = 16;
type P = { x: number; y: number };

function terrain(env: Environment): { color: string; icon: string; name: string } {
  const { temperature: t, foodAbundance: f } = env;
  if (t < 0.3) return { color: "#dbe9f1", icon: "❄️", name: "frozen" };
  if (t > 0.72) return { color: "#e6c994", icon: "🏜️", name: "scorched" };
  if (f > 0.6) return { color: "#9ec877", icon: "🌴", name: "lush" };
  return { color: "#bcd698", icon: "🌿", name: "temperate" };
}

// ---- geometry: a convex-ish island clipped into Voronoi territories ----
function clipHalfPlane(poly: P[], nx: number, ny: number, d: number): P[] {
  const out: P[] = [];
  const inside = (p: P) => nx * p.x + ny * p.y <= d + 1e-9;
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i], B = poly[(i + 1) % poly.length];
    const Ain = inside(A), Bin = inside(B);
    if (Ain) out.push(A);
    if (Ain !== Bin) {
      const den = nx * (B.x - A.x) + ny * (B.y - A.y);
      const t = den !== 0 ? (d - (nx * A.x + ny * A.y)) / den : 0;
      out.push({ x: A.x + t * (B.x - A.x), y: A.y + t * (B.y - A.y) });
    }
  }
  return out;
}

function pointInPoly(p: P, poly: P[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function centroid(poly: P[]): P {
  let x = 0, y = 0;
  for (const p of poly) { x += p.x; y += p.y; }
  return { x: x / poly.length, y: y / poly.length };
}

// Deterministic island + Voronoi cells (stable across the whole game — seeded by biome count only).
function buildMap(count: number, W: number, H: number) {
  const cx = W / 2, cy = H / 2, base = Math.min(W, H) * 0.44;
  const rng = makeRng(count * 1000 + 12345);

  // convex-ish island outline
  const island: P[] = [];
  const KISL = 28;
  for (let i = 0; i < KISL; i++) {
    const a = (i / KISL) * Math.PI * 2;
    const r = base * (0.86 + 0.14 * (0.5 + 0.5 * Math.sin(a * 3 + 1.3)));
    island.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.82 });
  }

  // biome seeds spread across the island (phyllotaxis)
  const seeds: P[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt((i + 0.4) / count) * base * 0.62;
    const th = i * 2.399963 + (rng() - 0.5) * 0.4;
    seeds.push({ x: cx + Math.cos(th) * r + (rng() - 0.5) * 18, y: cy + Math.sin(th) * r * 0.82 + (rng() - 0.5) * 14 });
  }

  // each cell = island clipped by every bisector half-plane
  const cells: P[][] = seeds.map((s, i) => {
    let cell = island;
    for (let j = 0; j < seeds.length; j++) {
      if (j === i) continue;
      const o = seeds[j];
      const nx = 2 * (o.x - s.x), ny = 2 * (o.y - s.y);
      const d = o.x * o.x + o.y * o.y - s.x * s.x - s.y * s.y;
      cell = clipHalfPlane(cell, nx, ny, d);
      if (cell.length === 0) break;
    }
    return cell;
  });

  return { island, seeds, cells };
}

function drawPoly(ctx: CanvasRenderingContext2D, poly: P[]) {
  ctx.beginPath();
  poly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
}

function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "66px 1fr", gap: 6, alignItems: "center", fontSize: 11 }}>
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
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const viewRef = useRef(view); useEffect(() => { viewRef.current = view; });
  const [hover, setHover] = useState<{ id: string; sx: number; sy: number } | null>(null);
  const hoverRef = useRef(hover); useEffect(() => { hoverRef.current = hover; });
  const [selected, setSelected] = useState<string | null>(null);
  const selRef = useRef(selected); useEffect(() => { selRef.current = selected; });
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const map = useMemo(() => buildMap(game.world.biomes.length, size.w, size.h), [game.world.biomes.length, size.w, size.h]);
  const mapRef = useRef(map); useEffect(() => { mapRef.current = map; });

  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(320, r.width), h: Math.max(280, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let raf = 0;
    const loop = (t: number) => {
      const { w, h } = sizeRef.current;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      draw(ctx, dpr, w, h, gameRef.current, mapRef.current, viewRef.current, hoverRef.current?.id ?? null, selRef.current, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const screenToWorld = (sx: number, sy: number) => ({ x: (sx - view.tx) / view.scale, y: (sy - view.ty) / view.scale });

  function biomeAt(sx: number, sy: number): string | null {
    const wp = screenToWorld(sx, sy);
    for (let i = 0; i < map.cells.length; i++) if (map.cells[i].length > 2 && pointInPoly(wp, map.cells[i])) return game.world.biomes[i].id;
    return null;
  }

  function onMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    if (drag.current) {
      const nx = drag.current.tx + (sx - drag.current.x), ny = drag.current.ty + (sy - drag.current.y);
      setView((v) => clampView({ ...v, tx: nx, ty: ny }, size));
      return;
    }
    const id = biomeAt(sx, sy);
    setHover(id ? { id, sx, sy } : null);
  }
  function onWheel(e: React.WheelEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    setView((v) => {
      const ns = Math.min(4, Math.max(1, v.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
      const tx = mx - (mx - v.tx) * (ns / v.scale), ty = my - (my - v.ty) * (ns / v.scale);
      return clampView({ scale: ns, tx, ty }, size);
    });
  }
  function onDown(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    drag.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, tx: view.tx, ty: view.ty };
  }
  function onUp(e: React.MouseEvent) {
    const moved = drag.current && (Math.abs((e.clientX - e.currentTarget.getBoundingClientRect().left) - drag.current.x) > 4);
    if (!moved) { const rect = e.currentTarget.getBoundingClientRect(); const id = biomeAt(e.clientX - rect.left, e.clientY - rect.top); setSelected(id); }
    drag.current = null;
  }

  const selBiome = selected ? game.world.biomes.find((b) => b.id === selected) : null;
  const selPresent = selBiome ? game.lineages.filter((l) => (l.presence[selBiome.id] ?? 0) > 0).sort((a, b) => b.presence[selBiome.id]! - a.presence[selBiome.id]!) : [];

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", height: "100%", minHeight: 280, fontFamily: FONT_SANS, overflow: "hidden", borderRadius: 16 }}>
      <canvas ref={canvasRef} onMouseMove={onMove} onMouseLeave={() => { setHover(null); drag.current = null; }} onWheel={onWheel} onMouseDown={onDown} onMouseUp={onUp}
        style={{ width: "100%", height: "100%", display: "block", cursor: hover ? "pointer" : "grab" }} />

      {/* hover quick tooltip */}
      {hover && (() => {
        const b = game.world.biomes.find((x) => x.id === hover.id)!;
        return (
          <div style={{ position: "absolute", left: Math.min(hover.sx + 12, size.w - 150), top: Math.min(hover.sy + 12, size.h - 40), background: "rgba(255,255,255,0.95)", border: `1px solid ${C.line}`, borderRadius: 10, padding: "4px 9px", fontSize: 12, fontWeight: 600, pointerEvents: "none", boxShadow: "0 6px 18px rgba(26,22,20,0.15)", whiteSpace: "nowrap" }}>
            {terrain(b.env).icon} {b.name}{b.id === game.homeBiome ? " ★" : ""}
          </div>
        );
      })()}

      {/* zoom controls */}
      <div style={{ position: "absolute", right: 10, bottom: 10, display: "grid", gap: 6 }}>
        <button className="db-gbtn" onClick={() => setView((v) => clampView({ ...v, scale: Math.min(4, v.scale * 1.3) }, size))} style={{ width: 30, height: 30, fontSize: 16 }}>+</button>
        <button className="db-gbtn" onClick={() => setView((v) => clampView({ ...v, scale: Math.max(1, v.scale / 1.3) }, size))} style={{ width: 30, height: 30, fontSize: 16 }}>−</button>
      </div>

      {/* selected territory stats */}
      {selBiome && (
        <div style={{ position: "absolute", top: 10, right: 10, width: 210, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 13px", boxShadow: "0 12px 34px rgba(26,22,20,0.18)", display: "grid", gap: 8, zIndex: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: 13 }}>{terrain(selBiome.env).icon} {selBiome.name}{selBiome.id === game.homeBiome ? " ★" : ""}</strong>
            <button onClick={() => setSelected(null)} style={{ border: "none", background: "none", cursor: "pointer", color: C.muted, fontSize: 13 }}>✕</button>
          </div>
          <div style={{ display: "grid", gap: 3 }}>
            <Bar label="food" v={selBiome.env.foodAbundance} />
            <Bar label="predators" v={selBiome.env.predatorPressure} />
            <Bar label="temperature" v={selBiome.env.temperature} />
          </div>
          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 6, display: "grid", gap: 3 }}>
            {selPresent.length === 0 && <span style={{ fontSize: 11, color: C.muted }}>uninhabited</span>}
            {selPresent.map((l) => (
              <span key={l.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: l.color }} />
                {l.kind === "player" ? "you" : STRATEGY_LABELS[l.strategy]}
                <span style={{ marginLeft: "auto", color: C.muted }}>{Math.round((l.presence[selBiome.id] ?? 0) * 100)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function clampView(v: { scale: number; tx: number; ty: number }, size: { w: number; h: number }) {
  const scale = Math.min(4, Math.max(1, v.scale));
  const tx = Math.min(0, Math.max(size.w * (1 - scale), v.tx));
  const ty = Math.min(0, Math.max(size.h * (1 - scale), v.ty));
  return { scale, tx, ty };
}

function draw(
  ctx: CanvasRenderingContext2D, dpr: number, W: number, H: number, game: GameState,
  map: { island: P[]; seeds: P[]; cells: P[][] }, view: { scale: number; tx: number; ty: number },
  hovered: string | null, selected: string | null, t: number,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // ocean (screen space)
  const sea = ctx.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, "#cdeae6"); sea.addColorStop(1, "#a9d6da");
  ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 26) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, y + Math.sin(x / 60 + t / 1400 + y) * 2);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(view.tx, view.ty); ctx.scale(view.scale, view.scale);

  // island coast
  ctx.save();
  ctx.shadowColor = "rgba(40,70,80,0.2)"; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#ecd6a4"; drawPoly(ctx, map.island); ctx.fill();
  ctx.restore();

  // territories
  game.world.biomes.forEach((b, i) => {
    const cell = map.cells[i]; if (cell.length < 3) return;
    const dom = dominantOnBiome(game.lineages, b.id);
    const ter = terrain(b.env);
    drawPoly(ctx, cell);
    ctx.fillStyle = ter.color; ctx.fill();
    if (dom) {
      const ctr = centroid(cell);
      const g = ctx.createRadialGradient(ctr.x, ctr.y, 0, ctr.x, ctr.y, 70);
      g.addColorStop(0, hexA(dom.color, b.id === hovered ? 0.42 : 0.3)); g.addColorStop(1, hexA(dom.color, 0));
      drawPoly(ctx, cell); ctx.save(); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(ctr.x - 80, ctr.y - 80, 160, 160); ctx.restore();
    }
    // border
    drawPoly(ctx, cell);
    ctx.lineWidth = b.id === selected ? 3.5 : b.id === hovered ? 2.5 : 1.5;
    ctx.strokeStyle = b.id === selected ? "#1a1614" : "rgba(90,70,40,0.5)";
    ctx.stroke();
  });

  // coastline outline
  drawPoly(ctx, map.island); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(150,120,70,0.55)"; ctx.stroke();

  // presence dots + icon + home star
  game.world.biomes.forEach((b, i) => {
    const cell = map.cells[i]; if (cell.length < 3) return;
    const ctr = centroid(cell);
    ctx.globalAlpha = 0.4; ctx.font = "18px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(terrain(b.env).icon, ctr.x, ctr.y - 14); ctx.globalAlpha = 1; ctx.textBaseline = "alphabetic";

    const rng = makeRng(i * 1000 + 7);
    game.lineages.forEach((l) => {
      const pr = l.presence[b.id] ?? 0; if (pr <= 0) return;
      const count = Math.max(1, Math.round(pr * DOTS_SCALE));
      for (let k = 0; k < count; k++) {
        const ang = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * 26;
        const jit = Math.sin(t / 600 + k * 1.7) * 0.7;
        ctx.fillStyle = l.color;
        ctx.beginPath(); ctx.arc(ctr.x + Math.cos(ang) * rr, ctr.y + Math.sin(ang) * rr + jit, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath(); ctx.arc(ctr.x + Math.cos(ang) * rr - 0.7, ctr.y + Math.sin(ang) * rr + jit - 0.7, 0.9, 0, Math.PI * 2); ctx.fill();
      }
    });
    if (b.id === game.homeBiome) { ctx.font = "13px serif"; ctx.textAlign = "center"; ctx.fillText("★", ctr.x + 16, ctr.y - 12); }
  });

  ctx.restore();

  // edge fade
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.34, W / 2, H / 2, Math.max(W, H) * 0.62);
  vg.addColorStop(0, "rgba(250,250,247,0)"); vg.addColorStop(1, "rgba(250,250,247,0.85)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
