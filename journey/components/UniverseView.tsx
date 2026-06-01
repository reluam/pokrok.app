"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Area, Chapter } from "@/lib/areas";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";
import { useTheme } from "@/lib/useTheme";
import { StarField } from "./StarField";
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

// ── Galaxy color sets (varied, like real deep-space galaxies) ────────────────

type GColors = { neb1: string; neb2: string; arm1: string; arm2: string; star: string };

const COSMIC_COLORS: GColors[] = [
  { neb1: "#c9aa78", neb2: "#7a6ad0", arm1: "#e8c99a", arm2: "#9a86e0", star: "#ffe9bf" }, // gold · violet
  { neb1: "#6f9bd8", neb2: "#3f5fb0", arm1: "#9bc0f0", arm2: "#5f7fd0", star: "#dceaff" }, // blue
  { neb1: "#5fc9c0", neb2: "#3f8f9f", arm1: "#9fe8e0", arm2: "#5fb0c0", star: "#d6fffb" }, // teal
  { neb1: "#d87a9a", neb2: "#9a5fd0", arm1: "#f0a8c0", arm2: "#c08fe0", star: "#ffe0ec" }, // rose · purple
  { neb1: "#9a7ad8", neb2: "#5f6ad0", arm1: "#c0a8f0", arm2: "#8f9fe8", star: "#ece0ff" }, // indigo
  { neb1: "#e0a85f", neb2: "#d0664a", arm1: "#f0c89a", arm2: "#e89a7a", star: "#ffeacf" }, // amber · copper
  { neb1: "#6fd8a8", neb2: "#3f9f7a", arm1: "#9fe8c8", arm2: "#5fc0a0", star: "#d6ffe8" }, // jade
];

const GREEN_COLORS: GColors = { neb1: "#00e850", neb2: "#0a7a2a", arm1: "#00e850", arm2: "#00a838", star: "#ffff66" };

function galaxyColors(areaId: string, theme: Theme): GColors {
  if (theme === "hhgttg") return GREEN_COLORS;
  const idx = Math.floor(seededRng(areaId + "col")() * 997) % COSMIC_COLORS.length;
  return COSMIC_COLORS[idx];
}

// ── Galaxy geometry ──────────────────────────────────────────────────────────

const GW = 420, GH = 260;
const GCX = GW / 2, GCY = GH / 2;

type Shape = { tilt: number; squash: number; turns: number; b: number; arms: number };

function galaxyShape(areaId: string): Shape {
  const r = seededRng(areaId + "shape");
  return {
    tilt:   (r() - 0.5) * 70,           // degrees
    squash: 0.42 + r() * 0.24,
    turns:  0.95 + r() * 0.5,
    b:      0.28 + r() * 0.08,
    arms:   r() < 0.4 ? 3 : 2,
  };
}

function armPath(rot: number, s: Shape): string {
  const steps = 44, base = 7;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const theta = t * s.turns * 2 * Math.PI;
    const rr = base * Math.exp(s.b * theta);
    const x = GCX + rr * Math.cos(theta + rot);
    const y = GCY + rr * s.squash * Math.sin(theta + rot);
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + " ";
  }
  return d.trim();
}

