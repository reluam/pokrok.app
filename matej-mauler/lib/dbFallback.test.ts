import { afterEach, describe, expect, it, vi } from "vitest";
import { withFallback } from "./dbFallback";

afterEach(() => vi.restoreAllMocks());

describe("withFallback", () => {
  it("vrací výsledek, když loader projde", async () => {
    expect(await withFallback("test", async () => "ok", () => "náhrada")).toBe("ok");
  });

  it("při selhání vrátí náhradu", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await withFallback("test", async () => { throw new Error("DB dole"); }, () => "náhrada");
    expect(r).toBe("náhrada");
  });

  it("selhání zaloguje i s kontextem — nesmí zmizet potichu", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await withFallback("public-experiments", async () => { throw new Error("DB dole"); }, () => null);
    expect(spy).toHaveBeenCalledOnce();
    expect(String(spy.mock.calls[0][0])).toContain("public-experiments");
  });

  it("náhradu volá až při selhání, ne dopředu", async () => {
    const fb = vi.fn(() => "náhrada");
    await withFallback("test", async () => "ok", fb);
    expect(fb).not.toHaveBeenCalled();
  });
});
