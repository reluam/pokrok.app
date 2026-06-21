import { asBool, asNumber, type BadgeDef } from "./types";

// Synapse (live route /synapsis, slug "synapsis").
// Insight/payload contract Synapse must provide to recordParticipation:
//   insight.overlapPct  (number 0–100) — how much the user's associations matched the crowd
//   insight.uniqueEdge  (boolean)       — gave an association nobody in the network had
//   payload.enteredResearcher (boolean) — explored the shared map, not just adding words
export const synapsisBadges: BadgeDef[] = [
  {
    slug: "mirror",
    experimentSlug: "synapsis",
    name: "Mind in the mirror",
    description: "You saw how much your associations overlap with everyone else.",
    criteriaKey: "completed_first_result",
    xp: 10,
    evaluate: ({ stats }) => stats.thisExperimentCount >= 1,
  },
  {
    slug: "outlier",
    experimentSlug: "synapsis",
    name: "One of a kind",
    description: "You gave an association no one else in the network had given.",
    criteriaKey: "unique_edge",
    xp: 25,
    evaluate: ({ participation }) => asBool(participation.insight?.uniqueEdge),
  },
  {
    slug: "predictable",
    experimentSlug: "synapsis",
    name: "Beautifully ordinary",
    description: "Your associations matched the crowd more than 90% of people. Comforting, isn’t it?",
    criteriaKey: "high_overlap",
    xp: 15,
    evaluate: ({ participation }) => asNumber(participation.insight?.overlapPct) >= 90,
  },
  {
    slug: "researcher",
    experimentSlug: "synapsis",
    name: "Researcher",
    description: "You went past adding words and explored the shared map itself.",
    criteriaKey: "entered_researcher",
    xp: 15,
    evaluate: ({ participation }) => asBool(participation.payload?.enteredResearcher),
  },
  {
    // Studio-wide: fires on any experiment once the user has done a second distinct one.
    slug: "returning_mind",
    experimentSlug: null,
    name: "A mind that came back",
    description: "You returned for a second Spaghetti experiment. The series is for you.",
    criteriaKey: "second_experiment",
    xp: 30,
    evaluate: ({ stats }) => stats.distinctExperiments >= 2,
  },
];
