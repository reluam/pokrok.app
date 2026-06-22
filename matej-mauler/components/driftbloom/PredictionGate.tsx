"use client";
import type { Scenario } from "@/lib/game/scenarios";
import type { GeneFocus } from "@/lib/game/insight";

const sans = "ui-sans-serif, system-ui, sans-serif";
const CHOICES: { focus: GeneFocus; label: string }[] = [
  { focus: "toughness", label: "tougher armor" },
  { focus: "camouflage", label: "blends in" },
  { focus: "speed", label: "faster" },
  { focus: "size", label: "bigger" },
  { focus: "metabolism", label: "burns hotter" },
];

export function PredictionGate({ scenario, onPredict }: { scenario: Scenario; onPredict: (f: GeneFocus) => void }) {
  return (
    <div style={{ fontFamily: sans, display: "grid", gap: 12, padding: "16px 0" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{scenario.title}</h2>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>{scenario.intro}</p>
      <p style={{ fontWeight: 600, margin: "4px 0 0" }}>{scenario.predictionPrompt}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CHOICES.map((c) => (
          <button key={c.focus} className="sbtn" onClick={() => onPredict(c.focus)}>{c.label}</button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>pick what you think wins, then watch.</p>
    </div>
  );
}
