"use client";
import { meanGenome } from "@/lib/sim/genome";
import type { GameState } from "@/lib/game/game";
import { dominatedCount, maturity } from "@/lib/game/lineage";
import { STRATEGY_LABELS } from "@/lib/game/strategies";
import { BlobView } from "./BlobView";
import { FONT_DISPLAY, FONT_SANS, C, panel, hexA } from "./theme";

// Left-column statistics: every lineage ranked by how much of the world it dominates, with a bar
// for its grip on the world and how widely it's spread.
export function Standings({ game }: { game: GameState }) {
  const total = game.world.biomes.length;
  const dom = (id: string) => dominatedCount(game.world, game.lineages, id);
  const rows = [...game.lineages].sort((a, b) => dom(b.id) - dom(a.id));

  return (
    <div style={{ fontFamily: FONT_SANS, display: "grid", gap: 10 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", margin: "2px 0 2px" }}>standings</h2>
      {rows.map((l) => {
        const isPlayer = l.kind === "player";
        const spread = Object.keys(l.presence).length;
        const grip = dom(l.id) / total;
        return (
          <div key={l.id} className="db-card" style={{
            ...panel, display: "flex", alignItems: "center", gap: 11, padding: "9px 11px",
            opacity: l.alive ? 1 : 0.5,
            background: isPlayer ? hexA(l.color, 0.08) : "#fff",
            borderColor: isPlayer ? hexA(l.color, 0.45) : C.line,
          }}>
            <div style={{ flex: "0 0 auto", background: hexA(l.color, 0.1), borderRadius: 12 }}>
              <BlobView genome={meanGenome(l.sim.population)} size={46} stage={maturity(l)} />
            </div>
            <div style={{ display: "grid", gap: 4, minWidth: 0, flex: 1 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 14, fontFamily: FONT_DISPLAY, letterSpacing: "-0.01em" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, flex: "0 0 auto" }} />
                {isPlayer ? "you" : STRATEGY_LABELS[l.strategy]}
              </span>
              {/* grip-on-the-world bar */}
              <span style={{ height: 6, borderRadius: 6, background: "rgba(26,22,20,0.07)", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${Math.round(grip * 100)}%`, background: l.color, borderRadius: 6, transition: "width .5s cubic-bezier(.2,.7,.2,1)" }} />
              </span>
              <span style={{ fontSize: 11, color: C.muted }}>
                {l.alive ? `leads ${dom(l.id)}/${total} · in ${spread} biome${spread === 1 ? "" : "s"}` : "extinct"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
