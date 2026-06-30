import { describe, expect, it } from "vitest";
import {
  initInvaders,
  stepInvaders,
  fireInvaders,
  PLAYER_Y,
  type InvadersState,
} from "./invadersLogic";

describe("invadersLogic", () => {
  it("invaders never fire until the player fires", () => {
    let s = initInvaders(1);
    for (let i = 0; i < 300 && s.status === "playing"; i++) s = stepInvaders(s, 16);
    expect(s.aggro).toBe(false);
    expect(s.invaderBullets.length).toBe(0);
  });

  it("pacifist run: never fire, the wave descends and passes — won via the hidden path", () => {
    let s = initInvaders(1);
    for (let i = 0; i < 3000 && s.status === "playing"; i++) s = stepInvaders(s, 16);
    expect(s.status).toBe("won");
    expect(s.aggro).toBe(false);
    expect(s.foundHiddenPath).toBe(true);
  });

  it("destroying every invader wins the loud way (no hidden path)", () => {
    const s: InvadersState = initInvaders(1);
    for (const inv of s.invaders) inv.alive = false;
    const target = s.invaders[0];
    target.alive = true;
    fireInvaders({ ...s, px: target.x } as InvadersState); // mark intent; set bullet on the target
    s.aggro = true;
    s.playerBullet = { x: target.x, y: target.y + 5 };
    let st = s;
    for (let i = 0; i < 80 && st.status === "playing"; i++) st = stepInvaders(st, 16);
    expect(st.status).toBe("won");
    expect(st.foundHiddenPath).toBe(false);
  });

  it("an invader bullet hitting the player loses (only possible once you've fired)", () => {
    const s = initInvaders(1);
    s.aggro = true;
    s.px = 60;
    s.invaderBullets = [{ x: 60, y: PLAYER_Y - 1 }];
    const r = stepInvaders(s, 16);
    expect(r.status).toBe("lost");
  });
});
