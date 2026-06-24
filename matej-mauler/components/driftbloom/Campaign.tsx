"use client";
import { useEffect, useRef, useState } from "react";
import { initGame, tickEra, GameState } from "@/lib/game/game";
import { PlayerAction } from "@/lib/game/actions";
import { summarize, revealText, outcomeInsight } from "@/lib/game/outcome";
import { recordCampaignResult } from "@/lib/game/campaignProgress";
import { PromptRegistration } from "@/components/PromptRegistration";
import { WorldMap } from "./WorldMap";
import { DesignPanel } from "./DesignPanel";
import { RivalsPanel } from "./RivalsPanel";
import { EventLog } from "./EventLog";

const sans = "ui-sans-serif, system-ui, sans-serif";
const newSeed = () => Math.floor(Math.random() * 1e9);

export function Campaign() {
  const [game, setGame] = useState<GameState>(() => initGame(newSeed()));
  const [queued, setQueued] = useState<PlayerAction[]>([]);
  const posted = useRef(false);

  const player = game.lineages.find((l) => l.kind === "player")!;
  const over = game.status !== "playing";

  // record one participation when a campaign ends (anonymous-first; never gates the core).
  useEffect(() => {
    if (!over || posted.current) return;
    posted.current = true;
    const o = summarize(game);
    recordCampaignResult({ won: o.won, playerBiomes: o.playerBiomes }); // local stats
    fetch("/api/participation", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ experimentSlug: "driftbloom", insight: outcomeInsight(o), payload: { mode: "campaign" } }),
    }).catch(() => {});
  }, [over, game]);

  function advance() { setGame((g) => tickEra(g, queued)); setQueued([]); }
  function restart() { posted.current = false; setQueued([]); setGame(initGame(newSeed())); }

  return (
    <div style={{ fontFamily: sans, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>era {game.era} / {game.maxEras}</span>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>you hold {player.held.length}/{game.world.biomes.length} biomes</span>
      </div>

      <WorldMap game={game} />

      {!over && (
        <>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr", maxWidth: 620 }}>
            <DesignPanel game={game} queued={queued} onQueue={(a) => setQueued((q) => [...q, a])} onClear={() => setQueued([])} />
            <RivalsPanel game={game} />
          </div>
          <button className="sbtn" onClick={advance} style={{ justifySelf: "start", fontWeight: 700 }}>
            advance era ▶ {queued.length > 0 && `(${queued.length} change${queued.length > 1 ? "s" : ""})`}
          </button>
        </>
      )}

      <EventLog log={game.log} />

      {over && (
        <div style={{ display: "grid", gap: 10, padding: "14px 0", borderTop: "1px solid var(--text-muted,#ddd)" }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>{game.status === "won" ? "you won this world 🌱" : "you lost this world"}</h2>
          <p style={{ margin: 0, fontWeight: 600 }}>{revealText(summarize(game))}</p>
          <div><PromptRegistration trigger="on_result" headline="keep your runs — across every experiment." sub="no account needed; sign in to carry your badges across the series." /></div>
          <button className="sbtn" onClick={restart} style={{ justifySelf: "start", fontWeight: 700 }}>play again</button>
        </div>
      )}
    </div>
  );
}
