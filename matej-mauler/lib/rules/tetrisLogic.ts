export const WIDTH = 10;
export const HEIGHT = 20;
export const SCORE_TARGET = 1000;
export const LINE_SCORES: Record<number, number> = { 1: 100, 2: 250, 3: 500, 4: 800 };
// An off-edge escape can only BEGIN in the top quarter of the field — above this row the sides are
// open, below it they are solid walls (unless the piece has already started escaping).
export const ESCAPE_MAX_ROW = Math.floor(HEIGHT / 4);

export type Cell = number;
// `escaping`: once a piece pokes off the side while in the top quarter, the side walls stop
// applying to it entirely — it can be pushed fully off even after it has fallen below the quarter.
export type Piece = { cells: [number, number][]; kind: number; escaping: boolean };
// Points awarded for each piece completely removed from the field by pushing it off the edge.
export const ESCAPE_SCORE = 100;

export type TetrisState = {
  board: Cell[][];
  piece: Piece;
  score: number;
  status: "playing" | "won";
  foundHiddenPath: boolean;
  seed: number;
};

// 7 tetrominoes as relative cell offsets, spawned near the top center.
const SHAPES: [number, number][][] = [
  [[0, 0], [1, 0], [2, 0], [3, 0]], // I
  [[0, 0], [1, 0], [0, 1], [1, 1]], // O
  [[0, 0], [1, 0], [2, 0], [1, 1]], // T
  [[0, 0], [1, 0], [1, 1], [2, 1]], // S
  [[1, 0], [2, 0], [0, 1], [1, 1]], // Z
  [[0, 0], [1, 0], [2, 0], [2, 1]], // J
  [[0, 0], [1, 0], [2, 0], [0, 1]], // L
];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function freshBoard(): Cell[][] {
  return Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => 0));
}

function spawn(seed: number): { piece: Piece; seed: number } {
  const rand = rng(seed);
  const kind = Math.floor(rand() * SHAPES.length);
  const offset = 3;
  const cells = SHAPES[kind].map(([x, y]) => [x + offset, y] as [number, number]);
  return { piece: { cells, kind: kind + 1, escaping: false }, seed: (seed * 1664525 + 1013904223) >>> 0 };
}

// Spawn the next piece onto `board`. If it can't be placed (topped out / clogged), restart the
// play field — a clean board instead of a frozen, stuck game. Score is preserved.
function spawnInto(board: Cell[][], seed: number): { board: Cell[][]; piece: Piece; seed: number } {
  const { piece, seed: next } = spawn(seed);
  if (collides(board, piece.cells, false)) return { board: freshBoard(), piece, seed: next };
  return { board, piece, seed: next };
}

export function initTetris(seed = 1): TetrisState {
  const { piece, seed: next } = spawn(seed);
  return { board: freshBoard(), piece, score: 0, status: "playing", foundHiddenPath: false, seed: next };
}

function collides(board: Cell[][], cells: [number, number][], escaping: boolean): boolean {
  for (const [x, y] of cells) {
    if (y >= HEIGHT) return true; // floor
    if (x < 0 || x >= WIDTH) {
      // a piece already escaping ignores the side walls entirely; otherwise the sides are open
      // only in the top quarter (where an escape can begin) and solid below it
      if (escaping || y < ESCAPE_MAX_ROW) continue;
      return true;
    }
    if (y >= 0 && board[y][x] !== 0) return true; // locked cell
  }
  return false;
}

function fullyEscaped(cells: [number, number][]): boolean {
  return cells.every(([x]) => x < 0) || cells.every(([x]) => x >= WIDTH);
}

function clearLines(board: Cell[][]): { board: Cell[][]; cleared: number } {
  const kept = board.filter((row) => row.some((c) => c === 0));
  const cleared = HEIGHT - kept.length;
  while (kept.length < HEIGHT) kept.unshift(Array.from({ length: WIDTH }, () => 0));
  return { board: kept, cleared };
}

function lockAndSpawn(s: TetrisState): TetrisState {
  const board = s.board.map((r) => r.slice());
  for (const [x, y] of s.piece.cells)
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) board[y][x] = s.piece.kind;
  const { board: cleared, cleared: n } = clearLines(board);
  const score = s.score + (LINE_SCORES[n] ?? 0);
  const next = spawnInto(cleared, s.seed);
  return {
    ...s,
    board: next.board,
    piece: next.piece,
    seed: next.seed,
    score,
    status: score >= SCORE_TARGET ? "won" : "playing",
  };
}

export function tickTetris(s: TetrisState): TetrisState {
  if (s.status !== "playing") return s;
  const moved = s.piece.cells.map(([x, y]) => [x, y + 1] as [number, number]);
  if (collides(s.board, moved, s.piece.escaping)) return lockAndSpawn(s);
  return { ...s, piece: { ...s.piece, cells: moved } };
}

export function moveTetris(s: TetrisState, dir: "left" | "right" | "down"): TetrisState {
  if (s.status !== "playing") return s;
  const d = dir === "left" ? [-1, 0] : dir === "right" ? [1, 0] : [0, 1];
  const moved = s.piece.cells.map(([x, y]) => [x + d[0], y + d[1]] as [number, number]);
  if (dir === "down" && collides(s.board, moved, s.piece.escaping)) return lockAndSpawn(s);
  // a piece fully off the side is removed and scores — once escaping, anywhere; otherwise only
  // if the whole move happens in the top quarter (where an escape is allowed to begin)
  const canEscape = s.piece.escaping || moved.every(([, y]) => y < ESCAPE_MAX_ROW);
  if (fullyEscaped(moved) && canEscape) {
    const next = spawnInto(s.board, s.seed);
    const score = s.score + ESCAPE_SCORE; // 100 per piece pushed clean off the field
    return {
      ...s,
      board: next.board,
      piece: next.piece,
      seed: next.seed,
      foundHiddenPath: true,
      score,
      status: score >= SCORE_TARGET ? "won" : "playing",
    };
  }
  if (collides(s.board, moved, s.piece.escaping)) return s; // blocked
  // the move succeeded; if it poked off the side, the piece is now escaping for the rest of its life
  const poked = moved.some(([x]) => x < 0 || x >= WIDTH);
  return { ...s, piece: { ...s.piece, cells: moved, escaping: s.piece.escaping || poked } };
}

export function rotateTetris(s: TetrisState): TetrisState {
  if (s.status !== "playing") return s;
  // rotate 90° about the piece's first cell as pivot
  const [ox, oy] = s.piece.cells[0];
  const rotated = s.piece.cells.map(([x, y]) => [ox - (y - oy), oy + (x - ox)] as [number, number]);
  if (collides(s.board, rotated, s.piece.escaping)) return s;
  return { ...s, piece: { ...s.piece, cells: rotated } };
}

export function dropTetris(s: TetrisState): TetrisState {
  if (s.status !== "playing") return s;
  let cells = s.piece.cells;
  while (true) {
    const next = cells.map(([x, y]) => [x, y + 1] as [number, number]);
    if (collides(s.board, next, s.piece.escaping)) break;
    cells = next;
  }
  return lockAndSpawn({ ...s, piece: { ...s.piece, cells } });
}
