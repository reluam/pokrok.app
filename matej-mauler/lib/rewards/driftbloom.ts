import type { BadgeDef } from "./types";

// Driftbloom — intelligent design vs. natural selection. Badges name what the player saw about
// THEIR OWN thinking, never completion/counts. insight is the game outcome:
// { won, era, playerBiomes, totalBiomes, winnerStrategy }.
export const driftbloomBadges: BadgeDef[] = [
  {
    slug: "out_designed_selection",
    experimentSlug: "driftbloom",
    name: "you out-designed the blind watchmaker",
    description: "you steered a lineage across a whole world — deliberate design beat blind selection, this once.",
    criteriaKey: "campaign_won",
    xp: 20,
    evaluate: ({ participation }) => (participation.insight as { won?: boolean } | null)?.won === true,
  },
  {
    slug: "watched_no_goal",
    experimentSlug: "driftbloom",
    name: "you watched 'better' get out-adapted",
    description: "your designed lineage lost to a blind process — you saw that 'fitter' is only ever local, never a goal.",
    criteriaKey: "campaign_lost_to_blind",
    xp: 10,
    evaluate: ({ participation }) => (participation.insight as { won?: boolean } | null)?.won === false,
  },
];
