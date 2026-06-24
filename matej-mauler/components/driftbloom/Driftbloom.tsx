"use client";
import { useEffect, useState } from "react";
import { Campaign } from "./Campaign";
import { Tutorial } from "./Tutorial";
import { loadCampaignProgress, markTutorialDone } from "@/lib/game/campaignProgress";

// Full-viewport game shell — the whole page IS the game (no scroll).
export default function Driftbloom({ skipTutorial = false }: { skipTutorial?: boolean }) {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (skipTutorial) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!loadCampaignProgress().tutorialDone) setShowTutorial(true);
  }, [skipTutorial]);

  return (
    <div style={{ height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--text-primary)" }}>
      <Campaign onHowToPlay={() => setShowTutorial(true)} />
      {showTutorial && <Tutorial onDone={() => { markTutorialDone(); setShowTutorial(false); }} />}
    </div>
  );
}
