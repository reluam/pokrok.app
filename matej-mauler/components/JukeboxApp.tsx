"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  radioUi, findRInst, DRUM_IDS, MELODIC_IDS, DRUM_LABEL, LAYER_LABEL,
  type SongState, type LayerId,
} from "@/lib/radio";
import { createRadio, type RadioControl } from "@/lib/radioEngine";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

const LAYER_COLOR: Record<LayerId, string> = {
  kick: "#f59e0b", snare: "#ef4444", hihat: "#9ca3af", clap: "#ec4899",
  bass: "#2563eb", chord: "#14b8a6", pluck: "#9333ea", lead: "#16a34a",
};

type Ripple = { x: number; y: number; r: number; maxR: number; color: string; born: number };

export function JukeboxApp({ lang }: { lang: Lang }) {
  const t = radioUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";

  const [running, setRunning] = useState(false);
  const [song, setSong] = useState<SongState | null>(null);
  const [change, setChange] = useState<{ cs: string; en: string } | null>(null);

  const ctrlRef = useRef<RadioControl | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef<number | null>(null);
  const progRef = useRef<HTMLDivElement>(null);

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
    const isDrum = DRUM_IDS.includes(layer as never);
    let x: number, y: number, maxR: number;
    if (isDrum) {
      const idx = DRUM_IDS.indexOf(layer as never);
      x = w * (0.18 + idx * 0.22) + (Math.random() - 0.5) * 30;
      y = h * 0.78 + (Math.random() - 0.5) * 24;
      maxR = layer === "kick" ? 95 : 60;
    } else {
      const norm = midi != null ? Math.max(0, Math.min(1, (midi - 36) / 60)) : 0.5;
      x = w * (0.08 + norm * 0.84);
      y = h * (layer === "bass" ? 0.6 : layer === "chord" ? 0.45 : layer === "pluck" ? 0.32 : 0.2) + (Math.random() - 0.5) * 26;
      maxR = layer === "bass" ? 80 : 55;
    }
    ripplesRef.current.push({ x, y, r: 4, maxR, color: LAYER_COLOR[layer], born: performance.now() });
    if (ripplesRef.current.length > 90) ripplesRef.current.splice(0, ripplesRef.current.length - 90);
  };

  const start = () => {
    if (ctrlRef.current) return;
    const ctrl = createRadio({
      onHit: (layer, midi, whenSec) => {
        const delay = Math.max(0, (whenSec - (ctrlRef.current?.audioTime() ?? whenSec)) * 1000);
        window.setTimeout(() => spawn(layer, midi), delay);
      },
      onChange: (s, label) => { setSong({ ...s }); setChange(label); },
    });
    ctrlRef.current = ctrl;
    setSong({ ...ctrl.getState() });
    setRunning(true);
    draw();
  };

  const draw = () => {
    const cv = canvasRef.current, ctrl = ctrlRef.current;
    if (!cv || !ctrl) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);

    // pozadí
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#0b1020"); grad.addColorStop(1, "#161a2e");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    // osciloskop
    const buf = new Uint8Array(ctrl.analyser.fftSize);
    ctrl.analyser.getByteTimeDomainData(buf);
    ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.beginPath();
    for (let i = 0; i < buf.length; i++) {
      const x = (i / buf.length) * w; const y = h / 2 + (buf[i] / 128 - 1) * (h * 0.22);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // ripples
    const now = performance.now();
    const alive: Ripple[] = [];
    for (const rp of ripplesRef.current) {
      const age = (now - rp.born) / 900;
      if (age >= 1) continue;
      rp.r = 4 + age * rp.maxR;
      const a = (1 - age) * 0.7;
      ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.strokeStyle = rp.color + Math.round(a * 255).toString(16).padStart(2, "0");
      ctx.lineWidth = 2.5 * (1 - age) + 0.5; ctx.stroke();
      // jádro
      ctx.beginPath(); ctx.arc(rp.x, rp.y, 3 * (1 - age) + 1, 0, Math.PI * 2);
      ctx.fillStyle = rp.color + Math.round(a * 255).toString(16).padStart(2, "0"); ctx.fill();
      alive.push(rp);
    }
    ripplesRef.current = alive;

    if (progRef.current) progRef.current.style.width = `${ctrl.getProgress() * 100}%`;
    rafRef.current = requestAnimationFrame(draw);
  };

  // canvas sizing
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const resize = () => { const r = cv.getBoundingClientRect(); cv.width = r.width; cv.height = r.height; };
    resize(); window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const noteName = (root: number) => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][((root % 12) + 12) % 12];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ padding: "20px 24px 0" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)", marginBottom: "10px" }}>{t.eyebrow}</p>
          <h1 style={{ ...display, fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em", marginBottom: "10px" }}>{t.title}</h1>
          <p style={{ ...serifItalic, fontSize: "16px", color: "var(--text-secondary)", maxWidth: "520px", margin: "0 auto" }}>{t.intro}</p>
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {/* viz */}
          <div style={{ flex: "2 1 420px", minWidth: "300px" }}>
            <div style={{ position: "relative", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "5px 5px 0 var(--border)", overflow: "hidden", background: "#0b1020" }}>
              <canvas ref={canvasRef} style={{ width: "100%", height: "360px", display: "block" }} />
              {!running && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <button onClick={start} style={{ background: "#fff", color: "var(--text-primary)", border: "2.5px solid var(--text-primary)", borderRadius: "12px", boxShadow: "4px 4px 0 var(--text-primary)", padding: "14px 30px", fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}>{t.start}</button>
                </div>
              )}
            </div>
            {/* loop progress */}
            <div style={{ marginTop: "10px", height: "6px", background: "rgba(0,0,0,0.08)", borderRadius: "999px", overflow: "hidden" }}>
              <div ref={progRef} style={{ height: "100%", width: "0%", background: "var(--text-primary)" }} />
            </div>
          </div>

          {/* controls / readout */}
          <div style={{ flex: "1 1 240px", minWidth: "240px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1, background: "#fff", border: "2px solid var(--border)", borderRadius: "12px", boxShadow: "3px 3px 0 var(--border)", padding: "12px", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{t.tempo}</p>
                <p style={{ ...display, fontSize: "22px", fontWeight: 800 }}>{song ? song.tempo : "—"}</p>
              </div>
              <div style={{ flex: 1, background: "#fff", border: "2px solid var(--border)", borderRadius: "12px", boxShadow: "3px 3px 0 var(--border)", padding: "12px", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{t.key}</p>
                <p style={{ ...display, fontSize: "22px", fontWeight: 800 }}>{song ? `${noteName(song.root)} ${song.scaleName.includes("minor") ? "moll" : "dur"}` : "—"}</p>
              </div>
            </div>

            {change && (
              <div style={{ background: "var(--text-primary)", color: "var(--bg)", borderRadius: "12px", padding: "12px 14px" }}>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.7 }}>{t.lastChange}</p>
                <p style={{ ...display, fontSize: "17px", fontWeight: 800 }}>{change[lang]}</p>
              </div>
            )}

            {/* layers */}
            <div style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "12px", boxShadow: "3px 3px 0 var(--border)", padding: "12px" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "8px" }}>{t.layers}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {DRUM_IDS.map((id) => {
                  const m = song?.drums[id].muted;
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: "8px", opacity: m ? 0.4 : 1 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: LAYER_COLOR[id] }} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600 }}>{DRUM_LABEL[id][lang]}</span>
                      <span style={{ marginLeft: "auto", fontFamily: "var(--font-sans)", fontSize: "10px", color: "var(--text-muted)" }}>{song ? (m ? t.muted : t.on) : ""}</span>
                    </div>
                  );
                })}
                {MELODIC_IDS.map((id) => {
                  const layer = song?.[id];
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: "8px", opacity: layer?.muted ? 0.4 : 1 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: LAYER_COLOR[id] }} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600 }}>{LAYER_LABEL[id][lang]}</span>
                      <span style={{ marginLeft: "auto", fontFamily: "var(--font-sans)", fontSize: "10px", color: "var(--text-muted)" }}>
                        {layer ? (layer.muted ? t.muted : findRInst(id, layer.inst).label[lang]) : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {running && (
              <button onClick={stop} style={{ background: "transparent", border: "2px solid var(--border)", borderRadius: "12px", padding: "11px", fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>{t.stop}</button>
            )}
            <p style={{ ...serifItalic, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>{t.hint}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
