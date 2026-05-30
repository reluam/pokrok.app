"use client";

import { Chapter } from "@/lib/areas";
import { Lang, ui } from "@/lib/i18n";

type Props = {
  chapters: Chapter[];
  currentChapterIdx: number;
  visitedChapters: Set<number>;
  lang: Lang;
  onNavigateToChapter: (chapterIdx: number) => void;
  onBack: () => void;
};

export function ChapterNav({
  chapters,
  currentChapterIdx,
  visitedChapters,
  lang,
  onNavigateToChapter,
  onBack,
}: Props) {
  return (
    <nav
      className="fixed left-0 top-0 h-full flex flex-col justify-center"
      style={{
        width: "200px",
        background: "var(--bg-nav)",
        backdropFilter: "blur(10px)",
        zIndex: 20,
        borderRight: "1px solid rgba(201,170,120,0.06)",
      }}
    >
      <button
        onClick={onBack}
        className="absolute top-8 left-7 flex items-center gap-1.5 transition-opacity hover:opacity-100"
        style={{
          color: "var(--text-muted)",
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          letterSpacing: "0.06em",
          opacity: 0.7,
        }}
      >
        {ui[lang].back}
      </button>

      <div className="relative px-8">
        <div
          className="absolute"
          style={{
            left: "calc(32px + 6px)",
            top: "7px",
            bottom: "7px",
            width: "1px",
            background: "var(--nav-line)",
          }}
        />

        <ul className="space-y-7 relative">
          {chapters.map((ch, i) => {
            const isActive = i === currentChapterIdx;
            const isVisited = visitedChapters.has(i) && !isActive;

            return (
              <li
                key={ch.id}
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => onNavigateToChapter(i)}
              >
                <div className="relative w-[13px] h-[13px] flex items-center justify-center shrink-0">
                  <div
                    className={`rounded-full transition-all duration-300 ${isActive ? "dot-active" : ""}`}
                    style={{
                      width:      isActive ? 13 : 7,
                      height:     isActive ? 13 : 7,
                      background: isActive
                        ? "var(--dot-active)"
                        : isVisited
                        ? "var(--dot-visited)"
                        : "var(--dot-future)",
                      border: isActive ? "none" : "1px solid rgba(201,170,120,0.2)",
                    }}
                  />
                </div>

                <span
                  className="transition-all duration-300 leading-tight"
                  style={{
                    fontFamily:    "var(--font-sans)",
                    fontSize:      "10px",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: isActive
                      ? "var(--accent)"
                      : isVisited
                      ? "var(--text-muted)"
                      : "var(--dot-future)",
                    opacity: isActive ? 1 : isVisited ? 0.8 : 0.45,
                  }}
                >
                  {ch[lang].subtitle}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
