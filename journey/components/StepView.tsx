"use client";

import { Fragment } from "react";
import type { Lang } from "@/lib/i18n";
import type { Step } from "@/lib/steps";

const serif: React.CSSProperties       = { fontFamily: "var(--font-serif)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-serif)", fontStyle: "italic" };

// Parses **bold** and [label](url) inline markdown.
// {rok} / {year} are replaced with the current calendar year.
function parseContent(input: string): React.ReactNode {
  const raw = input.replace(/\{rok\}|\{year\}/g, String(new Date().getFullYear()));
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
  step: Step;
  totalChapters: number;
  lang: Lang;
};

export function StepView({ step, totalChapters, lang }: Props) {
  const meta = step.chapter[lang];

  return (
    <div
      className="flex items-center"
      style={{ paddingLeft: "200px", position: "relative", zIndex: 10, height: "100dvh" }}
    >
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0 48px" }}>
        {step.kind === "title" ? (
          <>
            {/* Chapter indicator */}
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "10px",
              textTransform: "uppercase", letterSpacing: "0.22em",
              color: "var(--text-muted)", marginBottom: "40px",
            }}>
              {String(step.chapterIdx + 1).padStart(2, "0")} / {String(totalChapters).padStart(2, "0")} — {meta.subtitle}
            </p>

            {/* Title / question */}
            <h2 style={{
              ...serif,
              fontSize: "clamp(36px, 5vw, 54px)", lineHeight: 1.15,
              letterSpacing: "-0.02em", color: "var(--text-primary)",
            }}>
              {meta.title.replace(/\{rok\}|\{year\}/g, String(new Date().getFullYear()))}
            </h2>
          </>
        ) : step.section.type === "quote" ? (
          <p style={{
            ...serifItalic, fontSize: "clamp(22px, 3vw, 30px)", lineHeight: 1.55,
            color: "var(--accent)",
          }}>
            {parseContent(step.section[lang])}
          </p>
        ) : (
          <p style={{
            fontSize: "clamp(19px, 2.4vw, 24px)", lineHeight: 1.7,
            color: "var(--text-secondary)",
          }}>
            {parseContent(step.section[lang])}
          </p>
        )}
      </div>
    </div>
  );
}
