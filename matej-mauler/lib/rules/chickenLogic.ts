export type Dir = "up" | "down" | "left" | "right";

export type Car = { lane: number; x: number; w: number; speed: number; dir: 1 | -1 };

export type ChickenState = {
  cols: number;
  rows: number;
  px: number;
  py: number;
  lanes: Car[][];
  edgeCol: number;
  crossedTraffic: boolean;
  status: "playing" | "won";
  foundHiddenPath: boolean;
};

export const COLS = 11;
export const ROWS = 13;
export const EDGE_COL = 0;

// Deterministic mulberry32 PRNG so a seed → a fixed road.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initChicken(seed = 1): ChickenState {
  const rand = rng(seed);
  const lanes: Car[][] = [];
  for (let row = 0; row < ROWS; row++) {
    const cars: Car[] = [];
    const isTraffic = row >= 1 && row <= ROWS - 2;
    if (isTraffic) {
      const dir: 1 | -1 = rand() < 0.5 ? 1 : -1;
      const speed = 0.0012 + rand() * 0.0018; // cols per ms
      const count = 2 + Math.floor(rand() * 2);
      const gap = (COLS - 1) / count;
      for (let i = 0; i < count; i++) {
        // cars live in x ∈ [1, COLS): column 0 (EDGE_COL) is never covered
        cars.push({ lane: row, x: 1 + ((i * gap + rand() * gap) % (COLS - 1)), w: 1 + Math.floor(rand() * 2), speed, dir });
      }
    }
    lanes.push(cars);
  }
  return {
    cols: COLS,
    rows: ROWS,
    px: Math.floor(COLS / 2),
    py: ROWS - 1,
    lanes,
    edgeCol: EDGE_COL,
    crossedTraffic: false,
    status: "playing",
    foundHiddenPath: false,
  };
}

function carHits(s: ChickenState): boolean {
  if (s.py < 1 || s.py > s.rows - 2) return false; // safe rows
  for (const car of s.lanes[s.py]) {
    const lo = car.x;
    const hi = car.x + car.w;
    // player occupies [px, px+1)
    if (s.px + 1 > lo && s.px < hi) return true;
  }
  return false;
}

export function stepChicken(s: ChickenState, dtMs: number): ChickenState {
  if (s.status !== "playing") return s;
  const span = s.cols - 1; // cars wrap within [1, cols)
  for (const lane of s.lanes) {
    for (const car of lane) {
      car.x += car.speed * car.dir * dtMs * 1; // x is in cols
      // wrap inside [1, cols)
      while (car.x >= s.cols) car.x -= span;
      while (car.x < 1) car.x += span;
    }
  }
  if (carHits(s)) {
    s.px = Math.floor(s.cols / 2);
    s.py = s.rows - 1; // reset to start row (keeps crossedTraffic — they did try)
  }
  return s;
}

export function moveChicken(s: ChickenState, dir: Dir): ChickenState {
  if (s.status !== "playing") return s;
  let { px, py } = s;
  if (dir === "up") py -= 1;
  else if (dir === "down") py += 1;
  else if (dir === "left") px -= 1;
  else px += 1;
  if (px < 0 || px >= s.cols || py < 0 || py >= s.rows) return s; // wall
  s.px = px;
  s.py = py;
  if (py >= 1 && py <= s.rows - 2 && px !== s.edgeCol) s.crossedTraffic = true;
  if (carHits(s)) {
    s.px = Math.floor(s.cols / 2);
    s.py = s.rows - 1;
    return s;
  }
  if (py === 0) {
    s.status = "won";
    s.foundHiddenPath = !s.crossedTraffic;
  }
  return s;
}
