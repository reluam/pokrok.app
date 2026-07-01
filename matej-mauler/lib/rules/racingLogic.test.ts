import { describe, expect, it } from "vitest";
import { initRacing, setVelRacing, stepRacing, FINISH_Y, type RacingState } from "./racingLogic";

// teleport the car below the line, then drive it up across the finish (a forward crossing)
function crossUp(s: RacingState): RacingState {
  s.car.x = 60;
  s.car.y = FINISH_Y + 3;
  setVelRacing(s, 0, 0);
  s = stepRacing(s, 1); // settle below (no crossing)
  setVelRacing(s, 0, -1);
  s = stepRacing(s, 10); // drive up across the line
  return s;
}

// park on the checkpoint so it registers as touched
function touchCP(s: RacingState): RacingState {
  s.car.x = s.checkpoint.x;
  s.car.y = s.checkpoint.y;
  setVelRacing(s, 0, 0);
  return stepRacing(s, 1);
}

describe("racingLogic", () => {
  it("the first finish crossing is the start, not a lap", () => {
    let s = initRacing();
    s = crossUp(s);
    expect(s.started).toBe(true);
    expect(s.lap).toBe(0);
  });

  it("cutting across (never touching the checkpoint) still completes laps — won via the hidden path", () => {
    let s = initRacing();
    for (let i = 0; i < 4; i++) s = crossUp(s); // start + three cut laps
    expect(s.status).toBe("won");
    expect(s.foundHiddenPath).toBe(true);
  });

  it("proper laps around the checkpoint win without the hidden path", () => {
    let s = initRacing();
    s = crossUp(s); // start
    for (let i = 0; i < 3; i++) {
      s = touchCP(s);
      s = crossUp(s);
    }
    expect(s.status).toBe("won");
    expect(s.foundHiddenPath).toBe(false);
  });
});
