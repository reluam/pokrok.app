import type { BadgeDef } from "./types";
import { synapsisBadges } from "./synapsis";
import { timeRemainingBadges } from "./time-remaining";
import { hymnaBadges } from "./hymna";
import { decisionMakerBadges } from "./decision-maker";

// Every experiment's badge config registered here. Add new experiments by importing their
// lib/rewards/<slug>.ts array and spreading it in.
export const ALL_BADGES: BadgeDef[] = [
  ...synapsisBadges,
  ...timeRemainingBadges,
  ...hymnaBadges,
  ...decisionMakerBadges,
];

/** Badges relevant when evaluating a participation in `experimentSlug`:
 *  the experiment's own badges + all studio-wide (experimentSlug === null) ones. */
export function badgesForExperiment(experimentSlug: string): BadgeDef[] {
  return ALL_BADGES.filter((b) => b.experimentSlug === experimentSlug || b.experimentSlug === null);
}

export type { BadgeDef } from "./types";
