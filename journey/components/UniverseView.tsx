"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Area, Chapter } from "@/lib/areas";
import type { Lang } from "@/lib/i18n";

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

// ── Background star field (lives ON the plane, pans + zooms with galaxies) ───

type BgStar = { x: number; y: number; r: number; o: number; tw: boolean; dur: string; del: string };

function BackgroundStars({ box }: { box: { x: number; y: number; w: number; h: number } }) {
  const stars = useMemo<BgStar[]>(() => {
    const rng = seededRng("uv-background");
    const count = clamp(Math.round((box.w * box.h) / 11000), 140, 460);
    return Array.from({ length: count }, () => {
      const tw = rng() < 0.45;
      return {
        x: rng() * box.w,
        y: rng() * box.h,
        r: rng() * 1.1 + 0.25,
        o: rng() * 0.5 + 0.12,
        tw,
        dur: (2 + rng() * 3).toFixed(2),
        del: (rng() * 4).toFixed(2),
      };
    });
  }, [box.w, box.h]);

  return (
    <svg
      width={box.w} height={box.h}
      style={{ position: "absolute", left: box.x, top: box.y, overflow: "visible", pointerEvents: "none" }}
      aria-hidden="true"
    >
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r}
          fill="rgba(205,210,255,1)"
          style={{
            opacity: s.o,
            animation: s.tw ? `uv-tw ${s.dur}s ease-in-out ${s.del}s infinite` : undefined,
          }} />
      ))}
    </svg>
  );
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
          fontSize={isFocused ? 11 : 9} fontFamily="var(--font-sans)"
          style={{ textTransform: "uppercase", letterSpacing: "0.14em", pointerEvents: "none", opacity: isFocused ? 1 : 0.78 }}>
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

// ── Inline search (no modal — wide bar with results directly below) ──────────

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
  const sortedAreas = useMemo(() => [...areas].sort((a, b) => a.order - b.order), [areas]);
  const positions   = useMemo(() => buildPlanePositions(sortedAreas), [sortedAreas]);

  // Bounding box that comfortably covers all galaxies — used for the star field
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
  const [highlight, setHighlight] = useState<{ areaId: string; chapterId: number } | null>(null);
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

  return (
    <div style={{ background: "var(--bg)", height: "100dvh", overflow: "hidden", position: "relative" }}>
      {/* The pannable / zoomable plane — stars AND galaxies live here together */}
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

      {/* Inline search — top center */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        display: "flex", justifyContent: "center", padding: "22px", zIndex: 30, pointerEvents: "none",
      }}>
        <InlineSearch
          areas={sortedAreas} lang={lang} inputRef={searchInputRef}
          onActiveChange={setSearchActive}
          onPick={(area, chapter) => {
            setHighlight({ areaId: area.id, chapterId: chapter.id });
            centerOn(area.id, 650);
            searchInputRef.current?.blur();
          }} />
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
          {lang === "cs" ? "scroll = přiblížit · šipky = posun · klik = vstup" : "scroll = zoom · arrows = pan · click = enter"}
        </p>
      </div>
    </div>
  );
}
