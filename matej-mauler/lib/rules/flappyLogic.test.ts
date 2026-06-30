import { describe, expect, it } from "vitest";
import {
  initFlappy,
  stepFlappy,
  BIRD_X,
  PIPE_W,
  GAP_H,
  SKY,
  TOTAL_PIPES,
  type FlappyState,
} from "./flappyLogic";

describe("flappyLogic", () => {
  it("no pipe ever reaches into the sky band", () => {
    const s = initFlappy(1);
    expect(s.pipes.length).toBe(TOTAL_PIPES);
    for (const p of s.pipes) expect(p.gapY - GAP_H / 2).toBeGreaterThanOrEqual(SKY);
  });

  it("cruising the sky band clears every pipe — won via the hidden path", () => {
    let s = initFlappy(1);
    for (let i = 0; i < 8000 && s.status === "playing"; i++) {
      s.birdY = 5; // hold the bird up in the clear sky band
      s.vy = 0;
      s = stepFlappy(s, 16);
    }
    expect(s.status).toBe("won");
    expect(s.threadedAny).toBe(false);
    expect(s.foundHiddenPath).toBe(true);
  });

  it("passing a pipe through its gap counts as threaded — won without the hidden path", () => {
    const s = initFlappy(1);
    s.pipes = [{ x: BIRD_X - PIPE_W - 0.5, gapY: 50, passed: false }];
    s.total = 1;
    s.passed = 0;
    s.birdY = 50; // in the gap, well below the sky band
    s.vy = 0;
    stepFlappy(s, 16);
    expect(s.status).toBe("won");
    expect(s.threadedAny).toBe(true);
    expect(s.foundHiddenPath).toBe(false);
  });

  it("flying into a pipe loses", () => {
    const s: FlappyState = initFlappy(1);
    s.pipes = [{ x: BIRD_X - 2, gapY: 60, passed: false }];
    s.birdY = 25; // inside the top pipe (between the sky band and the gap)
    s.vy = 0;
    stepFlappy(s, 16);
    expect(s.status).toBe("lost");
  });
});
