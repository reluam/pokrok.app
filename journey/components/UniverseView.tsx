"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Area, Chapter } from "@/lib/areas";
import type { Lang } from "@/lib/i18n";
import { StarField } from "./StarField";

type Props = {
  areas: Area[];
  lang: Lang;
};

// Solar system SVG dimensions
const SVG_W = 320;
const SVG_H = 320;
const CX = SVG_W / 2;
const CY = SVG_H / 2;
const SUN_R = 32;
const ORBIT_R = 110;

function SolarSystem({
  area,
  lang,
  isActive,
  onClickSun,
  onClickChapter,
}: {
  area: Area;
  lang: Lang;
  isActive: boolean;
  onClickSun: () => void;
  onClickChapter: (chapter: Chapter) => void;
}) {
  const chapters = area.chapters;
  const areaName = area[lang].name;

  return (
    <div
      style={{
        width: SVG_W,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        transition: "opacity 400ms ease",
        opacity: isActive ? 1 : 0.45,
        cursor: "default",
      }}
    >
      <svg
        width={SVG_W}
        height={SVG_H}
        style={{ overflow: "visible" }}
        aria-label={`Solar system: ${areaName}`}
      >
        {/* Orbit circle */}
        <circle
          cx={CX}
          cy={CY}
          r={ORBIT_R}
          fill="none"
          stroke="rgba(201,170,120,0.12)"
          strokeWidth={1}
          strokeDasharray="4 6"
        />

        {/* Sun */}
        <circle
          cx={CX}
          cy={CY}
          r={SUN_R}
          fill={isActive ? "rgba(201,170,120,0.18)" : "rgba(201,170,120,0.08)"}
          stroke="var(--accent)"
          strokeWidth={isActive ? 1.5 : 1}
          style={{
            filter: isActive ? "drop-shadow(0 0 10px rgba(201,170,120,0.5))" : "none",
            cursor: "pointer",
            transition: "filter 300ms ease",
          }}
          onClick={onClickSun}
        />
        <text
          x={CX}
          y={CY + 4}
          textAnchor="middle"
          fill="var(--accent)"
          fontSize={10}
          fontFamily="var(--font-sans)"
          letterSpacing="0.08em"
          style={{ textTransform: "uppercase", cursor: "pointer", pointerEvents: "none" }}
        >
          {areaName}
        </text>

        {/* Chapter planets */}
        {chapters.map((ch, i) => {
          const angle = (2 * Math.PI * i) / chapters.length - Math.PI / 2;
          const px = CX + ORBIT_R * Math.cos(angle);
          const py = CY + ORBIT_R * Math.sin(angle);
          const labelAngle = angle * (180 / Math.PI);
          const isRight = Math.cos(angle) >= 0;

          return (
            <g
              key={ch.id}
              style={{ cursor: "pointer" }}
              onClick={() => onClickChapter(ch)}
              role="button"
              aria-label={ch[lang].subtitle}
            >
              <circle
                cx={px}
                cy={py}
                r={14}
                fill="transparent"
              />
              <circle
                cx={px}
                cy={py}
                r={5}
                fill="var(--text-secondary)"
                style={{
                  transition: "r 200ms ease, fill 200ms ease",
                }}
              />
              {/* Label */}
              <text
                x={px + (isRight ? 12 : -12)}
                y={py + 4}
                textAnchor={isRight ? "start" : "end"}
                fill="var(--text-secondary)"
                fontSize={9}
                fontFamily="var(--font-sans)"
                letterSpacing="0.06em"
                style={{ textTransform: "uppercase", opacity: 0.7, pointerEvents: "none" }}
              >
                {ch[lang].subtitle}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SearchModal({
  areas,
  lang,
  onClose,
  onNavigate,
}: {
  areas: Area[];
  lang: Lang;
  onClose: () => void;
  onNavigate: (areaSlug: string, chapterSlug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const results: { area: Area; chapter: Chapter }[] = [];
  if (query.trim().length >= 2) {
    const q = query.toLowerCase();
    for (const area of areas) {
      for (const ch of area.chapters) {
        const haystack = [
          area[lang].name,
          ch[lang].subtitle,
          ch[lang].title,
          ...ch.sections.map(s => s[lang]),
        ].join(" ").toLowerCase();
        if (haystack.includes(q)) {
          results.push({ area, chapter: ch });
        }
      }
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(5,5,26,0.85)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "15vh",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(10,10,36,0.96)",
          border: "1px solid rgba(201,170,120,0.18)",
          borderRadius: "12px",
          width: "min(560px, 90vw)",
          padding: "24px",
          maxHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={lang === "cs" ? "Hledat…" : "Search…"}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(201,170,120,0.25)",
            borderRadius: "6px",
            padding: "10px 14px",
            fontSize: "15px",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            outline: "none",
            width: "100%",
          }}
        />
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {results.length === 0 && query.trim().length >= 2 && (
            <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: "12px 0" }}>
              {lang === "cs" ? "Nic nenalezeno" : "No results"}
            </p>
          )}
          {results.map(({ area, chapter }) => (
            <button
              key={`${area.id}-${chapter.id}`}
              onClick={() => onNavigate(area.slug, chapter.slug)}
              style={{
                background: "none",
                border: "1px solid rgba(201,170,120,0.1)",
                borderRadius: "6px",
                padding: "10px 14px",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 200ms",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,170,120,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            >
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

export function UniverseView({ areas, lang }: Props) {
  const router = useRouter();
  const sortedAreas = [...areas].sort((a, b) => a.order - b.order);

  const [currentAreaIdx, setCurrentAreaIdx] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const isTransitioning = useRef(false);

  const goLeft = useCallback(() => {
    if (isTransitioning.current) return;
    setCurrentAreaIdx(i => Math.max(0, i - 1));
  }, []);

  const goRight = useCallback(() => {
    if (isTransitioning.current) return;
    setCurrentAreaIdx(i => Math.min(sortedAreas.length - 1, i + 1));
  }, [sortedAreas.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showSearch) return;
      if (e.key === "ArrowLeft")  { e.preventDefault(); goLeft(); }
      if (e.key === "ArrowRight") { e.preventDefault(); goRight(); }
      if (e.key === "/" || e.key === "f" || e.key === "F") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goLeft, goRight, showSearch]);

  const navigateToArea = (area: Area) => {
    router.push(`/${area.slug}`);
  };

  const navigateToChapter = (area: Area, chapter: Chapter) => {
    router.push(`/${area.slug}/${chapter.slug}`);
  };

  const CAROUSEL_ITEM_W = SVG_W + 80; // gap between solar systems
  const translateX = -currentAreaIdx * CAROUSEL_ITEM_W;

  return (
    <div
      style={{
        background: "var(--bg)",
        height: "100dvh",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <StarField />

      {/* Top bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 32px",
        zIndex: 20,
      }}>
        {/* Search — centered, prominent */}
        <button
          onClick={() => setShowSearch(true)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            fontFamily: "var(--font-sans)", fontSize: "12px",
            textTransform: "uppercase", letterSpacing: "0.18em",
            color: "var(--text-secondary)",
            background: "rgba(201,170,120,0.05)",
            border: "1px solid rgba(201,170,120,0.15)",
            borderRadius: "20px",
            padding: "8px 20px", cursor: "pointer",
            opacity: 0.75,
            transition: "opacity 200ms, border-color 200ms",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.borderColor = "rgba(201,170,120,0.4)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = "0.75";
            e.currentTarget.style.borderColor = "rgba(201,170,120,0.15)";
          }}
        >
          <span style={{ fontSize: "14px", opacity: 0.8 }}>⌕</span>
          {lang === "cs" ? "Hledat" : "Search"}
          <span style={{ fontSize: "10px", opacity: 0.5, marginLeft: 2 }}>/</span>
        </button>
      </div>

      {/* Carousel */}
      <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "80px",
          transform: `translateX(calc(50% - ${CX}px + ${translateX}px))`,
          transition: "transform 500ms cubic-bezier(0.4,0,0.2,1)",
          paddingLeft: "0",
          willChange: "transform",
        }}>
          {sortedAreas.map((area, i) => (
            <SolarSystem
              key={area.id}
              area={area}
              lang={lang}
              isActive={i === currentAreaIdx}
              onClickSun={() => navigateToArea(area)}
              onClickChapter={(ch) => navigateToChapter(area, ch)}
            />
          ))}
        </div>
      </div>

      {/* Area name label */}
      <div style={{
        position: "fixed", bottom: "80px", left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        zIndex: 20,
      }}>
        <p style={{
          fontFamily: "var(--font-serif)", fontSize: "28px",
          color: "var(--text-primary)", letterSpacing: "-0.01em",
          transition: "opacity 300ms ease",
        }}>
          {sortedAreas[currentAreaIdx]?.[lang].name}
        </p>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "10px",
          textTransform: "uppercase", letterSpacing: "0.18em",
          color: "var(--text-muted)",
        }}>
          {lang === "cs" ? "klikni pro vstup" : "click to enter"}
        </p>
      </div>

      {/* Left / Right arrows */}
      <button
        onClick={goLeft}
        disabled={currentAreaIdx === 0}
        style={{
          position: "fixed", left: "24px", top: "50%", transform: "translateY(-50%)",
          zIndex: 20, background: "none",
          border: "1px solid rgba(201,170,120,0.2)", borderRadius: "50%",
          width: 44, height: 44, cursor: "pointer",
          color: "var(--accent)", fontSize: "18px",
          opacity: currentAreaIdx === 0 ? 0.2 : 0.6,
          transition: "opacity 200ms",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={e => { if (currentAreaIdx > 0) e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = currentAreaIdx === 0 ? "0.2" : "0.6"; }}
        aria-label="Previous area"
      >
        ‹
      </button>
      <button
        onClick={goRight}
        disabled={currentAreaIdx === sortedAreas.length - 1}
        style={{
          position: "fixed", right: "24px", top: "50%", transform: "translateY(-50%)",
          zIndex: 20, background: "none",
          border: "1px solid rgba(201,170,120,0.2)", borderRadius: "50%",
          width: 44, height: 44, cursor: "pointer",
          color: "var(--accent)", fontSize: "18px",
          opacity: currentAreaIdx === sortedAreas.length - 1 ? 0.2 : 0.6,
          transition: "opacity 200ms",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={e => { if (currentAreaIdx < sortedAreas.length - 1) e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = currentAreaIdx === sortedAreas.length - 1 ? "0.2" : "0.6"; }}
        aria-label="Next area"
      >
        ›
      </button>

      {/* Dots indicator */}
      <div style={{
        position: "fixed", bottom: "32px", left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 8,
        zIndex: 20,
      }}>
        {sortedAreas.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentAreaIdx(i)}
            style={{
              width: i === currentAreaIdx ? 20 : 6,
              height: 6, borderRadius: "3px",
              background: i === currentAreaIdx ? "var(--accent)" : "var(--dot-future)",
              border: "1px solid rgba(201,170,120,0.2)",
              cursor: "pointer", padding: 0,
              transition: "width 300ms ease, background 300ms ease",
            }}
            aria-label={`Go to area ${i + 1}`}
          />
        ))}
      </div>

      {/* Search modal */}
      {showSearch && (
        <SearchModal
          areas={sortedAreas}
          lang={lang}
          onClose={() => setShowSearch(false)}
          onNavigate={(areaSlug, chapterSlug) => {
            setShowSearch(false);
            router.push(`/${areaSlug}/${chapterSlug}`);
          }}
        />
      )}
    </div>
  );
}
