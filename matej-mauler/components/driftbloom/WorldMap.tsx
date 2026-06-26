"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Application, Container, Graphics, BlurFilter, FillGradient } from "pixi.js";
import type { Environment } from "@/lib/sim/environment";
import type { GameState } from "@/lib/game/game";
import { makeRng } from "@/lib/sim/rng";
import { dominantOnBiome } from "@/lib/game/lineage";
import { STRATEGY_LABELS } from "@/lib/game/strategies";
import { FONT_SANS, C } from "./theme";

const DOTS_SCALE = 16;
type P = { x: number; y: number };

const hexNum = (hex: string) => parseInt(hex.slice(1), 16);

function terrain(env: Environment): { color: number; icon: string; name: string } {
  const { temperature: t, foodAbundance: f } = env;
  if (t < 0.3) return { color: 0xdbe9f1, icon: "❄️", name: "frozen" };
  if (t > 0.72) return { color: 0xe6c994, icon: "🏜️", name: "scorched" };
  if (f > 0.6) return { color: 0x9ec877, icon: "🌴", name: "lush" };
  return { color: 0xbcd698, icon: "🌿", name: "temperate" };
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
  let x = 0, y = 0; for (const p of poly) { x += p.x; y += p.y; } return { x: x / poly.length, y: y / poly.length };
}
function flat(poly: P[]): number[] { const a: number[] = []; for (const p of poly) { a.push(p.x, p.y); } return a; }

function buildMap(count: number, W: number, H: number) {
  const cx = W / 2, cy = H / 2, base = Math.min(W, H) * 0.44;
  const rng = makeRng(count * 1000 + 12345);
  const island: P[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const r = base * (0.86 + 0.14 * (0.5 + 0.5 * Math.sin(a * 3 + 1.3)));
    island.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.82 });
  }
  const seeds: P[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt((i + 0.4) / count) * base * 0.62;
    const th = i * 2.399963 + (rng() - 0.5) * 0.4;
    seeds.push({ x: cx + Math.cos(th) * r + (rng() - 0.5) * 18, y: cy + Math.sin(th) * r * 0.82 + (rng() - 0.5) * 14 });
  }
  const cells: P[][] = seeds.map((s, i) => {
    let cell = island;
    for (let j = 0; j < seeds.length; j++) {
      if (j === i) continue;
      const o = seeds[j];
      cell = clipHalfPlane(cell, 2 * (o.x - s.x), 2 * (o.y - s.y), o.x * o.x + o.y * o.y - s.x * s.x - s.y * s.y);
      if (cell.length === 0) break;
    }
    return cell;
  });
  return { island, cells };
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

function clampView(v: { scale: number; tx: number; ty: number }, size: { w: number; h: number }) {
  const scale = Math.min(4, Math.max(1, v.scale));
  return { scale, tx: Math.min(0, Math.max(size.w * (1 - scale), v.tx)), ty: Math.min(0, Math.max(size.h * (1 - scale), v.ty)) };
}

