"use client";
import { useEffect, useRef, useState } from "react";
import { initGame, tickEra, GameState } from "@/lib/game/game";
import { PlayerAction } from "@/lib/game/actions";
import { summarize, revealText, outcomeInsight } from "@/lib/game/outcome";
import { recordCampaignResult } from "@/lib/game/campaignProgress";
import { dominatedCount } from "@/lib/game/lineage";
import { PromptRegistration } from "@/components/PromptRegistration";
import { WorldMap } from "./WorldMap";
import { DesignPanel } from "./DesignPanel";
import { Standings } from "./Standings";
import { EventLog } from "./EventLog";
import { FONT_DISPLAY, FONT_SANS, C, chip } from "./theme";

const newSeed = () => Math.floor(Math.random() * 1e9);
const divider = `1px solid ${C.line}`;

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
    <div style={{ fontFamily: FONT_SANS, display: "flex", flexDirection: "column", height: "100%", minHeight: 0, position: "relative", background: C.bg }}>
      {/* top bar */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 16px", borderBottom: divider, flex: "0 0 auto" }}>
        <strong style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 19, letterSpacing: "-0.03em" }}>🌱 driftbloom</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={chip}>era {game.era}/{game.maxEras}</span>
          <span style={chip}>you lead {playerDom}/{total}</span>
          <span style={{ ...chip, background: "rgba(22,163,74,0.12)", color: "#15803d" }}>AP {player.ap}</span>
        </div>
        <span style={{ display: "flex", gap: 8 }}>
          <button className="sbtn" onClick={onHowToPlay} style={{ fontSize: 12 }}>how to play</button>
          <button className="sbtn" onClick={restart} style={{ fontSize: 12 }}>new game</button>
        </span>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* left — statistics */}
        <aside style={{ flex: "0 0 290px", borderRight: divider, overflowY: "auto", padding: 14 }}>
          <Standings game={game} />
        </aside>

        {/* right — map + controls */}
        <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, minHeight: 0, padding: 12 }}><WorldMap game={game} /></div>
          <div style={{ flex: "0 0 auto", borderTop: divider, padding: "12px 16px", display: "grid", gap: 9, background: "#fff" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <button className="db-advance" onClick={advance} disabled={over} style={{
                flex: "0 0 auto", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, color: "#fff",
                background: over ? "#9b958f" : "#16a34a", border: "none", borderRadius: 999, padding: "11px 20px",
                cursor: over ? "default" : "pointer", letterSpacing: "-0.01em",
              }}>
                advance era ▶{queued.length > 0 ? `  (${queued.length})` : ""}
              </button>
              <div style={{ flex: 1, minWidth: 240 }}>
                <DesignPanel game={game} queued={queued} onQueue={(a) => setQueued((q) => [...q, a])} onClear={() => setQueued([])} />
              </div>
            </div>
            <EventLog log={game.log} />
          </div>
        </main>
      </div>

      {over && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(26,22,20,0.45)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 }}>
          <div className="db-pop" style={{
            background: "#fff", color: C.text, borderRadius: 22, padding: "26px 24px", width: "min(470px, 94vw)",
            display: "grid", gap: 12, boxShadow: "0 24px 70px rgba(26,22,20,0.4)", border: `1px solid ${C.line}`,
          }}>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, letterSpacing: "-0.02em", margin: 0, fontSize: 26 }}>
              {game.status === "won" ? "you won this world 🌱" : "you lost this world"}
            </h2>
            <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.55, color: C.text2 }}>{revealText(summarize(game))}</p>
            <PromptRegistration trigger="on_result" headline="keep your runs — across every experiment." sub="no account needed; sign in to carry your badges across the series." />
            <button className="db-advance" onClick={restart} style={{ justifySelf: "start", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, color: "#fff", background: "#16a34a", border: "none", borderRadius: 999, padding: "10px 20px", cursor: "pointer" }}>play again</button>
          </div>
        </div>
      )}
    </div>
  );
}
