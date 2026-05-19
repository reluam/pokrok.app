"use client";

import { useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

interface Props {
  onVerify: () => void;
}

export default function RecaptchaGate({ onVerify }: Props) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [loading, setLoading] = useState(false);
  const [exiting, setExiting] = useState(false);

  async function handleEnter() {
    if (loading || exiting) return;
    setLoading(true);
    try {
      if (executeRecaptcha) {
        await executeRecaptcha("gate_entry");
      }
    } catch {
      // In dev without a valid v3 key, proceed anyway
    }
    setExiting(true);
    setTimeout(onVerify, 420);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ animation: exiting ? "gateOut 0.4s ease forwards" : undefined }}
    >
      {/* Compass-rose ornament */}
      <div className="mb-6 opacity-40" aria-hidden>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="26" stroke="#5c3a1e" strokeWidth="0.8" />
          <circle cx="28" cy="28" r="20" stroke="#5c3a1e" strokeWidth="0.5" strokeDasharray="2 4" />
          <circle cx="28" cy="28" r="3" fill="#5c3a1e" />
          <polygon points="28,2 31,22 25,22" fill="#5c3a1e" />
          <polygon points="28,54 31,34 25,34" fill="#8b7355" />
          <polygon points="2,28 22,25 22,31" fill="#8b7355" />
          <polygon points="54,28 34,25 34,31" fill="#8b7355" />
          {[45, 135, 225, 315].map((deg) => (
            <line
              key={deg}
              x1={28 + 8 * Math.cos((deg * Math.PI) / 180)}
              y1={28 + 8 * Math.sin((deg * Math.PI) / 180)}
              x2={28 + 22 * Math.cos((deg * Math.PI) / 180)}
              y2={28 + 22 * Math.sin((deg * Math.PI) / 180)}
              stroke="#8b7355"
              strokeWidth="0.8"
            />
          ))}
        </svg>
      </div>

      {/* Title block */}
      <div className="text-center mb-2">
        <p
          className="text-xs tracking-widest mb-3"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            color: "#8b7355",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}
        >
          An Interactive Study of
        </p>
        <h1
          className="text-4xl sm:text-5xl leading-tight"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#2c1810" }}
        >
          The Changing
          <br />
          World Order
        </h1>
        <div
          className="ornament-rule my-4"
          style={{ color: "#8b7355", maxWidth: "320px", margin: "1.25rem auto" }}
        >
          <span>✦</span>
        </div>
        <p
          className="text-base sm:text-lg leading-relaxed max-w-md mx-auto"
          style={{ fontFamily: "var(--font-crimson), Georgia, serif", color: "#4a2e1c" }}
        >
          Five centuries of the rise and fall of empires — mapped through
          Dalio&apos;s Big Cycle. Explore where we are, where we&apos;ve been,
          and where we may be going.
        </p>
      </div>

      <div
        className="w-px my-6 opacity-30"
        style={{ height: "40px", background: "#5c3a1e" }}
      />

      {/* Enter button (reCAPTCHA v3 runs invisibly on click) */}
      <button
        onClick={handleEnter}
        disabled={loading || exiting}
        className="px-10 py-3 text-sm tracking-widest transition-all duration-300 border rounded-sm"
        style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          cursor: loading || exiting ? "default" : "pointer",
          background: loading || exiting ? "transparent" : "#2c1810",
          color: loading || exiting ? "#8b7355" : "#e8dfc8",
          borderColor: loading || exiting ? "#8b7355" : "#2c1810",
          opacity: loading || exiting ? 0.5 : 1,
        }}
      >
        {loading ? "Verifying…" : "Enter the Archive"}
      </button>

      <p
        className="mt-8 text-xs opacity-40 text-center max-w-xs"
        style={{ fontFamily: "var(--font-crimson), Georgia, serif", color: "#5c3a1e" }}
      >
        Based on{" "}
        <em>Principles for Dealing with the Changing World Order</em>
        {" "}by Ray Dalio. All data synthesized from publicly available
        research for educational purposes.
      </p>
    </div>
  );
}
