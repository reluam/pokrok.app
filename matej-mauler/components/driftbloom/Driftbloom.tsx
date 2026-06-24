"use client";
import { useEffect, useState } from "react";
import { Campaign } from "./Campaign";
import { Tutorial } from "./Tutorial";
import { loadCampaignProgress, markTutorialDone } from "@/lib/game/campaignProgress";

const sans = "ui-sans-serif, system-ui, sans-serif";

// `skipTutorial` is decided server-side (signed-in players who've already played skip it).
// Anonymous / first-time visitors get it once, gated by localStorage; it's always replayable.
export default function Driftbloom({ skipTutorial = false }: { skipTutorial?: boolean }) {
  const [showTutorial, setShowTutorial] = useState(false);

  // Decide after mount: localStorage is client-only, so reading it in the initializer would cause
  // an SSR/hydration mismatch. This is the rule's blind spot for client-only stores.
  useEffect(() => {
    if (skipTutorial) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!loadCampaignProgress().tutorialDone) setShowTutorial(true);
  }, [skipTutorial]);

  function finishTutorial() { markTutorialDone(); setShowTutorial(false); }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text-primary)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 22px 70px", fontFamily: sans }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <h1 style={{ fontSize: "clamp(30px,6vw,46px)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>🌱 driftbloom</h1>
          <button className="sbtn" onClick={() => setShowTutorial(true)} style={{ fontSize: 12, marginTop: 8 }}>how to play</button>
        </div>
        <p style={{ color: "var(--text-secondary)", maxWidth: 560, marginTop: 4 }}>
          intelligent design vs. natural selection. you steer one lineage by hand; three rivals evolve
          by their own theories. colonize the world — if the shifting climate and blind luck let you.
        </p>
        <div style={{ marginTop: 16 }}><Campaign /></div>
      </div>
      {showTutorial && <Tutorial onDone={finishTutorial} />}
    </main>
  );
}
