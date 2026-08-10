// Tic-Tac-Toe — three in a row vs the machine. The hidden path: the board is a 3×3, but it sits
// inside a one-cell margin ring. The AI only ever plays (and blocks) inside the 3×3 — so a line that
// reaches into the margin is one it never defends. You can draw outside the grid.

export const SIZE = 5; // full board including the margin ring; the official grid is the inner 3×3
export const EMPTY = 0;
export const X = 1; // player
export const O = 2; // machine
export type Cell = 0 | 1 | 2;

export type TTTState = {
  cells: Cell[][]; // [y][x], SIZE×SIZE
  status: "playing" | "won" | "lost" | "draw";
  foundHiddenPath: boolean;
};

export const isInner = (x: number, y: number) => x >= 1 && x <= 3 && y >= 1 && y <= 3;
export const inBounds = (x: number, y: number) => x >= 0 && x < SIZE && y >= 0 && y < SIZE;
export const isMargin = (x: number, y: number) => inBounds(x, y) && !isInner(x, y);

const DIRS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

// any three-in-a-row of `mark` anywhere on the 5×5 → returns the winning triple, else null
function findWin(cells: Cell[][], mark: Cell): [number, number][] | null {
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++)
      for (const [dx, dy] of DIRS) {
        const tri: [number, number][] = [
          [x, y],
          [x + dx, y + dy],
          [x + 2 * dx, y + 2 * dy],
        ];
        if (tri.every(([cx, cy]) => inBounds(cx, cy) && cells[cy][cx] === mark)) return tri;
      }
  return null;
}

// the 8 lines of the inner 3×3
const INNER_LINES: [number, number][][] = (() => {
  const lines: [number, number][][] = [];
  for (let y = 1; y <= 3; y++) lines.push([[1, y], [2, y], [3, y]]);
  for (let x = 1; x <= 3; x++) lines.push([[x, 1], [x, 2], [x, 3]]);
  lines.push([[1, 1], [2, 2], [3, 3]]);
  lines.push([[3, 1], [2, 2], [1, 3]]);
  return lines;
})();

// machine = a competent opponent that plays a move every turn — but only ever inside the 3×3. It
// wins if it can, blocks the player's inner threat, else takes the centre / a corner / an edge. It
// never touches the margin, so a line reaching outside the grid is one it can't see.
function aiMove(cells: Cell[][]): [number, number] | null {
  const lineGap = (mark: Cell): [number, number] | null => {
    for (const line of INNER_LINES) {
      const same = line.filter(([cx, cy]) => cells[cy][cx] === mark).length;
      const empties = line.filter(([cx, cy]) => cells[cy][cx] === EMPTY);
      if (same === 2 && empties.length === 1) return empties[0];
    }
    return null;
  };
  const win = lineGap(O);
  if (win) return win; // take the win
  const block = lineGap(X);
  if (block) return block; // block the player
  const prefs: [number, number][] = [
    [2, 2], // centre
    [1, 1], [3, 1], [1, 3], [3, 3], // corners
    [2, 1], [1, 2], [3, 2], [2, 3], // edges
  ];
  for (const [cx, cy] of prefs) if (cells[cy][cx] === EMPTY) return [cx, cy];
  return null;
}

const innerFull = (cells: Cell[][]) => {
  for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) if (cells[y][x] === EMPTY) return false;
  return true;
};
const boardFull = (cells: Cell[][]) => cells.every((row) => row.every((c) => c !== EMPTY));

export function initTTT(): TTTState {
  return {
    cells: Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => EMPTY as Cell)),
    status: "playing",
    foundHiddenPath: false,
  };
}

export function placeTTT(s: TTTState, x: number, y: number): TTTState {
  if (s.status !== "playing") return s;
  if (!inBounds(x, y) || s.cells[y][x] !== EMPTY) return s; // illegal
  const cells = s.cells.map((r) => r.slice() as Cell[]);
  cells[y][x] = X;

  const win = findWin(cells, X);
  if (win) {
    return { ...s, cells, status: "won", foundHiddenPath: win.some(([cx, cy]) => isMargin(cx, cy)) };
  }

  // the machine answers every move (including your first)
  const ai = aiMove(cells);
  if (ai) cells[ai[1]][ai[0]] = O;
  if (findWin(cells, O)) return { ...s, cells, status: "lost", foundHiddenPath: false };

  const status: TTTState["status"] = innerFull(cells) || boardFull(cells) ? "draw" : "playing";
  return { ...s, cells, status };
}
