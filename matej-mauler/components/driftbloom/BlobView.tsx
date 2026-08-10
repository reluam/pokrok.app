"use client";
import { useEffect, useRef } from "react";
import type { Genome } from "@/lib/sim/genome";
import { drawBlob } from "@/lib/render/blob";

// Renders a genome as a living, breathing spaghettoid. `stage` (0..1) is the developmental stage.
// Genome + stage are read through refs so the rAF loop (started once) always draws the freshest one.
export function BlobView({ genome, size = 80, bg = "transparent", stage = 1 }: { genome: Genome; size?: number; bg?: string; stage?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const gRef = useRef(genome); useEffect(() => { gRef.current = genome; });
  const sRef = useRef(stage); useEffect(() => { sRef.current = stage; });

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let raf = 0;
    const loop = (t: number) => {
      ctx.clearRect(0, 0, c.width, c.height);
      drawBlob(ctx, gRef.current, c.width / 2, c.height / 2, t, sRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} width={size} height={size} style={{ width: size, height: size, borderRadius: 14, background: bg, display: "block" }} />;
}
