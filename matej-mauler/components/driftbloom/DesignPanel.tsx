"use client";
import type { Genome } from "@/lib/sim/genome";
import { GENE_KEYS } from "@/lib/sim/genome";
import type { GameState } from "@/lib/game/game";
import { PlayerAction, PUSH_COST } from "@/lib/game/actions";

const sans = "ui-sans-serif, system-ui, sans-serif";
export const PUSH_STEP = 0.12;

// Your intelligent-design lever: spend AP to push individual genes up or down before each era.
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

  const mean = (g: keyof Genome) => player.sim.population.reduce((s, x) => s + x[g], 0) / player.sim.population.length;
  const queuedFor = (g: keyof Genome) =>
    queued.reduce((s, a) => s + (a.type === "pushTrait" && a.gene === g ? Math.sign(a.amount) : 0), 0);

  return (
    <div style={{ fontFamily: sans, display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong>your genome (intelligent design)</strong>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>AP {apLeft} {spent > 0 && `(−${spent} queued)`}</span>
      </div>
      {GENE_KEYS.map((g) => {
        const m = mean(g);
        const q = queuedFor(g);
        return (
          <div key={g} style={{ display: "grid", gridTemplateColumns: "108px 1fr auto", gap: 8, alignItems: "center", fontSize: 12 }}>
            <span style={{ color: "var(--text-secondary)" }}>{g}{q !== 0 && <em style={{ color: q > 0 ? "#16a34a" : "#dc2626" }}> {q > 0 ? `+${q}` : q}</em>}</span>
            <span style={{ height: 7, background: "var(--card,#eee)", borderRadius: 4, overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${Math.round(m * 100)}%`, background: player.color }} />
            </span>
            <span style={{ display: "flex", gap: 4 }}>
              <button className="sbtn" disabled={!canPush} onClick={() => onQueue({ type: "pushTrait", gene: g, amount: PUSH_STEP })}>+</button>
              <button className="sbtn" disabled={!canPush} onClick={() => onQueue({ type: "pushTrait", gene: g, amount: -PUSH_STEP })}>−</button>
            </span>
          </div>
        );
      })}
      {queued.length > 0 && (
        <button className="sbtn" onClick={onClear} style={{ justifySelf: "start", marginTop: 4 }}>clear {queued.length} queued</button>
      )}
    </div>
  );
}
