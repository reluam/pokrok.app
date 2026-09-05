// Flappy — survive 15 seconds. The bird falls (a warning flashes near the floor). The FIRST pillar is
// open-topped: let the bird settle on it and everything freezes while the clock keeps running — you
// wait out the 15s in stillness. Every later pillar is a pipe-pair whose gap shrinks and shrinks until
// threading it is impossible. The frantic path is a trap; you could have just landed on the first one.

export const WIDTH = 140;
export const HEIGHT = 100;
export const BIRD_X = 44;
export const BIRD_R = 4;
export const PILLAR_W = 14;
export const SPACING = 46;
export const PILLAR_COUNT = 8;
export const SPEED = 0.012; // units per ms — world scroll
export const GRAVITY = 0.00016; // vy per ms — a fast, flappy-bird fall
export const FLAP = 0.05; // small upward hop per tap
export const LIMIT = 15000; // survive this many ms
export const WARN_Y = HEIGHT - 24; // below this, flash the warning
export const GAP_CENTER = 50;
export const START_GAP = 34; // gap of the first pipe-pair…
export const GAP_SHRINK = 8; // …shrinking by this per pillar…
export const GAP_MIN = 6; // …down to this (below the bird's height → impossible)

export type Pillar = { x: number; top: number; ceil: number }; // bottom column `top`→floor; ceiling pipe 0→`ceil` (0 = open top)

export type FlappyState = {
  width: number;
  height: number;
  birdY: number;
  vy: number;
  pillars: Pillar[];
  started: boolean; // the game holds until the first click
  landed: boolean;
  landedEver: boolean;
  elapsed: number;
  limit: number;
  status: "playing" | "won" | "lost";
  foundHiddenPath: boolean;
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function initFlappy(seed = 1): FlappyState {
  const rand = rng(seed);
  const startX = BIRD_X - PILLAR_W / 2;
  // the first pillar is open-topped (ceil 0) and sits right under the start — you can just land on it
  const pillars: Pillar[] = [{ x: startX, top: 66, ceil: 0 }];
  for (let i = 1; i < PILLAR_COUNT; i++) {
    const gap = Math.max(GAP_MIN, START_GAP - (i - 1) * GAP_SHRINK); // shrinks each pillar
    const center = clamp(GAP_CENTER + (rand() - 0.5) * 16, gap / 2 + 8, HEIGHT - gap / 2 - 8);
    pillars.push({ x: startX + i * SPACING, top: center + gap / 2, ceil: center - gap / 2 });
  }
  return {
    width: WIDTH,
    height: HEIGHT,
    birdY: 46,
    vy: 0,
    pillars,
    started: false,
    landed: false,
    landedEver: false,
    elapsed: 0,
    limit: LIMIT,
    status: "playing",
    foundHiddenPath: false,
  };
}

export function flapFlappy(s: FlappyState): FlappyState {
  if (s.status !== "playing") return s;
  if (!s.started) { s.started = true; return s; } // the first click just begins the game (then it falls)
  s.landed = false; // taking off again resumes the world
  s.vy = -FLAP;
  return s;
}

export function stepFlappy(s: FlappyState, dtMs: number): FlappyState {
  if (s.status !== "playing" || !s.started) return s; // hold until the first click

  s.elapsed += dtMs; // the clock always runs — even while perched
  if (s.elapsed >= s.limit) {
    s.status = "won";
    s.foundHiddenPath = s.landedEver;
    return s;
  }
  if (s.landed) return s; // perched: frozen bird, frozen world

  const prevBottom = s.birdY + BIRD_R;
  s.vy += GRAVITY * dtMs;
  s.birdY += s.vy * dtMs;
  if (s.birdY < 0) { s.birdY = 0; s.vy = 0; }
  const curBottom = s.birdY + BIRD_R;
  if (curBottom >= HEIGHT) { s.status = "lost"; return s; } // floor

  for (const p of s.pillars) p.x -= SPEED * dtMs;

  for (const p of s.pillars) {
    const overlapX = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PILLAR_W;
    if (!overlapX) continue;
    if (p.ceil > 0 && s.birdY - BIRD_R <= p.ceil) { s.status = "lost"; return s; } // flew into the ceiling pipe
    if (curBottom < p.top) continue; // above the bottom column → in the gap or over the top
    if (prevBottom <= p.top) { // came down onto the top from above → perch
      s.birdY = p.top - BIRD_R;
      s.vy = 0;
      s.landed = true;
      s.landedEver = true;
      break;
    }
    s.status = "lost"; // was already below the top → hit it from the side
    return s;
  }
  return s;
}
