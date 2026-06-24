"use client";
import { meanGenome } from "@/lib/sim/genome";
import type { GameState } from "@/lib/game/game";
import { rangeEnv } from "@/lib/game/game";
import { PlayerAction, PUSH_COST } from "@/lib/game/actions";
import { traitDemands, coachingHints } from "@/lib/game/hints";
import { GeneDial } from "./GeneDial";

const sans = "ui-sans-serif, system-ui, sans-serif";
export const PUSH_STEP = 0.12;

// Your intelligent-design lever: circular gene dials (your value vs the world's demand) + coaching.
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
    <div style={{ fontFamily: sans, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong>tune your genes</strong>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>AP {apLeft}{spent > 0 ? ` (−${spent})` : ""}</span>
      </div>

      {/* coaching — what this world is asking of you */}
      <div style={{ display: "grid", gap: 3, fontSize: 12, color: "var(--text-secondary)" }}>
        {hints.map((h, i) => <span key={i}>· {h}</span>)}
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))" }}>
        {demands.map((t) => (
          <GeneDial key={t.gene} label={t.label} value={t.current} demand={t.demand} color={player.color}
            canPush={canPush} onPush={(dir) => onQueue({ type: "pushTrait", gene: t.gene, amount: dir * PUSH_STEP })} />
        ))}
      </div>

      {queued.length > 0 && (
        <button className="sbtn" onClick={onClear} style={{ justifySelf: "start" }}>clear {queued.length} queued</button>
      )}
    </div>
  );
}
