"use client";
import { useEffect, useRef, useState } from "react";
import { initGame, tickEra, GameState } from "@/lib/game/game";
import { PlayerAction } from "@/lib/game/actions";
import { summarize, revealText, outcomeInsight } from "@/lib/game/outcome";
import { recordCampaignResult } from "@/lib/game/campaignProgress";
import { meanGenome } from "@/lib/sim/genome";
import { dominatedCount } from "@/lib/game/lineage";
import { PromptRegistration } from "@/components/PromptRegistration";
import { WorldMap } from "./WorldMap";
import { DesignPanel } from "./DesignPanel";
import { RivalsPanel } from "./RivalsPanel";
import { EventLog } from "./EventLog";
import { BlobView } from "./BlobView";

const sans = "ui-sans-serif, system-ui, sans-serif";
const newSeed = () => Math.floor(Math.random() * 1e9);
const muted = "var(--text-muted)";
const divider = "1px solid var(--text-muted, #e5e5e5)";

// Full-viewport dashboard (no page scroll): top bar, a left stats+controls column, and a large
// Plague-Inc-style world map on the right showing who controls what via coloured dots.
export function Campaign({ onHowToPlay }: { onHowToPlay: () => void }) {
  const [game, setGame] = useState<GameState>(() => initGame(newSeed()));
  const [queued, setQueued] = useState<PlayerAction[]>([]);
  const posted = useRef(false);

  const player = game.lineages.find((l) => l.kind === "player")!;
  const total = game.world.biomes.length;
  const playerDom = dominatedCount(game.world, game.lineages, player.id);
  const over = game.status !== "playing";

  useEffect(() => {
    if (!over || posted.current) return;
    posted.current = true;
    const o = summarize(game);
    recordCampaignResult({ won: o.won, playerBiomes: o.playerBiomes });
    fetch("/api/participation", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ experimentSlug: "driftbloom", insight: outcomeInsight(o), payload: { mode: "campaign" } }),
    }).catch(() => {});
  }, [over, game]);

  function advance() { setGame((g) => tickEra(g, queued)); setQueued([]); }
  function restart() { posted.current = false; setQueued([]); setGame(initGame(newSeed())); }

  return (
    <div style={{ fontFamily: sans, display: "flex", flexDirection: "column", height: "100%", minHeight: 0, position: "relative" }}>
      {/* top bar */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 14px", borderBottom: divider, flex: "0 0 auto" }}>
        <strong style={{ letterSpacing: "-0.02em" }}>🌱 driftbloom</strong>
        <span style={{ fontSize: 13, color: muted }}>era {game.era}/{game.maxEras} · you lead {playerDom}/{total} · AP {player.ap}</span>
        <span style={{ display: "flex", gap: 8 }}>
          <button className="sbtn" onClick={onHowToPlay} style={{ fontSize: 12 }}>how to play</button>
          <button className="sbtn" onClick={restart} style={{ fontSize: 12 }}>new game</button>
        </span>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* left — statistics + your controls */}
        <aside style={{ flex: "0 0 340px", borderRight: divider, overflowY: "auto", padding: 12, display: "grid", gap: 14, alignContent: "start" }}>
          <RivalsPanel game={game} />
          <div style={{ borderTop: divider, paddingTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <BlobView genome={meanGenome(player.sim.population)} size={72} />
            <div style={{ display: "grid", gap: 2 }}>
              <strong>you — intelligent design</strong>
              <span style={{ fontSize: 12, color: muted }}>lead {playerDom}/{total} biomes · AP {player.ap}</span>
              <button className="sbtn" onClick={advance} disabled={over} style={{ fontWeight: 700, justifySelf: "start", marginTop: 2 }}>
                advance era ▶{queued.length > 0 ? ` (${queued.length})` : ""}
              </button>
            </div>
          </div>
          <DesignPanel game={game} queued={queued} onQueue={(a) => setQueued((q) => [...q, a])} onClear={() => setQueued([])} />
        </aside>

        {/* right — the world map (the big view) */}
        <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 10, gap: 6, overflow: "hidden" }}>
          <div style={{ flex: 1, minHeight: 0 }}><WorldMap game={game} /></div>
          <div style={{ flex: "0 0 auto", borderTop: divider, paddingTop: 6 }}><EventLog log={game.log} /></div>
        </main>
      </div>

      {over && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", padding: 20 }}>
          <div style={{ background: "var(--bg,#fff)", color: "var(--text-primary,#111)", borderRadius: 16, padding: "22px", width: "min(460px, 94vw)", display: "grid", gap: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>{game.status === "won" ? "you won this world 🌱" : "you lost this world"}</h2>
            <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.5 }}>{revealText(summarize(game))}</p>
            <PromptRegistration trigger="on_result" headline="keep your runs — across every experiment." sub="no account needed; sign in to carry your badges across the series." />
            <button className="sbtn" onClick={restart} style={{ justifySelf: "start", fontWeight: 700 }}>play again</button>
          </div>
        </div>
      )}
    </div>
  );
}
