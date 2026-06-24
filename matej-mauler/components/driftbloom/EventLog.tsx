"use client";

const sans = "ui-sans-serif, system-ui, sans-serif";

// The era ticker — recent events, newest last.
export function EventLog({ log }: { log: string[] }) {
  const recent = log.slice(-6);
  return (
    <div style={{ fontFamily: sans, fontSize: 12, color: "var(--text-muted)", display: "grid", gap: 2 }}>
      {recent.length === 0 && <span>a fresh world. push some genes, then advance the era.</span>}
      {recent.map((line, i) => <span key={i}>{line}</span>)}
    </div>
  );
}
