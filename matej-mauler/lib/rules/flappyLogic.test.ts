import { describe, expect, it } from "vitest";
import {
  initFlappy,
  stepFlappy,
  flapFlappy,
  BIRD_X,
  BIRD_R,
  HEIGHT,
  LIMIT,
  PILLAR_W,
  SPEED,
  FLAP,
  GRAVITY,
} from "./flappyLogic";

const STEP = 1000 / 60;

// A steady-handed but un-prescient player: every `reactFrames` it looks at the next pillar and taps
// if the bird has sunk below the middle of that gap. Returns how the run ended.
function autopilot(seed: number, reactFrames: number) {
  const s = initFlappy(seed);
  flapFlappy(s); // the first click only starts the game
  let cooldown = 0;
  while (s.status === "playing") {
    if (cooldown <= 0) {
      const next = s.pillars.find((p) => p.x + PILLAR_W > BIRD_X - BIRD_R);
      const target = !next ? HEIGHT / 2 : next.ceil > 0 ? (next.ceil + next.top) / 2 : next.top - 12;
      if (s.birdY > target) flapFlappy(s);
      cooldown = reactFrames;
    }
    cooldown--;
    stepFlappy(s, STEP);
    if (s.landed) return "perched";
  }
  return s.status; // "won" | "lost"
}

describe("flappyLogic", () => {
  it("holds until the first click — nothing moves and the clock is frozen", () => {
    let s = initFlappy(1);
    const y0 = s.birdY;
    s = stepFlappy(s, 500);
    expect(s.birdY).toBe(y0);
    expect(s.elapsed).toBe(0);
    flapFlappy(s); // first click just starts it
    expect(s.started).toBe(true);
  });

  it("only the first pillar is open-topped; later pillars have a ceiling and the gap shrinks", () => {
    const s = initFlappy(1);
    expect(s.pillars[0].ceil).toBe(0); // first: sittable, open above
    expect(s.pillars[1].ceil).toBeGreaterThan(0); // later ones are pipe-pairs
    const gap = (i: number) => s.pillars[i].top - s.pillars[i].ceil;
    expect(gap(2)).toBeLessThan(gap(1)); // gaps get narrower and narrower
    expect(gap(3)).toBeLessThan(gap(2));
  });

  it("every pillar met inside the time limit leaves room to correct with a flap", () => {
    const flapRise = (FLAP * FLAP) / (2 * GRAVITY); // how far one tap lifts the bird
    for (let seed = 1; seed <= 40; seed++) {
      const s = initFlappy(seed);
      for (const p of s.pillars) {
        if (p.ceil === 0) continue; // the open-topped perch pillar
        const reachesBirdAt = (p.x - (BIRD_X + BIRD_R)) / SPEED;
        if (reachesBirdAt > LIMIT) continue; // never seen before the clock runs out
        expect(p.top - p.ceil).toBeGreaterThan(BIRD_R * 2 + flapRise);
      }
    }
  });

  it("only the first pillar is perchable — later ones never lose their ceiling", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = initFlappy(seed);
      for (const p of s.pillars.slice(1)) expect(p.ceil).toBeGreaterThan(0);
    }
  });

  it("flying the ordinary way survives the clock — the normal path is winnable", () => {
    let won = 0;
    for (let seed = 1; seed <= 40; seed++) if (autopilot(seed, 5) === "won") won++;
    expect(won).toBe(40);
  });

  it("staying airborne to the time limit wins without the hidden path", () => {
    let s = initFlappy(1);
    s.started = true;
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
    s.started = true;
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
    s.started = true;
    s.pillars = [{ x: BIRD_X - 5, top: 72, ceil: 36 }];
    s.birdY = 20; // high — inside the ceiling pipe
    s.vy = 0;
    s = stepFlappy(s, 16);
    expect(s.status).toBe("lost");
  });

  it("hitting a pillar from the side loses", () => {
    let s = initFlappy(1);
    s.started = true;
    s.pillars = [{ x: BIRD_X - 5, top: 30, ceil: 0 }];
    s.birdY = 70;
    s.vy = 0;
    s = stepFlappy(s, 16);
    expect(s.status).toBe("lost");
  });

  it("falling to the floor loses", () => {
    let s = initFlappy(1);
    s.started = true;
    s.pillars = [];
    for (let i = 0; i < 6000 && s.status === "playing"; i++) s = stepFlappy(s, 16); // never flap
    expect(s.status).toBe("lost");
  });
});
