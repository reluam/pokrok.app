"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/dictionaries";

const INK = "#1a1614", BG = "#FAFAF7";
const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
type Layers = { drums: boolean; bass: boolean; chord: boolean; mel: boolean };

const SECTIONS: { cs: { t: string; p: string }; en: { t: string; p: string }; interactive?: "tempo" | "mood" | "voice" }[] = [
  { cs: { t: "Co je hudba?", p: "Zvuk je jen chvění vzduchu. Hudba je zvuk, který někdo uspořádal — do času a do výšek. Pojďme si jednu skladbu poskládat." }, en: { t: "What is music?", p: "Sound is just shaking air. Music is sound someone organized — in time and in pitch. Let's build a track piece by piece." } },
  { cs: { t: "Rytmus = tep", p: "Základ je rytmus — pravidelný tep, do kterého všechno zapadá. Zkus změnit tempo." }, en: { t: "Rhythm = pulse", p: "It starts with rhythm — a steady pulse everything snaps to. Try changing the tempo." }, interactive: "tempo" },
  { cs: { t: "Basa drží spodek", p: "Basa je hluboký tón, co dává skladbě pevnou půdu pod nohama. Slyšíš, jak to najednou stojí pevně?" }, en: { t: "Bass holds the bottom", p: "Bass is the low tone that gives the track solid ground. Hear how it suddenly stands firm?" } },
  { cs: { t: "Akordy = nálada", p: "Víc tónů naráz je akord. Veselé (dur) nebo smutné (moll) — to rozhoduje o náladě. Přepni." }, en: { t: "Chords = mood", p: "Several notes at once make a chord. Happy (major) or sad (minor) — that sets the mood. Switch it." }, interactive: "mood" },
  { cs: { t: "Melodie = příběh", p: "Melodie je jeden hlas, co si zpívá svou cestu nahoru a dolů. To je to, co si broukáš." }, en: { t: "Melody = the story", p: "Melody is a single voice singing its way up and down. It's the part you hum." } },
  { cs: { t: "Barva — nástroj", p: "Stejná melodie zní jinak na klavír, housle nebo syntezátor. Vyber, čím má hrát." }, en: { t: "Color — the instrument", p: "The same melody sounds different on piano, violin or synth. Pick what plays it." }, interactive: "voice" },
  { cs: { t: "Vrstvy dělají skladbu", p: "Rytmus + basa + akordy + melodie hrají spolu. Z jednoduchých dílků vznikne celá skladba." }, en: { t: "Layers make a track", p: "Rhythm + bass + chords + melody play together. Simple parts become a whole song." } },
  { cs: { t: "Teď to umíš", p: "Hudba je jen chytře poskládaný zvuk — tep, spodek, nálada a příběh. A ty teď víš jak na to." }, en: { t: "Now you get it", p: "Music is just cleverly arranged sound — pulse, bottom, mood and story. And now you know how." } },
];

const UI = {
  cs: { back: "← Spaghetti.ltd", eyebrow: "Hudební experience", title: "Jak vzniká hudba", start: "Start ▶", audio: "🔊 Zapni si zvuk.", scroll: "scrolluj dolů", mute: "Ztlumit", unmute: "Zvuk", slow: "pomalu", fast: "rychle", major: "dur (veselé)", minor: "moll (smutné)", voices: { piano: "klavír", violin: "housle", synth: "synth" }, lanes: ["bicí", "basa", "akordy", "melodie"] },
  en: { back: "← Spaghetti.ltd", eyebrow: "A music experience", title: "How music is made", start: "Start ▶", audio: "🔊 Turn your sound on.", scroll: "scroll down", mute: "Mute", unmute: "Sound", slow: "slow", fast: "fast", major: "major (happy)", minor: "minor (sad)", voices: { piano: "piano", violin: "violin", synth: "synth" }, lanes: ["drums", "bass", "chords", "melody"] },
} as const;

