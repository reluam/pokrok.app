"use client";

import { useState } from "react";

export function ScoreBar({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const fill = hovered !== null ? n <= hovered : n <= value;
        return (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChange(n)}
            className={`flex-1 h-7 rounded text-lg font-bold transition-all ${
              fill ? "bg-accent text-white" : "bg-foreground/6 text-foreground/35 hover:bg-accent/15 hover:text-accent"
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
