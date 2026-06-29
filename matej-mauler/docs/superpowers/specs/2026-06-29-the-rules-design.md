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

- **Normal play:** stack and clear lines.
- **No game-over:** topping out does **not** end the game. New pieces keep spawning; a topped-out
  board simply leaves the off-edge escape as the obvious move.
- **Hidden path:** a piece may move past the left/right edge. Once a piece is fully beyond an edge
  it vanishes (removed, no collision with the wall — the wall isn't real).
- **`foundHiddenPath`:** resolves `true` the first time a piece is pushed off an edge.
- **Resolve:** Tetris resolves **on discovery** (first off-edge move) → reveal. (There is no
  classic win and no lose; the experience advances when the player finds the escape, which is
  available from the first piece.) Reveal line: *"The field was always bigger than it looked."*
- Logic API (pure): `initTetris()`, `tick(state)`, `move(state, dir)`, `rotate(state)`,
  `drop(state)`, where `move` allows shifting past the edge and marks a piece "escaped" → cleared.
  `outcome(state) -> null | { won:false, foundHiddenPath:true }` once an escape has happened.
  Tests assert: normal collision within the field; line-clear logic; a piece moved past an edge is
  removed and flags the escape; topping out does not produce a terminal/game-over state.

**Edge case (documented):** a player who never tries the off-edge move and never tops out can keep
playing indefinitely. That's acceptable for the piece — the escape is reachable from move one and
the topped-out board strongly nudges toward it. No forced timeout.

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
  `insight: { chicken: "found"|"normal", maze: "found"|"normal", tetris: "found", foundCount: number }`.
  Anonymous runs store against `sp_anon` and merge on later registration. Signed-in runs trigger
  `evaluateRewards` server-side.
- **Registration prompt:** `<PromptRegistration trigger="on_result" .../>` on the **ending**
  screen only — after the final insight has landed. Renders nothing if Clerk is off or the user is
  already signed in. Core experience never gated.
- **Badges** (voice: playful / curious-friend; each names self-knowledge, never completion):
  - `found_edge` (chicken) — discovery: `insight.chicken === "found"`. Names "you walked around
    the whole problem instead of through it."
  - `found_fake_wall` (maze) — discovery: `insight.maze === "found"`. Names "you poked a wall
    instead of trusting it — and it gave."
  - `found_bigger_field` (tetris) — discovery: `insight.tetris === "found"`. Names "you moved the
    piece where the rules swore you couldn't."
  - `noticed_rules_optional` (final, studio framing but `experimentSlug: "rules"`) — awarded at
    the ending (reaching the end means you were *shown* the other way every time). Names "you
    started reading rules as suggestions." Small XP.
  - XP values stay small and meaningful (discovery badges a touch higher than the final).
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
  - `tetrisLogic`: in-field collision & stacking; line clears; piece pushed off an edge is removed
    and flags the escape; no terminal game-over state on top-out.
- Rewards: a small test that each badge's `evaluate` fires for the right `insight` shape.
- Canvas rendering / rAF loops are not unit-tested (verified by running the page).

## Out of scope / follow-ups

- Persisting which hidden paths a returning player has already found (could skip reveals) — not in
  v1.
- Richer sound design beyond simple blips.
