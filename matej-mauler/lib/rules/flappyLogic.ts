// Flappy — tap to flap through the gaps. The hidden path: a SKY band along the top that no pipe ever
// reaches. Climb into it and cruise over every pipe; you never had to thread a single gap.

export const WIDTH = 140;
export const HEIGHT = 100;
export const BIRD_X = 34;
export const BIRD_R = 3.5;
export const SKY = 20; // y in [0, SKY) is always clear of pipes — the way over the top
export const PIPE_W = 16;
export const GAP_H = 30;
export const SPACING = 58;
export const SPEED = 0.03; // units per ms
export const GRAVITY = 0.0011; // vy units per ms
export const FLAP = 0.34; // upward impulse
export const TOTAL_PIPES = 6;

export type Pipe = { x: number; gapY: number; passed: boolean };

export type FlappyState = {
  width: number;
  height: number;
  sky: number;
  birdY: number;
  vy: number;
  pipes: Pipe[];
  passed: number;
  total: number;
  threadedAny: boolean; // passed a pipe through its gap rather than over the top
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
  const pipes: Pipe[] = [];
  // gapY is the gap centre; the top pipe starts at SKY, so gapY is always >= SKY + GAP_H/2 → the
  // sky band stays clear no matter what.
  const minGapY = SKY + GAP_H / 2 + 6;
  const maxGapY = HEIGHT - GAP_H / 2 - 6;
  for (let i = 0; i < TOTAL_PIPES; i++) {
    pipes.push({ x: WIDTH + 12 + i * SPACING, gapY: minGapY + rand() * (maxGapY - minGapY), passed: false });
  }
  return {
    width: WIDTH,
    height: HEIGHT,
    sky: SKY,
    birdY: HEIGHT / 2,
    vy: 0,
    pipes,
    passed: 0,
    total: TOTAL_PIPES,
    threadedAny: false,
    status: "playing",
    foundHiddenPath: false,
  };
}

export function flapFlappy(s: FlappyState): FlappyState {
  if (s.status !== "playing") return s;
  s.vy = -FLAP;
  return s;
}

export function stepFlappy(s: FlappyState, dtMs: number): FlappyState {
  if (s.status !== "playing") return s;
  s.vy += GRAVITY * dtMs;
  s.birdY += s.vy * dtMs;
  if (s.birdY < 0) { s.birdY = 0; s.vy = 0; } // ceiling: you can ride the very top
  if (s.birdY > s.height) { s.status = "lost"; return s; } // floor

  for (const p of s.pipes) {
    p.x -= SPEED * dtMs;
    const overlapX = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W;
    if (overlapX) {
      const inTop = s.birdY >= s.sky && s.birdY <= p.gapY - GAP_H / 2;
      const inBottom = s.birdY >= p.gapY + GAP_H / 2;
      if (inTop || inBottom) { s.status = "lost"; return s; }
    }
    if (!p.passed && p.x + PIPE_W < BIRD_X) {
      p.passed = true;
      if (s.birdY >= s.sky) s.threadedAny = true; // passed through a gap, not over the top
      s.passed += 1;
      if (s.passed >= s.total) {
        s.status = "won";
        s.foundHiddenPath = !s.threadedAny;
      }
    }
  }
  return s;
}
