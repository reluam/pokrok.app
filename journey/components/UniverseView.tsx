"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Area, Chapter } from "@/lib/areas";
import type { Lang } from "@/lib/i18n";
import { StarField } from "./StarField";

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

// ── Per-galaxy star + chapter layout (deterministic) ────────────────────────

const GW = 360, GH = 210;
const GCX = GW / 2, GCY = GH / 2;

type GStar = { x: number; y: number; r: number; o: number };

function buildGalaxyStars(seed: string, count: number): GStar[] {
  const rng = seededRng(seed + "stars");
  return Array.from({ length: count }, () => {
    const u1 = rng() + 1e-9, u2 = rng();
    const mag = Math.sqrt(-2 * Math.log(u1));
    const angle = 2 * Math.PI * u2;
    const rx = (0.28 + rng() * 0.18) * GW;
    const ry = rx * (0.4 + rng() * 0.22);
    return {
      x: Math.max(2, Math.min(GW - 2, GCX + mag * rx * Math.cos(angle))),
      y: Math.max(2, Math.min(GH - 2, GCY + mag * ry * Math.sin(angle))),
      r: rng() * 0.9 + 0.25,
      o: rng() * 0.55 + 0.12,
    };
  });
}

function buildChapterLayout(count: number, seed: string): PlanePos[] {
  const rng = seededRng(seed + "chapters");
  const rx = GW * 0.30, ry = GH * 0.30;
  return Array.from({ length: count }, (_, i) => {
    const base = (2 * Math.PI * i) / count - Math.PI / 2;
    const a = base + (rng() - 0.5) * 0.6;
    const t = 0.75 + rng() * 0.35;
    return { x: GCX + rx * t * Math.cos(a), y: GCY + ry * t * Math.sin(a) };
  });
}

// ── Galaxy ──────────────────────────────────────────────────────────────────

