"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Area, Chapter } from "@/lib/areas";
import type { Lang } from "@/lib/i18n";
import { StarField } from "./StarField";

type Props = { areas: Area[]; lang: Lang };

// ── Deterministic pseudo-random from string seed ────────────────────────────

function seededRng(seed: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) h ^= seed.charCodeAt(i), h = Math.imul(h, 0x01000193) >>> 0;
  let s = h;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

// ── Galaxy particle + chapter position generation ───────────────────────────

type Star = { x: number; y: number; r: number; o: number };

function buildGalaxy(seed: string, W: number, H: number, starCount: number): Star[] {
  const rng = seededRng(seed + "stars");
  const cx = W / 2, cy = H / 2;
  return Array.from({ length: starCount }, () => {
    // Box-Muller for gaussian cluster around center
    const u1 = rng() + 1e-9, u2 = rng();
    const mag = Math.sqrt(-2 * Math.log(u1));
    const angle = 2 * Math.PI * u2;
    // Galaxy is elongated: spread more on X axis
    const rx = (0.28 + rng() * 0.18) * W;
    const ry = rx * (0.4 + rng() * 0.22);
    return {
      x: Math.max(2, Math.min(W - 2, cx + mag * rx * Math.cos(angle))),
      y: Math.max(2, Math.min(H - 2, cy + mag * ry * Math.sin(angle))),
      r: rng() * 0.9 + 0.25,
      o: rng() * 0.55 + 0.12,
    };
  });
}

type ChapterPos = { x: number; y: number };

function buildChapterPositions(count: number, seed: string, W: number, H: number): ChapterPos[] {
  const rng = seededRng(seed + "chapters");
  const cx = W / 2, cy = H / 2;
  const rx = W * 0.30, ry = H * 0.30;
  return Array.from({ length: count }, (_, i) => {
    const base = (2 * Math.PI * i) / count - Math.PI / 2;
    const jitter = (rng() - 0.5) * 0.6;
    const a = base + jitter;
    const t = 0.75 + rng() * 0.35;
    return { x: cx + rx * t * Math.cos(a), y: cy + ry * t * Math.sin(a) };
  });
}

// ── Galaxy SVG component ────────────────────────────────────────────────────

const GW = 360, GH = 210;
const GCX = GW / 2, GCY = GH / 2;

function GalaxySvg({
  area, lang, isActive,
  onClickSun, onClickChapter,
}: {
  area: Area; lang: Lang; isActive: boolean;
  onClickSun: () => void;
  onClickChapter: (ch: Chapter) => void;
}) {
  const stars      = useMemo(() => buildGalaxy(area.id, GW, GH, 90),                    [area.id]);
  const chapterPos = useMemo(() => buildChapterPositions(area.chapters.length, area.id, GW, GH), [area.chapters.length, area.id]);
  const filterId   = `glow-${area.id}`;
  const coreId     = `core-${area.id}`;
  const glowId     = `outer-${area.id}`;

  return (
    <svg
      width={GW} height={GH}
      style={{ overflow: "visible", cursor: isActive ? "default" : "pointer" }}
      onClick={!isActive ? onClickSun : undefined}
    >
      <defs>
        {/* Soft outer nebula */}
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#c9aa78" stopOpacity={isActive ? 0.18 : 0.10} />
          <stop offset="55%"  stopColor="#6060c0" stopOpacity={isActive ? 0.07 : 0.04} />
          <stop offset="100%" stopColor="#05051a" stopOpacity="0" />
        </radialGradient>
        {/* Bright core */}
        <radialGradient id={coreId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#fff8e8" stopOpacity={isActive ? 0.55 : 0.30} />
          <stop offset="60%" stopColor="#c9aa78" stopOpacity={isActive ? 0.20 : 0.10} />
          <stop offset="100%" stopColor="#c9aa78" stopOpacity="0" />
        </radialGradient>
        {/* Chapter node glow filter */}
        <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={isActive ? "2.5" : "1.5"} result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Outer nebula glow */}
      <ellipse cx={GCX} cy={GCY} rx={GW * 0.48} ry={GH * 0.46} fill={`url(#${glowId})`} />

      {/* Background stars of this galaxy */}
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r}
          fill={`rgba(205,210,255,${s.o})`} />
      ))}

      {/* Bright galactic core */}
      <ellipse cx={GCX} cy={GCY} rx={isActive ? 28 : 18} ry={isActive ? 16 : 10}
        fill={`url(#${coreId})`} />

      {/* Chapter nodes */}
      {area.chapters.map((ch, i) => {
        const p = chapterPos[i];
        const isRight = p.x >= GCX;
        return (
          <g key={ch.id}
            onClick={(e) => { e.stopPropagation(); onClickChapter(ch); }}
            style={{ cursor: "pointer" }}>
            {/* Glow halo */}
            <circle cx={p.x} cy={p.y} r={isActive ? 8 : 5}
              fill="rgba(201,170,120,0.12)" filter={`url(#${filterId})`} />
            {/* Star dot */}
            <circle cx={p.x} cy={p.y} r={isActive ? 3.5 : 2.5}
              fill="#c9aa78" opacity={isActive ? 0.9 : 0.7} />
            {/* Label — only on active galaxy */}
            {isActive && (
              <text
                x={p.x + (isRight ? 10 : -10)} y={p.y + 4}
                textAnchor={isRight ? "start" : "end"}
                fill="#8880b0" fontSize="8"
                fontFamily="var(--font-sans)"
                style={{ textTransform: "uppercase", letterSpacing: "0.07em", pointerEvents: "none" }}
              >
                {ch[lang].subtitle}
              </text>
            )}
          </g>
        );
      })}

      {/* Area name at core */}
      <text x={GCX} y={GCY + 5}
        textAnchor="middle"
        fill="#c9aa78"
        fontSize={isActive ? 11 : 8}
        fontFamily="var(--font-sans)"
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          pointerEvents: "none",
          opacity: isActive ? 1 : 0.7,
        }}>
        {area[lang].name}
      </text>
    </svg>
  );
}

