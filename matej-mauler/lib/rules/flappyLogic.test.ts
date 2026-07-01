import { describe, expect, it } from "vitest";
import { initFlappy, stepFlappy, flapFlappy, BIRD_X, HEIGHT } from "./flappyLogic";

describe("flappyLogic", () => {
  it("staying airborne to the time limit wins without the hidden path", () => {
    let s = initFlappy(1);
    s.pillars = []; // clear sky — just survive the clock
    let t = 0;
    while (s.status === "playing" && t < 30000) {
      if (s.birdY > HEIGHT / 2) flapFlappy(s);
      s = stepFlappy(s, 16);
      t += 16;
    }
    expect(s.status).toBe("won");
    expect(s.foundHiddenPath).toBe(false);
  });

  it("perching on a pillar top freezes the world but the clock runs on — won via the hidden path", () => {
    let s = initFlappy(1);
    s.pillars = [{ x: BIRD_X - 5, top: 60 }];
    s.birdY = 40; // above the pillar top
    s.vy = 0;
    for (let i = 0; i < 3000 && s.status === "playing"; i++) s = stepFlappy(s, 16);
    expect(s.landedEver).toBe(true);
    expect(s.status).toBe("won");
    expect(s.foundHiddenPath).toBe(true);
  });

  it("perching pins the pillar in place (the world stops scrolling)", () => {
    let s = initFlappy(1);
    s.pillars = [{ x: BIRD_X - 5, top: 60 }];
    s.birdY = 40;
    s.vy = 0;
    while (s.status === "playing" && !s.landed) s = stepFlappy(s, 16);
    expect(s.landed).toBe(true);
    const xAtLanding = s.pillars[0].x;
    s = stepFlappy(s, 16);
    s = stepFlappy(s, 16);
    expect(s.pillars[0].x).toBe(xAtLanding); // frozen
  });

  it("hitting a pillar from the side loses", () => {
    let s = initFlappy(1);
    s.pillars = [{ x: BIRD_X - 5, top: 30 }]; // tall pillar; bird is level with its body
    s.birdY = 70;
    s.vy = 0;
    s = stepFlappy(s, 16);
    expect(s.status).toBe("lost");
  });

  it("falling to the floor loses", () => {
    let s = initFlappy(1);
    s.pillars = [];
    for (let i = 0; i < 6000 && s.status === "playing"; i++) s = stepFlappy(s, 16); // never flap
    expect(s.status).toBe("lost");
  });
});
