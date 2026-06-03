"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Area } from "@/lib/journey/areas";
import type { Lang } from "@/lib/journey/i18n";
import { buildSteps, chapterTitleIndices } from "@/lib/journey/steps";
import { useTheme } from "@/lib/journey/useTheme";
import { StarField } from "./StarField";
import { ChapterNav } from "./ChapterNav";
import { IntroScreen } from "./IntroScreen";
import { StepView } from "./StepView";
import { ThemeToggle } from "./ThemeToggle";
import { LangToggle } from "./LangToggle";

type ContentId = "intro" | number;

const NORMAL_MS = 550;
const FAST_MS   = 160;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function slotStyle(offset: number, animMs: number): React.CSSProperties {
  const abs  = Math.abs(offset);
  const sign = Math.sign(offset) || 0;
  const [yVh, scale, opacity] =
    abs === 0 ? [0,          1.00, 1.00] :
    abs === 1 ? [sign * 34,  0.74, 0.30] :
                [sign * 58,  0.55, 0.10];
  return {
    position:     "absolute", inset: 0, zIndex: 10 - abs,
    opacity, transform: `translateY(${yVh}vh) scale(${scale})`,
    transition:   `transform ${animMs}ms cubic-bezier(0.4,0,0.2,1),
                   opacity   ${animMs}ms cubic-bezier(0.4,0,0.2,1)`,
    pointerEvents: abs === 0 ? "auto" : "none",
  };
}

type Props = {
  area: Area;
  lang: Lang;
  initialChapterSlug?: string;
};

