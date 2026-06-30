// Ordered registry of "the rules" mini-games — pure metadata, no React, so both the rewards layer
// (lib/rewards) and the UI (components/rules) can read it. Adding a game = append one entry here, add
// its logic module + controller (registered in components/rules/registry.tsx) and a Reveal schematic.
//
// The order here IS the play order. Keep existing badge slugs stable so already-awarded badges stay
// valid. Reveal lines are the deadpan one-liners shown after each game.

export type RulesGameMeta = {
  key: string;
  title: string;
  revealLine: string;
  badge: { slug: string; name: string; description: string; criteriaKey: string };
};

export const RULES_GAMES: RulesGameMeta[] = [
  {
    key: "chicken",
    title: "chicken",
    revealLine: "You didn't have to cross the road.",
    badge: {
      slug: "found_edge",
      name: "you walked around the whole problem",
      description:
        "you found the safe shoulder and strolled past the traffic — you didn't have to cross the road at all.",
      criteriaKey: "chicken_edge_found",
    },
  },
  {
    key: "maze",
    title: "maze",
    revealLine: "Not every wall is real.",
    badge: {
      slug: "found_fake_wall",
      name: "you poked a wall instead of trusting it",
      description: "one wall in the maze only looked solid. you tested it — and it let you through.",
      criteriaKey: "maze_fake_wall_found",
    },
  },
  {
    key: "tetris",
    title: "tetris",
    revealLine: "The field was always bigger than it looked.",
    badge: {
      slug: "found_bigger_field",
      name: "you moved where the rules swore you couldn't",
      description:
        "you slid a piece clean off the edge of the board. the field was always bigger than it looked.",
      criteriaKey: "tetris_offedge_found",
    },
  },
  {
    key: "flappy",
    title: "flappy",
    revealLine: "There was sky above the pipes.",
    badge: {
      slug: "found_sky",
      name: "you flew over the whole thing",
      description: "the pipes never reached the top — you climbed into the open sky and cruised past every one.",
      criteriaKey: "flappy_sky_found",
    },
  },
  {
    key: "invaders",
    title: "invaders",
    revealLine: "They only shot back because you did.",
    badge: {
      slug: "found_ceasefire",
      name: "you never raised a hand",
      description: "you never fired a shot — so neither did they. the whole fight was always mutual.",
      criteriaKey: "invaders_pacifist_found",
    },
  },
  {
    key: "ttt",
    title: "tic-tac-toe",
    revealLine: "You can draw outside the grid.",
    badge: {
      slug: "found_margin",
      name: "you drew outside the lines",
      description: "the board was three by three, but the page was bigger. you made your row where nobody was guarding.",
      criteriaKey: "ttt_margin_found",
    },
  },
];

export const RULES_GAME_KEYS: string[] = RULES_GAMES.map((g) => g.key);

export function revealLineFor(key: string): string {
  return RULES_GAMES.find((g) => g.key === key)?.revealLine ?? "There was another way.";
}
