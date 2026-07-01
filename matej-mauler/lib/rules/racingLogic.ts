// Racing — three laps of the track. The hidden path: the track is paint, not a wall. You don't have
// to follow it. Cut straight across the infield and cross the finish however you like — the finish
// counts your crossings whether or not you bothered with the checkpoint. The track was a suggestion.

export const WIDTH = 120;
export const HEIGHT = 100;
export const FINISH_Y = 78; // horizontal finish line near the bottom
export const FINISH_X0 = 24;
export const FINISH_X1 = 96;
export const TOTAL_LAPS = 3;
export const CP = { x: 60, y: 20 }; // the far checkpoint the "proper" route goes around
export const CP_R = 14;

export type RacingState = {
  width: number;
  height: number;
  car: { x: number; y: number; vx: number; vy: number };
  checkpoint: { x: number; y: number };
  cpTouched: boolean; // has the far checkpoint been reached since the last counted lap
  started: boolean; // the first finish crossing is the start line, not a completed lap
  lap: number;
  totalLaps: number;
  cutAny: boolean; // a lap was completed without the checkpoint (a shortcut)
  status: "playing" | "won";
  foundHiddenPath: boolean;
};

export function initRacing(): RacingState {
  return {
    width: WIDTH,
    height: HEIGHT,
    car: { x: 60, y: FINISH_Y + 8, vx: 0, vy: 0 },
    checkpoint: { x: CP.x, y: CP.y },
    cpTouched: false,
    started: false,
    lap: 0,
    totalLaps: TOTAL_LAPS,
    cutAny: false,
    status: "playing",
    foundHiddenPath: false,
  };
}

export function setVelRacing(s: RacingState, vx: number, vy: number): RacingState {
  s.car.vx = vx;
  s.car.vy = vy;
  return s;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function stepRacing(s: RacingState, dtMs: number): RacingState {
  if (s.status !== "playing") return s;
  const prevY = s.car.y;
  s.car.x = clamp(s.car.x + s.car.vx * dtMs, 3, WIDTH - 3);
  s.car.y = clamp(s.car.y + s.car.vy * dtMs, 3, HEIGHT - 3);

  if (Math.hypot(s.car.x - s.checkpoint.x, s.car.y - s.checkpoint.y) < CP_R) s.cpTouched = true;

  // forward crossing of the finish line = moving upward across FINISH_Y within its x span
  if (prevY >= FINISH_Y && s.car.y < FINISH_Y && s.car.x >= FINISH_X0 && s.car.x <= FINISH_X1) {
    if (!s.started) {
      s.started = true; // this is the start, not a lap
    } else {
      s.lap += 1;
      if (!s.cpTouched) s.cutAny = true; // crossed without going around → a shortcut
      s.cpTouched = false;
      if (s.lap >= s.totalLaps) {
        s.status = "won";
        s.foundHiddenPath = s.cutAny;
      }
    }
  }
  return s;
}
