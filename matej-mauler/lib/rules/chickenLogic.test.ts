import { describe, expect, it } from "vitest";
import {
  initChicken,
  moveChicken,
  stepChicken,
  COLS,
  ROWS,
  EDGE_COL,
  type ChickenState,
} from "./chickenLogic";

const clearCars = (s: ChickenState): ChickenState => ({ ...s, lanes: s.lanes.map(() => []) });

describe("chickenLogic", () => {
  it("never spawns a car in the edge column lane (x stays >= 1)", () => {
    const s = initChicken(1);
    for (const lane of s.lanes) {
      for (const car of lane) expect(car.x).toBeGreaterThanOrEqual(1);
    }
  });

  it("walking straight up the edge column wins via the hidden path", () => {
    let s = clearCars(initChicken(1));
    // move to the edge column first along the safe bottom row
    while (s.px > EDGE_COL) s = moveChicken(s, "left");
    while (s.status === "playing") s = moveChicken(s, "up");
    expect(s.status).toBe("won");
    expect(s.crossedTraffic).toBe(false);
    expect(s.foundHiddenPath).toBe(true);
  });

  it("crossing straight up through traffic columns wins without the hidden path", () => {
    let s = clearCars(initChicken(1)); // cars cleared so we can reach the top deterministically
    while (s.status === "playing") s = moveChicken(s, "up"); // straight up the center column
    expect(s.status).toBe("won");
    expect(s.crossedTraffic).toBe(true);
    expect(s.foundHiddenPath).toBe(false);
  });

  it("a car overlapping the player resets the player to the start row", () => {
    let s = initChicken(1);
    // place player into a traffic lane at a non-edge column, with a car exactly on it
    const laneRow = ROWS - 2; // a traffic row
    s = { ...s, px: 5, py: laneRow };
    s.lanes[laneRow] = [{ lane: laneRow, x: 5, w: 2, speed: 0, dir: 1 }];
    s = stepChicken(s, 16);
    expect(s.py).toBe(ROWS - 1); // reset to bottom
  });
});
