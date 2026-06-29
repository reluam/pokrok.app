"use client";

import { PixelButton, RULES, type GameOutcome } from "../theme";

export default function Maze({ onResolve }: { onResolve: (o: GameOutcome) => void }) {
  return (
    <div style={{ display: "grid", gap: 18, placeItems: "center" }}>
      <p style={{ fontSize: 12, color: RULES.green }}>maze (stub)</p>
      <PixelButton onClick={() => onResolve({ won: true, foundHiddenPath: false })}>win normally</PixelButton>
      <PixelButton color={RULES.yellow} onClick={() => onResolve({ won: true, foundHiddenPath: true })}>find the hidden path</PixelButton>
    </div>
  );
}
