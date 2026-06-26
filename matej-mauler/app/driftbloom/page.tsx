import type { Metadata } from "next";
import Driftbloom from "@/components/driftbloom/Driftbloom";
import { syncAuthedUser } from "@/lib/account/session";
import { getUserParticipations } from "@/lib/accountsDb";

export const metadata: Metadata = {
  title: "driftbloom — an alien field study of humanity (as spaghetti)",
  description: "a strategy game: steer one spaghettoid lineage by intelligent design against three rivals evolving on their own. evolution has no recipe.",
};

// Returning signed-in players who've already played skip the tutorial; everyone else gets it once
// (gated client-side by localStorage). Env-guarded auth → anonymous when Clerk/DB are absent.
export default async function Page() {
  let skipTutorial = false;
  try {
    const synced = await syncAuthedUser();
    if (synced) {
      const parts = await getUserParticipations(synced.userId);
      skipTutorial = parts.some((p) => p.experiment_slug === "driftbloom");
    }
  } catch {
    /* no auth/db configured — treat as anonymous, show the tutorial */
  }
  return <Driftbloom skipTutorial={skipTutorial} />;
}
