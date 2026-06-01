"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  radioUi, DRUM_IDS, MELODIC_IDS, DRUM_LABEL, LAYER_LABEL,
  type SongState, type LayerId, type DrumId, type MelodicId,
} from "@/lib/radio";
import { createRadio, type RadioControl } from "@/lib/radioEngine";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

const LAYER_COLOR: Record<LayerId, string> = {
  kick: "#f59e0b", clap: "#ec4899", chat: "#94a3b8", ohat: "#cbd5e1",
  sub: "#2563eb", pad: "#14b8a6", arp: "#06b6d4", pluck: "#9333ea", lead: "#22c55e",
};

type Ripple = { x: number; y: number; r: number; maxR: number; color: string; born: number };
type LogItem = { label: { cs: string; en: string }; at: number };

const card: React.CSSProperties = { background: "#fff", border: "2px solid var(--border)", borderRadius: "14px", boxShadow: "3px 3px 0 var(--border)", padding: "14px" };
const lab: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" };

export function JukeboxApp({ lang }: { lang: Lang }) {
  const t = radioUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";

  const [running, setRunning] = useState(false);
  const [song, setSong] = useState<SongState | null>(null);
  const [log, setLog] = useState<LogItem[]>([]);

  const ctrlRef = useRef<RadioControl | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef<number | null>(null);
  const progRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const startRef = useRef<number>(0);

  const stop = () => {
    ctrlRef.current?.stop(); ctrlRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null;
    ripplesRef.current = [];
    setRunning(false);
  };
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const spawn = (layer: LayerId, midi: number | null) => {
    const cv = canvasRef.current; if (!cv) return;
    const w = cv.width, h = cv.height;
    const isDrum = (DRUM_IDS as string[]).includes(layer);
    let x: number, y: number, maxR: number;
    if (isDrum) {
      const idx = DRUM_IDS.indexOf(layer as never);
      x = w * (0.12 + idx * 0.06) + (Math.random() - 0.5) * 26;
      y = h * 0.84 + (Math.random() - 0.5) * 20;
      maxR = layer === "kick" ? w * 0.14 : 50;
    } else {
      const norm = midi != null ? Math.max(0, Math.min(1, (midi - 36) / 60)) : 0.5;
      x = w * (0.08 + norm * 0.84);
      y = h * (layer === "sub" ? 0.62 : layer === "pad" ? 0.5 : layer === "arp" ? 0.36 : layer === "pluck" ? 0.3 : 0.18) + (Math.random() - 0.5) * 24;
      maxR = layer === "sub" ? 90 : 55;
    }
    ripplesRef.current.push({ x, y, r: 4, maxR, color: LAYER_COLOR[layer], born: performance.now() });
    if (ripplesRef.current.length > 110) ripplesRef.current.splice(0, ripplesRef.current.length - 110);
  };

  const start = () => {
    if (ctrlRef.current) return;
    startRef.current = performance.now();
    const ctrl = createRadio({
      onHit: (layer, midi, whenSec) => {
        const delay = Math.max(0, (whenSec - (ctrlRef.current?.audioTime() ?? whenSec)) * 1000);
        window.setTimeout(() => spawn(layer, midi), delay);
      },
      onChange: (s, label) => {
        setSong({ ...s });
        setLog((prev) => [{ label, at: performance.now() }, ...prev].slice(0, 12));
      },
    });
    ctrlRef.current = ctrl;
    setSong({ ...ctrl.getState() });
    setLog([]);
    setRunning(true);
    draw();
  };

  const draw = () => {
    const cv = canvasRef.current, ctrl = ctrlRef.current;
    if (!cv || !ctrl) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const w = cv.width, h = cv.height;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#070b18"); grad.addColorStop(1, "#141a30");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    // spektrum (spodní pruh)
    const freq = new Uint8Array(ctrl.analyser.frequencyBinCount);
    ctrl.analyser.getByteFrequencyData(freq);
    const bars = 64; const bw = w / bars;
    for (let i = 0; i < bars; i++) {
      const v = freq[Math.floor((i / bars) * (freq.length * 0.7))] / 255;
      const bh = v * h * 0.4;
      const hue = 200 + (i / bars) * 120;
      ctx.fillStyle = `hsla(${hue}, 80%, ${40 + v * 30}%, ${0.35 + v * 0.4})`;
      ctx.fillRect(i * bw, h - bh, bw - 1, bh);
    }

    // osciloskop
    const tdom = new Uint8Array(ctrl.analyser.fftSize);
    ctrl.analyser.getByteTimeDomainData(tdom);
    ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.beginPath();
    for (let i = 0; i < tdom.length; i += 2) {
      const x = (i / tdom.length) * w; const y = h * 0.4 + (tdom[i] / 128 - 1) * (h * 0.18);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // ripples
    const now = performance.now();
    const alive: Ripple[] = [];
    for (const rp of ripplesRef.current) {
      const age = (now - rp.born) / 950;
      if (age >= 1) continue;
      rp.r = 4 + age * rp.maxR;
      const a = (1 - age) * 0.75;
      const hex = Math.round(a * 255).toString(16).padStart(2, "0");
      ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.strokeStyle = rp.color + hex; ctx.lineWidth = 2.5 * (1 - age) + 0.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(rp.x, rp.y, 3 * (1 - age) + 1, 0, Math.PI * 2);
      ctx.fillStyle = rp.color + hex; ctx.fill();
      alive.push(rp);
    }
    ripplesRef.current = alive;

    if (progRef.current) progRef.current.style.width = `${ctrl.getProgress() * 100}%`;
    if (timeRef.current) {
      const sec = Math.floor((now - startRef.current) / 1000);
      timeRef.current.textContent = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
    }
    rafRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const resize = () => { const r = cv.getBoundingClientRect(); cv.width = r.width; cv.height = r.height; };
    resize(); window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const noteName = (root: number) => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][((root % 12) + 12) % 12];
  const fmtAgo = (at: number) => `${Math.floor((performance.now() - at) / 1000)}s`;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ padding: "16px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)" }}>{t.eyebrow}</span>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "16px 24px 40px" }}>
        <h1 style={{ ...display, fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "4px" }}>{t.title}</h1>
        <p style={{ ...serifItalic, fontSize: "15px", color: "var(--text-secondary)", marginBottom: "16px" }}>{t.intro}</p>

        {/* Visualization */}
        <div style={{ position: "relative", border: "2.5px solid var(--border)", borderRadius: "18px", boxShadow: "6px 6px 0 var(--border)", overflow: "hidden", background: "#070b18" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "48vh", minHeight: "300px", display: "block" }} />
          {!running && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button onClick={start} style={{ background: "#fff", color: "var(--text-primary)", border: "2.5px solid var(--text-primary)", borderRadius: "12px", boxShadow: "5px 5px 0 var(--text-primary)", padding: "16px 36px", fontFamily: "var(--font-sans)", fontSize: "17px", fontWeight: 800, cursor: "pointer" }}>{t.start}</button>
            </div>
          )}
        </div>
        <div style={{ marginTop: "10px", height: "6px", background: "rgba(0,0,0,0.08)", borderRadius: "999px", overflow: "hidden" }}>
          <div ref={progRef} style={{ height: "100%", width: "0%", background: "var(--text-primary)" }} />
        </div>

        {/* Dashboard */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "12px", marginTop: "16px" }}>
          {/* stats */}
          <div style={{ ...card, display: "flex", justifyContent: "space-around", textAlign: "center", gap: "8px" }}>
            <div><p style={lab}>{t.tempo}</p><p style={{ ...display, fontSize: "24px", fontWeight: 800 }}>{song ? song.tempo : "—"}</p></div>
            <div><p style={lab}>{t.key}</p><p style={{ ...display, fontSize: "24px", fontWeight: 800 }}>{song ? `${noteName(song.root)}${song.scaleName.includes("minor") ? "m" : ""}` : "—"}</p></div>
            <div><p style={lab}>{t.playtime}</p><p style={{ ...display, fontSize: "24px", fontWeight: 800 }}><span ref={timeRef}>00:00</span></p></div>
          </div>

          {/* layers */}
          <div style={card}>
            <p style={{ ...lab, marginBottom: "8px" }}>{t.layers}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
              {([...DRUM_IDS, ...MELODIC_IDS] as LayerId[]).map((id) => {
                const isDrum = (DRUM_IDS as string[]).includes(id);
                const muted = isDrum ? song?.drums[id as DrumId]?.muted : song?.[id as MelodicId]?.muted;
                const label = isDrum ? DRUM_LABEL[id as DrumId][lang] : LAYER_LABEL[id as MelodicId][lang];
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: "6px", opacity: muted ? 0.35 : 1 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: LAYER_COLOR[id] }} />
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 600 }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* change log */}
          <div style={{ ...card, gridColumn: "span 1" }}>
            <p style={{ ...lab, marginBottom: "8px" }}>{t.changelog}</p>
            {log.length === 0 ? (
              <p style={{ ...serifItalic, fontSize: "13px", color: "var(--text-muted)" }}>—</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "150px", overflowY: "auto" }}>
                {log.map((it, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontFamily: "var(--font-sans)", fontSize: "12px", color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: i === 0 ? 700 : 400 }}>
                    <span>{it.label[lang]}</span>
                    <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{fmtAgo(it.at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {running && (
          <div style={{ marginTop: "14px", textAlign: "center" }}>
            <button onClick={stop} style={{ background: "transparent", border: "2px solid var(--border)", borderRadius: "12px", padding: "10px 24px", fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>{t.stop}</button>
          </div>
        )}
        <p style={{ ...serifItalic, fontSize: "12px", color: "var(--text-muted)", textAlign: "center", marginTop: "12px" }}>{t.hint}</p>
      </div>
    </div>
  );
}
