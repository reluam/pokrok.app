import { GameState } from "./game";
import { dominatedCount } from "./lineage";
import { Strategy, STRATEGY_LABELS } from "./strategies";

export interface GameOutcome {
  won: boolean;
  era: number;
  playerBiomes: number;
  totalBiomes: number;
  winnerStrategy: Strategy; // the strategy of the lineage that ended up dominant
}

// Summarize a finished game: who dominated the most ground, and how the player fared.
export function summarize(game: GameState): GameOutcome {
  const player = game.lineages.find((l) => l.kind === "player")!;
  // dominant lineage = most biomes dominated (ties broken by lineage order: player first).
  const dominant = [...game.lineages].sort(
    (a, b) => dominatedCount(game.world, game.lineages, b.id) - dominatedCount(game.world, game.lineages, a.id),
  )[0];
  return {
    won: game.status === "won",
    era: game.era,
    playerBiomes: dominatedCount(game.world, game.lineages, player.id),
    totalBiomes: game.world.biomes.length,
    winnerStrategy: dominant.strategy,
  };
}

// The reveal line — names what the player just learned. lowercase, "curious friend" voice.
export function revealText(o: GameOutcome): string {
  if (o.won) {
    return `you out-designed the blind cook — this run. but selection never aimed at you; it only ever ` +
      `fit the world in front of it. there's no recipe: change the world and "winning" changes with it.`;
  }
  return `${STRATEGY_LABELS[o.winnerStrategy]} won — not by following a recipe, but by tangling into this ` +
    `world better than your design did. evolution has no destination; it just keeps whatever holds together here.`;
}

// Participation insight payload (badges read these fields).
export function outcomeInsight(o: GameOutcome): Record<string, unknown> {
  return { won: o.won, era: o.era, playerBiomes: o.playerBiomes, totalBiomes: o.totalBiomes, winnerStrategy: o.winnerStrategy };
}
