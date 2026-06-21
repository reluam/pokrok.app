import type { BadgeDef } from "./types";

// Decision Maker — pros/cons with weights, a tug-of-war, the moment of cutting off.
export const decisionMakerBadges: BadgeDef[] = [
  {
    slug: "watched_yourself_decide",
    experimentSlug: "decision-maker",
    name: "You watched yourself decide",
    description: "You saw your own decision take shape — part of you was already leaning.",
    criteriaKey: "completed_first_result",
    xp: 10,
    evaluate: ({ stats }) => stats.thisExperimentCount >= 1,
  },
];
