"use client";
import type { GameState } from "@/lib/game/game";

// The world as a ring of biome nodes with adjacency edges; each node is tinted by its current
// holder's colour (grey = unclaimed). The player's biomes get a bold outline.
export function WorldMap({ game }: { game: GameState }) {
  const W = 360, H = 300, cx = W / 2, cy = H / 2, R = 110;
  const n = game.world.biomes.length;
  const pos = game.world.biomes.map((_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  });
  const idIndex = new Map(game.world.biomes.map((b, i) => [b.id, i]));
  const holderOf = (biomeId: string) => game.lineages.find((l) => l.held.includes(biomeId));
  const player = game.lineages.find((l) => l.kind === "player")!;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block" }}>
      {/* edges */}
      {game.world.biomes.map((b, i) =>
        b.neighbors.map((nid) => {
          const j = idIndex.get(nid)!;
          if (j <= i) return null; // draw each undirected edge once
          return <line key={`${b.id}-${nid}`} x1={pos[i].x} y1={pos[i].y} x2={pos[j].x} y2={pos[j].y} stroke="var(--text-muted, #bbb)" strokeWidth={1} opacity={0.5} />;
        }),
      )}
      {/* nodes */}
      {game.world.biomes.map((b, i) => {
        const holder = holderOf(b.id);
        const isPlayer = player.held.includes(b.id);
        return (
          <g key={b.id}>
            <circle cx={pos[i].x} cy={pos[i].y} r={24} fill={holder ? holder.color : "#d4d4d8"}
              stroke={isPlayer ? "#111" : "#fff"} strokeWidth={isPlayer ? 3 : 1.5} />
            <text x={pos[i].x} y={pos[i].y + 40} textAnchor="middle" fontSize={9} fill="var(--text-secondary, #555)">{b.name}</text>
          </g>
        );
      })}
    </svg>
  );
}
