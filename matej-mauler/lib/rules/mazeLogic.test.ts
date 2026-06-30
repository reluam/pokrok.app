import { describe, expect, it } from "vitest";
import { MAZE, passable, initMaze, moveMaze, type MazeState } from "./mazeLogic";

// BFS over passable tiles to prove solvability and find route lengths.
function bfsReaches(avoidFake: boolean): boolean {
  let start: [number, number] | null = null;
  let exit: [number, number] | null = null;
  for (let y = 0; y < MAZE.length; y++)
    for (let x = 0; x < MAZE[0].length; x++) {
      if (MAZE[y][x] === 3) start = [x, y];
      if (MAZE[y][x] === 4) exit = [x, y];
    }
  const seen = new Set<string>();
  const q = [start!];
  seen.add(start!.join(","));
  while (q.length) {
    const [x, y] = q.shift()!;
    if (x === exit![0] && y === exit![1]) return true;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (ny < 0 || ny >= MAZE.length || nx < 0 || nx >= MAZE[0].length) continue;
      if (!passable(MAZE, nx, ny)) continue;
      if (avoidFake && MAZE[ny][nx] === 2) continue;
      const k = nx + "," + ny;
      if (!seen.has(k)) {
        seen.add(k);
        q.push([nx, ny]);
      }
    }
  }
  return false;
}

// Shortest path length (in steps) from start to exit; fakes optionally treated as walls.
function bfsDist(avoidFake: boolean): number {
  let start: [number, number] | null = null;
  let exit: [number, number] | null = null;
  for (let y = 0; y < MAZE.length; y++)
    for (let x = 0; x < MAZE[0].length; x++) {
      if (MAZE[y][x] === 3) start = [x, y];
      if (MAZE[y][x] === 4) exit = [x, y];
    }
  const dist = new Map<string, number>();
  const q: [number, number][] = [start!];
  dist.set(start!.join(","), 0);
  while (q.length) {
    const [x, y] = q.shift()!;
    const d = dist.get(x + "," + y)!;
    if (x === exit![0] && y === exit![1]) return d;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (ny < 0 || ny >= MAZE.length || nx < 0 || nx >= MAZE[0].length) continue;
      if (!passable(MAZE, nx, ny)) continue;
      if (avoidFake && MAZE[ny][nx] === 2) continue;
      const k = nx + "," + ny;
      if (!dist.has(k)) {
        dist.set(k, d + 1);
        q.push([nx, ny]);
      }
    }
  }
  return -1;
}

const path = (s: MazeState, dirs: ("up" | "down" | "left" | "right")[]) =>
  dirs.reduce((acc, d) => moveMaze(acc, d), s);

describe("mazeLogic", () => {
  it("is solvable by a normal route that avoids the fake tile", () => {
    expect(bfsReaches(true)).toBe(true);
  });

  it("the secret straight-up route is shorter than the shortest legit route", () => {
    const legit = bfsDist(true); // fakes treated as walls → the shorter of the two legit paths
    const secret = bfsDist(false); // fakes open → the straight-up shortcut
    expect(secret).toBeGreaterThan(0);
    expect(secret).toBeLessThan(legit); // the hidden doors beat even the short legit path
    expect(secret).toBe(6); // straight up column 1
  });

  it("the fake switchback tiles are passable; a real wall is not", () => {
    expect(MAZE[6][1]).toBe(2);
    expect(MAZE[2][1]).toBe(2);
    expect(passable(MAZE, 1, 6)).toBe(true);
    expect(MAZE[4][2]).toBe(1);
    expect(passable(MAZE, 2, 4)).toBe(false);
  });

  it("walking straight up column 1 through the fake walls reaches the exit with foundHiddenPath", () => {
    let s = initMaze(); // start at (1,7)
    s = path(s, ["up", "up", "up", "up", "up", "up"]); // up col 1 through fakes (1,6) & (1,2) to exit (1,1)
    expect(s.status).toBe("won");
    expect(s.foundHiddenPath).toBe(true);
  });

  it("does not move through a real wall", () => {
    let s = initMaze(); // start (1,7); the left side (0,7) is a border wall
    expect(MAZE[7][0]).toBe(1);
    s = moveMaze(s, "left");
    expect([s.x, s.y]).toEqual([1, 7]); // unchanged
  });
});