function GalaxySvg({
  area, lang, isFocused, highlightChapterId,
  onClickArea, onClickChapter,
}: {
  area: Area; lang: Lang; isFocused: boolean;
  highlightChapterId: number | null;
  onClickArea: () => void;
  onClickChapter: (ch: Chapter) => void;
}) {
  const stars      = useMemo(() => buildGalaxyStars(area.id, 90), [area.id]);
  const chapterPos = useMemo(() => buildChapterLayout(area.chapters.length, area.id), [area.chapters.length, area.id]);
  const filterId = `glow-${area.id}`;
  const coreId   = `core-${area.id}`;
  const glowId   = `outer-${area.id}`;

  return (
    <svg width={GW} height={GH} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#c9aa78" stopOpacity={isFocused ? 0.18 : 0.10} />
          <stop offset="55%"  stopColor="#6060c0" stopOpacity={isFocused ? 0.07 : 0.04} />
          <stop offset="100%" stopColor="#05051a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={coreId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#fff8e8" stopOpacity={isFocused ? 0.55 : 0.32} />
          <stop offset="60%" stopColor="#c9aa78" stopOpacity={isFocused ? 0.20 : 0.12} />
          <stop offset="100%" stopColor="#c9aa78" stopOpacity="0" />
        </radialGradient>
        <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={isFocused ? "2.5" : "1.5"} result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <ellipse cx={GCX} cy={GCY} rx={GW * 0.48} ry={GH * 0.46} fill={`url(#${glowId})`} />

      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={`rgba(205,210,255,${s.o})`} />
      ))}

      <ellipse cx={GCX} cy={GCY} rx={isFocused ? 28 : 18} ry={isFocused ? 16 : 10} fill={`url(#${coreId})`} />

      {/* Clickable core / area name */}
      <g onClick={(e) => { e.stopPropagation(); onClickArea(); }} style={{ cursor: "pointer" }}>
        <ellipse cx={GCX} cy={GCY} rx={42} ry={26} fill="transparent" />
        <text x={GCX} y={GCY + 5} textAnchor="middle" fill="#c9aa78"
          fontSize={isFocused ? 11 : 8} fontFamily="var(--font-sans)"
          style={{ textTransform: "uppercase", letterSpacing: "0.14em", pointerEvents: "none", opacity: isFocused ? 1 : 0.7 }}>
          {area[lang].name}
        </text>
      </g>

      {/* Chapter stars */}
      {area.chapters.map((ch, i) => {
        const p = chapterPos[i];
        const isRight = p.x >= GCX;
        const highlighted = highlightChapterId === ch.id;
        return (
          <g key={ch.id} onClick={(e) => { e.stopPropagation(); onClickChapter(ch); }} style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r={isFocused ? 8 : 5}
              fill="rgba(201,170,120,0.12)" filter={`url(#${filterId})`} />
            <circle cx={p.x} cy={p.y} r={highlighted ? 4.5 : isFocused ? 3.5 : 2.5}
              fill={highlighted ? "#fff3d0" : "#c9aa78"} opacity={isFocused ? 0.95 : 0.7}>
              {highlighted && (
                <>
                  <animate attributeName="r" values="4;8;4" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.5;1" dur="1.6s" repeatCount="indefinite" />
                </>
              )}
            </circle>
            {(isFocused || highlighted) && (
              <text x={p.x + (isRight ? 10 : -10)} y={p.y + 4} textAnchor={isRight ? "start" : "end"}
                fill={highlighted ? "#c9aa78" : "#8880b0"} fontSize="8" fontFamily="var(--font-sans)"
                style={{ textTransform: "uppercase", letterSpacing: "0.07em", pointerEvents: "none" }}>
                {ch[lang].subtitle}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Search modal ────────────────────────────────────────────────────────────

function SearchModal({
  areas, lang, onClose, onPick,
}: {
  areas: Area[]; lang: Lang;
  onClose: () => void;
  onPick: (area: Area, chapter: Chapter) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

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

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(5,5,26,0.85)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh",
    }} onClick={onClose}>
      <div style={{
        background: "rgba(10,10,36,0.96)", border: "1px solid rgba(201,170,120,0.18)",
        borderRadius: "12px", width: "min(560px, 90vw)", padding: "24px",
        maxHeight: "60vh", display: "flex", flexDirection: "column", gap: 16,
      }} onClick={e => e.stopPropagation()}>
        <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
          placeholder={lang === "cs" ? "Hledat…" : "Search…"}
          style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,170,120,0.25)",
            borderRadius: "6px", padding: "10px 14px", fontSize: "15px",
            color: "var(--text-primary)", fontFamily: "var(--font-sans)", outline: "none", width: "100%",
          }} />
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {results.length === 0 && query.trim().length >= 2 && (
            <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: "12px 0" }}>
              {lang === "cs" ? "Nic nenalezeno" : "No results"}
            </p>
          )}
          {results.map(({ area, chapter }) => (
            <button key={`${area.id}-${chapter.id}`} onClick={() => onPick(area, chapter)}
              style={{
                background: "none", border: "1px solid rgba(201,170,120,0.1)", borderRadius: "6px",
                padding: "10px 14px", textAlign: "left", cursor: "pointer", transition: "background 200ms",
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
      </div>
    </div>
  );
}

// ── Camera ───────────────────────────────────────────────────────────────────

type Camera = { cx: number; cy: number; zoom: number };
const ZOOM_MIN = 0.3, ZOOM_MAX = 2.6, PAN_STEP = 130;

export function UniverseView({ areas, lang, focusSlug }: Props) {
  const router = useRouter();
  const sortedAreas = useMemo(() => [...areas].sort((a, b) => a.order - b.order), [areas]);
  const positions   = useMemo(() => buildPlanePositions(sortedAreas), [sortedAreas]);

  // Initial camera: centered on focus area (from zoom-out) or first area
  const initialCamera = useMemo<Camera>(() => {
    const focus = sortedAreas.find(a => a.slug === focusSlug) ?? sortedAreas[0];
    const p = focus ? positions[focus.id] : { x: 0, y: 0 };
    return { cx: p.x, cy: p.y, zoom: 1 };
  }, [sortedAreas, focusSlug, positions]);

  const [camera, setCamera] = useState<Camera>(initialCamera);
  const [transMs, setTransMs] = useState(650);  // animate the initial centering
  const [showSearch, setShowSearch] = useState(false);
  const [highlight, setHighlight] = useState<{ areaId: string; chapterId: number } | null>(null);

  // Galaxy nearest to the viewport center is the "focused" one
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

  const centerOn = useCallback((areaId: string, ms = 650) => {
    const p = positions[areaId];
    if (!p) return;
    setTransMs(ms);
    setCamera(c => ({ ...c, cx: p.x, cy: p.y, zoom: Math.max(c.zoom, 1) }));
  }, [positions]);

  // Wheel = zoom
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setTransMs(140);
      setCamera(c => {
        const factor = Math.exp(-e.deltaY * 0.0014);
        return { ...c, zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, c.zoom * factor)) };
      });
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  // Arrows = pan the plane
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showSearch) return;
      if (e.key === "/" || e.key === "f") { e.preventDefault(); setShowSearch(true); return; }
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
  }, [showSearch, camera.zoom]);

  return (
    <div style={{
      background: "var(--bg)", height: "100dvh", overflow: "hidden", position: "relative",
    }}>
      <StarField />

      {/* Search button — top center */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        display: "flex", justifyContent: "center", padding: "24px", zIndex: 20, pointerEvents: "none",
      }}>
        <button onClick={() => setShowSearch(true)}
          style={{
            pointerEvents: "auto", display: "flex", alignItems: "center", gap: "8px",
            fontFamily: "var(--font-sans)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.18em",
            color: "var(--text-secondary)", background: "rgba(201,170,120,0.05)",
            border: "1px solid rgba(201,170,120,0.15)", borderRadius: "20px",
            padding: "8px 20px", cursor: "pointer", opacity: 0.75, transition: "opacity 200ms, border-color 200ms",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "rgba(201,170,120,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "0.75"; e.currentTarget.style.borderColor = "rgba(201,170,120,0.15)"; }}>
          <span style={{ fontSize: "14px", opacity: 0.8 }}>⌕</span>
          {lang === "cs" ? "Hledat" : "Search"}
          <span style={{ fontSize: "10px", opacity: 0.5, marginLeft: 2 }}>/</span>
        </button>
      </div>

      {/* The pannable / zoomable plane */}
      <div style={{
        position: "absolute", left: "50%", top: "50%", transformOrigin: "0 0",
        transform: `scale(${camera.zoom}) translate(${-camera.cx}px, ${-camera.cy}px)`,
        transition: `transform ${transMs}ms cubic-bezier(0.4,0,0.2,1)`,
        willChange: "transform",
      }}>
        {sortedAreas.map((area) => {
          const p = positions[area.id];
          const isFocused = area.id === focusedAreaId;
          const hl = highlight && highlight.areaId === area.id ? highlight.chapterId : null;
          return (
            <div key={area.id} style={{
              position: "absolute", left: p.x, top: p.y, transform: "translate(-50%, -50%)",
            }}>
              <GalaxySvg
                area={area} lang={lang} isFocused={isFocused} highlightChapterId={hl}
                onClickArea={() => router.push(`/${area.slug}`)}
                onClickChapter={(ch) => router.push(`/${area.slug}/${ch.slug}`)}
              />
            </div>
          );
        })}
      </div>

      {/* Focused area name */}
      <div style={{
        position: "fixed", bottom: "64px", left: 0, right: 0,
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
          {lang === "cs" ? "scroll = přiblížit · šipky = posun · klik = vstup" : "scroll = zoom · arrows = pan · click = enter"}
        </p>
      </div>

      {showSearch && (
        <SearchModal areas={sortedAreas} lang={lang}
          onClose={() => setShowSearch(false)}
          onPick={(area, chapter) => {
            setShowSearch(false);
            setHighlight({ areaId: area.id, chapterId: chapter.id });
            centerOn(area.id, 650);
          }} />
      )}
    </div>
  );
}
