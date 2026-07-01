// Simon Says — watch the sequence, repeat it. The hidden truth: nothing is actually checking. Press
// any pads, in any order, and the round still advances. You were obeying a referee who wasn't there.

export const PADS = 4;
export const TOTAL = 4; // the sequence grows to this length; completing that round wins

export type SimonState = {
  pads: number;
  sequence: number[];
  input: number[];
  total: number;
  status: "playing" | "won";
  foundHiddenPath: boolean;
  seed: number;
};

function nextSeed(seed: number) {
  return (seed * 1664525 + 1013904223) >>> 0;
}

export function initSimon(seed = 1): SimonState {
  const s0 = seed >>> 0;
  return {
    pads: PADS,
    sequence: [s0 % PADS],
    input: [],
    total: TOTAL,
    status: "playing",
    foundHiddenPath: false,
    seed: nextSeed(s0),
  };
}

export function pressSimon(s: SimonState, pad: number): SimonState {
  if (s.status !== "playing") return s;
  s.input.push(pad);
  if (s.input.length < s.sequence.length) return s; // round still in progress

  // round complete — advance NO MATTER WHAT (that's the whole point)
  const matched = s.input.every((v, i) => v === s.sequence[i]);
  if (!matched) s.foundHiddenPath = true;
  s.input = [];
  if (s.sequence.length >= s.total) {
    s.status = "won";
    return s;
  }
  s.seed = nextSeed(s.seed);
  s.sequence.push(s.seed % s.pads);
  return s;
}
