"use client";
import { useEffect, useRef, useState } from "react";
import type { Environment } from "@/lib/sim/environment";
import { initPopulation, step, setEnv, SimState } from "@/lib/sim/population";
import { GameCanvas } from "./GameCanvas";
import { StatsPanel } from "./StatsPanel";
import { Controls } from "./Controls";
import { SCENARIOS, Scenario } from "@/lib/game/scenarios";
import { GeneFocus, DriftInsight, buildInsight, mirrorSentence } from "@/lib/game/insight";
import { PredictionGate } from "./PredictionGate";
import { SurvivalPath } from "@/lib/sim/fitness";
import { markScenarioComplete, loadProgress, type DriftProgress } from "@/lib/game/progress";
import { PromptRegistration } from "@/components/PromptRegistration";

const DEFAULT_ENV: Environment = { foodAbundance: 0.6, predatorPressure: 0.6, temperature: 0.5, backgroundHue: 0.3 };
const sans = "ui-sans-serif, system-ui, sans-serif";

// Run a Phase-A scenario start→twist→end deterministically and produce the insight.
function runScenario(scenario: Scenario, predicted: GeneFocus, seed: number, priorPaths: SurvivalPath[]): { finalState: SimState; insight: DriftInsight } {
  let s = initPopulation(seed, 40, scenario.startEnv);
  const END = 50;
  for (let gen = 1; gen <= END; gen++) {
    if (scenario.twist && gen === scenario.twist.atGen) s = setEnv(s, scenario.twist.env);
    s = step(s, 0.25);
  }
  return { finalState: s, insight: buildInsight({ scenarioId: scenario.id, predictedGeneFocus: predicted, finalState: s, priorPaths }) };
}

export default function Driftbloom() {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [env, setEnvState] = useState<Environment>(DEFAULT_ENV);
  const [mutationRate, setMutationRate] = useState(0.3);
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<SimState>(() => initPopulation(seed, 40, DEFAULT_ENV));
  const mutRef = useRef(mutationRate); mutRef.current = mutationRate;

  // run loop: advance ~4 generations/second while running.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setState((s) => step(s, mutRef.current)), 250);
    return () => clearInterval(id);
  }, [running]);

  function applyEnv(next: Environment) {
    setEnvState(next);
    setState((s) => setEnv(s, next)); // keep the population, change the pressures live
  }
  function reset() {
    const ns = Math.floor(Math.random() * 1e9);
    setSeed(ns); setRunning(false);
    setState(initPopulation(ns, 40, env));
  }

  const [mode, setMode] = useState<"sandbox" | "phaseA">("sandbox");
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [reveal, setReveal] = useState<DriftInsight | null>(null);
  const [pathsUsed, setPathsUsed] = useState<SurvivalPath[]>([]);
  const [progress, setProgress] = useState<DriftProgress>(() => loadProgress());

  function handlePredict(focus: GeneFocus) {
    const scenario = SCENARIOS[scenarioIdx];
    const ns = Math.floor(Math.random() * 1e9);
    const { finalState, insight } = runScenario(scenario, focus, ns, pathsUsed);
    setState(finalState);
    setReveal(insight);
    setPathsUsed(insight.survivalPathsUsed);
    setProgress(markScenarioComplete(scenario.id));
    fetch("/api/participation", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ experimentSlug: "driftbloom", insight, payload: { scenarioId: SCENARIOS[scenarioIdx].id } }),
    }).catch(() => {});
  }
  function nextScenario() {
    setReveal(null);
    setScenarioIdx((i) => Math.min(i + 1, SCENARIOS.length - 1));
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text-primary)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 22px 70px", fontFamily: sans }}>
        <h1 style={{ fontSize: "clamp(30px,6vw,46px)", fontWeight: 900, letterSpacing: "-0.03em" }}>🌱 driftbloom</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: 560 }}>watch life adapt to where it is — not toward anywhere. seed {seed}</p>
        <div style={{ display: "flex", gap: 8, margin: "8px 0 4px" }}>
          <button className="sbtn" onClick={() => setMode("phaseA")} disabled={mode === "phaseA"}>learn (phase a)</button>
          <button className="sbtn" onClick={() => setMode("sandbox")} disabled={mode === "sandbox"}>sandbox</button>
        </div>

        {mode === "phaseA" && (
          <div>
            {!reveal && <PredictionGate scenario={SCENARIOS[scenarioIdx]} onPredict={handlePredict} />}
            <div style={{ margin: "12px 0" }}><GameCanvas state={state} /></div>
            {reveal && (
              <div style={{ display: "grid", gap: 8, padding: "8px 0" }}>
                {SCENARIOS[scenarioIdx].twist && <p style={{ color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>{SCENARIOS[scenarioIdx].twist!.message}</p>}
                <p style={{ fontWeight: 700, margin: 0 }}>{mirrorSentence(reveal)}</p>
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>{SCENARIOS[scenarioIdx].revealInsight}</p>
                <div style={{ marginTop: 8 }}>
                  <PromptRegistration
                    trigger="on_result"
                    headline="keep what you learn here — across every experiment."
                    sub="no account needed; sign in to carry your badges across the series."
                  />
                </div>
                {scenarioIdx < SCENARIOS.length - 1
                  ? <button className="sbtn" onClick={nextScenario} style={{ justifySelf: "start" }}>next scenario →</button>
                  : <p style={{ fontWeight: 700, margin: 0 }}>that&apos;s the whole point: evolution has no goal. now go play (phase b).</p>}
              </div>
            )}
            <div style={{ marginTop: 12 }}><StatsPanel history={state.history} /></div>
          </div>
        )}

        {mode === "sandbox" && (
          <div>
            <div style={{ margin: "16px 0" }}><GameCanvas state={state} /></div>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>generation {state.generation}</span>
            <div style={{ marginTop: 12 }}>
              <Controls
                env={env} mutationRate={mutationRate} running={running}
                onEnvChange={applyEnv} onMutationRateChange={setMutationRate}
                onToggleRun={() => setRunning((r) => !r)}
                onStep={() => setState((s) => step(s, mutationRate))}
                onReset={reset}
              />
            </div>
            <div style={{ marginTop: 16 }}><StatsPanel history={state.history} /></div>
          </div>
        )}
      </div>
    </main>
  );
}
