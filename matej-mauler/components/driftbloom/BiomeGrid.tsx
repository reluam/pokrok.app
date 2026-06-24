"use client";
import type { GameState } from "@/lib/game/game";
import { dominantOnBiome } from "@/lib/game/lineage";

const sans = "ui-sans-serif, system-ui, sans-serif";

// The world as a row of biome sections (Plague-Inc-style regions). Each tile is tinted by whoever
// currently dominates it; this is the contested ground the lineages spread across.
export function BiomeGrid({ game }: { game: GameState }) {
  const holderOf = (id: string) => dominantOnBiome(game.lineages, id);
  return (
    <div style={{ fontFamily: sans, display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(116px, 1fr))" }}>
      {game.world.biomes.map((b) => {
        const h = holderOf(b.id);
        const mine = h?.kind === "player";
        const home = b.id === game.homeBiome;
        return (
          <div key={b.id} style={{
            border: `2px solid ${h ? h.color : "var(--text-muted, #ccc)"}`,
            background: h ? `${h.color}1f` : "var(--card, #f4f4f5)",
            borderRadius: 10, padding: "7px 9px", display: "grid", gap: 2, minWidth: 0,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}{home ? " ★" : ""}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{h ? (mine ? "you lead" : "rival leads") : "unclaimed"}</span>
          </div>
        );
      })}
    </div>
  );
}