const VOICE_H: Record<string, number[] | null> = { piano: [1, 0.55, 0.32, 0.2, 0.13, 0.08], violin: [1, 0.7, 0.55, 0.4, 0.32, 0.26, 0.2], synth: null };
const m2f = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export function MusicBlasterBook({ lang }: { lang: Lang }) {
  const u = UI[lang]; const homeHref = lang === "cs" ? "/cs" : "/"; const N = SECTIONS.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [step, setStep] = useState(0);

  const bpm = useRef(100); const [bpmUI, setBpmUI] = useState(100);
  const minor = useRef(false); const [minorUI, setMinorUI] = useState(false);
  const voice = useRef("piano"); const [voiceUI, setVoiceUI] = useState("piano");

  const ac = useRef<AudioContext | null>(null);
  const lay = useRef<Record<keyof Layers, GainNode | null>>({ drums: null, bass: null, chord: null, mel: null });
  const master = useRef<GainNode | null>(null);
  const stepRef = useRef(0);
  const layTarget = useRef<Layers>({ drums: false, bass: false, chord: false, mel: false });
  const hitRef = useRef<Record<string, number>>({});

  // chord progression I V vi IV (C G Am F) — root midi
  const PROG = [60, 67, 69, 65];

  const start = () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const a = new AC(); ac.current = a;
    const ms = a.createGain(); ms.gain.value = muted ? 0 : 0.9; ms.connect(a.destination); master.current = ms;
    (["drums", "bass", "chord", "mel"] as const).forEach((k) => { const g = a.createGain(); g.gain.value = 0; g.connect(ms); lay.current[k] = g; });
    let s = 0;
    const tick = () => {
      const stepDur = 60 / bpm.current / 4; const now = a.currentTime; const sib = s % 8; const bar = Math.floor(s / 8) % 4;
      const root = PROG[bar]; const third = root + (minor.current ? 3 : 4);
      // drums
      if (sib % 4 === 0) kick(a, lay.current.drums!, now);
      if (sib === 4) snare(a, lay.current.drums!, now);
      if (sib % 2 === 1) hat(a, lay.current.drums!, now);
      // bass
      if (sib === 0 || sib === 4) tone(a, lay.current.bass!, m2f(root - 24), 0.34, "triangle", now, null);
      // chord (na začátku taktu, dlouhý)
      if (sib === 0) [root, third, root + 7].forEach((n) => tone(a, lay.current.chord!, m2f(n - 12), stepDur * 7, "sine", now, VOICE_H.synth));
      // melody — pentatonika
      const penta = [0, 2, 4, 7, 9]; const mp = [0, 2, 4, 2, 7, 4, 9, 7];
      if (sib % 1 === 0 && mp[sib] !== undefined && sib % 2 === 0) tone(a, lay.current.mel!, m2f(72 + penta[(mp[sib]) % penta.length] || 72), 0.3, "sine", now, VOICE_H[voice.current]);
      // grid hit pro vizualizaci
      hitRef.current = { d: sib % 4 === 0 || sib === 4 ? 1 : sib % 2 === 1 ? 0.5 : 0, b: sib === 0 || sib === 4 ? 1 : 0, c: sib === 0 ? 1 : 0, m: sib % 2 === 0 ? 1 : 0 };
      stepRef.current = s; s = (s + 1) % 32;
      timer = window.setTimeout(tick, stepDur * 1000);
    };
    let timer = window.setTimeout(tick, 60);
    cleanup.current = () => clearTimeout(timer);
    setStarted(true);
  };
  const cleanup = useRef<(() => void) | null>(null);
  const toggleMute = () => setMuted((m) => { const nm = !m; if (master.current && ac.current) master.current.gain.setTargetAtTime(nm ? 0 : 0.9, ac.current.currentTime, 0.03); return nm; });
  useEffect(() => () => { cleanup.current?.(); try { ac.current?.close(); } catch {} }, []);

  // scroll → aktivní vrstvy + vizualizace
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);
    const g = { d: 0, b: 0, c: 0, m: 0 }; let raf = 0, lastStep = 0;
    const lerp = (a: number, x: number, k: number) => a + (x - a) * k;
    const loop = () => {
      const tr = trackRef.current; let p = 0; if (tr) { const dist = tr.offsetHeight - innerHeight; p = dist > 0 ? Math.min(1, Math.max(0, -tr.getBoundingClientRect().top / dist)) : 0; }
      const idx = Math.min(N - 1, Math.round(p * (N - 1)));
      if (idx !== lastStep) { lastStep = idx; setStep(idx); }
      layTarget.current = { drums: idx >= 1, bass: idx >= 2, chord: idx >= 3, mel: idx >= 4 };
      if (ac.current) { const now = ac.current.currentTime; const lt = layTarget.current; lay.current.drums?.gain.setTargetAtTime(started && lt.drums ? 0.8 : 0, now, 0.15); lay.current.bass?.gain.setTargetAtTime(started && lt.bass ? 0.7 : 0, now, 0.15); lay.current.chord?.gain.setTargetAtTime(started && lt.chord ? 0.5 : 0, now, 0.2); lay.current.mel?.gain.setTargetAtTime(started && lt.mel ? 0.55 : 0, now, 0.2); }
      // vizualizace: step-grid 4 vrstvy × 8 kroků
      const w = innerWidth, h = innerHeight; ctx.clearRect(0, 0, w, h);
      const grd = ctx.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#FAFAF7"); grd.addColorStop(1, "#efe9fb"); ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      const lt = layTarget.current; const act = [lt.drums, lt.bass, lt.chord, lt.mel];
      g.d = lerp(g.d, lt.drums ? 1 : 0.12, 0.08); g.b = lerp(g.b, lt.bass ? 1 : 0.12, 0.08); g.c = lerp(g.c, lt.chord ? 1 : 0.12, 0.08); g.m = lerp(g.m, lt.mel ? 1 : 0.12, 0.08);
      const opac = [g.d, g.b, g.c, g.m]; const colors = ["#ff6fae", "#4aa3ff", "#9b6cff", "#ffb43c"];
      const gw = Math.min(560, w * 0.8), gx = (w - gw) / 2, cell = gw / 8, gh = 46, gy = h * 0.3;
      const cur = started ? stepRef.current % 8 : -1;
      for (let r = 0; r < 4; r++) {
        const y = gy + r * (gh + 12);
        for (let cI = 0; cI < 8; cI++) {
          const on = act[r] && hitPattern(r, cI);
          ctx.globalAlpha = act[r] ? 1 : 0.25; ctx.fillStyle = cI === cur ? "rgba(26,22,20,0.08)" : "transparent"; if (cI === cur) ctx.fillRect(gx + cI * cell, y, cell, gh);
          ctx.globalAlpha = on ? opac[r] : 0.1; ctx.fillStyle = on ? colors[r] : "rgba(26,22,20,0.15)";
          roundRect(ctx, gx + cI * cell + 4, y + 6, cell - 8, gh - 12, 6); ctx.fill();
        }
        ctx.globalAlpha = act[r] ? 0.8 : 0.3; ctx.fillStyle = INK; ctx.font = "700 12px system-ui"; ctx.textAlign = "right"; ctx.fillText(u.lanes[r], gx - 10, y + gh / 2 + 4);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, [started, N, u.lanes]);

  const sec = SECTIONS[step]; const txt = sec[lang];

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}><canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} /></div>

      <div style={{ position: "fixed", top: 16, left: 18, zIndex: 6 }}><Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>{u.back}</Link></div>
      {started && <button onClick={toggleMute} aria-label={muted ? u.unmute : u.mute} style={{ position: "fixed", top: 14, right: 16, zIndex: 7, width: 42, height: 42, borderRadius: 12, border: `2.5px solid ${INK}`, background: "#fff", color: INK, boxShadow: `3px 3px 0 ${INK}`, cursor: "pointer", fontSize: 16 }}>{muted ? "🔇" : "🔊"}</button>}

      {started && (
        <div style={{ position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)", zIndex: 6, display: "flex", flexDirection: "column", gap: 7, marginTop: 34 }}>
          {SECTIONS.map((_, i) => <div key={i} style={{ width: i === step ? 9 : 6, height: i === step ? 9 : 6, borderRadius: "50%", background: i <= step ? INK : "rgba(26,22,20,0.25)", transition: "all .2s" }} />)}
        </div>
      )}

      {started && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: "8vh", zIndex: 5, display: "flex", justifyContent: "center", padding: "0 22px", pointerEvents: "none" }}>
          <div key={step} className="mb-card" style={{ maxWidth: 560, textAlign: "center", background: "rgba(255,255,255,0.82)", border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 ${INK}`, padding: "20px 24px", color: INK, backdropFilter: "blur(6px)", pointerEvents: "auto" }}>
            <p style={{ ...display, fontSize: "clamp(22px,5vw,32px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>{txt.t}</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 15.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>{txt.p}</p>
            {sec.interactive === "tempo" && (<div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700 }}>{u.slow}</span>
              <input type="range" min={70} max={150} value={bpmUI} onChange={(e) => { const v = +e.target.value; bpm.current = v; setBpmUI(v); }} style={{ flex: 1, accentColor: INK }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700 }}>{u.fast}</span>
            </div>)}
            {sec.interactive === "mood" && (<div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
              <button onClick={() => { minor.current = false; setMinorUI(false); }} style={pill(!minorUI)}>{u.major}</button>
              <button onClick={() => { minor.current = true; setMinorUI(true); }} style={pill(minorUI)}>{u.minor}</button>
            </div>)}
            {sec.interactive === "voice" && (<div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
              {(["piano", "violin", "synth"] as const).map((vk) => <button key={vk} onClick={() => { voice.current = vk; setVoiceUI(vk); }} style={pill(voiceUI === vk)}>{u.voices[vk]}</button>)}
            </div>)}
          </div>
        </div>
      )}

      {started && step < N - 1 && <div style={{ position: "fixed", bottom: "2.5vh", left: "50%", transform: "translateX(-50%)", zIndex: 6, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", animation: "mb-bob 2s ease-in-out infinite" }}>{u.scroll} ↓</div>}

      {!started && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.24em", color: "var(--text-muted)", marginBottom: 16 }}>{u.eyebrow}</p>
            <h1 style={{ ...display, fontSize: "clamp(34px,8vw,60px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 24, maxWidth: 600 }}>{u.title}</h1>
            <button onClick={start} style={{ background: INK, color: "#fff", border: `2.5px solid ${INK}`, borderRadius: 14, boxShadow: `5px 5px 0 ${INK}`, padding: "16px 38px", fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>{u.start}</button>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 18 }}>{u.audio}</p>
          </div>
        </div>
      )}

      <div ref={trackRef} style={{ height: started ? `${N * 100}vh` : "100vh", background: BG }} />
      <style>{`@keyframes mb-bob { 0%,100%{ transform:translateX(-50%) translateY(0);} 50%{ transform:translateX(-50%) translateY(6px);} } .mb-card{ animation: mb-in .5s cubic-bezier(.22,1,.36,1);} @keyframes mb-in{ from{opacity:0; transform:translateY(14px);} to{opacity:1; transform:none;} }`}</style>
    </>
  );
}

const pill = (active: boolean): React.CSSProperties => ({ padding: "7px 14px", borderRadius: 999, border: `2px solid ${INK}`, background: active ? INK : "transparent", color: active ? "#fff" : INK, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, cursor: "pointer" });

function hitPattern(lane: number, s: number): boolean {
  if (lane === 0) return s % 2 === 0 || s === 2 || s === 6; // bicí
  if (lane === 1) return s === 0 || s === 4; // basa
  if (lane === 2) return s === 0; // akordy
  return s % 2 === 0; // melodie
}
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

function kick(a: AudioContext, into: AudioNode, t: number) { const o = a.createOscillator(); const g = a.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.connect(g).connect(into); o.start(t); o.stop(t + 0.2); }
function snare(a: AudioContext, into: AudioNode, t: number) { const b = a.createBuffer(1, a.sampleRate * 0.2, a.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2); const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1500; const g = a.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); s.connect(f).connect(g).connect(into); s.start(t); s.stop(t + 0.2); }
function hat(a: AudioContext, into: AudioNode, t: number) { const b = a.createBuffer(1, a.sampleRate * 0.05, a.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7000; const g = a.createGain(); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05); s.connect(f).connect(g).connect(into); s.start(t); s.stop(t + 0.06); }
function tone(a: AudioContext, into: AudioNode, freq: number, dur: number, type: OscillatorType, t: number, h: number[] | null) {
  const o = a.createOscillator(); if (h) { const im = new Float32Array(h.length + 1), re = new Float32Array(h.length + 1); h.forEach((x, k) => (im[k + 1] = x)); o.setPeriodicWave(a.createPeriodicWave(re, im)); } else o.type = type;
  o.frequency.value = freq; const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(into); o.start(t); o.stop(t + dur + 0.05);
}
