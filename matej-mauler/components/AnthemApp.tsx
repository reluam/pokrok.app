"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { questions, buildAnthem, anthemUi, type Answers, type Anthem } from "@/lib/anthem";
import { SCALES, midiToFreq } from "@/lib/music";
import type { Lang } from "@/lib/dictionaries";
import { AudioNotice } from "./AudioNotice";
import { PromptRegistration } from "./PromptRegistration";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

/* ── Jednorázové přehrání hymny ─────────────────────────────────── */
function playAnthem(a: Anthem, onEnd: () => void): () => void {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain(); master.gain.value = 0.85; master.connect(ctx.destination);
  const eighth = (60 / a.tempo) / 2;
  const t0 = ctx.currentTime + 0.1;
  const sc = SCALES[a.scaleName];
  const degMidi = (deg: number, oct: number) => a.root + 12 * oct + sc[((deg % sc.length) + sc.length) % sc.length];

  const brass = (midi: number, durSec: number, t: number) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.025);
    g.gain.setValueAtTime(0.14, t + Math.max(0.05, durSec * 0.7));
    g.gain.exponentialRampToValueAtTime(0.0008, t + durSec + 0.05);
    const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 2600; filt.Q.value = 1;
    g.connect(filt); filt.connect(master);
    for (const det of [-7, 7]) { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = midiToFreq(midi); o.detune.value = det; o.connect(g); o.start(t); o.stop(t + durSec + 0.08); }
  };
  const organ = (midis: number[], durSec: number, t: number) => {
    for (const m of midis) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06, t + 0.08);
      g.gain.setValueAtTime(0.06, t + durSec * 0.8); g.gain.exponentialRampToValueAtTime(0.0008, t + durSec);
      const o1 = ctx.createOscillator(); o1.type = "square"; o1.frequency.value = midiToFreq(m);
      const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = midiToFreq(m + 12);
      const g2 = ctx.createGain(); g2.gain.value = 0.4; o2.connect(g2); g2.connect(g);
      o1.connect(g); g.connect(master); o1.start(t); o1.stop(t + durSec); o2.start(t); o2.stop(t + durSec);
    }
  };
  const bass = (midi: number, durSec: number, t: number) => {
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, t + durSec);
    const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = midiToFreq(midi - 12); o.connect(g); g.connect(master); o.start(t); o.stop(t + durSec + 0.05);
  };
  const kick = (t: number) => {
    const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = "sine"; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
    g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.18); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.2);
  };
  const cymbal = (t: number, dur: number) => {
    const len = Math.ceil(ctx.sampleRate * dur); const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
    for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, 1.5);
    const src = ctx.createBufferSource(); src.buffer = buf; const filt = ctx.createBiquadFilter(); filt.type = "highpass"; filt.frequency.value = 6000;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(filt).connect(g).connect(master); src.start(t); src.stop(t + dur + 0.02);
  };

  const maxStep = a.melody.reduce((m, n) => Math.max(m, n.step + n.dur), 0);
  const bars = Math.ceil(maxStep / 8);
  for (let b = 0; b < bars; b++) {
    const deg = a.chords[b % a.chords.length];
    const bt = t0 + b * 8 * eighth;
    organ([deg, deg + 2, deg + 4].map((dd) => degMidi(dd, 0)), 8 * eighth, bt);
    bass(degMidi(deg, 0), 4 * eighth, bt); bass(degMidi(deg, 0), 4 * eighth, bt + 4 * eighth);
    kick(bt); kick(bt + 4 * eighth);
  }
  for (const n of a.melody) brass(n.midi, n.dur * eighth, t0 + n.step * eighth);
  cymbal(t0, 0.4);
  cymbal(t0 + maxStep * eighth, 1.2);

  const totalMs = (maxStep * eighth + 1.4) * 1000;
  const timer = setTimeout(() => { try { ctx.close(); } catch {} onEnd(); }, totalMs);
  return () => { clearTimeout(timer); try { ctx.close(); } catch {} onEnd(); };
}

