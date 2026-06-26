import { expect, test, vi } from "vitest";
import { drawBlob, hueToCss } from "@/lib/render/blob";
import { makeRng } from "@/lib/sim/rng";
import { randomGenome } from "@/lib/sim/genome";

function stubCtx() {
  return {
    save: vi.fn(), restore: vi.fn(), translate: vi.fn(), beginPath: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), quadraticCurveTo: vi.fn(), arc: vi.fn(), ellipse: vi.fn(),
    fill: vi.fn(), stroke: vi.fn(),
    fillStyle: "", strokeStyle: "", lineWidth: 1, lineCap: "", globalAlpha: 1, shadowBlur: 0, shadowColor: "",
  } as unknown as CanvasRenderingContext2D;
}

test("hueToCss maps 0..1 to a degrees-based hsla string", () => {
  expect(hueToCss(0.5, 70, 50)).toBe("hsla(180, 70%, 50%, 1)");
});

test("drawBlob renders a spaghettoid without throwing and balances save/restore", () => {
  const ctx = stubCtx();
  drawBlob(ctx, randomGenome(makeRng(1)), 100, 100, 0);
  expect((ctx.save as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  expect((ctx.restore as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  expect((ctx.stroke as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0); // noodle strands
});

test("drawBlob is deterministic in stroke count for a given genome", () => {
  const g = randomGenome(makeRng(2));
  const a = stubCtx(), b = stubCtx();
  drawBlob(a, g, 0, 0, 0);
  drawBlob(b, g, 0, 0, 0);
  expect((a.stroke as ReturnType<typeof vi.fn>).mock.calls.length)
    .toBe((b.stroke as ReturnType<typeof vi.fn>).mock.calls.length);
});
