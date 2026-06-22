"use client";
import { useEffect, useRef } from "react";
import type { GenStats } from "@/lib/sim/population";

const TRACKED: { key: keyof GenStats["means"]; color: string; label: string }[] = [
  { key: "toughness", color: "#ef4444", label: "toughness" },
  { key: "camouflage", color: "#22c55e", label: "camouflage" },
  { key: "speed", color: "#3b82f6", label: "speed" },
];

export function StatsPanel({ history }: { history: GenStats[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    if (history.length < 2) return;

    const n = history.length;
    const xAt = (i: number) => (i / (n - 1)) * (W - 8) + 4;

    // avg fitness, normalised to its own max, drawn faint grey.
    const maxF = Math.max(...history.map((h) => h.avgFitness), 0.001);
    ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 1.5; ctx.beginPath();
    history.forEach((h, i) => {
      const y = H - 4 - (h.avgFitness / maxF) * (H - 8);
      if (i === 0) ctx.moveTo(xAt(i), y); else ctx.lineTo(xAt(i), y);
    });
    ctx.stroke();

    // gene means are already 0..1.
    for (const tr of TRACKED) {
      ctx.strokeStyle = tr.color; ctx.lineWidth = 2; ctx.beginPath();
      history.forEach((h, i) => {
        const y = H - 4 - h.means[tr.key] * (H - 8);
        if (i === 0) ctx.moveTo(xAt(i), y); else ctx.lineTo(xAt(i), y);
      });
      ctx.stroke();
    }
  }, [history]);

  return (
    <div>
      <canvas ref={ref} width={640} height={140} style={{ width: "100%", maxWidth: 640, borderRadius: 12, background: "var(--card, #fff)", display: "block" }} />
      <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
        <span>— avg fitness</span>
        {TRACKED.map((t) => <span key={t.key} style={{ color: t.color }}>— {t.label}</span>)}
      </div>
    </div>
  );
}
