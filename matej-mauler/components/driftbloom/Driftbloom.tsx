"use client";
import { Campaign } from "./Campaign";

const sans = "ui-sans-serif, system-ui, sans-serif";

export default function Driftbloom() {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text-primary)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 22px 70px", fontFamily: sans }}>
        <h1 style={{ fontSize: "clamp(30px,6vw,46px)", fontWeight: 900, letterSpacing: "-0.03em" }}>🌱 driftbloom</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: 560, marginTop: 4 }}>
          intelligent design vs. natural selection. you steer one lineage by hand; three rivals evolve
          by their own theories. colonize the world — if the shifting climate and blind luck let you.
        </p>
        <div style={{ marginTop: 16 }}><Campaign /></div>
      </div>
    </main>
  );
}
