"use client";

import { useState } from "react";
import { RULES, Scanlines, PixelButton } from "./theme";

type Phase = "intro" | "ending";

export default function TheRules() {
  const [phase, setPhase] = useState<Phase>("intro");

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: RULES.bg,
        color: RULES.white,
        fontFamily: RULES.font,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: 24,
        overflow: "hidden",
      }}
    >
      {phase === "intro" && (
        <div style={{ display: "grid", gap: 28, maxWidth: 620, cursor: "pointer", lineHeight: 1.9 }} onClick={() => setPhase("ending")}>
          <p style={{ fontSize: 13 }}>Every game has rules.</p>
          <p style={{ fontSize: 13 }}>Every rule was made up by someone.</p>
          <p style={{ fontSize: 13, color: RULES.green }}>This is a game about noticing that.</p>
          <p style={{ fontSize: 9, color: RULES.gray, marginTop: 18 }}>[ click to continue ]</p>
        </div>
      )}

      {phase === "ending" && (
        <div style={{ display: "grid", gap: 24, maxWidth: 620, lineHeight: 1.9 }}>
          <p style={{ fontSize: 13 }}>You just played three games.</p>
          <p style={{ fontSize: 13 }}>In each one, the rules were suggestions.</p>
          <p style={{ fontSize: 13, color: RULES.green }}>Most rules are.</p>
          <div style={{ marginTop: 12 }}>
            <PixelButton onClick={() => setPhase("intro")}>restart</PixelButton>
          </div>
        </div>
      )}

      <Scanlines />
    </div>
  );
}
