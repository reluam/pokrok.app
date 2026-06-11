"use client";

type Lang = "cs" | "en";

export function LanguageSwitcher({ lang }: { lang: Lang }) {
  const setLang = (target: Lang) => {
    document.cookie = `lang=${target}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.location.reload();
  };

  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 50 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 1, padding: "4px 6px",
        background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: "8px",
      }}>
        {(["cs", "en"] as Lang[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            style={{
              fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 500,
              textTransform: "uppercase", letterSpacing: "0.08em",
              background: lang === l ? "var(--border)" : "transparent",
              color: lang === l ? "var(--bg)" : "var(--text-muted)",
              border: "none", borderRadius: "5px", padding: "4px 10px", cursor: "pointer",
            }}
            aria-label={l === "cs" ? "Čeština" : "English"}
          >
            {l === "cs" ? "CZ" : "EN"}
          </button>
        ))}
      </div>
    </div>
  );
}
