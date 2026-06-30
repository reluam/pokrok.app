import type { Dir } from "./chickenLogic";

// 0 open · 1 wall · 2 fake (passable, looks identical to a wall) · 3 start · 4 exit
// One winding S-path: start bottom-left, exit top-right, connectors forced to a single route.
// The hidden path is straight UP column 1 from the start — its two switchback walls (rows 6 & 2)
// are fake and give way, a shortcut that bypasses the whole S.
export const MAZE: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 4, 1],
  [1, 2, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 2, 1, 1, 1, 1, 1, 0, 1],
  [1, 3, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export type MazeState = {
  x: number;
  y: number;
  status: "playing" | "won";
  foundHiddenPath: boolean;
};

export function passable(grid: number[][], x: number, y: number): boolean {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return false;
  return grid[y][x] !== 1; // open / fake / start / exit are walkable
}

export function initMaze(): MazeState {
  for (let y = 0; y < MAZE.length; y++)
    for (let x = 0; x < MAZE[0].length; x++)
      if (MAZE[y][x] === 3) return { x, y, status: "playing", foundHiddenPath: false };
  return { x: 1, y: 7, status: "playing", foundHiddenPath: false };
}

export function moveMaze(s: MazeState, dir: Dir): MazeState {
  if (s.status !== "playing") return s;
  let { x, y } = s;
  if (dir === "up") y -= 1;
  else if (dir === "down") y += 1;
  else if (dir === "left") x -= 1;
  else x += 1;
  if (!passable(MAZE, x, y)) return s;
  const tile = MAZE[y][x];
  const found = s.foundHiddenPath || tile === 2;
  if (tile === 4) return { x, y, status: "won", foundHiddenPath: found };
  return { x, y, status: "playing", foundHiddenPath: found };
}