type PlanePos = { x: number; y: number };
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
  area, lang, isFocused, colors, shape,
  onClickArea, onClickChapter,
}: {
  area: Area; lang: Lang; isFocused: boolean; colors: GColors; shape: Shape;
  onClickArea: () => void;
  onClickChapter: (ch: Chapter) => void;
}) {
  const chapterPos = useMemo(() => buildChapterLayout(area.chapters.length, area.id), [area.chapters.length, area.id]);
  const armRot     = useMemo(() => seededRng(area.id + "arm")() * Math.PI, [area.id]);
  const nebulaId   = `neb-${area.id}`;
  const coreId     = `core-${area.id}`;
  const armBlur    = `armb-${area.id}`;
  const starGlow   = `sg-${area.id}`;
  const nameShadow = `nsh-${area.id}`;

  const nameFont = isFocused ? 28 : 19;
  const armRots = Array.from({ length: shape.arms }, (_, k) => armRot + (k * 2 * Math.PI) / shape.arms);

  return (
    <svg width={GW} height={GH} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={nebulaId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={colors.neb1} stopOpacity={isFocused ? 0.20 : 0.12} />
          <stop offset="45%"  stopColor={colors.neb2} stopOpacity={isFocused ? 0.11 : 0.06} />
          <stop offset="100%" stopColor="#05051a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={coreId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fffaf0"    stopOpacity={isFocused ? 0.95 : 0.62} />
          <stop offset="35%"  stopColor={colors.star} stopOpacity={isFocused ? 0.6 : 0.34} />
          <stop offset="70%"  stopColor={colors.neb1} stopOpacity={isFocused ? 0.24 : 0.13} />
          <stop offset="100%" stopColor={colors.neb1} stopOpacity="0" />
        </radialGradient>
        <filter id={armBlur} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
        <filter id={starGlow} x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={isFocused ? "2.4" : "1.6"} result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={nameShadow} x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="0" stdDeviation={nameFont * 0.07} floodColor="#04040f" floodOpacity="0.95" />
        </filter>
      </defs>

      {/* Nebula + arms (tilted for variety) */}
      <g transform={`rotate(${shape.tilt} ${GCX} ${GCY})`}>
        <ellipse cx={GCX} cy={GCY} rx={GW * 0.5} ry={GH * 0.5 * (0.7 + shape.squash * 0.5)} fill={`url(#${nebulaId})`} />
        <g filter={`url(#${armBlur})`} opacity={isFocused ? 0.72 : 0.44}>
          {armRots.map((rot, k) => (
            <path key={k} d={armPath(rot, shape)} fill="none"
              stroke={k % 2 === 0 ? colors.arm1 : colors.arm2}
              strokeWidth={k % 2 === 0 ? 3 : 2}
              strokeLinecap="round" opacity={k % 2 === 0 ? 0.5 : 0.3} />
          ))}
        </g>
      </g>

      {/* Bright core */}
      <ellipse cx={GCX} cy={GCY} rx={isFocused ? 66 : 46} ry={isFocused ? 42 : 30} fill={`url(#${coreId})`} />
      <circle cx={GCX} cy={GCY} r={isFocused ? 4 : 2.6} fill="#fffaf0" opacity={0.95} />

      {/* Chapter stars */}
      {area.chapters.map((ch, i) => {
        const p = chapterPos[i];
        const isRight = p.x >= GCX;
        return (
          <g key={ch.id} onClick={(e) => { e.stopPropagation(); onClickChapter(ch); }} style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
            <circle cx={p.x} cy={p.y} r={isFocused ? 7 : 5} fill={colors.arm1} fillOpacity={0.18} filter={`url(#${starGlow})`} />
            <circle cx={p.x} cy={p.y} r={isFocused ? 3.4 : 2.4} fill={colors.star} opacity={0.95} />
            {isFocused && (
              <text x={p.x + (isRight ? 12 : -12)} y={p.y + 3.5} textAnchor={isRight ? "start" : "end"}
                fill="var(--text-secondary)" fontSize="9" fontFamily="var(--font-sans)"
                style={{ textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer" }}>
                {ch[lang].subtitle}
              </text>
            )}
          </g>
        );
      })}

      {/* Area name */}
      <g onClick={(e) => { e.stopPropagation(); onClickArea(); }} style={{ cursor: "pointer" }}>
        <ellipse cx={GCX} cy={GCY} rx={70} ry={38} fill="transparent" />
        <text x={GCX} y={GCY + nameFont * 0.33} textAnchor="middle"
          fill="var(--text-primary)" fontSize={nameFont} fontWeight={500} fontFamily="var(--font-serif)"
          filter={`url(#${nameShadow})`}
          style={{ letterSpacing: "0.02em", cursor: "pointer", opacity: isFocused ? 1 : 0.9 }}>
          {area[lang].name}
        </text>
      </g>
    </svg>
  );
}

// ── Inline search (wide bar, results directly below) ─────────────────────────

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

// ── Main UniverseView — galaxies on an ellipse, scroll rotates the carousel ──

export function UniverseView({ areas, lang, focusSlug }: Props) {
  const router = useRouter();
  const [theme, toggleTheme] = useTheme();

  const sortedAreas = useMemo(() => [...areas].sort((a, b) => a.order - b.order), [areas]);
  const n = sortedAreas.length;
  const step = n > 0 ? (2 * Math.PI) / n : 0;

  const initialIdx = useMemo(() => {
    const i = sortedAreas.findIndex(a => a.slug === focusSlug);
    return i >= 0 ? i : 0;
  }, [sortedAreas, focusSlug]);

  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const touchStartY = useRef(0);
  const lastStep = useRef(0);

  // Viewport size (drives ellipse dimensions + scale)
  const [size, setSize] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const calc = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // Continuous rotation (in "index" units) eased toward a target via rAF
  const [rotation, setRotation] = useState(initialIdx);
  const targetRef = useRef(initialIdx);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setRotation(prev => {
        const diff = targetRef.current - prev;
        return Math.abs(diff) < 0.0015 ? targetRef.current : prev + diff * 0.16;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const rotateBy = (dir: 1 | -1) => { targetRef.current += dir; };
  const rotateTo = (i: number) => {
    if (n === 0) return;
    const cur = targetRef.current;
    const curMod = ((cur % n) + n) % n;
    let delta = i - curMod;
    if (delta >  n / 2) delta -= n;
    if (delta < -n / 2) delta += n;
    targetRef.current = cur + delta;
  };

  useEffect(() => {
    const tick = (dir: 1 | -1) => {
      const now = Date.now();
      if (now - lastStep.current < 90) return;
      lastStep.current = now;
      rotateBy(dir);
    };
    const onWheel = (e: WheelEvent) => {
      if (searchActive || Math.abs(e.deltaY) < 8) return;
      tick(e.deltaY > 0 ? 1 : -1);
    };
    const onTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const d = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(d) < 50) return;
      tick(d > 0 ? 1 : -1);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "/" || e.key === "f") && !searchActive) { e.preventDefault(); searchInputRef.current?.focus(); return; }
      if (searchActive) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); tick(1); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); tick(-1); }
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [searchActive, n]);

  // Ellipse geometry
  const cx = size.w / 2;
  const cy = size.h * 0.45;
  const A  = size.w * 0.34;
  const B  = size.h * 0.30;
  const sMax = clamp(Math.min(size.w / 1150, size.h / 820), 0.8, 1.7);
  const sMin = sMax * 0.32;

  const focusedIdx = n > 0 ? ((Math.round(rotation) % n) + n) % n : 0;
  const focusedArea = sortedAreas[focusedIdx];

  return (
    <div data-theme={theme} style={{ background: "var(--bg)", height: "100dvh", overflow: "hidden", position: "relative" }}>
      <StarField theme={theme} />
      <div className="scanlines" />

      {/* Galaxies on the rotating ellipse */}
      <div style={{ position: "absolute", inset: 0 }}>
        {sortedAreas.map((area, i) => {
          const theta = (i - rotation) * step;          // 0 = front (bottom)
          const depth = (Math.cos(theta) + 1) / 2;        // 1 = front, 0 = back
          const x = cx + A * Math.sin(theta);
          const y = cy + B * Math.cos(theta);
          const scale = sMin + (sMax - sMin) * depth;
          const opacity = 0.12 + 0.88 * depth;
          const isFocused = i === focusedIdx;
          return (
            <div key={area.id} style={{
              position: "absolute", left: 0, top: 0,
              transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`,
              opacity,
              zIndex: Math.round(depth * 100),
            }}>
              <GalaxySvg
                area={area} lang={lang} isFocused={isFocused}
                colors={galaxyColors(area.id, theme)} shape={galaxyShape(area.id)}
                onClickArea={() => isFocused ? router.push(`/${area.slug}`) : rotateTo(i)}
                onClickChapter={(ch) => isFocused ? router.push(`/${area.slug}/${ch.slug}`) : rotateTo(i)}
              />
            </div>
          );
        })}
      </div>

      {/* Left sidebar — all areas */}
      <nav style={{
        position: "fixed", left: 0, top: "50%", transform: "translateY(-50%)",
        zIndex: 25, padding: "0 24px", display: "flex", flexDirection: "column", gap: "2px",
        maxHeight: "80vh", overflowY: "auto", pointerEvents: "auto",
      }}>
        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)", marginBottom: 12, fontFamily: "var(--font-sans)" }}>
          {lang === "cs" ? "Oblasti" : "Areas"}
        </p>
        {sortedAreas.map((a, i) => {
          const active = i === focusedIdx;
          return (
            <button key={a.id} onClick={() => rotateTo(i)}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: "6px 0", textAlign: "left" }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                background: active ? "var(--accent)" : "var(--dot-future)",
                border: active ? "none" : "1px solid rgba(201,170,120,0.25)",
                boxShadow: active ? "0 0 8px var(--accent-glow)" : "none",
                transition: "background 250ms, box-shadow 250ms",
              }} />
              <span style={{
                fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase",
                color: active ? "var(--accent)" : "var(--text-secondary)", opacity: active ? 1 : 0.7,
                transition: "color 250ms, opacity 250ms",
              }}>
                {a[lang].name}
              </span>
            </button>
          );
        })}
      </nav>

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

      {/* Hint */}
      <div style={{
        position: "fixed", bottom: "32px", left: 0, right: 0,
        display: "flex", justifyContent: "center", zIndex: 20, pointerEvents: "none",
      }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)" }}>
          {lang === "cs" ? "scroll = otáčet · klik = vstup" : "scroll = rotate · click = enter"}
        </p>
      </div>

      {/* Current area name (bottom) */}
      <div style={{
        position: "fixed", bottom: "60px", left: 0, right: 0,
        display: "flex", justifyContent: "center", zIndex: 20, pointerEvents: "none",
      }}>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "13px", letterSpacing: "0.04em", color: "var(--text-muted)", opacity: 0.7 }}>
          {focusedArea?.[lang].name}
        </p>
      </div>
    </div>
  );
}