export function AreaApp({ area, lang, initialChapterSlug }: Props) {
  const router = useRouter();
  const [theme, toggleTheme] = useTheme();

  const steps     = buildSteps(area);
  const titleIdx  = chapterTitleIndices(area);
  const chapters  = area.chapters;

  const getInitialContent = (): ContentId => {
    if (initialChapterSlug) {
      const ci = chapters.findIndex(ch => ch.slug === initialChapterSlug);
      if (ci !== -1) return titleIdx[ci];
    }
    return "intro"; // every area opens with its intro screen
  };

  const introContent = area.intro?.[lang] ?? { eyebrow: "", title: area[lang].name, tagline: "" };

  const [current, _setCurrentState] = useState<ContentId>(getInitialContent);
  const currentRef = useRef<ContentId>(getInitialContent());
  const setCurrent = useCallback((val: ContentId) => {
    currentRef.current = val;
    _setCurrentState(val);
  }, []);

  const [exitingItem, setExitingItem] = useState<ContentId | null>(null);
  const isTransitioning = useRef(false);
  const animMsRef       = useRef(NORMAL_MS);
  const wheelDirRef     = useRef<"down" | "up">("down");
  const wheelTimeRef    = useRef(0);
  const touchStartY     = useRef(0);

  // Scroll-to-return progress (shown at the very end of an area)
  const returnRef    = useRef(0);
  const returningRef = useRef(false);
  const [returnProgress, setReturnProgress] = useState(0);

  const lastStep = steps.length - 1;
  const currentNavIdx = typeof current === "number" ? steps[current].chapterIdx : 0;
  const visitedChapters = typeof current === "number"
    ? new Set(steps.slice(0, current + 1).map(s => s.chapterIdx))
    : new Set<number>();

  const lyricsItems =
    exitingItem === null && typeof current === "number"
      ? [-2, -1, 0, 1, 2].flatMap((offset) => {
          const idx = (current as number) + offset;
          if (idx < 0 || idx >= steps.length) return [];
          return [{ id: idx as ContentId, offset }];
        })
      : [];

  // Update the URL bar without a Next navigation (no recompile / refetch)
  useEffect(() => {
    let url: string;
    if (current === "intro") url = area.slug === "intro" ? "/" : `/${area.slug}`;
    else url = `/${area.slug}/${steps[current as number].chapter.slug}`;
    window.history.replaceState(window.history.state, "", url);
  }, [current, area.slug, steps]);

  const zoomOut = useCallback(() => {
    router.push(`/journey/universe?from=${area.slug}`);
  }, [router, area.slug]);

  const bumpReturn = useCallback((delta: number) => {
    if (returningRef.current) return;
    const v = clamp(returnRef.current + delta, 0, 1);
    returnRef.current = v;
    setReturnProgress(v);
    if (v >= 1) { returningRef.current = true; zoomOut(); }
  }, [zoomOut]);

  const drainReturn = useCallback((delta: number) => {
    const v = clamp(returnRef.current - delta, 0, 1);
    returnRef.current = v;
    setReturnProgress(v);
  }, []);

  useEffect(() => {
    const atLast = typeof current === "number" && current === lastStep;
    if (!atLast && returnRef.current !== 0) {
      returnRef.current = 0;
      setReturnProgress(0);
    }
  }, [current, lastStep]);

  const goTo = useCallback((target: ContentId, ms: number) => {
    isTransitioning.current = true;
    animMsRef.current = ms;
    const cur = currentRef.current;

    if (cur === "intro" || target === "intro") {
      setExitingItem(cur);
      setCurrent(target);
      setTimeout(() => {
        setExitingItem(null);
        isTransitioning.current = false;
        animMsRef.current = NORMAL_MS;
      }, 600);
    } else {
      setCurrent(target);
      setTimeout(() => {
        if (Date.now() - wheelTimeRef.current < 300) {
          const dir    = wheelDirRef.current;
          const newCur = currentRef.current as number;
          let next: ContentId | null = null;
          if      (dir === "down" && newCur < steps.length - 1) next = newCur + 1;
          else if (dir === "up"   && newCur > 0)                next = newCur - 1;
          else if (dir === "up"   && newCur === 0)              next = "intro";
          if (next !== null) { goTo(next, FAST_MS); return; }
        }
        isTransitioning.current = false;
        animMsRef.current = NORMAL_MS;
      }, ms);
    }
  }, [setCurrent, steps.length, area.slug]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 10) return;
      const dir = e.deltaY > 0 ? "down" : "up";
      wheelDirRef.current  = dir;
      wheelTimeRef.current = Date.now();
      if (isTransitioning.current) return;
      const cur = currentRef.current;

      if (cur === "intro") { if (dir === "down") goTo(0, NORMAL_MS); return; }
      const step = cur as number;
      const atLast = step === lastStep;
      if (dir === "down") {
        if (!atLast) goTo(step + 1, NORMAL_MS);
        else bumpReturn(Math.min(Math.abs(e.deltaY), 60) * 0.0011);
      } else {
        if (atLast && returnRef.current > 0) drainReturn(Math.min(Math.abs(e.deltaY), 60) * 0.0016);
        else if (step > 0) goTo(step - 1, NORMAL_MS);
        else goTo("intro", NORMAL_MS);
      }
    };
    const handleTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const handleTouchEnd   = (e: TouchEvent) => {
      const delta = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) < 50 || isTransitioning.current) return;
      const dir = delta > 0 ? "down" : "up";
      const cur = currentRef.current;
      if (cur === "intro") { if (dir === "down") goTo(0, NORMAL_MS); return; }
      const step = cur as number;
      const atLast = step === lastStep;
      if (dir === "down") {
        if (!atLast) goTo(step + 1, NORMAL_MS);
        else bumpReturn(0.5);
      } else {
        if (atLast && returnRef.current > 0) drainReturn(0.5);
        else if (step > 0) goTo(step - 1, NORMAL_MS);
        else goTo("intro", NORMAL_MS);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning.current) return;
      const cur = currentRef.current;
      if (e.key === " " || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        if (cur === "intro") { goTo(0, NORMAL_MS); return; }
        const step = cur as number;
        if (step < lastStep) goTo(step + 1, NORMAL_MS);
        else bumpReturn(0.34);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        if (cur === "intro") return;
        const step = cur as number;
        const atLast = step === lastStep;
        if (atLast && returnRef.current > 0) { drainReturn(0.5); return; }
        if (step > 0) goTo(step - 1, NORMAL_MS);
        else goTo("intro", NORMAL_MS);
      }
    };
    window.addEventListener("wheel",      handleWheel,      { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend",   handleTouchEnd,   { passive: true });
    window.addEventListener("keydown",    handleKeyDown);
    return () => {
      window.removeEventListener("wheel",      handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend",   handleTouchEnd);
      window.removeEventListener("keydown",    handleKeyDown);
    };
  }, [goTo, zoomOut, bumpReturn, drainReturn, lastStep, steps.length, area.slug]);

  const isLastStep = typeof current === "number" && current === lastStep;

  const renderContent = (id: ContentId) =>
    id === "intro" ? (
      <IntroScreen lang={lang} onStart={() => goTo(0, NORMAL_MS)}
        eyebrow={introContent.eyebrow} title={introContent.title} tagline={introContent.tagline} />
    ) : (
      <StepView step={steps[id as number]} totalChapters={chapters.length} lang={lang} />
    );

  const canGoUp   = current !== "intro" || area.slug !== "intro";
  const canGoDown = current === "intro" ||
    (typeof current === "number" && current < lastStep) || isLastStep;

  return (
    <div
      data-theme={theme}
      style={{ background: "var(--bg)", height: "100dvh", overflow: "hidden", position: "relative" }}
    >
      <StarField theme={theme} />
      <div className="scanlines" />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <LangToggle lang={lang} />

      {/* Overview button — always visible, same style everywhere */}
      <button
        onClick={zoomOut}
        style={{
          position: "fixed", top: "18px", left: "24px", zIndex: 30,
          fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 500,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: "var(--text-muted)", background: "none",
          border: "1px solid var(--text-muted)", borderRadius: "3px",
          padding: "4px 9px", cursor: "pointer", opacity: 0.55,
          transition: "opacity 250ms ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "0.55"; }}
      >
        {lang === "cs" ? "Přehled →" : "Overview →"}
      </button>

      {/* Sidebar nav */}
      <div style={{
        opacity: current !== "intro" ? 1 : 0,
        transition: `opacity ${NORMAL_MS}ms ease`,
        pointerEvents: current !== "intro" ? "auto" : "none",
      }}>
        <ChapterNav
          chapters={chapters}
          currentChapterIdx={currentNavIdx}
          visitedChapters={visitedChapters}
          lang={lang}
          onNavigateToChapter={(i) => {
            if (isTransitioning.current || typeof current !== "number") return;
            const target = titleIdx[i];
            if (target !== current) goTo(target, NORMAL_MS);
          }}
        />
      </div>

      {/* Scroll-to-return progress on the last step */}
      {isLastStep && (
        <div style={{
          position: "fixed", bottom: "44px", left: "50%", transform: "translateX(-50%)",
          zIndex: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
        }}>
          <button
            onClick={zoomOut}
            style={{
              fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 500,
              letterSpacing: "0.16em", textTransform: "uppercase",
              color: "var(--accent)", background: "none", border: "none",
              cursor: "pointer", opacity: returnProgress > 0.02 ? 1 : 0.6,
              transition: "opacity 250ms ease",
            }}
          >
            {returnProgress > 0.99
              ? (lang === "cs" ? "Vracím se…" : "Returning…")
              : returnProgress > 0.02
                ? (lang === "cs" ? "Zpět na přehled" : "Back to overview")
                : (lang === "cs" ? "Scrolluj dál — zpět na přehled" : "Keep scrolling — back to overview")}
          </button>
          <div style={{
            width: "180px", height: "3px", borderRadius: "2px",
            background: "rgba(201,170,120,0.15)", overflow: "hidden",
          }}>
            <div style={{
              width: `${returnProgress * 100}%`, height: "100%",
              background: "var(--accent)", borderRadius: "2px",
              transition: "width 120ms linear",
              boxShadow: returnProgress > 0 ? "0 0 8px var(--accent-glow)" : "none",
            }} />
          </div>
        </div>
      )}

      {exitingItem !== null ? (
        <>
          <div key={`exit-${exitingItem}`} className="page-exit"
               style={{ position: "absolute", inset: 0, zIndex: 6 }}>
            {renderContent(exitingItem)}
          </div>
          <div key={`enter-${current}`} className="page-enter"
               style={{ position: "absolute", inset: 0, zIndex: 5 }}>
            {renderContent(current)}
          </div>
        </>
      ) : current === "intro" ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 6 }}>
          <IntroScreen lang={lang} onStart={() => goTo(0, NORMAL_MS)}
            eyebrow={introContent.eyebrow} title={introContent.title} tagline={introContent.tagline} />
        </div>
      ) : (
        lyricsItems.map(({ id, offset }) => (
          <div key={String(id)} style={slotStyle(offset, animMsRef.current)}>
            {renderContent(id)}
          </div>
        ))
      )}

      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "130px",
        background: "linear-gradient(to bottom, var(--bg) 0%, transparent 100%)",
        zIndex: 15, pointerEvents: "none",
        opacity: canGoUp ? undefined : 0,
        transition: `opacity ${NORMAL_MS}ms ease`,
      }} />
      <div className="breathing-bottom" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: "130px",
        background: "linear-gradient(to top, var(--bg) 0%, transparent 100%)",
        zIndex: 15, pointerEvents: "none",
        opacity: canGoDown ? undefined : 0,
        transition: `opacity ${NORMAL_MS}ms ease`,
      }} />
    </div>
  );
}
