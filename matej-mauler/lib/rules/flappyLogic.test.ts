import { describe, expect, it } from "vitest";
import { initFlappy, stepFlappy, flapFlappy, BIRD_X, HEIGHT } from "./flappyLogic";

describe("flappyLogic", () => {
  it("only the first pillar is open-topped; later pillars have a ceiling and the gap shrinks", () => {
    const s = initFlappy(1);
    expect(s.pillars[0].ceil).toBe(0); // first: sittable, open above
    expect(s.pillars[1].ceil).toBeGreaterThan(0); // later ones are pipe-pairs
    const gap = (i: number) => s.pillars[i].top - s.pillars[i].ceil;
    expect(gap(2)).toBeLessThan(gap(1)); // gaps get narrower and narrower
    expect(gap(3)).toBeLessThan(gap(2));
  });

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

  it("perching on the open-topped pillar freezes the world but the clock runs on — won via the hidden path", () => {
    let s = initFlappy(1);
    s.pillars = [{ x: BIRD_X - 5, top: 60, ceil: 0 }];
    s.birdY = 40;
    s.vy = 0;
    for (let i = 0; i < 3000 && s.status === "playing"; i++) s = stepFlappy(s, 16);
    expect(s.landedEver).toBe(true);
    expect(s.status).toBe("won");
    expect(s.foundHiddenPath).toBe(true);
  });

  it("flying up into a ceiling pipe loses", () => {
    let s = initFlappy(1);
    s.pillars = [{ x: BIRD_X - 5, top: 72, ceil: 36 }];
    s.birdY = 20; // high — inside the ceiling pipe
    s.vy = 0;
    s = stepFlappy(s, 16);
    expect(s.status).toBe("lost");
  });

  it("hitting a pillar from the side loses", () => {
    let s = initFlappy(1);
    s.pillars = [{ x: BIRD_X - 5, top: 30, ceil: 0 }];
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
