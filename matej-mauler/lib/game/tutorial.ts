// A short coaching script (replayable from the menu). Frame: an outside intelligence studying
// humanity — depicted, accurately, as spaghetti. Each step pairs copy with an illustration.
export type TutorialArt = "creatures" | "helix" | "dial" | "map" | "goal";

export interface TutorialStep {
  text: string;
  art: TutorialArt;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    art: "creatures",
    text: "you're an outside intelligence studying a small world of creatures. it's humanity — rendered, accurately, as spaghetti.",
  },
  {
    art: "helix",
    text: "their heredity is a tangled spaghetti helix. you steer ONE lineage by intelligent design; three rivals evolve on their own — gene's-eye view, group selection, and lamarckism.",
  },
  {
    art: "dial",
    text: "each era, spend adaptation points to nudge genes up or down. a dial shows what your lineage has versus what THIS world is asking for.",
  },
  {
    art: "map",
    text: "hit “advance era” to let everyone evolve, breed, and fight over biomes. lineages spread one biome at a time — and the climate shifts, catastrophes strike.",
  },
  {
    art: "goal",
    text: "dominate every biome before a rival does, or lead after 100 eras. the quiet lesson: evolution has no recipe — it just tangles toward whatever fits right now.",
  },
];
