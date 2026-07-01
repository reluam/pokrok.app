// Pac-Man — eat every dot, dodge the ghosts. The hidden path: a gap in the left wall is an exit, not
// a wrap-around tunnel. Walk out of it and you've left the maze entirely. You could have just left.

// tiles: 1 wall · 0 path (dot) · 3 pac start · 4 ghost start · 5 exit (the way out)
export const MAZE: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [5, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const W = MAZE[0].length;
export const H = MAZE.length;

export type Dir = "up" | "down" | "left" | "right";
const VEC: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export type PacmanState = {
  pac: { x: number; y: number; dir: Dir | null };
  ghosts: { x: number; y: number }[];
  dots: Set<string>;
  status: "playing" | "won" | "lost";
  foundHiddenPath: boolean;
};

const tileAt = (x: number, y: number) => (y < 0 || y >= H || x < 0 || x >= W ? 1 : MAZE[y][x]);
const passablePac = (x: number, y: number) => tileAt(x, y) !== 1;
const passableGhost = (x: number, y: number) => tileAt(x, y) !== 1 && tileAt(x, y) !== 5;

function find(tile: number): [number, number] {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (MAZE[y][x] === tile) return [x, y];
  return [1, 1];
}

export function initPacman(): PacmanState {
  const [px, py] = find(3);
  const [gx, gy] = find(4);
  const dots = new Set<string>();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (MAZE[y][x] === 0) dots.add(`${x},${y}`);
  return {
    pac: { x: px, y: py, dir: null },
    ghosts: [{ x: gx, y: gy }],
    dots,
    status: "playing",
    foundHiddenPath: false,
  };
}

export function setDirPacman(s: PacmanState, dir: Dir): PacmanState {
  if (s.status !== "playing") return s;
  s.pac.dir = dir;
  return s;
}

function moveGhost(g: { x: number; y: number }, pac: { x: number; y: number }) {
  let best: [number, number] | null = null;
  let bestD = Infinity;
  for (const d of ["up", "down", "left", "right"] as Dir[]) {
    const nx = g.x + VEC[d][0];
    const ny = g.y + VEC[d][1];
    if (!passableGhost(nx, ny)) continue;
    const dist = Math.abs(nx - pac.x) + Math.abs(ny - pac.y);
    if (dist < bestD) { bestD = dist; best = [nx, ny]; }
  }
  if (best) { g.x = best[0]; g.y = best[1]; }
}

const collides = (s: PacmanState) => s.ghosts.some((g) => g.x === s.pac.x && g.y === s.pac.y);

export function stepPacman(s: PacmanState): PacmanState {
  if (s.status !== "playing") return s;

  // move pac in its current direction if the way is open
  if (s.pac.dir) {
    const [dx, dy] = VEC[s.pac.dir];
    if (passablePac(s.pac.x + dx, s.pac.y + dy)) {
      s.pac.x += dx;
      s.pac.y += dy;
    }
  }

  if (tileAt(s.pac.x, s.pac.y) === 5) {
    s.status = "won";
    s.foundHiddenPath = true; // walked out the side — left the maze entirely
    return s;
  }

  s.dots.delete(`${s.pac.x},${s.pac.y}`);
  if (s.dots.size === 0) {
    s.status = "won"; // cleared every dot the long way
    return s;
  }

  if (collides(s)) { s.status = "lost"; return s; } // ran into a ghost

  // ghosts only start hunting once the player has started moving
  if (s.pac.dir) {
    for (const g of s.ghosts) moveGhost(g, s.pac);
    if (collides(s)) { s.status = "lost"; return s; } // a ghost caught up
  }

  return s;
}
