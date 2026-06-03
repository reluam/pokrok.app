"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { sonify, sonifyUi, presets, waveLabel } from "@/lib/sonify";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

export function SonifyApp({ lang }: { lang: Lang }) {
  const t = sonifyUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";

  const [input, setInput] = useState("");
  const [playing, setPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const result = useMemo(() => sonify(input), [input]);

  const audioRef = useRef<AudioContext | null>(null);
  const oscsRef = useRef<OscillatorNode[]>([]);
  const rafRef = useRef<number | null>(null);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    oscsRef.current.forEach((o) => { try { o.stop(); } catch {} });
    oscsRef.current = [];
    setPlaying(false);
    setActiveIdx(-1);
  };

  useEffect(() => () => stop(), []);

  const play = () => {
    if (!result) return;
    stop();

    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = audioRef.current ?? new Ctx();
    audioRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();

    const amp = result.waveform === "square" || result.waveform === "sawtooth" ? 0.1 : 0.2;
    const start = ctx.currentTime + 0.05;

    result.notes.forEach((n) => {
      if (n.rest) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = result.waveform;
      osc.frequency.value = n.freq;
      const s = start + n.startMs / 1000;
      const d = n.durationMs / 1000;
      gain.gain.setValueAtTime(0, s);
      gain.gain.linearRampToValueAtTime(amp, s + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, s + d * 0.95);
      osc.connect(gain).connect(ctx.destination);
      osc.start(s);
      osc.stop(s + d);
      oscsRef.current.push(osc);
    });

    setPlaying(true);

    const tick = () => {
      const elapsed = (ctx.currentTime - start) * 1000;
      if (elapsed >= result.totalMs) { stop(); return; }
      let idx = -1;
      for (let i = 0; i < result.notes.length; i++) {
        const n = result.notes[i];
        if (elapsed >= n.startMs && elapsed < n.startMs + n.durationMs) { idx = i; break; }
      }
      setActiveIdx(idx);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const maxDegree = 5; // pentatonika má 5 stupňů (+oktávy → ale degree je 0..4)

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Back */}
      <div style={{ padding: "20px 24px 0" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>
          {t.back}
        </Link>
      </div>

      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "clamp(24px,5vw,48px) clamp(16px,4vw,40px) 80px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)", marginBottom: "14px" }}>
            {t.eyebrow}
          </p>
          <h1 style={{ ...display, fontSize: "clamp(36px, 8vw, 60px)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em", marginBottom: "14px" }}>
            {t.title}
          </h1>
          <p style={{ ...serifItalic, fontSize: "18px", color: "var(--text-secondary)", lineHeight: 1.4, maxWidth: "440px", margin: "0 auto" }}>
            {t.intro}
          </p>
        </div>

        {/* Input */}
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); if (playing) stop(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && result) (playing ? stop : play)(); }}
          placeholder={t.placeholder}
          maxLength={60}
          style={{
            width: "100%", background: "#fff",
            border: "2.5px solid var(--border)", borderRadius: "14px",
            boxShadow: "4px 4px 0 var(--border)",
            padding: "16px 18px", fontFamily: "var(--font-sans)",
            fontSize: "16px", color: "var(--text-primary)", outline: "none",
            marginBottom: "20px",
          }}
        />

        {/* Visualization */}
        <div style={{
          background: "#fff", border: "2.5px solid var(--border)",
          borderRadius: "18px", boxShadow: "5px 5px 0 var(--border)",
          padding: "24px", marginBottom: "20px", minHeight: "160px",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          gap: "4px", overflowX: "auto",
        }}>
          {result ? (
            result.notes.map((n, i) => {
              const active = i === activeIdx;
              const h = n.rest ? 8 : 28 + (n.degree / maxDegree) * 92;
              return (
                <div
                  key={i}
                  style={{
                    width: "10px",
                    height: `${h}px`,
                    borderRadius: "5px",
                    flexShrink: 0,
                    background: n.rest
                      ? "rgba(26,22,20,0.12)"
                      : active ? "#2563EB" : "var(--text-primary)",
                    transform: active ? "scaleY(1.12)" : "scaleY(1)",
                    transformOrigin: "bottom",
                    opacity: n.rest ? 0.5 : active ? 1 : 0.55,
                    transition: "background 80ms linear, transform 80ms linear, opacity 80ms linear",
                  }}
                />
              );
            })
          ) : (
            <p style={{ ...serifItalic, fontSize: "16px", color: "var(--text-muted)", alignSelf: "center" }}>
              {t.empty}
            </p>
          )}
        </div>

        {/* Play + stats */}
        {result && (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <button
                onClick={playing ? stop : play}
                style={{
                  background: playing ? "#2563EB" : "var(--text-primary)",
                  color: "#fff",
                  border: `2.5px solid ${playing ? "#2563EB" : "var(--text-primary)"}`,
                  borderRadius: "12px",
                  boxShadow: `4px 4px 0 ${playing ? "#1e3a8a" : "var(--text-primary)"}`,
                  padding: "14px 36px", fontFamily: "var(--font-sans)",
                  fontSize: "16px", fontWeight: 700, cursor: "pointer",
                  transition: "transform 140ms ease, box-shadow 140ms ease",
                }}
                onMouseEnter={(e) => { const el = e.currentTarget; el.style.transform = "translate(-2px,-2px)"; }}
                onMouseLeave={(e) => { const el = e.currentTarget; el.style.transform = ""; }}
              >
                {playing ? t.stop : t.play}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", marginBottom: "32px" }}>
              {[
                { label: t.statsTempo, value: `${result.tempoBpm} ${t.bpm}` },
                { label: t.statsScale, value: result.scaleName[lang] },
                { label: t.statsWave, value: waveLabel(result.waveform) },
                { label: t.statsNotes, value: String(result.notes.filter((n) => !n.rest).length) },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "#fff", border: "2px solid var(--border)", borderRadius: "12px",
                  boxShadow: "3px 3px 0 var(--border)", padding: "12px 14px", textAlign: "center",
                }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "4px" }}>
                    {s.label}
                  </p>
                  <p style={{ ...display, fontSize: "15px", fontWeight: 800, color: "var(--text-primary)" }}>{s.value}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Presets */}
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", letterSpacing: "0.04em" }}>
          {t.presetsLabel}
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
          {presets(lang).map((p) => (
            <button
              key={p.label}
              onClick={() => { stop(); setInput(p.value); }}
              style={{
                background: "#fff", border: "2px solid var(--border)", borderRadius: "999px",
                boxShadow: "2px 2px 0 var(--border)", padding: "8px 16px",
                fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 500,
                color: "var(--text-primary)", cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <p style={{ ...serifItalic, fontSize: "13px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
          {t.disclaimer}
        </p>
      </div>
    </div>
  );
}
