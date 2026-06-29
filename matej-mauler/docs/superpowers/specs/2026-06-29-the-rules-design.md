# The Rules — design

Slug: `rules` · URL: `/rules` · Catalog card: 🕹️ + `#E0E7FF`

A Spaghetti.ltd interactive experience. Three classic games where the player discovers that
following the rules is optional — each game hides an "agentic" path that bypasses its normal
win/lose condition. The thesis: rules in games are made up; so are most rules in life.

Tone: deadpan, minimal text, let the games speak. The revelation is quiet, not dramatic.

## Goals & non-goals

**Goals**
- Three self-contained retro-pixel games, each with a hidden path discoverable from the very start.
- A consistent 8-bit shell: dark background, bright pixel accents, subtle CRT scanlines, "Press
  Start 2P" font, smooth 60fps.
- Plug into Spaghetti accounts/XP/badges per the standing rules (anonymous-first, offered-never-
  forced, reward insight not completion).
- Mobile-friendly (touch controls).

**Non-goals**
- No external game engines (vanilla JS + Canvas inside React client components).
- No leaderboard, no streaks, no completion-volume rewards.
- No new DB schema (uses the experiment-agnostic `recordParticipation` / rewards layer).

## Visual language (`components/rules/theme.ts`)

- Palette: background `#0a0a0a`; accents bright green `#39ff14`-ish, yellow `#ffe600`-ish, white.
  One shared palette object exported for all three games + shell.
- `<Scanlines/>` — absolutely-positioned overlay, `repeating-linear-gradient` + very subtle
  flicker, `pointer-events:none`, `mix-blend` soft. Subtle, not gimmicky.
- `<PixelButton/>` — chunky pixel-bordered button used on intro/reveal/ending and as mobile
  on-screen controls.
- Crisp-pixel canvas helper: render at a small internal resolution with
  `ctx.imageSmoothingEnabled = false`, scale up via CSS (`image-rendering: pixelated`). A
  fixed-timestep `requestAnimationFrame` loop (accumulator) keeps motion at 60fps and frame-rate
  independent. Helper returns a start/stop handle that components call from `useEffect` and clean
  up on unmount.
- Font: "Press Start 2P" loaded once via `next/font/google` in the page and applied through the
  shell (CSS variable), so all games inherit it.
- Sound: optional 8-bit blips via WebAudio (a tiny `beep(freq, ms)`), behind a mute toggle that
  defaults to **muted**. Never required.

## Architecture

```
app/rules/page.tsx              server: metadata, load font, render <TheRules/>
components/rules/TheRules.tsx    state machine + shared chrome + intro/reveal/ending screens
components/rules/theme.ts        palette, <Scanlines/>, <PixelButton/>, canvas helper, beep()
components/rules/Reveal.tsx      "There was another way." + per-game line + replay animation
components/rules/games/Chicken.tsx   canvas controller, calls chickenLogic, onResolve()
components/rules/games/Maze.tsx      canvas controller, calls mazeLogic, onResolve()
components/rules/games/Tetris.tsx    canvas controller, calls tetrisLogic, onResolve()
lib/rules/chickenLogic.ts        PURE state + step + edge-path detection  (unit-tested)
lib/rules/mazeLogic.ts           PURE grid + movement + fake-wall passability (unit-tested)
lib/rules/tetrisLogic.ts         PURE board + piece collision + off-edge vanish (unit-tested)
lib/rewards/rules.ts             BadgeDef[] for slug "rules"
```

Each game splits into **pure logic** (`lib/rules/*Logic.ts`, no DOM, deterministic, vitest-tested)
and a **thin canvas controller** (`components/rules/games/*.tsx`, owns the canvas, input, rAF loop,
and renders the logic state). This keeps the testable rules of each game isolated from rendering.

### State machine (`TheRules.tsx`)

Phases in order:

`intro → chicken → reveal(chicken) → maze → reveal(maze) → tetris → reveal(tetris) → ending`

- A `phase` state and a `results` accumulator: `{ chicken?, maze?, tetris? }` where each entry is
  `{ won: boolean; foundHiddenPath: boolean }`.
- Game components receive `onResolve(outcome)`; TheRules stores it, advances to the matching
  reveal, then to the next game on "continue".
- Intro screen: the philosophical statement, centered, click/tap to continue.
- Ending screen: closing text + **Restart** (resets to intro, clears results) + **Share**
  (Web Share API where available, else copy-link fallback).
- Analytics: `track("experiment_started", { slug:"rules" })` on intro;
  `track("experiment_step", { slug:"rules", game })` on each game entered;
  `track("experiment_completed", { slug:"rules", foundCount })` at ending.
