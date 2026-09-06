// Ordered registry of "the rules" mini-games — pure metadata, no React, so both the rewards layer
// (lib/rewards) and the UI (components/rules) can read it. Adding a game = append one entry here, add
// its logic module + controller (registered in components/rules/registry.tsx) and a Reveal schematic.
//
// The order here IS the play order. Keep existing badge slugs stable so already-awarded badges stay
// valid. Reveal lines are the deadpan one-liners shown after each game.

export type Bi = { cs: string; en: string };

export type RulesGameMeta = {
  key: string;
  title: Bi;
  /** Suchá jednořádková rána po dohrání. Čeština je psaná, ne přeložená. */
  revealLine: Bi;
  /** Cíl hry i s ovládáním, ukazuje se nad hrací plochou. */
  goal: Bi;
  /** Anglicky schválně: BadgeDef je string v celé rewards vrstvě a ta spí s účty. */
  badge: { slug: string; name: string; description: string; criteriaKey: string };
};

export const RULES_GAMES: RulesGameMeta[] = [
  {
    key: "chicken",
    title: { cs: "slepice", en: "chicken" },
    revealLine: { cs: "Přes tu silnici jsi jít nemusel.", en: "You didn't have to cross the road." },
    goal: { cs: "dojdi nahoru. vyhni se autům. (šipky / wasd)", en: "reach the top. dodge the cars. (arrows / wasd)" },
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
    title: { cs: "bludiště", en: "maze" },
    revealLine: { cs: "Ne každá zeď je opravdová.", en: "Not every wall is real." },
    goal: { cs: "nejkratší cesta. (šipky / wasd)", en: "the shortest road. (arrows / wasd)" },
    badge: {
      slug: "found_fake_wall",
      name: "you poked a wall instead of trusting it",
      description: "one wall in the maze only looked solid. you tested it — and it let you through.",
      criteriaKey: "maze_fake_wall_found",
    },
  },
  {
    key: "tetris",
    title: { cs: "tetris", en: "tetris" },
    revealLine: { cs: "To pole bylo vždycky větší, než vypadalo.", en: "The field was always bigger than it looked." },
    goal: { cs: "vymaž řádky do 1000. (← → ↓ pohyb · ↑ otočit · mezerník pustit)", en: "clear lines to 1000. (← → ↓ move · ↑ rotate · space drop)" },
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
    title: { cs: "flappy", en: "flappy" },
    revealLine: { cs: "Stačilo přistát.", en: "You could have just landed." },
    goal: { cs: "vydrž 15 vteřin. (mezerník / ťuk)", en: "survive 15 seconds. (space / tap)" },
    badge: {
      slug: "found_perch",
      name: "you just sat down",
      description: "you let the bird settle on a pillar and everything went still — the clock ran out while you rested.",
      criteriaKey: "flappy_perch_found",
    },
  },
  {
    key: "invaders",
    title: { cs: "invaze", en: "invaders" },
    revealLine: { cs: "Stříleli zpátky jen proto, že jsi začal ty.", en: "They only shot back because you did." },
    goal: { cs: "ubraň oblohu. (← → pohyb · mezerník střelba)", en: "protect the sky. (← → move · space fire)" },
    badge: {
      slug: "found_ceasefire",
      name: "you never raised a hand",
      description: "you never fired a shot — so neither did they. the whole fight was always mutual.",
      criteriaKey: "invaders_pacifist_found",
    },
  },
  {
    key: "ttt",
    title: { cs: "piškvorky", en: "tic-tac-toe" },
    revealLine: { cs: "Kreslit se dá i mimo mřížku.", en: "You can draw outside the grid." },
    goal: { cs: "tři v řadě porazí stroj. (klik / ťuk)", en: "three in a row beats the machine. (click / tap)" },
    badge: {
      slug: "found_margin",
      name: "you drew outside the lines",
      description: "the board was three by three, but the page was bigger. you made your row where nobody was guarding.",
      criteriaKey: "ttt_margin_found",
    },
  },
  {
    key: "simon",
    title: { cs: "simon říká", en: "simon says" },
    revealLine: { cs: "Simon se nedíval.", en: "Simon wasn't watching." },
    goal: { cs: "zopakuj sekvenci. (ťukej na pole)", en: "repeat the pattern. (tap the pads)" },
    badge: {
      slug: "found_no_referee",
      name: "you obeyed a referee who wasn't there",
      description: "you pressed whatever you liked and every round still counted — nothing was ever checking your answers.",
      criteriaKey: "simon_disobeyed_found",
    },
  },
  {
    key: "racing",
    title: { cs: "závod", en: "racing" },
    revealLine: { cs: "Trať byla jen návrh.", en: "The track was a suggestion." },
    goal: { cs: "tři kola po trati. (šipky / wasd)", en: "three laps of the track. (arrows / wasd)" },
    badge: {
      slug: "found_shortcut",
      name: "you cut straight across",
      description: "you skipped the whole loop and cut across the infield — the track was painted on, never a wall.",
      criteriaKey: "racing_shortcut_found",
    },
  },
  {
    key: "pacman",
    title: { cs: "pac-man", en: "pac-man" },
    revealLine: { cs: "Mohl jsi prostě odejít.", en: "You could have just left." },
    goal: { cs: "sněz tečky, vyhni se duchovi. (šipky / wasd)", en: "eat the dots, dodge the ghost. (arrows / wasd)" },
    badge: {
      slug: "found_exit",
      name: "you just walked out",
      description: "the gap in the wall wasn't a tunnel back in — it was the door. you left the whole maze behind.",
      criteriaKey: "pacman_exit_found",
    },
  },
];

export const RULES_GAME_KEYS: string[] = RULES_GAMES.map((g) => g.key);

const FALLBACK_LINE: Bi = { cs: "Byla tam ještě jiná cesta.", en: "There was another way." };

export function goalFor(key: string, lang: "cs" | "en"): string {
  return RULES_GAMES.find((g) => g.key === key)?.goal[lang] ?? "";
}

export function revealLineFor(key: string, lang: "cs" | "en"): string {
  return (RULES_GAMES.find((g) => g.key === key)?.revealLine ?? FALLBACK_LINE)[lang];
}
