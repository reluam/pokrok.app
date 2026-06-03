import type { Lang } from "@/lib/dictionaries";

const TEXT = {
  cs: "Audio experiment — zapni si zvuk / reproduktory 🔊",
  en: "Audio experiment — turn your sound / speakers on 🔊",
} as const;

/* Malé upozornění, že experiment hraje zvuk. */
export function AudioNotice({ lang, center = true }: { lang: Lang; center?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: center ? "center" : "flex-start", marginBottom: "18px" }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: "var(--text-secondary, #444)",
          background: "rgba(0,0,0,0.05)",
          border: "1.5px solid rgba(0,0,0,0.12)",
          borderRadius: "999px",
          padding: "6px 14px",
        }}
      >
        {TEXT[lang]}
      </span>
    </div>
  );
}
