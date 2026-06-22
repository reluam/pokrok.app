"use client";
import { useState } from "react";
import type { Environment } from "@/lib/sim/environment";
import { initPopulation, step, SimState } from "@/lib/sim/population";
import { GameCanvas } from "./GameCanvas";

const DEFAULT_ENV: Environment = { foodAbundance: 0.6, predatorPressure: 0.6, temperature: 0.5, backgroundHue: 0.3 };
const sans = "ui-sans-serif, system-ui, sans-serif";

export default function Driftbloom() {
  const [seed] = useState(() => Math.floor(Math.random() * 1e9)); // UI seed (fine outside lib/sim)
  const [state, setState] = useState<SimState>(() => initPopulation(seed, 40, DEFAULT_ENV));

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text-primary)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 22px 70px", fontFamily: sans }}>
        <h1 style={{ fontSize: "clamp(30px,6vw,46px)", fontWeight: 900, letterSpacing: "-0.03em" }}>🌱 driftbloom</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: 560 }}>watch life adapt to where it is — not toward anywhere.</p>
        <div style={{ margin: "16px 0" }}><GameCanvas state={state} /></div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="sbtn" onClick={() => setState((s) => step(s, 0.3))}>step</button>
          <button className="sbtn" onClick={() => setState((s) => { let n = s; for (let i = 0; i < 10; i++) n = step(n, 0.3); return n; })}>run ×10</button>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>generation {state.generation}</span>
        </div>
      </div>
    </main>
  );
}
