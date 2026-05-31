"use client";

import { Lang } from "@/lib/dictionaries";

export function LanguageSwitcher({
  lang,
  labels,
}: {
  lang: Lang;
  labels: { cs: string; en: string };
}) {
  const setLang = (target: Lang) => {
    document.cookie = `lang=${target}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.location.href = target === "cs" ? "/cs" : "/";
  };

  return (
    <div className="fixed top-5 right-5 md:top-6 md:right-8 z-50">
      <div
        className="flex items-center gap-px px-1.5 py-1 rounded"
        style={{
          background: "var(--bg)",
          border: "1.5px solid var(--border)",
          borderRadius: "8px",
        }}
      >
        {(["cs", "en"] as Lang[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className="rounded px-2.5 py-1 transition-colors"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background: lang === l ? "var(--border)" : "transparent",
              color: lang === l ? "var(--bg)" : "var(--text-muted)",
            }}
            aria-label={l === "cs" ? "Čeština" : "English"}
          >
            {labels[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
