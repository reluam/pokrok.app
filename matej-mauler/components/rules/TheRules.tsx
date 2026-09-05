"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import Link from "next/link";
import { RULES, Scanlines, PixelButton, audio, type GameOutcome } from "./theme";
import { Reveal } from "./Reveal";
import { PromptRegistration } from "@/components/PromptRegistration";
import { track } from "@/lib/analytics/track";
import { RULES_GAME_KEYS } from "@/lib/rules/games";
import type { Lang } from "@/lib/dictionaries";

// Čeština je psaná, ne přeložená — ty věty jsou suché rány, ne popisky.
const T = {
  cs: {
    l1: "Každá hra má svá pravidla.",
    l2: "Každé pravidlo někdo vymyslel.",
    l3: "Tahle hra je o tom si toho všimnout.",
    click: "[ klikni a pokračuj ]",
    played: (n: string) => `Právě jsi odehrál ${n} her.`,
    e2: "V každé z nich byla pravidla jen návrh.",
    e3: "Většina pravidel je.",
    restart: "znovu",
    keepHeadline: "nech si, čeho sis všiml — napříč všemi experimenty.",
    keepSub: "účet není potřeba; přihlášení ti přenese odznaky mezi experimenty.",
  },
  en: {
    l1: "Every game has rules.",
    l2: "Every rule was made up by someone.",
    l3: "This is a game about noticing that.",
    click: "[ click to continue ]",
    played: (n: string) => `You just played ${n} games.`,
    e2: "In each one, the rules were suggestions.",
    e3: "Most rules are.",
    restart: "restart",
    keepHeadline: "keep what you noticed — across every experiment.",
    keepSub: "no account needed; sign in to carry your badges across the series.",
  },
} as const;

const NUM_CS: Record<number, string> = { 1: "jednu", 2: "dvě", 3: "tři", 4: "čtyři", 5: "pět", 6: "šest", 7: "sedm", 8: "osm", 9: "devět" };
import Chicken from "./games/Chicken";
import Maze from "./games/Maze";
import Tetris from "./games/Tetris";
import Flappy from "./games/Flappy";
import SpaceInvaders from "./games/SpaceInvaders";
import TicTacToe from "./games/TicTacToe";
import SimonSays from "./games/SimonSays";
import Racing from "./games/Racing";
import Pacman from "./games/Pacman";

// key → controller. Every game in lib/rules/games.ts registers its component here.
const GAMES: Record<string, ComponentType<{ onResolve: (o: GameOutcome) => void }>> = {
  chicken: Chicken,
  maze: Maze,
  tetris: Tetris,
  flappy: Flappy,
  invaders: SpaceInvaders,
  ttt: TicTacToe,
  simon: SimonSays,
  racing: Racing,
  pacman: Pacman,
};

const ORDER = RULES_GAME_KEYS;
type Phase = "intro" | "reveal" | "ending" | string;
type Results = Record<string, GameOutcome>;

const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
export default function TheRules({ lang }: { lang: Lang }) {
  const t = T[lang];
  const numberWord = (n: number) => (lang === "cs" ? NUM_CS[n] ?? String(n) : NUM[n] ?? String(n));
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
      <Link
        href="/"
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 60,
          fontFamily: RULES.font,
          fontSize: 9,
          color: RULES.gray,
          textDecoration: "none",
          padding: 6,
        }}
      >
        {"← spaghetti"}
      </Link>

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
          <p style={{ fontSize: 13 }}>{t.l1}</p>
          <p style={{ fontSize: 13 }}>{t.l2}</p>
          <p style={{ fontSize: 13, color: RULES.green }}>{t.l3}</p>
          <p style={{ fontSize: 9, color: RULES.gray, marginTop: 18 }}>{t.click}</p>
        </div>
      )}

      {Game && <Game onResolve={(o) => resolve(phase, o)} />}

      {phase === "reveal" && <Reveal game={current} lang={lang} found={!!results[current]?.foundHiddenPath} side={results[current]?.side} onContinue={afterReveal} onRetry={() => startGame(current)} />}

      {phase === "ending" && (
        <div style={{ display: "grid", gap: 24, maxWidth: 620, lineHeight: 1.9 }}>
          <p style={{ fontSize: 13 }}>{t.played(numberWord(ORDER.length))}</p>
          <p style={{ fontSize: 13 }}>{t.e2}</p>
          <p style={{ fontSize: 13, color: RULES.green }}>{t.e3}</p>
          <div style={{ marginTop: 8 }}>
            <PromptRegistration
              trigger="on_result"
              headline={t.keepHeadline}
              sub={t.keepSub}
            />
          </div>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8 }}>
            <PixelButton onClick={restart}>{t.restart}</PixelButton>
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
