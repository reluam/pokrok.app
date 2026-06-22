"use client";
import { useEffect, useRef } from "react";
import type { SimState } from "@/lib/sim/population";
import { drawScene } from "@/lib/render/scene";

export function GameCanvas({ state, width = 640, height = 420 }: { state: SimState; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const loop = (t: number) => { drawScene(ctx, stateRef.current, t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", maxWidth: width, borderRadius: 16, display: "block" }} />;
}
