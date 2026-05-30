"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  life: number;       // 0 → 1, then respawns
  lifeSpeed: number;  // per second
};

function makeStar(bright: boolean): Star {
  return {
    x: Math.random(),
    y: Math.random(),
    r: bright ? Math.random() * 1.4 + 1.0 : Math.random() * 0.9 + 0.2,
    baseOpacity: bright ? 0.75 : Math.random() * 0.5 + 0.15,
    twinkleSpeed: bright ? Math.random() * 0.6 + 0.2 : Math.random() * 1.2 + 0.3,
    twinklePhase: Math.random() * Math.PI * 2,
    life: Math.random(), // stagger so they don't all die at once
    lifeSpeed: bright
      ? Math.random() * 0.03 + 0.015  // ~33–67 s lifetime
      : Math.random() * 0.06 + 0.025, // ~17–40 s lifetime
  };
}

import { Theme } from "@/lib/theme";

export function StarField({ theme = "cosmic" }: { theme?: Theme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef  = useRef(theme);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener("resize", setSize);

    const stars: Star[] = [
      ...Array.from({ length: 210 }, () => makeStar(false)),
      ...Array.from({ length: 20 }, () => makeStar(true)),
    ];

    let lastTs = 0;
    let animId: number;

    const draw = (ts: number) => {
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0;
      lastTs = ts;

      // Advance each star's life; respawn when it reaches 1
      for (const s of stars) {
        s.life += s.lifeSpeed * dt;
        if (s.life >= 1) {
          s.x = Math.random();
          s.y = Math.random();
          s.life = 0;
          s.twinklePhase = Math.random() * Math.PI * 2;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = ts / 1000;

      for (const s of stars) {
        // Envelope: fade-in 0–12 %, full 12–85 %, fade-out 85–100 %
        const envelope =
          s.life < 0.12 ? s.life / 0.12
          : s.life > 0.85 ? (1 - s.life) / 0.15
          : 1.0;

        const twinkle = 0.55 + 0.45 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
        const opacity = s.baseOpacity * envelope * twinkle;

        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = themeRef.current === "hhgttg"
          ? `rgba(0, 230, 80, ${opacity})`
          : `rgba(205, 210, 255, ${opacity})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", setSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
