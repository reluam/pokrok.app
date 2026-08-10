import { describe, expect, it } from "vitest";
import { initSimon, pressSimon, TOTAL } from "./simonLogic";

describe("simonLogic", () => {
  it("repeating the sequence correctly wins without the hidden path", () => {
    let s = initSimon(1);
    let guard = 0;
    while (s.status === "playing" && guard++ < 100) {
      const seq = [...s.sequence];
      for (const pad of seq) s = pressSimon(s, pad);
    }
    expect(s.status).toBe("won");
    expect(s.foundHiddenPath).toBe(false);
  });

  it("pressing the wrong pads still advances — you finish via the hidden path", () => {
    let s = initSimon(1);
    let guard = 0;
    while (s.status === "playing" && guard++ < 100) {
      const wrong = (s.sequence[0] + 1) % s.pads;
      const len = s.sequence.length;
      for (let i = 0; i < len; i++) s = pressSimon(s, wrong);
    }
    expect(s.status).toBe("won");
    expect(s.foundHiddenPath).toBe(true);
  });

  it("a round only completes after a full sequence-length of presses", () => {
    let s = initSimon(1);
    s = pressSimon(s, s.sequence[0]); // finish round 1 (length 1) → sequence grows to length 2
    expect(s.sequence.length).toBe(2);
    s = pressSimon(s, 0); // one press of a two-press round
    expect(s.status).toBe("playing");
    expect(s.input.length).toBe(1);
  });

  it("the final sequence length is TOTAL", () => {
    let s = initSimon(1);
    let guard = 0;
    while (s.status === "playing" && guard++ < 100) {
      const seq = [...s.sequence];
      for (const pad of seq) s = pressSimon(s, pad);
    }
    expect(s.sequence.length).toBe(TOTAL);
  });
});
