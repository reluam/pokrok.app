"use client";

import { Theme } from "@/lib/theme";

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isHHGTTG = theme === "hhgttg";

  return (
    <button
      onClick={onToggle}
      title={isHHGTTG ? "Switch to cosmic" : "Don't Panic — switch to The Guide"}
      style={{
        position:    "fixed",
        top:         "18px",
        right:       "24px",
        zIndex:       30,
        fontFamily:  "var(--font-sans)",
        fontSize:    "11px",
        fontWeight:  500,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color:       isHHGTTG ? "var(--accent)" : "var(--text-muted)",
        background:  "none",
        border:      "1px solid",
        borderColor: isHHGTTG ? "var(--accent)" : "var(--text-muted)",
        borderRadius: "3px",
        padding:     "4px 9px",
        cursor:      "pointer",
        opacity:      0.55,
        transition:  "opacity 250ms ease, color 250ms ease, border-color 250ms ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.55"; }}
    >
      {isHHGTTG ? "☀ journey" : "42"}
    </button>
  );
}
