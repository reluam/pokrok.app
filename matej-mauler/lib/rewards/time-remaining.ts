import type { BadgeDef } from "./types";

// Time Remaining — answer a few questions, see an estimate of the time you have left.
export const timeRemainingBadges: BadgeDef[] = [
  {
    slug: "memento_mori",
    experimentSlug: "time-remaining",
    name: "Memento mori",
    description: "You looked an estimate of the time you have left in the eye. Now go spend it.",
    criteriaKey: "completed_first_result",
    xp: 10,
    evaluate: ({ stats }) => stats.thisExperimentCount >= 1,
  },
];
