"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Area, Chapter } from "@/lib/areas";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";
import { StarField } from "./StarField";
import { ChapterNav } from "./ChapterNav";
import { IntroScreen } from "./IntroScreen";
import { StepView } from "./StepView";
import { ThemeToggle } from "./ThemeToggle";

type ContentId = "intro" | number;

const NORMAL_MS = 550;
const FAST_MS   = 160;

function slotStyle(offset: number, animMs: number): React.CSSProperties {
  const abs  = Math.abs(offset);
  const sign = Math.sign(offset) || 0;
  const [yVh, scale, opacity] =
    abs === 0 ? [0,          1.00, 1.00] :
    abs === 1 ? [sign * 40,  0.68, 0.26] :
                [sign * 64,  0.48, 0.09];
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
  const [theme, setTheme] = useState<Theme>("cosmic");

  // Chapters in their natural order (as stored in data)
  const chapters: Chapter[] = area.chapters;

  // Determine initial position
  const getInitialContent = (): ContentId => {
    if (initialChapterSlug) {
      const idx = chapters.findIndex(ch => ch.slug === initialChapterSlug);
      if (idx !== -1) return idx;
    }
    // intro area shows IntroScreen first; other areas go straight to chapter 0
    return area.slug === "intro" ? "intro" : 0;
  };

  const [current, _setCurrentState]   = useState<ContentId>(getInitialContent);
  const currentRef                    = useRef<ContentId>(getInitialContent());
  const setCurrent = useCallback((val: ContentId) => {
    currentRef.current = val;
    _setCurrentState(val);
  }, []);

  const [exitingItem, setExitingItem] = useState<ContentId | null>(null);
  const isTransitioning               = useRef(false);
  const animMsRef                     = useRef(NORMAL_MS);
  const wheelDirRef                   = useRef<"down" | "up">("down");
  const wheelTimeRef                  = useRef(0);
  const touchStartY                   = useRef(0);

  const currentNavIdx   = typeof current === "number" ? (current as number) : 0;
  const visitedChapters = typeof current === "number"
    ? new Set(Array.from({ length: (current as number) + 1 }, (_, i) => i))
    : new Set<number>();

  const lyricsItems =
    exitingItem === null && typeof current === "number"
      ? [-2, -1, 0, 1, 2].flatMap((offset) => {
          const idx = (current as number) + offset;
          if (idx < 0 || idx >= chapters.length) return [];
          return [{ id: idx as ContentId, offset }];
        })
      : [];

  // Update URL when chapter changes
  useEffect(() => {
    if (typeof current === "number") {
      const chapter = chapters[current];
      if (chapter) {
        router.push(`/${area.slug}/${chapter.slug}`, { scroll: false });
      }
    } else if (current === "intro") {
      router.push(`/${area.slug}`, { scroll: false });
    }
  }, [current, area.slug, chapters, router]);

  const zoomOut = useCallback(() => {
    router.push("/universe");
  }, [router]);

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
          if      (dir === "down" && newCur < chapters.length - 1) next = newCur + 1;
          else if (dir === "up"   && newCur > 0)                    next = newCur - 1;
          else if (dir === "up"   && newCur === 0 && area.slug === "intro") next = "intro";
          if (next !== null) { goTo(next, FAST_MS); return; }
        }
        isTransitioning.current = false;
        animMsRef.current = NORMAL_MS;
      }, ms);
    }
  }, [setCurrent, chapters.length, area.slug]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 10) return;
      const dir = e.deltaY > 0 ? "down" : "up";
      wheelDirRef.current  = dir;
      wheelTimeRef.current = Date.now();
      if (isTransitioning.current) return;
      const cur = currentRef.current;

      if (cur === "intro") {
        if (dir === "down") goTo(0, NORMAL_MS);
        return;
      }
      const step = cur as number;
      if (dir === "down") {
        if (step < chapters.length - 1) goTo(step + 1, NORMAL_MS);
        else zoomOut(); // scroll past last chapter → zoom out
      } else if (dir === "up") {
        if (step > 0) goTo(step - 1, NORMAL_MS);
        else if (area.slug === "intro") goTo("intro", NORMAL_MS);
        else zoomOut();
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
      if (dir === "down") {
        if (step < chapters.length - 1) goTo(step + 1, NORMAL_MS);
        else zoomOut();
      } else if (dir === "up") {
        if (step > 0) goTo(step - 1, NORMAL_MS);
        else if (area.slug === "intro") goTo("intro", NORMAL_MS);
        else zoomOut();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning.current) return;
      const cur = currentRef.current;
      if (e.key === " " || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        if (cur === "intro") { goTo(0, NORMAL_MS); return; }
        const step = cur as number;
        if (step < chapters.length - 1) goTo(step + 1, NORMAL_MS);
        else zoomOut();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        if (cur === "intro") return;
        const step = cur as number;
        if (step > 0) goTo(step - 1, NORMAL_MS);
        else if (area.slug === "intro") goTo("intro", NORMAL_MS);
        else zoomOut();
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
  }, [goTo, zoomOut, chapters.length, area.slug]);

  const isLastChapter = typeof current === "number" && current === chapters.length - 1;

  const renderContent = (id: ContentId) =>
    id === "intro" ? (
      <IntroScreen lang={lang} onStart={() => goTo(0, NORMAL_MS)} />
    ) : (
      <StepView
        chapter={chapters[id as number]}
        totalChapters={chapters.length}
        lang={lang}
        isLast={id === chapters.length - 1}
        onZoomOut={zoomOut}
      />
    );

  const canGoUp   = current !== "intro" || area.slug !== "intro";
  const canGoDown = current === "intro" ||
    (typeof current === "number" && current < chapters.length - 1) ||
    isLastChapter; // always show bottom gradient, zoom out hint

  return (
    <div
      data-theme={theme}
      style={{ background: "var(--bg)", height: "100dvh", overflow: "hidden", position: "relative" }}
    >
      <StarField theme={theme} />
      <div className="scanlines" />
      <ThemeToggle theme={theme} onToggle={() => setTheme(t => t === "cosmic" ? "hhgttg" : "cosmic")} />

      {/* Zoom out button - top left when no nav, or always visible */}
      {current === "intro" && (
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
          ← Universe
        </button>
      )}

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
            if (i !== current) goTo(i, NORMAL_MS);
          }}
          onBack={zoomOut}
        />
      </div>

      {/* Zoom out button on last chapter */}
      {isLastChapter && (
        <button
          onClick={zoomOut}
          style={{
            position: "fixed", bottom: "40px", left: "50%",
            transform: "translateX(-50%)", zIndex: 30,
            fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500,
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--accent)", background: "none",
            border: "1px solid var(--accent)", borderRadius: "3px",
            padding: "6px 16px", cursor: "pointer", opacity: 0.7,
            transition: "opacity 250ms ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "0.7"; }}
        >
          {lang === "cs" ? "← Odzoumovat" : "← Zoom out"}
        </button>
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
          <IntroScreen lang={lang} onStart={() => goTo(0, NORMAL_MS)} />
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
