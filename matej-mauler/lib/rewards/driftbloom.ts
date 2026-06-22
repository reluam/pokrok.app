import type { BadgeDef } from "./types";

// Driftbloom — evolution has no goal. Badges name what the player saw about THEIR OWN thinking,
// never completion/counts. insight is a DriftInsight: { predictionMatched, survivalPathsUsed, ... }.
export const driftbloomBadges: BadgeDef[] = [
  {
    slug: "expected_a_plan",
    experimentSlug: "driftbloom",
    name: "you expected a plan",
    description: "you predicted a direction; selection just fit the local world instead.",
    criteriaKey: "prediction_missed",
    xp: 10,
    evaluate: ({ participation }) => {
      const insight = participation.insight as { predictionMatched?: boolean } | null;
      return insight?.predictionMatched === false;
    },
  },
  {
    slug: "found_a_second_way",
    experimentSlug: "driftbloom",
    name: "you found a second way to survive",
    description: "you watched a different trait win — there was never one 'right' answer.",
    criteriaKey: "two_survival_paths",
    xp: 15,
    evaluate: ({ participation }) => {
      const insight = participation.insight as { survivalPathsUsed?: string[] } | null;
      return (insight?.survivalPathsUsed?.length ?? 0) >= 2;
    },
  },
];
