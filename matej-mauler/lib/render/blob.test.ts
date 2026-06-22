import { expect, test, vi } from "vitest";
import { drawBlob, hueToCss } from "@/lib/render/blob";
import { makeRng } from "@/lib/sim/rng";
import { randomGenome } from "@/lib/sim/genome";

function stubCtx() {
  return {
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), arc: vi.fn(),
    fill: vi.fn(), translate: vi.fn(), fillStyle: "", globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

test("hueToCss maps 0..1 to a degrees-based hsl string", () => {
  expect(hueToCss(0.5, 70, 50)).toBe("hsl(180, 70%, 50%)");
});

test("drawBlob draws particles without throwing and balances save/restore", () => {
  const ctx = stubCtx();
  const g = randomGenome(makeRng(1));
  drawBlob(ctx, g, 100, 100, 0);
  expect((ctx.save as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  expect((ctx.restore as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
});

test("drawBlob is deterministic in call count for a given genome", () => {
  const g = randomGenome(makeRng(2));
  const a = stubCtx(), b = stubCtx();
  drawBlob(a, g, 0, 0, 0);
  drawBlob(b, g, 0, 0, 0);
  expect((a.arc as ReturnType<typeof vi.fn>).mock.calls.length)
    .toBe((b.arc as ReturnType<typeof vi.fn>).mock.calls.length);
});
