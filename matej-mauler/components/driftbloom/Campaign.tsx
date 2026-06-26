"use client";
import { useEffect, useRef, useState, CSSProperties } from "react";
import { initGame, tickEra, GameState } from "@/lib/game/game";
import { PlayerAction } from "@/lib/game/actions";
import { summarize, revealText, outcomeInsight } from "@/lib/game/outcome";
import { recordCampaignResult } from "@/lib/game/campaignProgress";
import { dominatedCount } from "@/lib/game/lineage";
import { meanGenome } from "@/lib/sim/genome";
import { PromptRegistration } from "@/components/PromptRegistration";
import { WorldMap } from "./WorldMap";
import { DesignPanel } from "./DesignPanel";
import { Standings } from "./Standings";
import { BlobView } from "./BlobView";
import { FONT_DISPLAY, FONT_SANS, C, chip, hexA } from "./theme";

const newSeed = () => Math.floor(Math.random() * 1e9);

const glass: CSSProperties = {
  background: "rgba(255,255,255,0.86)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: `1px solid ${C.line}`,
  borderRadius: 18,
  boxShadow: "0 8px 30px rgba(26,22,20,0.10)",
};

export function Campaign({ onHowToPlay }: { onHowToPlay: () => void }) {
  const [game, setGame] = useState<GameState>(() => initGame(newSeed()));
  const [queued, setQueued] = useState<PlayerAction[]>([]);
  const posted = useRef(false);

  const player = game.lineages.find((l) => l.kind === "player")!;
  const total = game.world.biomes.length;
  const playerDom = dominatedCount(game.world, game.lineages, player.id);
  const over = game.status !== "playing";
  const lastLog = game.log[game.log.length - 1];

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
    <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden", fontFamily: FONT_SANS, background: C.bg }}>
      {/* map = full-bleed stage */}
      <div style={{ position: "absolute", inset: 0 }}><WorldMap game={game} /></div>

      {/* top HUD */}
      <header style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", gap: 10, zIndex: 10, pointerEvents: "none" }}>
        <strong style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 19, letterSpacing: "-0.03em", pointerEvents: "auto" }}>🌱 driftbloom</strong>
        <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
          <span style={chip}>era {game.era}/{game.maxEras}</span>
          <span style={chip}>you lead {playerDom}/{total}</span>
          <span style={{ ...chip, background: "rgba(22,163,74,0.14)", color: "#15803d" }}>AP {player.ap}</span>
        </div>
        <span style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
          <button className="sbtn" onClick={onHowToPlay} style={{ fontSize: 12 }}>how to play</button>
          <button className="sbtn" onClick={restart} style={{ fontSize: 12 }}>new game</button>
        </span>
      </header>

      {/* latest-event toast */}
      {lastLog && (
        <div style={{ position: "absolute", top: 52, left: "50%", transform: "translateX(-50%)", zIndex: 9, ...glass, borderRadius: 999, padding: "5px 15px", fontSize: 12, color: C.text2, maxWidth: "60%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {lastLog}
        </div>
      )}

      {/* standings — floating top-left */}
      <aside style={{ position: "absolute", top: 60, left: 16, width: 250, maxHeight: "calc(100% - 250px)", overflowY: "auto", zIndex: 8, ...glass, padding: 12 }}>
        <Standings game={game} />
      </aside>

      {/* command bar — floating bottom HUD */}
      <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", width: "min(1200px, calc(100% - 28px))", zIndex: 9, ...glass, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "grid", justifyItems: "center", gap: 2, flex: "0 0 auto" }}>
            <div style={{ background: hexA(player.color, 0.1), borderRadius: 14 }}><BlobView genome={meanGenome(player.sim.population)} size={64} /></div>
            <strong style={{ fontFamily: FONT_DISPLAY, fontSize: 13 }}>you</strong>
            <span style={{ fontSize: 11, color: C.muted }}>lead {playerDom}/{total}</span>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <DesignPanel game={game} queued={queued} onQueue={(a) => setQueued((q) => [...q, a])} onClear={() => setQueued([])} />
          </div>
          <button className={`db-advance${queued.length > 0 && !over ? " db-cta" : ""}`} onClick={advance} disabled={over} style={{
            flex: "0 0 auto", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, color: "#fff",
            background: over ? "#9b958f" : "#16a34a", border: "none", borderRadius: 14, padding: "14px 24px",
            cursor: over ? "default" : "pointer", letterSpacing: "-0.01em",
          }}>
            advance era <span className="arr">▶</span>{queued.length > 0 ? `  (${queued.length})` : ""}
          </button>
        </div>
      </div>

      {over && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(26,22,20,0.45)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20, zIndex: 20 }}>
          <div className="db-pop" style={{ background: "#fff", color: C.text, borderRadius: 22, padding: "26px 24px", width: "min(470px, 94vw)", display: "grid", gap: 12, boxShadow: "0 24px 70px rgba(26,22,20,0.4)", border: `1px solid ${C.line}` }}>
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
