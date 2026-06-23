import { expect, test } from "vitest";
import { initGame, GameState } from "@/lib/game/game";
import { summarize, revealText, outcomeInsight } from "@/lib/game/outcome";

// craft a finished game from a fresh one by overwriting held + status
function finished(seed: number, held: string[][], status: "won" | "lost", era = 6): GameState {
  const g = initGame(seed);
  return {
    ...g, era, status,
    lineages: g.lineages.map((l, i) => ({ ...l, held: held[i], alive: held[i].length > 0 })),
  };
}

test("summarize reports a win with the player holding every biome", () => {
  const g = initGame(1);
  const all = g.world.biomes.map((b) => b.id);
  const o = summarize(finished(1, [all, [], [], []], "won"));
  expect(o.won).toBe(true);
  expect(o.playerBiomes).toBe(all.length);
  expect(o.totalBiomes).toBe(all.length);
  expect(o.winnerStrategy).toBe("intelligent_design");
});

test("summarize names the dominant rival's strategy on a loss", () => {
  const g = initGame(1);
  const b = g.world.biomes.map((x) => x.id);
  // npc3 (index 3) is lamarck and holds the most
  const o = summarize(finished(1, [[b[0]], [b[1]], [b[2]], [b[3], b[4], b[5]]], "lost"));
  expect(o.won).toBe(false);
  expect(o.winnerStrategy).toBe("lamarck");
});

test("revealText is a non-empty lowercase line that differs between win and loss", () => {
  const g = initGame(1);
  const all = g.world.biomes.map((x) => x.id);
  const win = revealText(summarize(finished(1, [all, [], [], []], "won")));
  const lose = revealText(summarize(finished(1, [[all[0]], [], [], all.slice(1)], "lost")));
  expect(win).toBe(win.toLowerCase());
  expect(lose.length).toBeGreaterThan(10);
  expect(win).not.toBe(lose);
});

test("outcomeInsight carries the fields badges read", () => {
  const g = initGame(1);
  const all = g.world.biomes.map((x) => x.id);
  const ins = outcomeInsight(summarize(finished(1, [all, [], [], []], "won", 9)));
  expect(ins.won).toBe(true);
  expect(ins.era).toBe(9);
  expect(ins.winnerStrategy).toBe("intelligent_design");
  expect(typeof ins.playerBiomes).toBe("number");
});
