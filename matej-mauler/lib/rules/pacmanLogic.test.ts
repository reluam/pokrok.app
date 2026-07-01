import { describe, expect, it } from "vitest";
import { initPacman, setDirPacman, stepPacman, MAZE } from "./pacmanLogic";

describe("pacmanLogic", () => {
  it("the exit is a gap in the left wall, reachable as a path", () => {
    expect(MAZE[4][0]).toBe(5); // exit
    expect(MAZE[4][1]).toBe(0); // path leading to it
  });

  it("walking out the side exit leaves the maze — won via the hidden path", () => {
    const s = initPacman();
    s.ghosts = [];
    s.pac = { x: 1, y: 4, dir: "left" };
    const r = stepPacman(s); // step onto the exit at (0,4)
    expect(r.status).toBe("won");
    expect(r.foundHiddenPath).toBe(true);
  });

  it("eating the last dot wins the long way (no hidden path)", () => {
    const s = initPacman();
    s.ghosts = [];
    s.pac = { x: 1, y: 1, dir: "right" };
    s.dots = new Set(["2,1"]); // only one dot left, at (2,1)
    const r = stepPacman(s);
    expect(r.status).toBe("won");
    expect(r.foundHiddenPath).toBe(false);
  });

  it("a ghost catching pac loses", () => {
    const s = initPacman();
    s.pac = { x: 1, y: 5, dir: "up" };
    s.ghosts = [{ x: 1, y: 4 }]; // pac steps up into the ghost
    const r = stepPacman(s);
    expect(r.status).toBe("lost");
  });

  it("pac does not walk through walls", () => {
    const s = initPacman();
    s.ghosts = [];
    s.pac = { x: 1, y: 1, dir: "up" }; // (1,0) is a wall
    setDirPacman(s, "up");
    const r = stepPacman(s);
    expect([r.pac.x, r.pac.y]).toEqual([1, 1]); // unchanged
  });
});
