import { GameState } from "./game";
import { Strategy, STRATEGY_LABELS } from "./strategies";

export interface GameOutcome {
  won: boolean;
  era: number;
  playerBiomes: number;
  totalBiomes: number;
  winnerStrategy: Strategy; // the strategy of the lineage that ended up dominant
}

// Summarize a finished game: who held the most ground, and how the player fared.
export function summarize(game: GameState): GameOutcome {
  const player = game.lineages.find((l) => l.kind === "player")!;
  // dominant lineage = most biomes held (ties broken by lineage order: player first).
  const dominant = [...game.lineages].sort((a, b) => b.held.length - a.held.length)[0];
  return {
    won: game.status === "won",
    era: game.era,
    playerBiomes: player.held.length,
    totalBiomes: game.world.biomes.length,
    winnerStrategy: dominant.strategy,
  };
}

// The reveal line — names what the player just learned. lowercase, "curious friend" voice.
export function revealText(o: GameOutcome): string {
  if (o.won) {
    return `you out-designed the blind watchmaker — this run. but selection never aimed at you; ` +
      `it only ever fit the world in front of it. change the world and "winning" changes with it.`;
  }
  return `${STRATEGY_LABELS[o.winnerStrategy]} won — not by aiming at a goal, but by fitting this ` +
    `world better than your design did. evolution has no destination; it just keeps whatever works here.`;
}

// Participation insight payload (badges read these fields).
export function outcomeInsight(o: GameOutcome): Record<string, unknown> {
  return { won: o.won, era: o.era, playerBiomes: o.playerBiomes, totalBiomes: o.totalBiomes, winnerStrategy: o.winnerStrategy };
}
