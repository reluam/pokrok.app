"use client";
import { meanGenome } from "@/lib/sim/genome";
import type { GameState } from "@/lib/game/game";
import { dominatedCount } from "@/lib/game/lineage";
import { STRATEGY_LABELS } from "@/lib/game/strategies";
import { BlobView } from "./BlobView";

const sans = "ui-sans-serif, system-ui, sans-serif";
const hexA = (hex: string, a: number) => {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// Left-column statistics: every lineage ranked by how much of the world it dominates, with how
// widely it's spread — so you can read at a glance which genome is winning where.
export function Standings({ game }: { game: GameState }) {
  const total = game.world.biomes.length;
  const dom = (id: string) => dominatedCount(game.world, game.lineages, id);
  const rows = [...game.lineages].sort((a, b) => dom(b.id) - dom(a.id));

  return (
    <div style={{ fontFamily: sans, display: "grid", gap: 8 }}>
      <strong>standings</strong>
      {rows.map((l) => {
        const isPlayer = l.kind === "player";
        const spread = Object.keys(l.presence).length;
        return (
          <div key={l.id} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "5px 7px", borderRadius: 10,
            opacity: l.alive ? 1 : 0.4, background: isPlayer ? hexA(l.color, 0.1) : "transparent",
            border: isPlayer ? `1px solid ${hexA(l.color, 0.4)}` : "1px solid transparent",
          }}>
            <BlobView genome={meanGenome(l.sim.population)} size={46} />
            <div style={{ display: "grid", gap: 1, fontSize: 13, minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, flex: "0 0 auto" }} />
                {isPlayer ? "you" : STRATEGY_LABELS[l.strategy]}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {l.alive ? `leads ${dom(l.id)}/${total} · in ${spread} biome${spread === 1 ? "" : "s"}` : "extinct"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
