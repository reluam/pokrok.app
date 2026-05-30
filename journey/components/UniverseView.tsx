"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Area, Chapter } from "@/lib/areas";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";
import { useTheme } from "@/lib/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { LangToggle } from "./LangToggle";

type Props = { areas: Area[]; lang: Lang; focusSlug?: string };

// ── Deterministic pseudo-random from string seed ────────────────────────────

function seededRng(seed: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  let s = h;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ── Theme palette for galaxies ───────────────────────────────────────────────

type Palette = {
  nebula1: string; nebula2: string; arm1: string; arm2: string;
  coreA: string; coreB: string; coreC: string; star: string; name: string;
};

function galaxyPalette(theme: Theme): Palette {
  if (theme === "hhgttg") return {
    nebula1: "#00e850", nebula2: "#0a7a2a", arm1: "#00e850", arm2: "#00a838",
    coreA: "#eaffea", coreB: "#9dff9d", coreC: "#00e850", star: "#ffff66", name: "#d6ffd6",
  };
  return {
    nebula1: "#c9aa78", nebula2: "#7a6ad0", arm1: "#d9b98a", arm2: "#8a7ad8",
    coreA: "#fffaf0", coreB: "#ffe9bf", coreC: "#c9aa78", star: "#ffe9bf", name: "#fff3da",
  };
}

// ── Galaxy positions on the 2D plane (golden-angle spiral + seeded jitter) ───

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const SPREAD = 640;

type PlanePos = { x: number; y: number };

function buildPlanePositions(areas: Area[]): Record<string, PlanePos> {
  const out: Record<string, PlanePos> = {};
  areas.forEach((area, i) => {
    const r = SPREAD * Math.sqrt(i);
    const a = i * GOLDEN;
    const rng = seededRng(area.id + "pos");
    const jx = (rng() - 0.5) * SPREAD * 0.55;
    const jy = (rng() - 0.5) * SPREAD * 0.55;
    out[area.id] = { x: r * Math.cos(a) + jx, y: r * Math.sin(a) + jy };
  });
  return out;
}

// ── Background star field (lives ON the plane, pans + zooms with galaxies) ───

type BgStar = { x: number; y: number; r: number; o: number; tw: boolean; dur: string; del: string };

function BackgroundStars({ box }: { box: { x: number; y: number; w: number; h: number } }) {
  const stars = useMemo<BgStar[]>(() => {
    const rng = seededRng("uv-background");
    const count = clamp(Math.round((box.w * box.h) / 11000), 140, 460);
    return Array.from({ length: count }, () => {
      const tw = rng() < 0.45;
      return {
        x: rng() * box.w, y: rng() * box.h,
        r: rng() * 1.1 + 0.25, o: rng() * 0.5 + 0.12,
        tw, dur: (2 + rng() * 3).toFixed(2), del: (rng() * 4).toFixed(2),
      };
    });
  }, [box.w, box.h]);

  return (
    <svg width={box.w} height={box.h}
      style={{ position: "absolute", left: box.x, top: box.y, overflow: "visible", pointerEvents: "none" }}
      aria-hidden="true">
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="rgba(205,210,255,1)"
          style={{ opacity: s.o, animation: s.tw ? `uv-tw ${s.dur}s ease-in-out ${s.del}s infinite` : undefined }} />
      ))}
    </svg>
  );
}

// ── Galaxy geometry ──────────────────────────────────────────────────────────

const GW = 400, GH = 240;
const GCX = GW / 2, GCY = GH / 2;

function armPath(rot: number): string {
  const steps = 40, turns = 1.15, b = 0.32, base = 7;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const theta = t * turns * 2 * Math.PI;
    const r = base * Math.exp(b * theta);
    const x = GCX + r * Math.cos(theta + rot);
    const y = GCY + r * 0.56 * Math.sin(theta + rot);
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + " ";
  }
  return d.trim();
}

function buildChapterLayout(count: number, seed: string): PlanePos[] {
  const rot0 = seededRng(seed + "rot")() * Math.PI * 2;
  const rx = GW * 0.30, ry = GH * 0.28;
  return Array.from({ length: count }, (_, i) => {
    const a = rot0 + (2 * Math.PI * i) / count;
    return { x: GCX + rx * Math.cos(a), y: GCY + ry * Math.sin(a) };
  });
}

// ── Galaxy ──────────────────────────────────────────────────────────────────

