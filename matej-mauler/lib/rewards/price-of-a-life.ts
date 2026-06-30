import { asBool, asNumber, type BadgeDef } from "./types";

// The Price of a Life — XP celebrates what the player learned about how THEY value a life, never
// completion/volume/streak. Sums to exactly 100. Reads the `insight` object recordParticipation
// stored (see lib/priceOfALife.ts computeMirror): reachedMirror, fundedCount, skippedCount,
// contradictions, distanceBias, fundedSpanRatio.
export const priceOfALifeBadges: BadgeDef[] = [
  {
    slug: "saw_your_price",
    experimentSlug: "price-of-a-life",
    name: "You saw your own price",
    description: "You put a number on a human life — ten times, without flinching once you started.",
    criteriaKey: "reached_mirror",
    xp: 10,
    evaluate: ({ participation }) => asBool(participation.insight?.reachedMirror),
  },
  {
    slug: "drew_a_line",
    experimentSlug: "price-of-a-life",
    name: "You drew a line",
    description: "You funded some lives and walked away from others — so somewhere, you have a price.",
    criteriaKey: "has_threshold",
    xp: 20,
    evaluate: ({ participation }) =>
      asNumber(participation.insight?.fundedCount) >= 1 &&
      asNumber(participation.insight?.skippedCount) >= 1,
  },
  {
    slug: "broke_your_own_rule",
    experimentSlug: "price-of-a-life",
    name: "You broke your own rule",
    description: "You paid more for one life than for another that cost less — your line bends.",
    criteriaKey: "self_contradiction",
    xp: 25,
    evaluate: ({ participation }) => asNumber(participation.insight?.contradictions) >= 1,
  },
  {
    slug: "distance_changed_math",
    experimentSlug: "price-of-a-life",
    name: "Distance changed the math",
    description: "The cheapest life of all was the far-away one — and it's the one you passed on.",
    criteriaKey: "proximity_bias",
    xp: 25,
    evaluate: ({ participation }) => asBool(participation.insight?.distanceBias),
  },
  {
    slug: "priced_lives_100x_apart",
    experimentSlug: "price-of-a-life",
    name: "You priced lives 100× apart",
    description: "You funded a cheap life and a hundred-times-dearer one — you don't price them evenly.",
    criteriaKey: "funded_span",
    xp: 20,
    evaluate: ({ participation }) => asNumber(participation.insight?.fundedSpanRatio) >= 100,
  },
];
