"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { buildSound, foundryUi, suggestions, type SoundSpec } from "@/lib/foundry";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

function makeNoiseBuffer(ctx: AudioContext, color: "white" | "pink", durSec: number): AudioBuffer {
  const len = Math.max(1, Math.ceil(ctx.sampleRate * durSec));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  if (color === "white") {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  } else {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return buf;
}

export function SoundFoundryApp({ lang }: { lang: Lang }) {
  const t = foundryUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";

  const [input, setInput] = useState("");
  const [playing, setPlaying] = useState(false);

  const spec: SoundSpec | null = useMemo(() => buildSound(input, lang), [input, lang]);

  const audioRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nodesRef = useRef<AudioScheduledSourceNode[]>([]);
  const rafRef = useRef<number | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    rafRef.current = null;
    stopTimerRef.current = null;
    nodesRef.current.forEach((n) => { try { n.stop(); } catch {} });
    nodesRef.current = [];
    setPlaying(false);
    drawIdle();
  };

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const drawIdle = () => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "rgba(26,22,20,0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cv.height / 2);
    ctx.lineTo(cv.width, cv.height / 2);
    ctx.stroke();
  };

  useEffect(() => { drawIdle(); }, []);

  const drawScope = () => {
    const cv = canvasRef.current, analyser = analyserRef.current;
    if (!cv || !analyser) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const buf = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buf);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#9333EA";
    ctx.beginPath();
    const slice = cv.width / buf.length;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i] / 128 - 1;
      const y = cv.height / 2 + v * (cv.height / 2) * 0.9;
      const x = i * slice;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    rafRef.current = requestAnimationFrame(drawScope);
  };

  const play = () => {
    if (!spec) return;
    stop();

    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = audioRef.current ?? new Ctx();
    audioRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0.85;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    master.connect(analyser);
    analyser.connect(ctx.destination);

    const start = ctx.currentTime + 0.06;

    for (const layer of spec.layers) {
      const s = start + layer.startMs / 1000;
      const d = layer.durMs / 1000;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, s);
      env.gain.linearRampToValueAtTime(layer.gain, s + layer.attackMs / 1000);
      env.gain.exponentialRampToValueAtTime(0.0008, s + d);
      env.connect(master);

      if (layer.kind === "tone") {
        const osc = ctx.createOscillator();
        osc.type = layer.wave;
        osc.frequency.setValueAtTime(layer.freqStart, s);
        if (layer.freqEnd !== layer.freqStart) {
          if (layer.sweep === "exp") osc.frequency.exponentialRampToValueAtTime(Math.max(1, layer.freqEnd), s + d);
          else osc.frequency.linearRampToValueAtTime(layer.freqEnd, s + d);
        }
        osc.connect(env);
        osc.start(s);
        osc.stop(s + d + 0.02);
        nodesRef.current.push(osc);

        if (layer.vibratoHz && layer.vibratoDepth) {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.value = layer.vibratoHz;
          lfoGain.gain.value = layer.vibratoDepth;
          lfo.connect(lfoGain).connect(osc.frequency);
          lfo.start(s);
          lfo.stop(s + d + 0.02);
          nodesRef.current.push(lfo);
        }
      } else {
        const src = ctx.createBufferSource();
        src.buffer = makeNoiseBuffer(ctx, layer.color, d + 0.05);
        let node: AudioNode = src;
        if (layer.filterType) {
          const filt = ctx.createBiquadFilter();
          filt.type = layer.filterType;
          filt.Q.value = layer.q ?? 1;
          filt.frequency.setValueAtTime(layer.filterFreqStart ?? 1000, s);
          if (layer.filterFreqEnd && layer.filterFreqEnd !== layer.filterFreqStart) {
            filt.frequency.linearRampToValueAtTime(layer.filterFreqEnd, s + d);
          }
          src.connect(filt);
          node = filt;
        }
        node.connect(env);
        src.start(s);
        src.stop(s + d + 0.02);
        nodesRef.current.push(src);
      }
    }

    setPlaying(true);
    rafRef.current = requestAnimationFrame(drawScope);
    stopTimerRef.current = setTimeout(stop, spec.totalMs + 220);
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ padding: "20px 24px 0" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>
          {t.back}
        </Link>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)", marginBottom: "14px" }}>
            {t.eyebrow}
          </p>
          <h1 style={{ ...display, fontSize: "clamp(34px, 7.5vw, 56px)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em", marginBottom: "14px" }}>
            {t.title}
          </h1>
          <p style={{ ...serifItalic, fontSize: "17px", color: "var(--text-secondary)", lineHeight: 1.45, maxWidth: "460px", margin: "0 auto" }}>
            {t.intro}
          </p>
        </div>

        {/* Input */}
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); if (playing) stop(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && spec) (playing ? stop : play)(); }}
          placeholder={t.placeholder}
          maxLength={80}
          style={{
            width: "100%", background: "#fff",
            border: "2.5px solid var(--border)", borderRadius: "14px",
            boxShadow: "4px 4px 0 var(--border)",
            padding: "16px 18px", fontFamily: "var(--font-sans)",
            fontSize: "16px", color: "var(--text-primary)", outline: "none",
            marginBottom: "20px",
          }}
        />

        {/* Oscilloscope */}
        <div style={{
          background: "#fff", border: "2.5px solid var(--border)",
          borderRadius: "18px", boxShadow: "5px 5px 0 var(--border)",
          padding: "16px", marginBottom: "20px",
        }}>
          <canvas ref={canvasRef} width={560} height={150} style={{ width: "100%", height: "150px", display: "block" }} />
        </div>

        {/* Play + stats */}
        {spec && (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <button
                onClick={playing ? stop : play}
                style={{
                  background: playing ? "#9333EA" : "var(--text-primary)",
                  color: "#fff",
                  border: `2.5px solid ${playing ? "#9333EA" : "var(--text-primary)"}`,
                  borderRadius: "12px",
                  boxShadow: `4px 4px 0 ${playing ? "#6b21a8" : "var(--text-primary)"}`,
                  padding: "14px 36px", fontFamily: "var(--font-sans)",
                  fontSize: "16px", fontWeight: 700, cursor: "pointer",
                  transition: "transform 140ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-2px,-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
              >
                {playing ? t.stop : t.play}
              </button>
            </div>

            {/* Detected tags */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "20px" }}>
              {spec.tags.map((tag, i) => (
                <span key={i} style={{
                  fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600,
                  background: "#F3E8FF", color: "#7E22CE",
                  border: "1.5px solid #9333EA", borderRadius: "999px", padding: "4px 12px",
                }}>
                  {tag}
                </span>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "32px" }}>
              {[
                { label: t.detected, value: String(spec.tags.length) },
                { label: t.layers, value: String(spec.layers.length) },
                { label: t.duration, value: `${(spec.totalMs / 1000).toFixed(1)}s` },
              ].map((st) => (
                <div key={st.label} style={{
                  background: "#fff", border: "2px solid var(--border)", borderRadius: "12px",
                  boxShadow: "3px 3px 0 var(--border)", padding: "12px 10px", textAlign: "center",
                }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "4px" }}>
                    {st.label}
                  </p>
                  <p style={{ ...display, fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>{st.value}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {!spec && (
          <p style={{ ...serifItalic, fontSize: "15px", color: "var(--text-muted)", textAlign: "center", marginBottom: "32px" }}>
            {t.empty}
          </p>
        )}

        {/* Suggestions */}
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", letterSpacing: "0.04em" }}>
          {t.suggestionsLabel}
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
          {suggestions(lang).map((sug) => (
            <button
              key={sug}
              onClick={() => { stop(); setInput(sug); }}
              style={{
                background: "#fff", border: "2px solid var(--border)", borderRadius: "999px",
                boxShadow: "2px 2px 0 var(--border)", padding: "8px 16px",
                fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 500,
                color: "var(--text-primary)", cursor: "pointer",
              }}
            >
              {sug}
            </button>
          ))}
        </div>

        <p style={{ ...serifItalic, fontSize: "13px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
          {t.disclaimer}
        </p>
      </div>
    </div>
  );
}
