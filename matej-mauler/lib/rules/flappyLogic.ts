// Flappy — survive 15 seconds. The bird falls slowly; a warning flashes near the floor. The hidden
// path: let the bird settle on TOP of a pillar (even the first one). It sticks there, the whole world
// stops scrolling — but the clock keeps ticking. You wait out the 15s in perfect stillness.
// The catch: you must come down onto a pillar from above. Hit one from the side and you're done.

export const WIDTH = 140;
export const HEIGHT = 100;
export const BIRD_X = 44;
export const BIRD_R = 4;
export const PILLAR_W = 22;
export const PILLAR_TOP_MIN = 48;
export const PILLAR_TOP_MAX = 70;
export const SPACING = 46;
export const PILLAR_COUNT = 8;
export const SPEED = 0.008; // units per ms — slow world scroll
export const GRAVITY = 0.00002; // vy per ms — a gentle, slow fall
export const FLAP = 0.06; // upward impulse
export const LIMIT = 15000; // survive this many ms
export const WARN_Y = HEIGHT - 24; // below this, flash the warning

export type Pillar = { x: number; top: number }; // solid column from `top` down to the floor

export type FlappyState = {
  width: number;
  height: number;
  birdY: number;
  vy: number;
  pillars: Pillar[];
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

export function initFlappy(seed = 1): FlappyState {
  const rand = rng(seed);
  const startX = BIRD_X - PILLAR_W / 2; // the first pillar sits right under the start — let it fall
  const pillars: Pillar[] = [{ x: startX, top: 66 }];
  for (let i = 1; i < PILLAR_COUNT; i++) {
    pillars.push({ x: startX + i * SPACING, top: PILLAR_TOP_MIN + rand() * (PILLAR_TOP_MAX - PILLAR_TOP_MIN) });
  }
  return {
    width: WIDTH,
    height: HEIGHT,
    birdY: 46,
    vy: 0,
    pillars,
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
  s.landed = false; // taking off again resumes the world
  s.vy = -FLAP;
  return s;
}

export function stepFlappy(s: FlappyState, dtMs: number): FlappyState {
  if (s.status !== "playing") return s;

  // the clock always runs — even while perched
  s.elapsed += dtMs;
  if (s.elapsed >= s.limit) {
    s.status = "won";
    s.foundHiddenPath = s.landedEver;
    return s;
  }
  if (s.landed) return s; // perched: frozen bird, frozen world

  const prevBottom = s.birdY + BIRD_R;
  s.vy += GRAVITY * dtMs;
  s.birdY += s.vy * dtMs;
  if (s.birdY < 0) { s.birdY = 0; s.vy = 0; } // ceiling
  const curBottom = s.birdY + BIRD_R;
  if (curBottom >= HEIGHT) { s.status = "lost"; return s; } // floor

  for (const p of s.pillars) p.x -= SPEED * dtMs;

  for (const p of s.pillars) {
    const overlapX = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PILLAR_W;
    if (!overlapX) continue;
    if (curBottom < p.top) continue; // above the pillar top → flying over it
    if (prevBottom <= p.top) {
      // came down onto the top from above → perch
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
