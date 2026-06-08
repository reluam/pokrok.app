"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/dictionaries";

const INK = "#1a1614", BG = "#FAFAF7";
const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const card: React.CSSProperties = { background: "#fff", border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 ${INK}` };
type Medium = "air" | "water" | "space";

const C = {
  cs: {
    eyebrow: "Sound Blaster", back: "← Spaghetti.ltd",
    title: "Jak funguje zvuk", sub: "Zvuk si těžko představíš — je to neviditelné chvění vzduchu. Tak si ho pojďme ukázat.", scroll: "Scrolluj ↓",
    s1t: "Zvuk je rozkmitání", s1p: "Zdroj — struna, reproduktor, tvůj hlas — rozkmitá molekuly vzduchu kolem sebe. Ty strčí do sousedních, ty zase do dalších… a tlaková vlna se rozběhne až k tvému uchu.",
    s1btn: "Přehrát tón", s1stop: "Ticho", s1note: "Když hraje zvuk, molekuly se hustí a řídnou. To „hustění“ putuje — ne molekuly samotné.",
    s2t: "Rychlost kmitání = výška", s2p: "Čím rychleji to kmitá, tím vyšší tón. Pomalé kmity jsou basy (dlouhé vlny), rychlé jsou výšky (krátké vlny).", s2low: "Basy", s2high: "Výšky", s2hz: "Hz (kmitů za vteřinu)",
    s3t: "Velikost kmitu = hlasitost", s3p: "Jak daleko se molekuly rozkmitají, to je hlasitost. Malý kmit — šepot. Velký kmit — rána.", s3vol: "Hlasitost",
    s4t: "Zvuk musí mít čím cestovat", s4p: "Vlna potřebuje médium — něco, co rozkmitá. Vyzkoušej, jak ten samý zvuk zní jinde:",
    air: "Tvůj pokoj", water: "Pod vodou", space: "Ve vesmíru",
    airN: "Vzduch nese zvuk přímo k uchu — tak ho slyšíš normálně.",
    waterN: "Voda je hustší: zvuk v ní letí 4× rychleji, ale zní zatlumeně a temně.",
    spaceN: "Ticho. Ve vesmíru není vzduch — zvuk nemá co rozkmitat. Žádné médium, žádný zvuk.",
    endT: "A to je celé", endP: "Zvuk je jen rozkmitaný vzduch, co doběhne k uchu. Neviditelný — ale teď ho vidíš.", endBtn: "← Zpět na Spaghetti.ltd",
    audioHint: "🔊 Zapni si zvuk.",
  },
  en: {
    eyebrow: "Sound Blaster", back: "← Spaghetti.ltd",
    title: "How sound works", sub: "Sound is hard to picture — it's invisible shaking of the air. So let's make it visible.", scroll: "Scroll ↓",
    s1t: "Sound is shaking", s1p: "A source — a string, a speaker, your voice — shakes the air molecules around it. They bump the next ones, those bump the next… and a pressure wave runs all the way to your ear.",
    s1btn: "Play a tone", s1stop: "Silence", s1note: "When sound plays, molecules bunch up and spread out. That bunching travels — not the molecules themselves.",
    s2t: "Faster shaking = higher pitch", s2p: "The faster it shakes, the higher the tone. Slow shaking is bass (long waves), fast is treble (short waves).", s2low: "Bass", s2high: "Treble", s2hz: "Hz (shakes per second)",
    s3t: "Bigger shake = louder", s3p: "How far the molecules swing is the loudness. Small swing — a whisper. Big swing — a bang.", s3vol: "Loudness",
    s4t: "Sound needs something to travel through", s4p: "A wave needs a medium — something to shake. Hear the same sound somewhere else:",
    air: "Your room", water: "Underwater", space: "In space",
    airN: "Air carries the sound straight to your ear — that's how you normally hear it.",
    waterN: "Water is denser: sound goes 4× faster, but it sounds muffled and dark.",
    spaceN: "Silence. There's no air in space — nothing for the sound to shake. No medium, no sound.",
    endT: "That's all there is", endP: "Sound is just shaken air reaching your ear. Invisible — but now you've seen it.", endBtn: "← Back to Spaghetti.ltd",
    audioHint: "🔊 Turn your sound on.",
  },
} as const;

export function SoundBlasterBook({ lang }: { lang: Lang }) {
  const t = C[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";
  const acRef = useRef<AudioContext | null>(null);
  const ensure = () => {
    if (!acRef.current) { const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; acRef.current = new AC(); }
    if (acRef.current.state === "suspended") acRef.current.resume();
    return acRef.current;
  };
  useEffect(() => () => { try { acRef.current?.close(); } catch {} }, []);

  return (
    <main style={{ background: BG, color: INK, minHeight: "100dvh" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 22px 100px" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>

        {/* cover */}
        <section style={{ textAlign: "center", padding: "52px 0 30px" }}>
          <Rev><p style={chipS}>{t.eyebrow}</p></Rev>
          <Rev d={0.1}><div style={{ position: "relative", height: 120, margin: "10px 0 4px" }}><span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", fontSize: 40, zIndex: 2 }}>🔊</span>{[0, 1, 2].map((i) => <span key={i} className="sb-ring" style={{ animationDelay: `${i * 0.7}s` }} />)}</div></Rev>
          <Rev d={0.2}><h1 style={{ ...display, fontSize: "clamp(36px,8vw,64px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.02 }}>{t.title}</h1></Rev>
          <Rev d={0.32}><p style={subS}>{t.sub}</p></Rev>
          <Rev d={0.44}><p style={{ ...subS, fontSize: 12, color: "var(--text-muted)", marginTop: 22 }}>{t.audioHint} · {t.scroll}</p></Rev>
        </section>

        <Section title={t.s1t}><Vibration t={t} ensure={ensure} /></Section>
        <Section title={t.s2t}><Frequency t={t} ensure={ensure} /></Section>
        <Section title={t.s3t}><Amplitude t={t} ensure={ensure} /></Section>
        <Section title={t.s4t}><MediumDemo t={t} ensure={ensure} /></Section>

        <section style={{ ...card, padding: "30px 28px", textAlign: "center", marginTop: 44 }}>
          <Rev><div style={{ fontSize: 40, marginBottom: 8 }}>👂</div></Rev>
          <Rev d={0.1}><h2 style={{ ...display, fontSize: "clamp(24px,5vw,36px)", fontWeight: 700, marginBottom: 8 }}>{t.endT}</h2></Rev>
          <Rev d={0.2}><p style={{ ...subS, marginTop: 0 }}>{t.endP}</p></Rev>
          <Rev d={0.32}><Link href={homeHref} style={{ background: INK, color: "#fff", border: `2.5px solid ${INK}`, borderRadius: 12, boxShadow: `4px 4px 0 ${INK}`, padding: "13px 28px", fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700, textDecoration: "none", display: "inline-block", marginTop: 18 }}>{t.endBtn}</Link></Rev>
        </section>
      </div>

      <style>{`
        .sb-ring { position:absolute; left:50%; top:50%; width:18px; height:18px; border:2.5px solid ${INK}; border-radius:50%; transform:translate(-50%,-50%); opacity:0; animation: sb-ring 2.1s ease-out infinite; }
        @keyframes sb-ring { 0%{ width:18px; height:18px; opacity:0.9; } 100%{ width:150px; height:150px; opacity:0; } }
        .sb-r { opacity:0; transform: translateY(16px); transition: opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1); }
        .sb-r.in { opacity:1; transform:none; }
      `}</style>
    </main>
  );
}

type T = Record<keyof (typeof C)["cs"], string>;
const chipS: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.24em", color: "var(--text-muted)" };
const subS: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "12px auto 0", lineHeight: 1.6 };
const pStyle: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 16 };
const btn = (active: boolean): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 999, border: `2.5px solid ${INK}`, background: active ? INK : "#fff", color: active ? "#fff" : INK, boxShadow: active ? "none" : `3px 3px 0 ${INK}`, transform: active ? "translate(3px,3px)" : "none", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, cursor: "pointer" });

// reveal-on-scroll
function Rev({ d = 0, children }: { d?: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = ref.current; if (!el) return; const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } }, { threshold: 0.15 }); io.observe(el); return () => io.disconnect(); }, []);
  return <div ref={ref} className="sb-r" style={{ transitionDelay: `${d}s` }}>{children}</div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: "34px 0", borderTop: "1.5px solid rgba(26,22,20,0.1)" }}>
      <Rev><h2 style={{ ...display, fontSize: "clamp(23px,4.5vw,34px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>{title}</h2></Rev>
      {children}
    </section>
  );
}

/* ── 1) Vibrace + tón ──────────────────────────────────────────── */
function Vibration({ t, ensure }: { t: T; ensure: () => AudioContext }) {
  const [on, setOn] = useState(false);
  const ref = useRef<{ o: OscillatorNode; g: GainNode } | null>(null);
  const toggle = () => {
    if (on) { ref.current?.o.stop(); ref.current = null; setOn(false); return; }
    const ac = ensure(); const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = 200;
    const g = ac.createGain(); g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.16, ac.currentTime + 0.05);
    o.connect(g).connect(ac.destination); o.start(); ref.current = { o, g }; setOn(true);
  };
  useEffect(() => () => { try { ref.current?.o.stop(); } catch {} }, []);
  return (<div>
    <Rev><p style={pStyle}>{t.s1p}</p></Rev>
    <Rev d={0.1}><div style={{ ...card, padding: 14 }}><Molecules mode="air" active={on} freq={200} /></div></Rev>
    <Rev d={0.18}><div style={{ marginTop: 14 }}><button onClick={toggle} style={btn(on)}>{on ? "❚❚ " + t.s1stop : "▶ " + t.s1btn}</button></div></Rev>
    <Rev d={0.26}><p style={{ ...pStyle, fontStyle: "italic", fontSize: 15, borderLeft: `3px solid ${INK}`, paddingLeft: 14, marginTop: 16, marginBottom: 0 }}>{t.s1note}</p></Rev>
  </div>);
}

/* ── 2) Frekvence ──────────────────────────────────────────────── */
function Frequency({ t, ensure }: { t: T; ensure: () => AudioContext }) {
  const [freq, setFreq] = useState(220);
  const [on, setOn] = useState(false);
  const ref = useRef<{ o: OscillatorNode; g: GainNode } | null>(null);
  const start = () => { const ac = ensure(); const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = freq; const g = ac.createGain(); g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.16, ac.currentTime + 0.04); o.connect(g).connect(ac.destination); o.start(); ref.current = { o, g }; setOn(true); };
  const stop = () => { ref.current?.o.stop(); ref.current = null; setOn(false); };
  useEffect(() => { if (ref.current && acReady()) ref.current.o.frequency.setTargetAtTime(freq, ref.current.o.context.currentTime, 0.02); }, [freq]);
  function acReady() { return !!ref.current; }
  useEffect(() => () => { try { ref.current?.o.stop(); } catch {} }, []);
  const cycles = Math.round(2 + (freq - 80) / 80);
  return (<div>
    <Rev><p style={pStyle}>{t.s2p}</p></Rev>
    <Rev d={0.1}><div style={{ ...card, padding: 16 }}>
      <SineWave cycles={cycles} color={freq < 200 ? "#4aa3ff" : freq > 500 ? "#ff6fae" : "#ffb43c"} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "#4aa3ff" }}>{t.s2low}</span>
        <input type="range" min={80} max={900} value={freq} onChange={(e) => { setFreq(+e.target.value); if (!on) start(); }} style={{ flex: 1, accentColor: INK }} />
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "#ff6fae" }}>{t.s2high}</span>
      </div>
      <p style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, marginTop: 8 }}>{freq} {t.s2hz}</p>
      <div style={{ textAlign: "center", marginTop: 8 }}><button onClick={on ? stop : start} style={btn(on)}>{on ? "❚❚" : "▶"}</button></div>
    </div></Rev>
  </div>);
}

/* ── 3) Amplituda ──────────────────────────────────────────────── */
function Amplitude({ t, ensure }: { t: T; ensure: () => AudioContext }) {
  const [vol, setVol] = useState(0.4);
  const [on, setOn] = useState(false);
  const ref = useRef<{ o: OscillatorNode; g: GainNode } | null>(null);
  const start = () => { const ac = ensure(); const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = 220; const g = ac.createGain(); g.gain.value = vol * 0.4; o.connect(g).connect(ac.destination); o.start(); ref.current = { o, g }; setOn(true); };
  const stop = () => { ref.current?.o.stop(); ref.current = null; setOn(false); };
  useEffect(() => { if (ref.current) ref.current.g.gain.setTargetAtTime(vol * 0.4, ref.current.o.context.currentTime, 0.02); }, [vol]);
  useEffect(() => () => { try { ref.current?.o.stop(); } catch {} }, []);
  return (<div>
    <Rev><p style={pStyle}>{t.s3p}</p></Rev>
    <Rev d={0.1}><div style={{ ...card, padding: 16 }}>
      <SineWave cycles={5} color="#ffb43c" amp={0.25 + vol * 0.75} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <span style={{ fontSize: 16 }}>🔈</span>
        <input type="range" min={0} max={1} step={0.01} value={vol} onChange={(e) => { setVol(+e.target.value); if (!on) start(); }} style={{ flex: 1, accentColor: INK }} />
        <span style={{ fontSize: 18 }}>🔊</span>
      </div>
      <p style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, marginTop: 8 }}>{t.s3vol}: {Math.round(vol * 100)} %</p>
      <div style={{ textAlign: "center", marginTop: 8 }}><button onClick={on ? stop : start} style={btn(on)}>{on ? "❚❚" : "▶"}</button></div>
    </div></Rev>
  </div>);
}

/* ── 4) Médium: pokoj / voda / vesmír ──────────────────────────── */
function MediumDemo({ t, ensure }: { t: T; ensure: () => AudioContext }) {
  const [mode, setMode] = useState<Medium | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const note = mode === "air" ? t.airN : mode === "water" ? t.waterN : mode === "space" ? t.spaceN : "";

  const play = (m: Medium) => {
    stopRef.current?.(); stopRef.current = null; setMode(m);
    if (m === "space") return; // ticho
    const ac = ensure();
    const filt = ac.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = m === "water" ? 420 : 18000;
    const master = ac.createGain(); master.gain.value = m === "water" ? 0.7 : 0.5;
    filt.connect(master).connect(ac.destination);
    const scale = [0, 4, 7, 11, 12, 11, 7, 4]; let i = 0;
    const root = m === "water" ? 180 : 262;
    const timer = setInterval(() => {
      const o = ac.createOscillator(); o.type = "triangle"; o.frequency.value = root * Math.pow(2, scale[i % scale.length] / 12);
      const g = ac.createGain(); const tn = ac.currentTime; g.gain.setValueAtTime(0.0001, tn); g.gain.exponentialRampToValueAtTime(0.5, tn + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, tn + 0.34);
      o.connect(g).connect(filt); o.start(tn); o.stop(tn + 0.38); i++;
    }, 300);
    stopRef.current = () => { clearInterval(timer); try { filt.disconnect(); } catch {} };
  };
  useEffect(() => () => { stopRef.current?.(); }, []);

  return (<div>
    <Rev><p style={pStyle}>{t.s4p}</p></Rev>
    <Rev d={0.1}><div style={{ ...card, padding: 14, overflow: "hidden" }}>
      <Molecules mode={mode ?? "air"} active={mode != null && mode !== "space"} freq={mode === "water" ? 120 : 200} space={mode === "space"} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 14 }}>
        <button onClick={() => play("air")} style={btn(mode === "air")}>🏠 {t.air}</button>
        <button onClick={() => play("water")} style={btn(mode === "water")}>🌊 {t.water}</button>
        <button onClick={() => play("space")} style={btn(mode === "space")}>🌌 {t.space}</button>
      </div>
      {note && <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)", marginTop: 12, textAlign: "center", maxWidth: 440, marginInline: "auto" }}>{note}</p>}
    </div></Rev>
  </div>);
}

/* ── vizualizace ───────────────────────────────────────────────── */
function SineWave({ cycles, color, amp = 1 }: { cycles: number; color: string; amp?: number }) {
  const W = 320, H = 90, mid = H / 2;
  let d = `M 0 ${mid}`;
  for (let x = 0; x <= W; x += 2) { const y = mid - Math.sin((x / W) * cycles * Math.PI * 2) * 30 * amp; d += ` L ${x} ${y.toFixed(1)}`; }
  return <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}><line x1="0" y1={mid} x2={W} y2={mid} stroke="rgba(26,22,20,0.12)" strokeWidth="1.5" /><path d={d} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" /></svg>;
}

// longitudinální vlna molekul (canvas)
function Molecules({ mode, active, freq, space = false }: { mode: Medium; active: boolean; freq: number; space?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ampRef = useRef(0);
  useEffect(() => {
    const cv = ref.current!; const ctx = cv.getContext("2d")!; let raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { const r = cv.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); const ro = new ResizeObserver(resize); ro.observe(cv);
    const cols = mode === "water" ? 30 : 24, rows = mode === "water" ? 9 : 7;
    const stars = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.3 }));
    let tt = 0;
    const draw = () => {
      const w = cv.width / dpr, h = cv.height / dpr; tt += 0.05;
      ampRef.current += ((active ? 1 : 0) - ampRef.current) * 0.08;
      const a = ampRef.current;
      if (space) {
        ctx.fillStyle = "#05060f"; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#fff"; for (const s of stars) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(tt * 0.6 + s.x * 9); ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "700 13px system-ui"; ctx.textAlign = "center"; ctx.fillText(mode === "space" ? "— ticho —" : "", w / 2, h / 2);
        raf = requestAnimationFrame(draw); return;
      }
      // pozadí
      if (mode === "water") { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#bfe3ff"); g.addColorStop(1, "#7fb6e0"); ctx.fillStyle = g; }
      else ctx.fillStyle = "#eef3fb";
      ctx.fillRect(0, 0, w, h);
      const dotR = mode === "water" ? 2.2 : 2.6; const k = (freq / 200) * 0.9;
      ctx.fillStyle = mode === "water" ? "rgba(20,60,100,0.55)" : "rgba(26,22,20,0.5)";
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const bx = (c + 0.5) / cols * w, by = (r + 0.5) / rows * h;
        const disp = Math.sin((bx / w) * cols * k - tt * (1 + freq / 300)) * (mode === "water" ? 7 : 9) * a;
        ctx.beginPath(); ctx.arc(bx + disp, by, dotR, 0, 7); ctx.fill();
      }
      // emitor vlevo
      ctx.beginPath(); ctx.arc(10, h / 2, 7, 0, 7); ctx.fillStyle = "#ff6fae"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
      // ucho vpravo
      ctx.fillStyle = INK; ctx.font = "15px system-ui"; ctx.textAlign = "center"; ctx.fillText("👂", w - 12, h / 2 + 5);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [mode, active, freq, space]);
  return <canvas ref={ref} style={{ width: "100%", height: 130, display: "block", borderRadius: 10, border: `2px solid ${INK}` }} />;
}
