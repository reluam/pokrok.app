"use client";

import { useEffect, useRef, useState } from "react";
import { RULES, Scanlines, PixelButton, audio, type GameOutcome } from "./theme";
import { Reveal } from "./Reveal";
import { PromptRegistration } from "@/components/PromptRegistration";
import { track } from "@/lib/analytics/track";
import Chicken from "./games/Chicken";
import Maze from "./games/Maze";
import Tetris from "./games/Tetris";

type GameKey = "chicken" | "maze" | "tetris";
type Phase = "intro" | GameKey | "reveal" | "ending";
type Results = Partial<Record<GameKey, GameOutcome>>;

const ORDER: GameKey[] = ["chicken", "maze", "tetris"];

export default function TheRules() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState<GameKey>("chicken");
  const [results, setResults] = useState<Results>({});
  const [muted, setMuted] = useState(audio.muted);
  const posted = useRef(false);

  // post one participation when the ending is reached
  useEffect(() => {
    if (phase !== "ending" || posted.current) return;
    posted.current = true;
    const insight = {
      chicken: results.chicken?.foundHiddenPath ? "found" : "normal",
      maze: results.maze?.foundHiddenPath ? "found" : "normal",
      tetris: results.tetris?.foundHiddenPath ? "found" : "normal",
      foundCount: ORDER.filter((g) => results[g]?.foundHiddenPath).length,
    };
    track("experiment_completed", { slug: "rules", foundCount: insight.foundCount });
    fetch("/api/participation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ experimentSlug: "rules", insight, payload: {} }),
    }).catch(() => {});
  }, [phase, results]);

  function startGame(g: GameKey) {
    track("experiment_step", { slug: "rules", game: g });
    setCurrent(g);
    setPhase(g);
  }

  function resolve(g: GameKey, outcome: GameOutcome) {
    setResults((r) => ({ ...r, [g]: outcome }));
    setPhase("reveal");
  }

  function afterReveal() {
    const idx = ORDER.indexOf(current);
    if (idx < ORDER.length - 1) startGame(ORDER[idx + 1]);
    else setPhase("ending");
  }

  function restart() {
    posted.current = false;
    setResults({});
    setPhase("intro");
  }

  const fullscreenGame = phase === "chicken" || phase === "maze" || phase === "tetris";

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: RULES.bg,
        color: RULES.white,
        fontFamily: RULES.font,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: fullscreenGame ? 0 : 24,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setMuted(audio.toggle())}
        aria-label={muted ? "unmute" : "mute"}
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          zIndex: 60,
          fontFamily: RULES.font,
          fontSize: 16,
          background: "transparent",
          border: "none",
          color: RULES.gray,
          cursor: "pointer",
          padding: 6,
        }}
      >
        {muted ? "\u{1F507}" : "\u{1F50A}"}
      </button>

      {phase === "intro" && (
        <div
          style={{ display: "grid", gap: 28, maxWidth: 620, cursor: "pointer", lineHeight: 1.9 }}
          onClick={() => {
            track("experiment_started", { slug: "rules" });
            startGame("chicken");
          }}
        >
          <p style={{ fontSize: 13 }}>Every game has rules.</p>
          <p style={{ fontSize: 13 }}>Every rule was made up by someone.</p>
          <p style={{ fontSize: 13, color: RULES.green }}>This is a game about noticing that.</p>
          <p style={{ fontSize: 9, color: RULES.gray, marginTop: 18 }}>[ click to continue ]</p>
        </div>
      )}

      {phase === "chicken" && <Chicken onResolve={(o) => resolve("chicken", o)} />}
      {phase === "maze" && <Maze onResolve={(o) => resolve("maze", o)} />}
      {phase === "tetris" && <Tetris onResolve={(o) => resolve("tetris", o)} />}

      {phase === "reveal" && <Reveal game={current} found={!!results[current]?.foundHiddenPath} onContinue={afterReveal} />}

      {phase === "ending" && (
        <div style={{ display: "grid", gap: 24, maxWidth: 620, lineHeight: 1.9 }}>
          <p style={{ fontSize: 13 }}>You just played three games.</p>
          <p style={{ fontSize: 13 }}>In each one, the rules were suggestions.</p>
          <p style={{ fontSize: 13, color: RULES.green }}>Most rules are.</p>
          <div style={{ marginTop: 8 }}>
            <PromptRegistration
              trigger="on_result"
              headline="keep what you noticed — across every experiment."
              sub="no account needed; sign in to carry your badges across the series."
            />
          </div>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8 }}>
            <PixelButton onClick={restart}>restart</PixelButton>
            <PixelButton
              color={RULES.yellow}
              onClick={() => {
                const url = typeof window !== "undefined" ? window.location.href : "https://spaghetti.ltd/rules";
                if (navigator.share) navigator.share({ url, title: "the rules" }).catch(() => {});
                else navigator.clipboard?.writeText(url).catch(() => {});
              }}
            >
              share
            </PixelButton>
          </div>
        </div>
      )}

      <Scanlines />
    </div>
  );
}
