// Space Invaders — shoot the descending invaders. The hidden path: the invaders only ever fire back
// once YOU have fired. Never pull the trigger and they just descend and drift past, harmless. The
// fight was always mutual.

export const WIDTH = 120;
export const HEIGHT = 100;
export const COLS = 6;
export const ROWS = 3;
export const INV_W = 10;
export const INV_H = 7;
export const PLAYER_Y = 92;
export const PLAYER_W = 12;
export const BULLET_UP = 0.12;
export const BULLET_DOWN = 0.045;
export const DESCENT = 0.004;
export const FIRE_INTERVAL = 650; // ms between invader shots (only while aggro)

export type Invader = { x: number; y: number; alive: boolean };
export type Bullet = { x: number; y: number };

export type InvadersState = {
  width: number;
  height: number;
  invaders: Invader[];
  px: number;
  playerBullet: Bullet | null;
  invaderBullets: Bullet[];
  aggro: boolean; // the player has fired at least once
  fireTimer: number;
  status: "playing" | "won" | "lost";
  foundHiddenPath: boolean;
  seed: number;
};

function nextSeed(seed: number) {
  return (seed * 1664525 + 1013904223) >>> 0;
}

export function initInvaders(seed = 1): InvadersState {
  const invaders: Invader[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) invaders.push({ x: 16 + c * 16, y: 14 + r * 12, alive: true });
  return {
    width: WIDTH,
    height: HEIGHT,
    invaders,
    px: WIDTH / 2,
    playerBullet: null,
    invaderBullets: [],
    aggro: false,
    fireTimer: 0,
    status: "playing",
    foundHiddenPath: false,
    seed: seed >>> 0,
  };
}

export function moveInvaders(s: InvadersState, dx: number): InvadersState {
  if (s.status !== "playing") return s;
  s.px = Math.max(6, Math.min(WIDTH - 6, s.px + dx));
  return s;
}

export function fireInvaders(s: InvadersState): InvadersState {
  if (s.status !== "playing" || s.playerBullet) return s;
  s.playerBullet = { x: s.px, y: PLAYER_Y - 6 };
  s.aggro = true; // firing is what makes this a fight
  return s;
}

const aliveCount = (s: InvadersState) => s.invaders.reduce((n, i) => n + (i.alive ? 1 : 0), 0);

export function stepInvaders(s: InvadersState, dtMs: number): InvadersState {
  if (s.status !== "playing") return s;

  for (const inv of s.invaders) if (inv.alive) inv.y += DESCENT * dtMs;

  // player bullet
  if (s.playerBullet) {
    s.playerBullet.y -= BULLET_UP * dtMs;
    if (s.playerBullet.y < 0) s.playerBullet = null;
    else {
      for (const inv of s.invaders) {
        if (!inv.alive) continue;
        if (Math.abs(s.playerBullet.x - inv.x) < INV_W / 2 && Math.abs(s.playerBullet.y - inv.y) < INV_H / 2) {
          inv.alive = false;
          s.playerBullet = null;
          break;
        }
      }
    }
  }
  if (aliveCount(s) === 0) {
    s.status = "won";
    s.foundHiddenPath = false; // you cleared the wave the loud way
    return s;
  }

  // invaders only ever shoot back once you have
  if (s.aggro) {
    s.fireTimer += dtMs;
    if (s.fireTimer >= FIRE_INTERVAL) {
      s.fireTimer = 0;
      const alive = s.invaders.filter((i) => i.alive);
      if (alive.length) {
        s.seed = nextSeed(s.seed);
        const shooter = alive[s.seed % alive.length];
        s.invaderBullets.push({ x: shooter.x, y: shooter.y + INV_H / 2 });
      }
    }
  }
  for (const b of s.invaderBullets) b.y += BULLET_DOWN * dtMs;
  s.invaderBullets = s.invaderBullets.filter((b) => b.y <= HEIGHT);
  for (const b of s.invaderBullets) {
    if (b.y >= PLAYER_Y - 4 && Math.abs(b.x - s.px) < PLAYER_W / 2) {
      s.status = "lost";
      return s;
    }
  }

  // formation reaches the bottom
  const lowest = Math.max(...s.invaders.filter((i) => i.alive).map((i) => i.y));
  if (lowest >= PLAYER_Y - INV_H) {
    if (s.aggro) {
      s.status = "lost"; // a fight you started, lost
    } else {
      s.status = "won"; // they passed straight through — you never raised a hand
      s.foundHiddenPath = true;
    }
  }
  return s;
}
