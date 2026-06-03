"use client";

import { Chapter } from "@/lib/journey/areas";
import { Lang } from "@/lib/journey/i18n";

type Props = {
  chapters: Chapter[];
  currentChapterIdx: number;
  visitedChapters: Set<number>;
  lang: Lang;
  onNavigateToChapter: (chapterIdx: number) => void;
};

export function ChapterNav({
  chapters,
  currentChapterIdx,
  visitedChapters,
  lang,
  onNavigateToChapter,
}: Props) {
  return (
    <nav style={{
      position: "fixed", left: 0, top: "50%", transform: "translateY(-50%)",
      zIndex: 20, padding: "0 24px", display: "flex", flexDirection: "column", gap: "2px",
      maxHeight: "80vh", overflowY: "auto",
    }}>
      {chapters.map((ch, i) => {
        const active = i === currentChapterIdx;
        const visited = visitedChapters.has(i) && !active;
        return (
          <button key={ch.id} onClick={() => onNavigateToChapter(i)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "none", border: "none", cursor: "pointer",
              padding: "6px 0", textAlign: "left",
            }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: active ? "var(--accent)" : visited ? "var(--dot-visited)" : "var(--dot-future)",
              border: active ? "none" : "1px solid rgba(201,170,120,0.25)",
              boxShadow: active ? "0 0 8px var(--accent-glow)" : "none",
              transition: "background 250ms, box-shadow 250ms",
            }} />
            <span style={{
              fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: active ? "var(--accent)" : visited ? "var(--text-secondary)" : "var(--text-muted)",
              opacity: active ? 1 : visited ? 0.7 : 0.45,
              transition: "color 250ms, opacity 250ms",
            }}>
              {ch[lang].subtitle}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