export function WorldMap({ game }: { game: GameState }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const waterRef = useRef<Graphics | null>(null);
  const dynRef = useRef<{ glow: Graphics; dots: Graphics; hi: Graphics } | null>(null);
  const [ready, setReady] = useState(false);

  const gameRef = useRef(game); useEffect(() => { gameRef.current = game; });
  const [size, setSize] = useState({ w: 600, h: 460 });
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const [hover, setHover] = useState<{ id: string; sx: number; sy: number } | null>(null);
  const hoverRef = useRef(hover); useEffect(() => { hoverRef.current = hover; });
  const [selected, setSelected] = useState<string | null>(null);
  const selRef = useRef(selected); useEffect(() => { selRef.current = selected; });
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const map = useMemo(() => buildMap(game.world.biomes.length, size.w, size.h), [game.world.biomes.length, size.w, size.h]);
  const mapRef = useRef(map); useEffect(() => { mapRef.current = map; });

  // container sizing
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); setSize({ w: Math.max(320, r.width), h: Math.max(280, r.height) }); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // init Pixi once
  useEffect(() => {
    let destroyed = false;
    const app = new Application();
    app.init({ backgroundAlpha: 0, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true, width: 600, height: 460 })
      .then(() => {
        if (destroyed) { app.destroy(true); return; }
        const wrap = wrapRef.current; if (!wrap) { app.destroy(true); return; }
        app.canvas.style.width = "100%"; app.canvas.style.height = "100%"; app.canvas.style.display = "block";
        wrap.insertBefore(app.canvas, wrap.firstChild);
        const water = new Graphics(); app.stage.addChild(water); waterRef.current = water;
        const world = new Container(); app.stage.addChild(world);
        const glowC = new Container(); glowC.filters = [new BlurFilter({ strength: 12 })];
        const glow = new Graphics(); glowC.addChild(glow);
        const dots = new Graphics(); const hi = new Graphics();
        world.addChild(glowC, dots, hi);
        appRef.current = app; worldRef.current = world; dynRef.current = { glow, dots, hi };

        app.ticker.add(() => {
          const t = performance.now();
          const g = gameRef.current, m = mapRef.current, dyn = dynRef.current; if (!dyn) return;
          // dominant glows
          dyn.glow.clear();
          g.world.biomes.forEach((b, i) => {
            const cell = m.cells[i]; if (cell.length < 3) return;
            const dom = dominantOnBiome(g.lineages, b.id); if (!dom) return;
            const ctr = centroid(cell);
            dyn.glow.circle(ctr.x, ctr.y, 34).fill({ color: hexNum(dom.color), alpha: 0.55 });
          });
          // dots
          dyn.dots.clear();
          g.world.biomes.forEach((b, i) => {
            const cell = m.cells[i]; if (cell.length < 3) return;
            const ctr = centroid(cell);
            const rng = makeRng(i * 1000 + 7);
            g.lineages.forEach((l) => {
              const pr = l.presence[b.id] ?? 0; if (pr <= 0) return;
              const count = Math.max(1, Math.round(pr * DOTS_SCALE));
              const col = hexNum(l.color);
              for (let k = 0; k < count; k++) {
                const ang = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * 26, jit = Math.sin(t / 600 + k * 1.7) * 0.7;
                dyn.dots.circle(ctr.x + Math.cos(ang) * rr, ctr.y + Math.sin(ang) * rr + jit, 2.6).fill({ color: col });
              }
            });
          });
          // hover / selected highlight
          dyn.hi.clear();
          const mark = (id: string | null, color: number, width: number) => {
            if (!id) return; const i = g.world.biomes.findIndex((b) => b.id === id); if (i < 0) return;
            const cell = m.cells[i]; if (cell.length < 3) return;
            dyn.hi.poly(flat(cell)).stroke({ width, color, alpha: 0.9 });
          };
          mark(hoverRef.current?.id ?? null, 0x5a4628, 2.5);
          mark(selRef.current, 0x1a1614, 3.5);
        });

        setReady(true);
      })
      .catch(() => {});
    return () => { destroyed = true; const a = appRef.current; if (a) { a.destroy(true); appRef.current = null; } };
  }, []);

  // (re)build static layers on size / map change
  useEffect(() => {
    const app = appRef.current, world = worldRef.current, dyn = dynRef.current;
    if (!ready || !app || !world || !dyn) return;
    app.renderer.resize(size.w, size.h);

    // ocean backdrop (fixed behind the world)
    const water = waterRef.current;
    if (water) {
      const grad = new FillGradient(0, 0, 0, size.h);
      grad.addColorStop(0, 0xcdeae6); grad.addColorStop(1, 0xa9d6da);
      water.clear(); water.rect(0, 0, size.w, size.h).fill(grad);
    }

    // remove old static (everything before glow/dots/hi)
    const keep = new Set<Container>([dyn.glow.parent!, dyn.dots, dyn.hi]);
    for (const child of [...world.children]) if (!keep.has(child as Container)) world.removeChild(child);

    const shadow = new Graphics().poly(flat(map.island)).fill({ color: 0x2a3b40, alpha: 0.25 });
    shadow.filters = [new BlurFilter({ strength: 14 })]; shadow.y = 7;
    const island = new Graphics().poly(flat(map.island)).fill(0xecd6a4).stroke({ width: 3, color: 0x96784a, alpha: 0.55 });
    const terr = new Graphics();
    game.world.biomes.forEach((b, i) => {
      const cell = map.cells[i]; if (cell.length < 3) return;
      terr.poly(flat(cell)).fill(terrain(b.env).color).stroke({ width: 1.4, color: 0x5a4628, alpha: 0.4 });
    });
    world.addChildAt(shadow, 0); world.addChildAt(island, 1); world.addChildAt(terr, 2);
  }, [ready, map, size, game.world.biomes]);

  // pan / zoom transform
  useEffect(() => {
    const world = worldRef.current; if (!world) return;
    world.scale.set(view.scale); world.position.set(view.tx, view.ty);
  }, [view, ready]);

  // ---- input (kept in React; geometry via buildMap) ----
  const screenToWorld = (sx: number, sy: number) => ({ x: (sx - view.tx) / view.scale, y: (sy - view.ty) / view.scale });
  function biomeAt(sx: number, sy: number): string | null {
    const wp = screenToWorld(sx, sy);
    for (let i = 0; i < map.cells.length; i++) if (map.cells[i].length > 2 && pointInPoly(wp, map.cells[i])) return game.world.biomes[i].id;
    return null;
  }
  function onMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    if (drag.current) { setView((v) => clampView({ ...v, tx: drag.current!.tx + (sx - drag.current!.x), ty: drag.current!.ty + (sy - drag.current!.y) }, size)); return; }
    const id = biomeAt(sx, sy); setHover(id ? { id, sx, sy } : null);
  }
  function onWheel(e: React.WheelEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    setView((v) => { const ns = Math.min(4, Math.max(1, v.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); return clampView({ scale: ns, tx: mx - (mx - v.tx) * (ns / v.scale), ty: my - (my - v.ty) * (ns / v.scale) }, size); });
  }
  function onDown(e: React.MouseEvent) { const rect = e.currentTarget.getBoundingClientRect(); drag.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, tx: view.tx, ty: view.ty }; }
  function onUp(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const moved = drag.current && Math.abs((e.clientX - rect.left) - drag.current.x) > 4;
    if (!moved) setSelected(biomeAt(e.clientX - rect.left, e.clientY - rect.top));
    drag.current = null;
  }

  const selBiome = selected ? game.world.biomes.find((b) => b.id === selected) : null;
  const selPresent = selBiome ? game.lineages.filter((l) => (l.presence[selBiome.id] ?? 0) > 0).sort((a, b) => b.presence[selBiome.id]! - a.presence[selBiome.id]!) : [];

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", height: "100%", minHeight: 280, fontFamily: FONT_SANS, overflow: "hidden", borderRadius: 16 }}>
      {/* pointer surface above the pixi canvas */}
      <div onMouseMove={onMove} onMouseLeave={() => { setHover(null); drag.current = null; }} onWheel={onWheel} onMouseDown={onDown} onMouseUp={onUp}
        style={{ position: "absolute", inset: 0, zIndex: 2, cursor: hover ? "pointer" : "grab" }} />

      {/* edge vignette → ocean melts into the page */}
      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", background: "radial-gradient(ellipse at center, rgba(250,250,247,0) 45%, rgba(250,250,247,0.85) 100%)" }} />

      {hover && (() => {
        const b = game.world.biomes.find((x) => x.id === hover.id)!;
        return (
          <div style={{ position: "absolute", zIndex: 4, left: Math.min(hover.sx + 12, size.w - 150), top: Math.min(hover.sy + 12, size.h - 40), background: "rgba(255,255,255,0.95)", border: `1px solid ${C.line}`, borderRadius: 10, padding: "4px 9px", fontSize: 12, fontWeight: 600, pointerEvents: "none", boxShadow: "0 6px 18px rgba(26,22,20,0.15)", whiteSpace: "nowrap" }}>
            {terrain(b.env).icon} {b.name}{b.id === game.homeBiome ? " ★" : ""}
          </div>
        );
      })()}

      <div style={{ position: "absolute", right: 10, bottom: 10, zIndex: 4, display: "grid", gap: 6 }}>
        <button className="db-gbtn" onClick={() => setView((v) => clampView({ ...v, scale: Math.min(4, v.scale * 1.3) }, size))} style={{ width: 30, height: 30, fontSize: 16 }}>+</button>
        <button className="db-gbtn" onClick={() => setView((v) => clampView({ ...v, scale: Math.max(1, v.scale / 1.3) }, size))} style={{ width: 30, height: 30, fontSize: 16 }}>−</button>
      </div>

      {selBiome && (
        <div style={{ position: "absolute", zIndex: 5, top: 10, right: 10, width: 210, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 13px", boxShadow: "0 12px 34px rgba(26,22,20,0.18)", display: "grid", gap: 8 }}>
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
