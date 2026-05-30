"use client";

import { Fragment } from "react";
import type { Chapter } from "@/lib/areas";
import type { Lang } from "@/lib/i18n";

const serif: React.CSSProperties       = { fontFamily: "var(--font-serif)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-serif)", fontStyle: "italic" };

// Parses **bold** and [label](url) inline markdown
function parseContent(raw: string): React.ReactNode {
  const parts = raw.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <Fragment>
      {parts.map((seg, i) => {
        if (seg.startsWith("**") && seg.endsWith("**"))
          return <strong key={i}>{seg.slice(2, -2)}</strong>;
        const m = seg.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (m)
          return (
            <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer"
               style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              {m[1]}
            </a>
          );
        return seg;
      })}
    </Fragment>
  );
}

type Props = {
  chapter: Chapter;
  totalChapters: number;
  lang: Lang;
  isLast: boolean;
  onZoomOut?: () => void;
};

export function StepView({ chapter, totalChapters, lang, isLast, onZoomOut }: Props) {
  void onZoomOut; // available for callers; AreaApp handles zoom-out button separately
  const meta = chapter[lang];

  return (
    <div
      className="flex items-center"
      style={{ paddingLeft: "200px", position: "relative", zIndex: 10, height: "100dvh" }}
    >
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0 48px" }}>
        {/* Chapter indicator */}
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "10px",
          textTransform: "uppercase", letterSpacing: "0.22em",
          color: "var(--text-muted)", marginBottom: "40px",
        }}>
          {String(chapter.id).padStart(2, "0")} / {String(totalChapters).padStart(2, "0")} — {meta.subtitle}
        </p>

        {/* Title */}
        <h2 style={{
          ...serif,
          fontSize: "clamp(36px, 5vw, 54px)", lineHeight: 1.15,
          letterSpacing: "-0.02em", color: "var(--text-primary)",
          marginBottom: "36px",
        }}>
          {meta.title}
        </h2>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {chapter.sections.map((sec) => {
            const content = sec[lang];
            if (sec.type === "quote") {
              return (
                <p key={sec.id} style={{
                  ...serifItalic, fontSize: "20px", lineHeight: 1.7,
                  color: "var(--accent)", marginTop: "4px",
                }}>
                  {parseContent(content)}
                </p>
              );
            }
            return (
              <p key={sec.id} style={{
                fontSize: "17px", lineHeight: 1.75,
                color: "var(--text-secondary)",
              }}>
                {parseContent(content)}
              </p>
            );
          })}
        </div>

        {isLast && (
          <p style={{
            ...serifItalic, fontSize: "18px",
            color: "var(--text-secondary)", marginTop: "48px",
          }}>
            {lang === "cs" ? "Konec? Nebo nový začátek." : "The end? Or a new beginning."}
          </p>
        )}
      </div>
    </div>
  );
}
