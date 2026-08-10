import { describe, expect, it } from "vitest";
import { initTTT, placeTTT, X, O } from "./tttLogic";

describe("tttLogic", () => {
  it("a line drawn in the margin ring wins via the hidden path", () => {
    let s = initTTT();
    s = placeTTT(s, 0, 1);
    s = placeTTT(s, 0, 2);
    s = placeTTT(s, 0, 3); // three X down the left margin column
    expect(s.status).toBe("won");
    expect(s.foundHiddenPath).toBe(true);
  });

  it("the machine answers the very first move", () => {
    let s = initTTT();
    s = placeTTT(s, 1, 1);
    const oCount = s.cells.flat().filter((c) => c === O).length;
    expect(oCount).toBe(1);
  });

  it("the machine blocks an inner three-in-a-row threat", () => {
    let s = initTTT();
    s = placeTTT(s, 1, 1); // one X, no threat yet → machine passes
    s = placeTTT(s, 2, 1); // two X in inner row y=1 → machine must block (3,1)
    expect(s.cells[1][3]).toBe(O);
  });

  it("the machine never plays in the margin ring", () => {
    let s = initTTT();
    s = placeTTT(s, 0, 0);
    s = placeTTT(s, 4, 0);
    s = placeTTT(s, 0, 4);
    const marginHasO = [
      [0, 0], [4, 0], [0, 4], [4, 4], [2, 0], [0, 2], [4, 2], [2, 4],
    ].some(([x, y]) => s.cells[y][x] === O);
    expect(marginHasO).toBe(false);
  });

  it("a win entirely inside the grid is not the hidden path", () => {
    const s = initTTT();
    s.cells[1][1] = X; // pre-seed two inner X (bypassing the AI) so the third completes the row
    s.cells[1][2] = X;
    const r = placeTTT(s, 3, 1); // inner row y=1 complete, all inner cells
    expect(r.status).toBe("won");
    expect(r.foundHiddenPath).toBe(false);
  });

  it("filling the inner grid with no line is a draw", () => {
    const s = initTTT();
    const fill = [
      [X, O, X],
      [X, O, O],
      [O, X, X],
    ];
    for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) s.cells[y][x] = fill[y - 1][x - 1] as 1 | 2;
    const r = placeTTT(s, 0, 0); // a margin move, no line → the inner grid is full → draw
    expect(r.status).toBe("draw");
  });
});
