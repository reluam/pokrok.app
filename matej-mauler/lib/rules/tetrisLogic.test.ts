import { describe, expect, it } from "vitest";
import {
  initTetris,
  moveTetris,
  tickTetris,
  WIDTH,
  HEIGHT,
  SCORE_TARGET,
  ESCAPE_MAX_ROW,
  type TetrisState,
} from "./tetrisLogic";

const emptyBoard = (): number[][] =>
  Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => 0));

// helper: place a single-cell "piece" at (x,y) for deterministic tests
const withPiece = (s: TetrisState, x: number, y: number): TetrisState => ({
  ...s,
  board: emptyBoard(),
  piece: { cells: [[x, y]], kind: 1 },
});

describe("tetrisLogic", () => {
  it("a piece pushed off the edge in the top third vanishes and flags the hidden path", () => {
    let s = withPiece(initTetris(1), 0, ESCAPE_MAX_ROW - 1); // in the top third
    s = moveTetris(s, "left"); // x = -1, fully off the left edge for a 1-wide piece
    expect(s.foundHiddenPath).toBe(true);
    // the escaped piece is gone; a fresh piece has spawned in-bounds
    expect(s.piece.cells.every(([x]) => x >= 0 && x < WIDTH)).toBe(true);
    expect(s.score).toBe(0); // escaping scores nothing
  });

  it("below the top third the side is a solid wall — no escape", () => {
    let s = withPiece(initTetris(1), 0, ESCAPE_MAX_ROW + 4); // below the escape zone
    s = moveTetris(s, "left"); // would go to x=-1 but the side is solid here
    expect(s.foundHiddenPath).toBe(false);
    expect(s.piece.cells[0][0]).toBe(0); // blocked: stayed in column 0
  });

  it("horizontal movement is blocked by a locked cell inside the field", () => {
    let s = withPiece(initTetris(1), 5, 5);
    s.board[5][6] = 3; // wall to the right
    const before = s.piece.cells[0][0];
    s = moveTetris(s, "right");
    expect(s.piece.cells[0][0]).toBe(before); // did not overlap the locked cell
  });

  it("locking a piece that completes a row clears it and scores", () => {
    let s = withPiece(initTetris(1), 0, HEIGHT - 1);
    // fill the bottom row except the landing column 0
    for (let x = 1; x < WIDTH; x++) s.board[HEIGHT - 1][x] = 2;
    s = tickTetris(s); // piece at floor → lock, completes the row, clears
    expect(s.score).toBe(100);
    expect(s.board[HEIGHT - 1].every((c) => c === 0)).toBe(true); // row cleared
  });

  it("reaching the score target wins", () => {
    let s = initTetris(1);
    s = { ...s, score: SCORE_TARGET - 100 };
    s = withPiece(s, 0, HEIGHT - 1);
    for (let x = 1; x < WIDTH; x++) s.board[HEIGHT - 1][x] = 2;
    s = tickTetris(s);
    expect(s.score).toBeGreaterThanOrEqual(SCORE_TARGET);
    expect(s.status).toBe("won");
  });

  it("topping out does not produce a game-over / terminal status", () => {
    let s = initTetris(1);
    // fill most of the board high
    for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) s.board[y][x] = 4;
    s = tickTetris(s);
    expect(s.status).not.toBe("over");
    expect(["playing", "won"]).toContain(s.status);
  });
});