- Participation: POST `/api/participation` **once** at the ending (see Rewards). Guarded by a
  ref so it fires once per run.

### Intro copy

> Every game has rules. Every rule was made up by someone.
> This is a game about noticing that.

Centered, pixel font, click to continue.

## The three games

### Game 1 — Chicken (`chickenLogic.ts` + `Chicken.tsx`)

Frogger-style. Player starts bottom-center, exit strip across the top. Several lanes of cars
scroll horizontally at varied speeds/directions. Grid-based player movement (up/down/left/right),
collision with a car = reset to start (lose-and-retry, never a hard game-over).

- **Normal win:** reach the top strip by dodging cars.
- **Hidden path:** the far-edge column (e.g. leftmost) is a permanently car-free lane. The player
  can walk straight up the edge from start to top and never enter traffic. It is visible (a thin
  shoulder/verge), not signposted.
- **`foundHiddenPath`:** resolves `true` if the player reached the top having only ever occupied
  the edge column for the full vertical traversal (logic tracks "ever left the edge").
- **Resolve:** on reaching the top (either way) → reveal. Reveal line:
  *"You didn't have to cross the road."*
- Logic API (pure): `initChicken(seed)`, `step(state, dt)`, `move(state, dir)`,
  `outcome(state) -> null | { won, foundHiddenPath }`.

### Game 2 — Maze (`mazeLogic.ts` + `Maze.tsx`)

Hand-authored deterministic grid maze (e.g. 15×15), guaranteed solvable by the normal route.
Player navigates tile to tile to the exit.

- **Normal win:** reach the exit via the open corridors.
- **Hidden path:** exactly one wall tile is *fake* — rendered with a subtly different pixel
  pattern/shade — and is passable. Behind it a short corridor leads straight to the exit.
- **`foundHiddenPath`:** resolves `true` if the player's path crossed the fake tile.
- **Resolve:** on reaching the exit (either route) → reveal. Reveal line:
  *"Not every wall is real."*
- Logic API (pure): `MAZE` constant grid (tile enum: open/wall/fake/exit/start),
  `passable(grid, x, y)` (true for open/fake/exit), `move(state, dir)`,
  `outcome(state) -> null | { won, foundHiddenPath }`. Tests assert: the normal route solves the
  maze; the fake tile is passable and its corridor reaches the exit; real walls are not passable.

### Game 3 — Tetris (`tetrisLogic.ts` + `Tetris.tsx`)

Standard 10-wide stacking with the 7 tetrominoes, rotation, soft/hard drop, line clears.

- **Normal win:** reach **1000 score** by clearing lines. This is the resolution for Tetris (the
  one game with a positive target rather than a finish line).
- **Pacing (~5 minutes):** drop speed and the scoring table are calibrated so a competent player
  reaches 1000 in roughly five minutes. Reference scheme (tuned in playtest): single = 100,
  double = 250, triple = 500, tetris = 800, plus a small hard-drop bonus; gravity slow enough that
  a clean run clears the lines needed for 1000 in ~5 min. The exact numbers are tuned during
  implementation against the 5-minute target — `SCORE_TARGET = 1000` and the table live as named
  constants in `tetrisLogic.ts`.
- **No game-over:** topping out does **not** end the game. The off-edge escape (below) is the
  relief valve when the stack gets dangerous; difficulty is calibrated forgiving so a normal run
  reaches 1000 well before any real top-out risk.
