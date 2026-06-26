"use client";
import { useEffect, useRef } from "react";
import type { Genome } from "@/lib/sim/genome";
import { drawBlob } from "@/lib/render/blob";

// Renders a genome as a living, breathing creature on its own canvas. The genome is read through a
// ref so the rAF loop (started once) always draws the freshest organism as it evolves.
export function BlobView({ genome, size = 80, bg = "transparent" }: { genome: Genome; size?: number; bg?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const gRef = useRef(genome);
  useEffect(() => { gRef.current = genome; });

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let raf = 0;
    const loop = (t: number) => {
      ctx.clearRect(0, 0, c.width, c.height);
      drawBlob(ctx, gRef.current, c.width / 2, c.height / 2, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} width={size} height={size} style={{ width: size, height: size, borderRadius: 14, background: bg, display: "block" }} />;
}
