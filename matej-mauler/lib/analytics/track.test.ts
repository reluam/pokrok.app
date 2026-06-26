import { describe, it, expect, vi, beforeEach } from "vitest";

// Ovládáme stav mocku přes module-level proměnné (žádné `this` vazby).
let loaded = true;
let optedOut = false;
const capture = vi.fn();

vi.mock("posthog-js", () => ({
  default: {
    get __loaded() {
      return loaded;
    },
    has_opted_out_capturing: () => optedOut,
    capture: (...args: unknown[]) => capture(...args),
  },
}));

import { track } from "./track";

describe("track (consent gating)", () => {
  beforeEach(() => {
    capture.mockReset();
    loaded = true;
    optedOut = false;
  });

  it("captures when loaded and opted in", () => {
    track("experiment_started", { slug: "driftbloom" });
    expect(capture).toHaveBeenCalledWith("experiment_started", { slug: "driftbloom" });
  });

  it("no-ops when opted out (no consent)", () => {
    optedOut = true;
    track("experiment_completed");
    expect(capture).not.toHaveBeenCalled();
  });

  it("no-ops when posthog is not loaded (no key / SSR)", () => {
    loaded = false;
    track("experiment_step");
    expect(capture).not.toHaveBeenCalled();
  });

  it("never throws even if capture blows up", () => {
    capture.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    expect(() => track("experiment_dropoff")).not.toThrow();
  });
});
