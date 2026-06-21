import { asBool, type BadgeDef } from "./types";

// The anthem of your life — answers become a personal anthem (tempo, major/minor, mood).
export const hymnaBadges: BadgeDef[] = [
  {
    slug: "life_as_music",
    experimentSlug: "hymna",
    name: "Your life, as music",
    description: "You heard your own answers turned into an anthem.",
    criteriaKey: "completed_first_result",
    xp: 10,
    evaluate: ({ stats }) => stats.thisExperimentCount >= 1,
  },
  {
    slug: "in_a_minor_key",
    experimentSlug: "hymna",
    name: "In a minor key",
    description: "Your life came out as a minor-key anthem — beautiful, a little wistful.",
    criteriaKey: "minor_anthem",
    xp: 15,
    evaluate: ({ participation }) => asBool(participation.insight?.minor),
  },
];
