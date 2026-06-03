"use client";

import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/journey/i18n";

export function LangToggle({ lang, right = "112px" }: { lang: Lang; right?: string }) {
  const router = useRouter();

  const setLang = (next: Lang) => {
    if (next === lang) return;
    // 1 year cookie; middleware reads it to override the domain default
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  const Item = ({ code }: { code: Lang }) => (
    <button
      onClick={() => setLang(code)}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 500,
        letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 2px",
        color: lang === code ? "var(--accent)" : "var(--text-muted)",
        opacity: lang === code ? 1 : 0.6,
        transition: "color 200ms ease, opacity 200ms ease",
      }}
    >
      {code}
    </button>
  );

  return (
    <div style={{
      position: "fixed", top: "18px", right, zIndex: 30,
      display: "flex", alignItems: "center", gap: "4px",
    }}>
      <Item code="en" />
      <span style={{ color: "var(--text-muted)", opacity: 0.4, fontSize: "11px" }}>/</span>
      <Item code="cs" />
    </div>
  );
}
