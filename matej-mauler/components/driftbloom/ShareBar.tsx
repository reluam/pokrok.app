"use client";
import { useState } from "react";
import type { SimState } from "@/lib/sim/population";
import { buildShareUrl, fittestGenome } from "@/lib/game/share";

export function ShareBar({ state }: { state: SimState }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://spaghetti.ltd";
    const url = buildShareUrl(origin, fittestGenome(state));
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  }
  return (
    <button className="sbtn" onClick={share}>{copied ? "copied ✓" : "share this line (dna →)"}</button>
  );
}