function GalaxySvg({
  area, lang, isFocused, pal,
  onClickArea, onClickChapter,
}: {
  area: Area; lang: Lang; isFocused: boolean; pal: Palette;
  onClickArea: () => void;
  onClickChapter: (ch: Chapter) => void;
}) {
  const chapterPos = useMemo(() => buildChapterLayout(area.chapters.length, area.id), [area.chapters.length, area.id]);
  const armRot     = useMemo(() => seededRng(area.id + "arm")() * Math.PI, [area.id]);
  const nebulaId = `neb-${area.id}`;
  const coreId   = `core-${area.id}`;
  const armBlur  = `armb-${area.id}`;
  const starGlow = `sg-${area.id}`;

  return (
    <svg width={GW} height={GH} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={nebulaId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={pal.nebula1} stopOpacity={isFocused ? 0.16 : 0.09} />
          <stop offset="45%"  stopColor={pal.nebula2} stopOpacity={isFocused ? 0.08 : 0.045} />
          <stop offset="100%" stopColor="#05051a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={coreId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={pal.coreA} stopOpacity={isFocused ? 0.95 : 0.6} />
          <stop offset="35%"  stopColor={pal.coreB} stopOpacity={isFocused ? 0.55 : 0.32} />
          <stop offset="70%"  stopColor={pal.coreC} stopOpacity={isFocused ? 0.22 : 0.12} />
          <stop offset="100%" stopColor={pal.coreC} stopOpacity="0" />
        </radialGradient>
        <filter id={armBlur} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
        <filter id={starGlow} x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={isFocused ? "2.4" : "1.6"} result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <ellipse cx={GCX} cy={GCY} rx={GW * 0.5} ry={GH * 0.5} fill={`url(#${nebulaId})`} />

      <g filter={`url(#${armBlur})`} opacity={isFocused ? 0.7 : 0.42}>
        <path d={armPath(armRot)}                 fill="none" stroke={pal.arm1} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        <path d={armPath(armRot + Math.PI)}       fill="none" stroke={pal.arm1} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        <path d={armPath(armRot + 0.5)}           fill="none" stroke={pal.arm2} strokeWidth={2} strokeLinecap="round" opacity={0.28} />
        <path d={armPath(armRot + Math.PI + 0.5)} fill="none" stroke={pal.arm2} strokeWidth={2} strokeLinecap="round" opacity={0.28} />
      </g>

      <ellipse cx={GCX} cy={GCY} rx={isFocused ? 64 : 46} ry={isFocused ? 42 : 30} fill={`url(#${coreId})`} />
      <circle cx={GCX} cy={GCY} r={isFocused ? 4 : 2.6} fill={pal.coreA} opacity={0.95} />

      {area.chapters.map((ch, i) => {
        const p = chapterPos[i];
        const isRight = p.x >= GCX;
        return (
          <g key={ch.id} onClick={(e) => { e.stopPropagation(); onClickChapter(ch); }} style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
            <circle cx={p.x} cy={p.y} r={isFocused ? 7 : 5}
              fill={pal.arm1} fillOpacity={0.16} filter={`url(#${starGlow})`} />
            <circle cx={p.x} cy={p.y} r={isFocused ? 3.4 : 2.4} fill={pal.star} opacity={0.95} />
            {isFocused && (
              <text x={p.x + (isRight ? 12 : -12)} y={p.y + 3.5} textAnchor={isRight ? "start" : "end"}
                fill="var(--text-secondary)" fontSize="9" fontFamily="var(--font-sans)"
                style={{ textTransform: "uppercase", letterSpacing: "0.08em", pointerEvents: "none" }}>
                {ch[lang].subtitle}
              </text>
            )}
          </g>
        );
      })}

      <g onClick={(e) => { e.stopPropagation(); onClickArea(); }} style={{ cursor: "pointer" }}>
        <ellipse cx={GCX} cy={GCY} rx={58} ry={34} fill="transparent" />
        <text x={GCX} y={GCY + 4} textAnchor="middle" fill={pal.name}
          fontSize={isFocused ? 13 : 10} fontFamily="var(--font-serif)"
          style={{ letterSpacing: "0.04em", pointerEvents: "none", opacity: isFocused ? 1 : 0.82 }}>
          {area[lang].name}
        </text>
      </g>
    </svg>
  );
}

// ── Inline search (wide bar, results directly below — no modal) ──────────────

function InlineSearch({
  areas, lang, onPick, onActiveChange, inputRef,
}: {
  areas: Area[]; lang: Lang;
  onPick: (area: Area, chapter: Chapter) => void;
  onActiveChange: (active: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results: { area: Area; chapter: Chapter }[] = [];
  if (query.trim().length >= 2) {
    const q = query.toLowerCase();
    for (const area of areas) {
      for (const ch of area.chapters) {
        const hay = [area[lang].name, ch[lang].subtitle, ch[lang].title,
          ...ch.sections.map(s => s[lang])].join(" ").toLowerCase();
        if (hay.includes(q)) results.push({ area, chapter: ch });
      }
    }
  }
  const showResults = open && query.trim().length >= 2;

  return (
    <div style={{ width: "min(620px, 92vw)", pointerEvents: "auto" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        background: "rgba(10,10,36,0.7)", backdropFilter: "blur(10px)",
        border: "1px solid rgba(201,170,120,0.22)",
        borderRadius: showResults ? "16px 16px 0 0" : "16px",
        padding: "10px 18px", transition: "border-radius 150ms",
      }}>
        <span style={{ fontSize: "16px", color: "var(--text-muted)" }}>⌕</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); onActiveChange(true); }}
          onBlur={() => { onActiveChange(false); }}
          placeholder={lang === "cs" ? "Hledat ve vesmíru…" : "Search the universe…"}
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            fontSize: "15px", color: "var(--text-primary)", fontFamily: "var(--font-sans)",
          }} />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "14px" }}>
            ✕
          </button>
        )}
      </div>

      {showResults && (
        <div style={{
          background: "rgba(10,10,36,0.92)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(201,170,120,0.22)", borderTop: "none",
          borderRadius: "0 0 16px 16px", maxHeight: "min(50vh, 420px)", overflowY: "auto",
        }}>
          {results.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: "16px" }}>
              {lang === "cs" ? "Nic nenalezeno" : "No results"}
            </p>
          ) : results.map(({ area, chapter }) => (
            <button key={`${area.id}-${chapter.id}`}
              onMouseDown={(e) => { e.preventDefault(); onPick(area, chapter); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: "none", border: "none", borderTop: "1px solid rgba(201,170,120,0.08)",
                padding: "11px 18px", cursor: "pointer", transition: "background 160ms",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,170,120,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                {area[lang].name}
              </span>
              <p style={{ fontSize: 14, color: "var(--text-primary)", margin: "2px 0 0", fontFamily: "var(--font-sans)" }}>
                {chapter[lang].subtitle} — {chapter[lang].title}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Camera ───────────────────────────────────────────────────────────────────

type Camera = { cx: number; cy: number; zoom: number };
const ZOOM_MIN = 0.62, ZOOM_MAX = 2.6, PAN_STEP = 130;

export function UniverseView({ areas, lang, focusSlug }: Props) {
  const router = useRouter();
  const [theme, toggleTheme] = useTheme();
  const pal = galaxyPalette(theme);

  const sortedAreas = useMemo(() => [...areas].sort((a, b) => a.order - b.order), [areas]);
  const positions   = useMemo(() => buildPlanePositions(sortedAreas), [sortedAreas]);

  const starBox = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const a of sortedAreas) {
      const p = positions[a.id];
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }
    if (!isFinite(minX)) { minX = minY = 0; maxX = maxY = 0; }
    const m = 1200;
    return { x: minX - m, y: minY - m, w: (maxX - minX) + 2 * m, h: (maxY - minY) + 2 * m };
  }, [sortedAreas, positions]);

  const initialCamera = useMemo<Camera>(() => {
    const focus = sortedAreas.find(a => a.slug === focusSlug) ?? sortedAreas[0];
    const p = focus ? positions[focus.id] : { x: 0, y: 0 };
    return { cx: p.x, cy: p.y, zoom: 1 };
  }, [sortedAreas, focusSlug, positions]);

  const [camera, setCamera] = useState<Camera>(initialCamera);
  const [transMs, setTransMs] = useState(650);
  const [searchActive, setSearchActive] = useState(false);
  const [dragging, setDragging] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Drag-to-pan
  const dragRef = useRef<{ sx: number; sy: number; cx: number; cy: number; zoom: number } | null>(null);
  const movedRef = useRef(false);
  const justDraggedRef = useRef(false);

  const focusedAreaId = useMemo(() => {
    let best = sortedAreas[0]?.id ?? "";
    let bestD = Infinity;
    for (const a of sortedAreas) {
      const p = positions[a.id];
      const d = (p.x - camera.cx) ** 2 + (p.y - camera.cy) ** 2;
      if (d < bestD) { bestD = d; best = a.id; }
    }
    return best;
  }, [sortedAreas, positions, camera.cx, camera.cy]);

  const focusedArea = sortedAreas.find(a => a.id === focusedAreaId) ?? sortedAreas[0];

  const navIfNotDragged = (fn: () => void) => { if (!justDraggedRef.current) fn(); };

  // Wheel = zoom (disabled while interacting with search)
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (searchActive) return;
      e.preventDefault();
      setTransMs(140);
      setCamera(c => {
        const factor = Math.exp(-e.deltaY * 0.0014);
        return { ...c, zoom: clamp(c.zoom * factor, ZOOM_MIN, ZOOM_MAX) };
      });
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [searchActive]);

  // Arrows = pan the plane
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "/" || e.key === "f") && !searchActive) {
        e.preventDefault(); searchInputRef.current?.focus(); return;
      }
      if (searchActive) return;
      const step = PAN_STEP / camera.zoom;
      let dx = 0, dy = 0;
      if (e.key === "ArrowLeft")  dx = -step;
      else if (e.key === "ArrowRight") dx = step;
      else if (e.key === "ArrowUp")    dy = -step;
      else if (e.key === "ArrowDown")  dy = step;
      else return;
      e.preventDefault();
      setTransMs(240);
      setCamera(c => ({ ...c, cx: c.cx + dx, cy: c.cy + dy }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchActive, camera.zoom]);

  // Pointer drag handlers
  const onPointerDown = (e: React.PointerEvent) => {
    if (searchActive || e.button !== 0) return;
    // Don't hijack clicks on interactive UI (search input, toggles)
    if ((e.target as HTMLElement).closest("input, button")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, cx: camera.cx, cy: camera.cy, zoom: camera.zoom };
    movedRef.current = false;
    setDragging(true);
    setTransMs(0);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / d.zoom;
    const dy = (e.clientY - d.sy) / d.zoom;
    if (Math.abs(e.clientX - d.sx) > 4 || Math.abs(e.clientY - d.sy) > 4) movedRef.current = true;
    setCamera(c => ({ ...c, cx: d.cx - dx, cy: d.cy - dy }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setDragging(false);
    if (movedRef.current) {
      justDraggedRef.current = true;
      setTimeout(() => { justDraggedRef.current = false; }, 60);
    }
  };

  return (
    <div
      data-theme={theme}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        background: "var(--bg)", height: "100dvh", overflow: "hidden", position: "relative",
        cursor: dragging ? "grabbing" : "grab", touchAction: "none",
      }}
    >
      <div className="scanlines" />

      {/* The pannable / zoomable plane */}
      <div style={{
        position: "absolute", left: "50%", top: "50%", transformOrigin: "0 0",
        transform: `scale(${camera.zoom}) translate(${-camera.cx}px, ${-camera.cy}px)`,
        transition: `transform ${transMs}ms cubic-bezier(0.4,0,0.2,1)`,
        willChange: "transform",
      }}>
        <BackgroundStars box={starBox} />

        {sortedAreas.map((area) => {
          const p = positions[area.id];
          const isFocused = area.id === focusedAreaId;
          return (
            <div key={area.id} style={{
              position: "absolute", left: p.x, top: p.y, transform: "translate(-50%, -50%)",
            }}>
              <GalaxySvg
                area={area} lang={lang} isFocused={isFocused} pal={pal}
                onClickArea={() => navIfNotDragged(() => router.push(`/${area.slug}`))}
                onClickChapter={(ch) => navIfNotDragged(() => router.push(`/${area.slug}/${ch.slug}`))}
              />
            </div>
          );
        })}
      </div>

      {/* Toggles */}
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <LangToggle lang={lang} />

      {/* Inline search — top center */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        display: "flex", justifyContent: "center", padding: "22px", zIndex: 30, pointerEvents: "none",
      }}>
        <InlineSearch
          areas={sortedAreas} lang={lang} inputRef={searchInputRef}
          onActiveChange={setSearchActive}
          onPick={(area, chapter) => router.push(`/${area.slug}/${chapter.slug}`)} />
      </div>

      {/* Focused area name + hint */}
      <div style={{
        position: "fixed", bottom: "40px", left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        zIndex: 20, pointerEvents: "none",
      }}>
        <p style={{
          fontFamily: "var(--font-serif)", fontSize: "26px", letterSpacing: "-0.01em",
          color: "var(--text-primary)", transition: "opacity 400ms",
        }}>
          {focusedArea?.[lang].name}
        </p>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase",
          letterSpacing: "0.2em", color: "var(--text-muted)",
        }}>
          {lang === "cs" ? "scroll = přiblížit · táhni / šipky = posun · klik = vstup" : "scroll = zoom · drag / arrows = pan · click = enter"}
        </p>
      </div>
    </div>
  );
}
