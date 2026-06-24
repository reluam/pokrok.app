"use client";
import type { GameState } from "@/lib/game/game";
import { STRATEGY_LABELS } from "@/lib/game/strategies";

const sans = "ui-sans-serif, system-ui, sans-serif";

// The three rival lineages, each a different theory of evolution, with how much world they hold.
export function RivalsPanel({ game }: { game: GameState }) {
  const rivals = game.lineages.filter((l) => l.kind === "npc");
  const total = game.world.biomes.length;
  return (
    <div style={{ fontFamily: sans, display: "grid", gap: 6 }}>
      <strong>rivals (shaped by environment)</strong>
      {rivals.map((r) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: r.alive ? 1 : 0.45 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: r.color, flex: "0 0 auto" }} />
          <span style={{ flex: 1 }}>{STRATEGY_LABELS[r.strategy]}</span>
          <span style={{ color: "var(--text-muted)" }}>{r.alive ? `${r.held.length}/${total}` : "extinct"}</span>
        </div>
      ))}
    </div>
  );
}