export function AnthemApp({ lang }: { lang: Lang }) {
  const t = anthemUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [anthem, setAnthem] = useState<Anthem | null>(null);
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const stop = () => { if (stopRef.current) stopRef.current(); stopRef.current = null; setPlaying(false); };
  useEffect(() => () => stop(), []);

  const pick = (qid: string, oid: string) => {
    const next = { ...answers, [qid]: oid };
    setAnswers(next);
    if (step + 1 >= questions.length) setAnthem(buildAnthem(next, 0));
    setStep((s) => s + 1);
  };

  const play = (a: Anthem) => { stop(); setPlaying(true); stopRef.current = playAnthem(a, () => setPlaying(false)); };
  const another = () => { const a = buildAnthem(answers, Math.floor(Math.random() * 1e9)); setAnthem(a); play(a); };
  const restart = () => { stop(); setAnswers({}); setAnthem(null); setStep(0); };

  // Zápis do Spaghetti účtů, jakmile zazní tvoje hymna (anonymous-first).
  const recordedRef = useRef(false);
  useEffect(() => {
    if (!(anthem && step >= questions.length) || recordedRef.current) return;
    recordedRef.current = true;
    fetch("/api/participation", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ experimentSlug: "hymna", insight: { minor: anthem.minor, tempo: anthem.tempo } }),
    }).catch(() => {});
  }, [anthem, step]);

  const wrap = (children: React.ReactNode) => (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ padding: "20px 24px 0" }}><Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link></div>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "clamp(24px,5vw,48px) clamp(16px,4vw,40px) 80px" }}><AudioNotice lang={lang} />{children}</div>
    </div>
  );

  // RESULT
  if (anthem && step >= questions.length) {
    return wrap(<div style={{ textAlign: "center", paddingTop: "10px" }}>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: "16px" }}>{t.yourAnthem}</p>
      <p style={{ fontSize: "52px", marginBottom: "10px" }}>{anthem.minor ? "🎺" : "🎻"}</p>
      <h1 style={{ ...display, fontSize: "clamp(26px, 5.5vw, 40px)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.02em", marginBottom: "10px" }}>{anthem.title[lang]}</h1>
      <p style={{ ...serifItalic, fontSize: "16px", color: "var(--text-secondary)", marginBottom: "8px" }}>{anthem.verdict[lang]}</p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", marginBottom: "28px" }}>{anthem.tempo} BPM · {anthem.minor ? (lang === "cs" ? "moll" : "minor") : (lang === "cs" ? "dur" : "major")}</p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={() => playing ? stop() : play(anthem)} style={{ background: "var(--text-primary)", color: "var(--bg)", border: "2.5px solid var(--text-primary)", borderRadius: "12px", boxShadow: "4px 4px 0 var(--text-primary)", padding: "14px 28px", fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>{playing ? t.stop : t.play}</button>
        <button onClick={another} style={{ background: "#fff", color: "var(--text-primary)", border: "2.5px solid var(--text-primary)", borderRadius: "12px", boxShadow: "4px 4px 0 var(--text-primary)", padding: "14px 20px", fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>{t.another}</button>
      </div>
      <button onClick={restart} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: "13px", cursor: "pointer", textDecoration: "underline", marginTop: "18px" }}>{t.again}</button>
      <p style={{ ...serifItalic, fontSize: "12px", color: "var(--text-muted)", marginTop: "24px" }}>{t.disclaimer}</p>
      <div style={{ marginTop: "28px" }}>
        <PromptRegistration
          trigger="on_result"
          headline="keep your anthem — and hear how next month's experiment adds to it."
          sub="no account needed to play; sign in to save it across the series."
        />
      </div>
    </div>);
  }

  // QUESTIONS
  const q = questions[step];
  return wrap(<>
    <div style={{ textAlign: "center", marginBottom: "28px" }}>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)", marginBottom: "12px" }}>{t.eyebrow}</p>
      {step === 0 && <h1 style={{ ...display, fontSize: "clamp(32px, 7vw, 50px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "10px" }}>{t.title}</h1>}
      {step === 0 && <p style={{ ...serifItalic, fontSize: "16px", color: "var(--text-secondary)", maxWidth: "420px", margin: "0 auto 8px" }}>{t.intro}</p>}
    </div>
    <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", textAlign: "center", marginBottom: "16px" }}>{t.step} {step + 1} / {questions.length}</p>
    <h2 style={{ ...display, fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 800, lineHeight: 1.2, textAlign: "center", marginBottom: "24px" }}>{q.text[lang]}</h2>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
      {q.options.map((o) => (
        <button key={o.id} onClick={() => pick(q.id, o.id)}
          style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "14px", boxShadow: "3px 3px 0 var(--border)", padding: "18px 14px", fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", cursor: "pointer", transition: "transform 120ms ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-2px,-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>
          {o.label[lang]}
        </button>
      ))}
    </div>
  </>);
}