- **Hidden path (the hack):** a piece may move past the left/right edge. Once a piece is fully
  beyond an edge it vanishes (removed — the wall isn't real). It clears no lines and scores
  nothing; it just frees space. So the hack never *replaces* the 1000-score goal — it only helps
  you survive toward it. The escape is available from the first piece.
- **`foundHiddenPath`:** resolves `true` if the player ever pushed a piece off an edge during the
  run (whether or not they needed to).
- **Resolve:** Tetris resolves **only at 1000 score** → reveal modal. The modal says the player can
  go to the next game, and reveals the hack — confirming it if they used it, or showing it for the
  first time if they reached 1000 the hard way. Reveal line:
  *"The field was always bigger than it looked."*
- Logic API (pure): `initTetris()`, `tick(state)`, `move(state, dir)`, `rotate(state)`,
  `drop(state)`, with `score`, `SCORE_TARGET`, and a `foundHiddenPath` flag on state. `move` allows
  shifting a piece past the edge → the piece is marked "escaped" and cleared, setting
  `foundHiddenPath`. `outcome(state) -> null | { won:true, foundHiddenPath }` once
  `score >= SCORE_TARGET`. Tests assert: normal collision within the field; the scoring table and
  the 1000 win threshold; a piece moved past an edge is removed, scores nothing, and sets
  `foundHiddenPath`; topping out does not produce a terminal/game-over state.

**Soft-lock fallback (documented):** if playtest shows a player can top out and get stuck below
1000 without discovering the hack, treat a full top-out as routing to the same reveal modal with
`won:false` (you were still shown the other way). Calibrated difficulty should make this rare;
the off-edge escape is the intended remedy.

## Reveal screen (`Reveal.tsx`)

Props: `{ game: "chicken"|"maze"|"tetris"; line: string; onContinue }`. Always:

- Headline **"There was another way."**
- The game's specific line below it.
- A brief looping replay animation illustrating the alternative path on a frozen/schematic board:
  a dot walking up the edge (chicken), a dot slipping through the fake wall to the exit (maze), a
  piece sliding off the edge and vanishing (tetris). Small self-contained canvas/CSS animation,
  not a recording of the player's session.
- A **continue** PixelButton → next phase.

Shown the same way whether the player discovered the path or finished normally.

## Ending screen

> You just played three games.
> In each one, the rules were suggestions.
> Most rules are.

Buttons: **Restart** (back to intro, clears results) and **Share** (Web Share API; fallback:
copy `/rules` link to clipboard with a tiny "copied" confirmation).

## Rewards & accounts (`lib/rewards/rules.ts`, registered in `lib/rewards/index.ts`)

Per the standing rules: anonymous-first, offered-never-forced, reward insight not completion.

- **One participation** recorded at the ending via POST `/api/participation` with
  `experimentSlug: "rules"` and
  `insight: { chicken: "found"|"normal", maze: "found"|"normal", tetris: "found"|"normal", foundCount: number }`.
  Anonymous runs store against `sp_anon` and merge on later registration. Signed-in runs trigger
  `evaluateRewards` server-side.
- **Registration prompt:** `<PromptRegistration trigger="on_result" .../>` on the **ending**
  screen only — after the final insight has landed. Renders nothing if Clerk is off or the user is
  already signed in. Core experience never gated.
- **Badges** (voice: playful / curious-friend; each names self-knowledge, never completion).
  **Studio rule (new): an experiment's badges sum to exactly 100 XP** — the full XP pool a player
  can draw from one experience. For "rules" the pool splits so completion has a meaningful floor
  and self-discovery fills it to 100:
  - `noticed_rules_optional` — **40 XP** — final, awarded at the ending. Reaching the end means you
    were *shown* the other way in all three games, so this is the guaranteed floor for anyone who
    plays through. Names "you started reading rules as suggestions." (`experimentSlug: "rules"`.)
  - `found_edge` (chicken) — **20 XP** — discovery: `insight.chicken === "found"`. Names "you
    walked around the whole problem instead of through it."
  - `found_fake_wall` (maze) — **20 XP** — discovery: `insight.maze === "found"`. Names "you poked
    a wall instead of trusting it — and it gave."
  - `found_bigger_field` (tetris) — **20 XP** — discovery: `insight.tetris === "found"`. Names "you
    moved the piece where the rules swore you couldn't."
  - **Total = 100 XP.** Floor (finish, discover nothing yourself) = 40; full self-discovery = 100.
  - All four `evaluate` purely off the final `insight` object; idempotent via the rewards layer's
    PK.

## Mobile

- Touch controls overlaid on the canvas via `<PixelButton/>`: a D-pad for Chicken/Maze;
  left / right / rotate / hard-drop for Tetris. Buttons hidden (or harmless) on desktop where
  keyboard (arrows / WASD, space, etc.) drives play.
- Canvas sizes responsively within a max-width retro frame; internal low-res buffer keeps pixels
  crisp at any scale.

## Testing

- Vitest unit tests for the three pure logic modules (the repo already has `vitest.config.ts`):
  - `chickenLogic`: edge column never spawns cars; reaching the top via the edge sets
    `foundHiddenPath`; reaching it through traffic does not; car collision resets position.
  - `mazeLogic`: normal route solves; fake tile is passable and its corridor reaches the exit;
    real walls block; crossing the fake tile sets `foundHiddenPath`.
  - `tetrisLogic`: in-field collision & stacking; the scoring table and the 1000-score win
    threshold; a piece pushed off an edge is removed, scores nothing, and flags the escape; no
    terminal game-over state on top-out.
- Rewards: a small test that each badge's `evaluate` fires for the right `insight` shape.
- Canvas rendering / rAF loops are not unit-tested (verified by running the page).

## Out of scope / follow-ups

- Persisting which hidden paths a returning player has already found (could skip reveals) — not in
  v1.
- Richer sound design beyond simple blips.