// ── Search modal ────────────────────────────────────────────────────────────

function SearchModal({
  areas, lang, onClose, onNavigate,
}: {
  areas: Area[]; lang: Lang;
  onClose: () => void;
  onNavigate: (areaSlug: string, chapterSlug: string) => void;
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
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      paddingTop: "15vh",
    }} onClick={onClose}>
      <div style={{
        background: "rgba(10,10,36,0.96)",
        border: "1px solid rgba(201,170,120,0.18)", borderRadius: "12px",
        width: "min(560px, 90vw)", padding: "24px",
        maxHeight: "60vh", display: "flex", flexDirection: "column", gap: 16,
      }} onClick={e => e.stopPropagation()}>
        <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
          placeholder={lang === "cs" ? "Hledat…" : "Search…"}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(201,170,120,0.25)", borderRadius: "6px",
            padding: "10px 14px", fontSize: "15px", color: "var(--text-primary)",
            fontFamily: "var(--font-sans)", outline: "none", width: "100%",
          }} />
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {results.length === 0 && query.trim().length >= 2 && (
            <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: "12px 0" }}>
              {lang === "cs" ? "Nic nenalezeno" : "No results"}
            </p>
          )}
          {results.map(({ area, chapter }) => (
            <button key={`${area.id}-${chapter.id}`}
              onClick={() => onNavigate(area.slug, chapter.slug)}
              style={{
                background: "none", border: "1px solid rgba(201,170,120,0.1)",
                borderRadius: "6px", padding: "10px 14px", textAlign: "left",
                cursor: "pointer", transition: "background 200ms",
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

// ── Main UniverseView ───────────────────────────────────────────────────────

const SPACING = 520; // px between galaxy centers

export function UniverseView({ areas, lang }: Props) {
  const router = useRouter();
  const sortedAreas = useMemo(() => [...areas].sort((a, b) => a.order - b.order), [areas]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showSearch, setShowSearch] = useState(false);

  const goLeft  = useCallback(() => setCurrentIdx(i => Math.max(0, i - 1)), []);
  const goRight = useCallback(() => setCurrentIdx(i => Math.min(sortedAreas.length - 1, i + 1)), [sortedAreas.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (showSearch) return;
      if (e.key === "ArrowLeft")  { e.preventDefault(); goLeft(); }
      if (e.key === "ArrowRight") { e.preventDefault(); goRight(); }
      if (e.key === "/" || e.key === "f") { e.preventDefault(); setShowSearch(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [goLeft, goRight, showSearch]);

  return (
    <div style={{
      background: "var(--bg)", height: "100dvh",
      overflow: "hidden", position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <StarField />

      {/* Search button — top center */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        display: "flex", justifyContent: "center", padding: "24px",
        zIndex: 20, pointerEvents: "none",
      }}>
        <button
          onClick={() => setShowSearch(true)}
          style={{
            pointerEvents: "auto",
            display: "flex", alignItems: "center", gap: "8px",
            fontFamily: "var(--font-sans)", fontSize: "12px",
            textTransform: "uppercase", letterSpacing: "0.18em",
            color: "var(--text-secondary)",
            background: "rgba(201,170,120,0.05)",
            border: "1px solid rgba(201,170,120,0.15)",
            borderRadius: "20px", padding: "8px 20px", cursor: "pointer",
            opacity: 0.75, transition: "opacity 200ms, border-color 200ms",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "rgba(201,170,120,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "0.75"; e.currentTarget.style.borderColor = "rgba(201,170,120,0.15)"; }}
        >
          <span style={{ fontSize: "14px", opacity: 0.8 }}>⌕</span>
          {lang === "cs" ? "Hledat" : "Search"}
          <span style={{ fontSize: "10px", opacity: 0.5, marginLeft: 2 }}>/</span>
        </button>
      </div>

      {/* Galaxy field */}
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {sortedAreas.map((area, i) => {
          const offset    = i - currentIdx;
          const absOffset = Math.abs(offset);
          // Only render nearby galaxies (performance)
          if (absOffset > 4) return null;

          const scale   = absOffset === 0 ? 1.0 : Math.max(0.22, 0.52 - absOffset * 0.12);
          const opacity = absOffset === 0 ? 1.0 : Math.max(0.08, 0.40 - absOffset * 0.12);
          const tx      = offset * SPACING;

          return (
            <div key={area.id} style={{
              position: "absolute",
              left: "50%", top: "50%",
              transform: `translate(calc(-50% + ${tx}px), -50%) scale(${scale})`,
              opacity,
              transition: "transform 700ms cubic-bezier(0.4,0,0.2,1), opacity 700ms ease",
              transformOrigin: "center center",
            }}>
              <GalaxySvg
                area={area} lang={lang}
                isActive={absOffset === 0}
                onClickSun={() => router.push(`/${area.slug}`)}
                onClickChapter={(ch) => router.push(`/${area.slug}/${ch.slug}`)}
              />
            </div>
          );
        })}
      </div>

      {/* Area name + hint below */}
      <div style={{
        position: "fixed", bottom: "72px", left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        zIndex: 20, pointerEvents: "none",
      }}>
        <p style={{
          fontFamily: "var(--font-serif)", fontSize: "28px", letterSpacing: "-0.01em",
          color: "var(--text-primary)", transition: "opacity 400ms",
        }}>
          {sortedAreas[currentIdx]?.[lang].name}
        </p>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "10px",
          textTransform: "uppercase", letterSpacing: "0.2em",
          color: "var(--text-muted)",
        }}>
          {lang === "cs" ? "klikni pro vstup" : "click to enter"}
        </p>
      </div>

      {/* Left arrow */}
      <button onClick={goLeft} disabled={currentIdx === 0}
        style={{
          position: "fixed", left: "24px", top: "50%", transform: "translateY(-50%)",
          zIndex: 20, background: "none", border: "1px solid rgba(201,170,120,0.2)",
          borderRadius: "50%", width: 44, height: 44, cursor: "pointer",
          color: "var(--accent)", fontSize: "22px",
          opacity: currentIdx === 0 ? 0.15 : 0.5, transition: "opacity 200ms",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={e => { if (currentIdx > 0) e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = currentIdx === 0 ? "0.15" : "0.5"; }}
        aria-label="Previous galaxy">
        ‹
      </button>

      {/* Right arrow */}
      <button onClick={goRight} disabled={currentIdx === sortedAreas.length - 1}
        style={{
          position: "fixed", right: "24px", top: "50%", transform: "translateY(-50%)",
          zIndex: 20, background: "none", border: "1px solid rgba(201,170,120,0.2)",
          borderRadius: "50%", width: 44, height: 44, cursor: "pointer",
          color: "var(--accent)", fontSize: "22px",
          opacity: currentIdx === sortedAreas.length - 1 ? 0.15 : 0.5,
          transition: "opacity 200ms",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={e => { if (currentIdx < sortedAreas.length - 1) e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = currentIdx === sortedAreas.length - 1 ? "0.15" : "0.5"; }}
        aria-label="Next galaxy">
        ›
      </button>

      {/* Dot indicators */}
      <div style={{
        position: "fixed", bottom: "28px", left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 8, zIndex: 20,
      }}>
        {sortedAreas.map((_, i) => (
          <button key={i} onClick={() => setCurrentIdx(i)}
            style={{
              width: i === currentIdx ? 20 : 6, height: 6,
              borderRadius: "3px", padding: 0, cursor: "pointer",
              background: i === currentIdx ? "var(--accent)" : "var(--dot-future)",
              border: "1px solid rgba(201,170,120,0.2)",
              transition: "width 300ms ease, background 300ms ease",
            }} />
        ))}
      </div>

      {showSearch && (
        <SearchModal areas={sortedAreas} lang={lang}
          onClose={() => setShowSearch(false)}
          onNavigate={(a, c) => { setShowSearch(false); router.push(`/${a}/${c}`); }} />
      )}
    </div>
  );
}
