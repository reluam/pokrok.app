"use client";
import type { Environment } from "@/lib/sim/environment";

const sans = "ui-sans-serif, system-ui, sans-serif";
const FIELDS: { key: keyof Environment; label: string }[] = [
  { key: "foodAbundance", label: "food" },
  { key: "predatorPressure", label: "predators" },
  { key: "temperature", label: "temperature" },
  { key: "backgroundHue", label: "background hue" },
];

export function Controls(props: {
  env: Environment; mutationRate: number; running: boolean;
  onEnvChange: (env: Environment) => void;
  onMutationRateChange: (r: number) => void;
  onToggleRun: () => void; onStep: () => void; onReset: () => void;
}) {
  const { env, mutationRate, running } = props;
  return (
    <div style={{ fontFamily: sans, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="sbtn" onClick={props.onToggleRun}>{running ? "pause" : "run"}</button>
        <button className="sbtn" onClick={props.onStep} disabled={running}>step</button>
        <button className="sbtn" onClick={props.onReset}>reset</button>
      </div>
      {FIELDS.map((f) => (
        <label key={f.key} style={{ display: "grid", gridTemplateColumns: "120px 1fr 38px", gap: 8, alignItems: "center", fontSize: 13 }}>
          <span style={{ color: "var(--text-muted)" }}>{f.label}</span>
          <input type="range" min={0} max={1} step={0.01} value={env[f.key]}
            onChange={(e) => props.onEnvChange({ ...env, [f.key]: Number(e.target.value) })} />
          <span style={{ color: "var(--text-muted)" }}>{env[f.key].toFixed(2)}</span>
        </label>
      ))}
      <label style={{ display: "grid", gridTemplateColumns: "120px 1fr 38px", gap: 8, alignItems: "center", fontSize: 13 }}>
        <span style={{ color: "var(--text-muted)" }}>mutation rate</span>
        <input type="range" min={0} max={1} step={0.01} value={mutationRate}
          onChange={(e) => props.onMutationRateChange(Number(e.target.value))} />
        <span style={{ color: "var(--text-muted)" }}>{mutationRate.toFixed(2)}</span>
      </label>
    </div>
  );
}
