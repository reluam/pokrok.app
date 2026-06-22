"use client";
import { useEffect, useState } from "react";
import { initChallenge, tickChallenge, ChallengeState } from "@/lib/game/challenge";
import { GameCanvas } from "./GameCanvas";
import { StatsPanel } from "./StatsPanel";
import { ShareBar } from "./ShareBar";

const sans = "ui-sans-serif, system-ui, sans-serif";

export function PhaseBRunner({ seed, onGameOver }: { seed: number; onGameOver: (generations: number) => void }) {
  const [c, setC] = useState<ChallengeState>(() => initChallenge(seed));
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running || !c.alive) return;
    const id = setInterval(() => setC((cur) => tickChallenge(cur, 0.3)), 220);
    return () => clearInterval(id);
  }, [running, c.alive]);

  useEffect(() => { if (!c.alive) onGameOver(c.sim.generation); }, [c.alive]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ fontFamily: sans, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <strong>survived: {c.sim.generation} generations</strong>
        {!c.alive && <span style={{ color: "#ef4444" }}>the world outran them. game over.</span>}
      </div>
      <GameCanvas state={c.sim} />
      <div style={{ display: "flex", gap: 8 }}>
        {c.alive
          ? <button className="sbtn" onClick={() => setRunning((r) => !r)}>{running ? "pause" : "resume"}</button>
          : <button className="sbtn" onClick={() => { setC(initChallenge(Math.floor(Math.random() * 1e9))); setRunning(true); }}>try again</button>}
        <ShareBar state={c.sim} />
      </div>
      <StatsPanel history={c.sim.history} />
    </div>
  );
}
