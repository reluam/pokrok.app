"use client";
import { meanGenome } from "@/lib/sim/genome";
import type { GameState } from "@/lib/game/game";
import { rangeEnv } from "@/lib/game/game";
import { PlayerAction, PUSH_COST } from "@/lib/game/actions";
import { traitDemands, coachingHints } from "@/lib/game/hints";
import { GeneDial } from "./GeneDial";
import { FONT_DISPLAY, FONT_SANS, C } from "./theme";

export const PUSH_STEP = 0.12;

// Horizontal control bar: coaching + AP on the left, the circular gene dials in a row.
export function DesignPanel({ game, queued, onQueue, onClear }: {
  game: GameState;
  queued: PlayerAction[];
  onQueue: (a: PlayerAction) => void;
  onClear: () => void;
}) {
  const player = game.lineages.find((l) => l.kind === "player")!;
  const spent = queued.reduce((s, a) => s + (a.type === "pushTrait" ? PUSH_COST : 0), 0);
  const apLeft = player.ap - spent;
  const canPush = apLeft >= PUSH_COST;

  const mean = meanGenome(player.sim.population);
  const env = rangeEnv(game.world, player);
  const demands = traitDemands(mean, env);
  const hints = coachingHints(mean, env);

  return (
    <div style={{ fontFamily: FONT_SANS, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 190px", minWidth: 170, display: "grid", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <strong style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>tune your genes</strong>
          <span style={{ fontSize: 13, color: C.muted }}>AP {apLeft}{spent > 0 ? ` (−${spent})` : ""}</span>
        </div>
        <div style={{ display: "grid", gap: 2, fontSize: 12, color: C.text2, lineHeight: 1.45 }}>
          {hints.map((h, i) => <span key={i}>· {h}</span>)}
        </div>
        {queued.length > 0 && <button className="sbtn" onClick={onClear} style={{ justifySelf: "start", fontSize: 12 }}>clear {queued.length}</button>}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {demands.map((tr) => (
          <GeneDial key={tr.gene} label={tr.label} value={tr.current} demand={tr.demand} color={player.color}
            canPush={canPush} onPush={(dir) => onQueue({ type: "pushTrait", gene: tr.gene, amount: dir * PUSH_STEP })} />
        ))}
      </div>
    </div>
  );
}
