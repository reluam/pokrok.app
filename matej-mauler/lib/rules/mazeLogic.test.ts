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

const path = (s: MazeState, dirs: ("up" | "down" | "left" | "right")[]) =>
  dirs.reduce((acc, d) => moveMaze(acc, d), s);

describe("mazeLogic", () => {
  it("is solvable by a normal route that avoids the fake tile", () => {
    expect(bfsReaches(true)).toBe(true);
  });

  it("the fake tile is passable; a real wall next to it is not", () => {
    expect(MAZE[4][4]).toBe(2);
    expect(passable(MAZE, 4, 4)).toBe(true);
    expect(MAZE[4][2]).toBe(1);
    expect(passable(MAZE, 2, 4)).toBe(false);
  });

  it("walking up column 4 through the fake tile reaches the exit with foundHiddenPath", () => {
    let s = initMaze(); // start at (1,7)
    s = path(s, ["right", "right", "right"]); // to (4,7)
    s = path(s, ["up", "up", "up", "up", "up", "up"]); // up col 4 through fake (4,4) to (4,1)
    s = path(s, ["right", "right", "right"]); // to exit (7,1)
    expect(s.status).toBe("won");
    expect(s.foundHiddenPath).toBe(true);
  });

  it("does not move through a real wall", () => {
    let s = initMaze(); // (1,7), wall above at (1,6)? it is '1'
    expect(MAZE[6][1]).toBe(1);
    s = moveMaze(s, "up");
    expect([s.x, s.y]).toEqual([1, 7]); // unchanged
  });
});
