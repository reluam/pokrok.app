import { asBool, asNumber, type BadgeDef } from "./types";

// The Price of a Life — XP celebrates what the player learned about how THEY value a life, never
// completion/volume/streak. Sums to exactly 100. Reads the `insight` object recordParticipation
// stored (see lib/priceOfALife.ts computeMirror): reachedMirror, fundedCount, skippedCount,
// flips (matched pairs answered oppositely), comfortFlips (split pairs where the funded side was
// the more-relatable one).
export const priceOfALifeBadges: BadgeDef[] = [
  {
    slug: "saw_your_price",
    experimentSlug: "price-of-a-life",
    name: "You saw your own price",
    description: "You put a number on a human life — twenty times, without flinching once you started.",
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
    xp: 15,
    evaluate: ({ participation }) =>
      asNumber(participation.insight?.fundedCount) >= 1 &&
      asNumber(participation.insight?.skippedCount) >= 1,
  },
  {
    slug: "same_price_different_answer",
    experimentSlug: "price-of-a-life",
    name: "Same price, different answer",
    description: "Two lives cost you exactly the same — and you saved one, not the other. The math didn't decide.",
    criteriaKey: "pair_flip",
    xp: 30,
    evaluate: ({ participation }) => asNumber(participation.insight?.flips) >= 1,
  },
  {
    slug: "who_not_how_much",
    experimentSlug: "price-of-a-life",
    name: "Who, not how much",
    description: "On more than one identical price, who they were flipped your call — it was never really the cost.",
    criteriaKey: "pattern_of_flips",
    xp: 25,
    evaluate: ({ participation }) => asNumber(participation.insight?.flips) >= 2,
  },
  {
    slug: "you_paid_for_the_familiar",
    experimentSlug: "price-of-a-life",
    name: "You paid for the familiar",
    description: "Given the same price, you funded the lives easier to picture — and passed on the ones you don't see.",
    criteriaKey: "comfort_bias",
    xp: 20,
    evaluate: ({ participation }) => asNumber(participation.insight?.comfortFlips) >= 2,
  },
];
