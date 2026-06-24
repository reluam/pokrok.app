"use client";
import { meanGenome } from "@/lib/sim/genome";
import type { GameState } from "@/lib/game/game";
import { dominatedCount } from "@/lib/game/lineage";
import { STRATEGY_LABELS } from "@/lib/game/strategies";
import { BlobView } from "./BlobView";

const sans = "ui-sans-serif, system-ui, sans-serif";

// The three rival lineages — each a different theory of evolution — shown as living creatures that
// morph on their own. (Left rail.)
export function RivalsPanel({ game }: { game: GameState }) {
  const rivals = game.lineages.filter((l) => l.kind === "npc");
  const total = game.world.biomes.length;
  return (
    <div style={{ fontFamily: sans, display: "grid", gap: 10 }}>
      <strong>rivals — shaped by their own rules</strong>
      {rivals.map((r) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, opacity: r.alive ? 1 : 0.4 }}>
          <BlobView genome={meanGenome(r.sim.population)} size={64} />
          <div style={{ display: "grid", gap: 2, fontSize: 13 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: r.color, display: "inline-block" }} />
              {STRATEGY_LABELS[r.strategy]}
            </span>
            <span style={{ color: "var(--text-muted)" }}>{r.alive ? `leads ${dominatedCount(game.world, game.lineages, r.id)}/${total} biomes` : "extinct"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
