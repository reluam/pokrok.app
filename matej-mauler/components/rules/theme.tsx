"use client";

import { useEffect, useRef } from "react";

export type GameOutcome = { won: boolean; foundHiddenPath: boolean; side?: "left" | "right" };

export const RULES = {
  bg: "#0a0a0a",
  green: "#39FF14",
  yellow: "#FFE600",
  white: "#FFFFFF",
  dim: "#2a2a2a",
  gray: "#6b6b6b",
  font: "var(--font-press), monospace",
} as const;

/** Subtle CRT scanline overlay. pointer-events:none, sits above everything. */
export function Scanlines() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)",
        mixBlendMode: "multiply",
      }}
    />
  );
}

export function PixelButton({
  children,
  onClick,
  color = RULES.green,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: RULES.font,
        fontSize: 11,
        lineHeight: 1.6,
        color: RULES.bg,
        background: color,
        border: "none",
        padding: "12px 18px",
        cursor: "pointer",
        boxShadow: `4px 4px 0 ${RULES.dim}`,
        imageRendering: "pixelated",
      }}
    >
      {children}
    </button>
  );
}

/** Create a crisp low-res canvas context: internal w×h pixels, CSS-scaled to fit `cssW`. */
export function pixelCanvas(canvas: HTMLCanvasElement, w: number, h: number) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

/** Fixed-timestep rAF loop (60fps). `update(dt)` runs at a fixed step; `render()` once per frame.
 *  Returns nothing; cleans up on unmount via the effect that calls it. */
export function useFixedLoop(
  update: (dtMs: number) => void,
  render: () => void,
  active: boolean,
) {
  const updateRef = useRef(update);
  const renderRef = useRef(render);
  // eslint-disable-next-line react-hooks/refs
  updateRef.current = update;
  // eslint-disable-next-line react-hooks/refs
  renderRef.current = render;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const STEP = 1000 / 60;
    const frame = (now: number) => {
      acc += Math.min(now - last, 250);
      last = now;
      while (acc >= STEP) {
        updateRef.current(STEP);
        acc -= STEP;
      }
      renderRef.current();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/** Module-level mute flag (muted by default). */
let _muted = true;
export const audio = {
  get muted() { return _muted; },
  toggle() { _muted = !_muted; return _muted; },
};

/** Tiny 8-bit blip. No-op if muted or WebAudio unavailable. */
let audioCtx: AudioContext | null = null;
export function beep(freq: number, ms: number, muted: boolean) {
  if (muted || typeof window === "undefined") return;
  try {
    audioCtx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.value = 0.04;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + ms / 1000);
  } catch {
    /* audio is best-effort */
  }
}
