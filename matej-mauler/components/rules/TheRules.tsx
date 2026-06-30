"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { RULES, Scanlines, PixelButton, audio, type GameOutcome } from "./theme";
import { Reveal } from "./Reveal";
import { PromptRegistration } from "@/components/PromptRegistration";
import { track } from "@/lib/analytics/track";
import { RULES_GAME_KEYS } from "@/lib/rules/games";
import Chicken from "./games/Chicken";
import Maze from "./games/Maze";
import Tetris from "./games/Tetris";
import Flappy from "./games/Flappy";
import SpaceInvaders from "./games/SpaceInvaders";
import TicTacToe from "./games/TicTacToe";

// key → controller. Every game in lib/rules/games.ts registers its component here.
const GAMES: Record<string, ComponentType<{ onResolve: (o: GameOutcome) => void }>> = {
  chicken: Chicken,
  maze: Maze,
  tetris: Tetris,
  flappy: Flappy,
  invaders: SpaceInvaders,
  ttt: TicTacToe,
};

const ORDER = RULES_GAME_KEYS;
type Phase = "intro" | "reveal" | "ending" | string;
type Results = Record<string, GameOutcome>;

const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const numberWord = (n: number) => NUM[n] ?? String(n);

export default function TheRules() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState<string>(ORDER[0]);
  const [results, setResults] = useState<Results>({});
  const [muted, setMuted] = useState(audio.muted);
  const posted = useRef(false);

  // post one participation when the ending is reached
  useEffect(() => {
    if (phase !== "ending" || posted.current) return;
    posted.current = true;
    const insight: Record<string, unknown> = {
      foundCount: ORDER.filter((g) => results[g]?.foundHiddenPath).length,
    };
    for (const g of ORDER) insight[g] = results[g]?.foundHiddenPath ? "found" : "normal";
    track("experiment_completed", { slug: "rules", foundCount: insight.foundCount });
    fetch("/api/participation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ experimentSlug: "rules", insight, payload: {} }),
    }).catch(() => {});
  }, [phase, results]);

  function startGame(g: string) {
    track("experiment_step", { slug: "rules", game: g });
    setCurrent(g);
    setPhase(g);
  }

  function resolve(g: string, outcome: GameOutcome) {
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
    setCurrent(ORDER[0]);
    setPhase("intro");
  }

  const inGame = ORDER.includes(phase);
  const Game = inGame ? GAMES[phase] : null;

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
        padding: inGame ? 0 : 24,
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
            startGame(ORDER[0]);
          }}
        >
          <p style={{ fontSize: 13 }}>Every game has rules.</p>
          <p style={{ fontSize: 13 }}>Every rule was made up by someone.</p>
          <p style={{ fontSize: 13, color: RULES.green }}>This is a game about noticing that.</p>
          <p style={{ fontSize: 9, color: RULES.gray, marginTop: 18 }}>[ click to continue ]</p>
        </div>
      )}

      {Game && <Game onResolve={(o) => resolve(phase, o)} />}

      {phase === "reveal" && <Reveal game={current} found={!!results[current]?.foundHiddenPath} side={results[current]?.side} onContinue={afterReveal} />}

      {phase === "ending" && (
        <div style={{ display: "grid", gap: 24, maxWidth: 620, lineHeight: 1.9 }}>
          <p style={{ fontSize: 13 }}>You just played {numberWord(ORDER.length)} games.</p>
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
