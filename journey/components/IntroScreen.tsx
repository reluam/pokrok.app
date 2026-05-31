"use client";

import { Lang, ui } from "@/lib/i18n";

const serif: React.CSSProperties = { fontFamily: "var(--font-serif)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-serif)", fontStyle: "italic" };

type Props = {
  lang: Lang;
  onStart: () => void;
  eyebrow: string;
  title: string;
  tagline: string;
};

export function IntroScreen({ lang, onStart, eyebrow, title, tagline }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-8"
      style={{ position: "relative", zIndex: 10, height: "100dvh" }}
    >
      {eyebrow && (
        <p
          className="mb-10"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            color: "var(--text-muted)",
          }}
        >
          {eyebrow}
        </p>
      )}

      <h1
        style={{
          ...serif,
          fontSize: "clamp(64px, 10vw, 96px)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          marginBottom: "28px",
        }}
      >
        {title}
      </h1>

      {tagline && (
        <p
          style={{
            ...serifItalic,
            fontSize: "clamp(18px, 2.5vw, 24px)",
            lineHeight: 1.5,
            color: "var(--text-secondary)",
            maxWidth: "440px",
            marginBottom: "72px",
          }}
        >
          {tagline}
        </p>
      )}

      <button
        onClick={onStart}
        className="group flex flex-col items-center gap-2 transition-opacity hover:opacity-70"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          fontWeight: 500,
          letterSpacing: "0.06em",
          color: "var(--accent)",
        }}
      >
        <span className="flex items-center gap-3">
          {ui[lang].start}
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
        <span
          style={{
            fontSize: "11px",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            fontWeight: 400,
          }}
        >
          {ui[lang].startHint}
        </span>
      </button>
    </div>
  );
}
