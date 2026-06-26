import type { CSSProperties } from "react";

// Shared visual language for Driftbloom — light, organic, playful (on-brand with Spaghetti).
export const FONT_DISPLAY = "var(--font-display), ui-sans-serif, system-ui, sans-serif";
export const FONT_SANS = "var(--font-sans), ui-sans-serif, system-ui, sans-serif";

export const C = {
  bg: "var(--bg)",
  text: "var(--text-primary)",
  text2: "var(--text-secondary)",
  muted: "var(--text-muted)",
  line: "rgba(26,22,20,0.10)",
  card: "#fff",
  warm: "#16a34a", // friendly accent (sprout green)
};

export const panel: CSSProperties = {
  background: "#fff",
  border: `1px solid ${C.line}`,
  borderRadius: 18,
  boxShadow: "0 1px 2px rgba(26,22,20,0.04), 0 6px 16px rgba(26,22,20,0.05)",
};

export const chip: CSSProperties = {
  fontFamily: FONT_SANS,
  fontSize: 12,
  fontWeight: 600,
  color: C.text2,
  background: "rgba(26,22,20,0.05)",
  borderRadius: 999,
  padding: "4px 11px",
};

export function hexA(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
