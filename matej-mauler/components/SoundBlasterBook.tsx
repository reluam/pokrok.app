"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/dictionaries";

const INK = "#1a1614";
const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
type Medium = "air" | "water" | "space";

// hlasy: 4 základní + nástroje (harmonické spektrum)
type Voice = { id: string; cs: string; en: string; h?: number[] };
const VOICES: Voice[] = [
  { id: "sine", cs: "čistý", en: "pure" },
  { id: "saw", cs: "ostrý", en: "sharp" },
  { id: "square", cs: "drsný", en: "buzzy" },
  { id: "triangle", cs: "jemný", en: "soft" },
  { id: "flute", cs: "flétna", en: "flute", h: [1, 0.15, 0.05] },
  { id: "violin", cs: "housle", en: "violin", h: [1, 0.7, 0.55, 0.4, 0.32, 0.26, 0.2, 0.15, 0.12, 0.08] },
  { id: "piano", cs: "klavír", en: "piano", h: [1, 0.55, 0.32, 0.2, 0.13, 0.08, 0.05, 0.03] },
  { id: "pad", cs: "pad", en: "pad", h: [1, 0, 0.5, 0, 0.25, 0, 0.12] },
];
const voiceOf = (id: string) => VOICES.find((v) => v.id === id);

type Sec = {
  cs: { t: string; p: string }; en: { t: string; p: string };
  freqMul: number; gainMul: number; filter: number; rows: number;
  medium: Medium; interactive?: "freq" | "amp" | "wave";
};

const SECTIONS: Sec[] = [
  { cs: { t: "Co je zvuk?", p: "Zvuk je chvění. Něco se rozkmitá — struna, hlas, reproduktor — a vzduch kolem se rozhýbe taky." }, en: { t: "What is sound?", p: "Sound is shaking. Something vibrates — a string, a voice, a speaker — and the air around it moves too." }, freqMul: 0.6, gainMul: 0.9, filter: 18000, rows: 1, medium: "air" },
  { cs: { t: "Vzduch se hustí a řídne", p: "Podívej na ty tečky — jsou to molekuly vzduchu. Zvuk je strká k sobě a zase od sebe. To hustění a řídnutí běží dál." }, en: { t: "Air squeezes and spreads", p: "Look at the dots — they're air molecules. Sound pushes them together and apart. That squeezing and spreading travels on." }, freqMul: 0.6, gainMul: 0.9, filter: 18000, rows: 1, medium: "air" },
  { cs: { t: "A doběhne k uchu", p: "Vlna stlačeného vzduchu dorazí k tobě, rozechvěje bubínek — a ty to slyšíš." }, en: { t: "And reaches your ear", p: "The wave of squeezed air arrives, shakes your eardrum — and you hear it." }, freqMul: 0.8, gainMul: 0.9, filter: 18000, rows: 1, medium: "air" },
  { cs: { t: "Rychlost = výška", p: "Čím rychleji se molekuly hýbou, tím vyšší tón. Zatáhni za posuvník — a tvoje volba ti zůstane po celou cestu." }, en: { t: "Speed = pitch", p: "The faster the molecules move, the higher the tone. Drag the slider — your choice stays with you all the way." }, freqMul: 1, gainMul: 0.9, filter: 18000, rows: 5, medium: "air", interactive: "freq" },
  { cs: { t: "Basy a výšky", p: "Pomalé hustění je hluboká basa — molekuly se houpou líně. Rychlé je pisklavá výška — cukají se sem a tam." }, en: { t: "Bass and treble", p: "Slow squeezing is deep bass — the molecules swing lazily. Fast is squeaky treble — they jitter back and forth." }, freqMul: 1, gainMul: 0.9, filter: 18000, rows: 3, medium: "air" },
  { cs: { t: "Velikost = hlasitost", p: "Jak daleko molekuly skáčou, tak je to hlasité. Malý pohyb šeptá, velký duní. Zkus to — taky to zůstane." }, en: { t: "Size = loudness", p: "How far the molecules swing is how loud it is. A small move whispers, a big one booms. Try it — this stays too." }, freqMul: 1, gainMul: 1, filter: 18000, rows: 5, medium: "air", interactive: "amp" },
  { cs: { t: "Barva zvuku", p: "Stejná výška umí znít jinak — flétna, housle, klavír. Liší se tím, jak přesně molekuly tlačí. Vyber si svůj zvuk." }, en: { t: "The color of sound", p: "The same pitch can sound different — flute, violin, piano. They differ in exactly how the molecules push. Pick your sound." }, freqMul: 1, gainMul: 0.9, filter: 18000, rows: 7, medium: "air", interactive: "wave" },
  { cs: { t: "Potřebuje médium", p: "Aby se zvuk nesl, musí mít co rozhýbat — vzduch, vodu, zeď. Bez molekul to nejde." }, en: { t: "It needs a medium", p: "To travel, sound needs something to move — air, water, a wall. Without molecules, it can't." }, freqMul: 0.9, gainMul: 0.9, filter: 18000, rows: 3, medium: "air" },
  { cs: { t: "Pod vodou", p: "Voda má molekuly natěsno — zvuk v ní letí rychleji, ale zní temně a tlumeně. (Tvůj tón, jen pod vodou.)" }, en: { t: "Underwater", p: "Water's molecules are packed tight — sound goes faster, but sounds dark and muffled. (Your tone, just underwater.)" }, freqMul: 0.5, gainMul: 1, filter: 420, rows: 5, medium: "water" },
  { cs: { t: "Ve vesmíru ticho", p: "Tady nejsou žádné molekuly. Není co rozhýbat — a tak je úplné ticho. Žádné médium, žádný zvuk." }, en: { t: "Silence in space", p: "There are no molecules here. Nothing to move — so it's total silence. No medium, no sound." }, freqMul: 1, gainMul: 0, filter: 8000, rows: 3, medium: "space" },
  { cs: { t: "Ohyb za roh", p: "Basy se umí ohnout za roh a projít stěnou. Výšky ne — ty se zastaví. Proto od souseda slyšíš jen dunění, ne melodii." }, en: { t: "Bending around corners", p: "Bass bends around corners and through walls. Treble can't — it stops. That's why you hear the neighbor's thump, not the tune." }, freqMul: 0.4, gainMul: 1, filter: 700, rows: 3, medium: "air" },
  { cs: { t: "Jak ho zastavit", p: "Chceš ticho? Těžká zeď zvuk odrazí. Měkká věc — pěna, hlína, koberec — ho spolkne. Hmota blokuje, měkkost pohlcuje." }, en: { t: "How to stop it", p: "Want quiet? A heavy wall reflects sound. A soft thing — foam, soil, a rug — swallows it. Mass blocks, softness absorbs." }, freqMul: 0.85, gainMul: 0.6, filter: 1400, rows: 3, medium: "air" },
  { cs: { t: "A to je celé", p: "Zvuk je jen rozhýbaný vzduch, co doběhne k uchu. Umíš ho zrychlit, zesílit, ohnout i ztišit. Teď ho slyšíš — i vidíš." }, en: { t: "That's all there is", p: "Sound is just moved air reaching your ear. You can speed it up, make it louder, bend it, quiet it. Now you hear it — and see it." }, freqMul: 1, gainMul: 0.95, filter: 18000, rows: 1, medium: "air" },
];

const UI = {
  cs: { back: "← Spaghetti.ltd", eyebrow: "Zvuková experience", title: "Cesta po zvukové vlně", start: "Start ▶", audio: "🔊 Zapni si zvuk a pusť se hloub.", scroll: "scrolluj dolů", low: "basa", high: "výška", quiet: "tiše", loud: "nahlas", mute: "Ztlumit", unmute: "Zvuk", toMusic: "Pokračovat: jak vzniká hudba →" },
  en: { back: "← Spaghetti.ltd", eyebrow: "A sound experience", title: "A journey along a sound wave", start: "Start ▶", audio: "🔊 Turn your sound on and dive deeper.", scroll: "scroll down", low: "bass", high: "treble", quiet: "soft", loud: "loud", mute: "Mute", unmute: "Sound", toMusic: "Next: how music is made →" },
} as const;

export function SoundBlasterBook({ lang }: { lang: Lang }) {
  const u = UI[lang]; const homeHref = lang === "cs" ? "/cs" : "/"; const N = SECTIONS.length;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [step, setStep] = useState(0);

  const userFreq = useRef(220); const [freqUI, setFreqUI] = useState(220);
  const userGain = useRef(0.5); const [ampUI, setAmpUI] = useState(0.5);
  const userVoice = useRef("sine"); const [voiceUI, setVoiceUI] = useState("sine");

  const ac = useRef<AudioContext | null>(null);
  const osc = useRef<OscillatorNode | null>(null);
  const level = useRef<GainNode | null>(null);
  const filt = useRef<BiquadFilterNode | null>(null);
  const master = useRef<GainNode | null>(null);

  const applyVoice = (id: string) => { const o = osc.current, a = ac.current; if (!o || !a) return; const v = voiceOf(id); if (v?.h) { const imag = new Float32Array(v.h.length + 1), real = new Float32Array(v.h.length + 1); v.h.forEach((x, k) => (imag[k + 1] = x)); o.setPeriodicWave(a.createPeriodicWave(real, imag)); } else o.type = (id === "saw" ? "sawtooth" : id) as OscillatorType; };

  const start = () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const a = new AC(); ac.current = a;
    const o = a.createOscillator(); o.frequency.value = userFreq.current * SECTIONS[0].freqMul;
    const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 18000;
    const lv = a.createGain(); lv.gain.value = 0;
    const ms = a.createGain(); ms.gain.value = muted ? 0 : 1;
    // jemný reverb pro teplejší zvuk
    const conv = a.createConvolver(); const len = (a.sampleRate * 1.4) | 0; const buf = a.createBuffer(2, len, a.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2); }
    conv.buffer = buf; const wet = a.createGain(); wet.gain.value = 0.2;
    o.connect(f).connect(lv); lv.connect(ms); lv.connect(conv).connect(wet).connect(ms); ms.connect(a.destination);
    osc.current = o; level.current = lv; filt.current = f; master.current = ms;
    applyVoice(userVoice.current); o.start();
    setStarted(true);
  };
  const toggleMute = () => setMuted((m) => { const nm = !m; if (master.current && ac.current) master.current.gain.setTargetAtTime(nm ? 0 : 1, ac.current.currentTime, 0.03); return nm; });
  useEffect(() => () => { try { osc.current?.stop(); ac.current?.close(); } catch {} }, []);

  // smyčka: scroll → morf + částicová animace
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);
    const cur = { freq: userFreq.current * SECTIONS[0].freqMul, level: 0, filter: 18000, rows: 1, medium: 0 };
    let phase = 0, raf = 0, lastStep = 0;
    const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3 }));
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

    const loop = () => {
      const track = trackRef.current; let p = 0;
      if (track) { const dist = track.offsetHeight - innerHeight; p = dist > 0 ? Math.min(1, Math.max(0, -track.getBoundingClientRect().top / dist)) : 0; }
      const idx = Math.min(N - 1, Math.round(p * (N - 1)));
      if (idx !== lastStep) { lastStep = idx; setStep(idx); }
      const s = SECTIONS[idx];
      cur.freq = lerp(cur.freq, userFreq.current * s.freqMul, 0.08);
      cur.level = lerp(cur.level, started ? userGain.current * s.gainMul : 0, 0.06);
      cur.filter = lerp(cur.filter, s.filter, 0.06);
      cur.rows = lerp(cur.rows, s.rows, 0.1);
      cur.medium = lerp(cur.medium, s.medium === "water" ? 1 : s.medium === "space" ? 2 : 0, 0.05);

      if (osc.current && level.current && filt.current && ac.current) {
        const now = ac.current.currentTime;
        osc.current.frequency.setTargetAtTime(cur.freq, now, 0.05);
        level.current.gain.setTargetAtTime(cur.level * 0.16, now, 0.08);
        filt.current.frequency.setTargetAtTime(cur.filter, now, 0.08);
      }

      const w = innerWidth, h = innerHeight, mid = h / 2; const space = cur.medium > 1.3;
      if (space) { ctx.fillStyle = "#05060f"; ctx.fillRect(0, 0, w, h); ctx.fillStyle = "#fff"; for (const st of stars) { ctx.globalAlpha = 0.4 + 0.5 * Math.sin(phase * 0.6 + st.x * 9); ctx.beginPath(); ctx.arc(st.x * w, st.y * h, st.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
      else { const water = Math.min(1, cur.medium); const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, mixHex("#FAFAF7", "#cfe6ff", water)); g.addColorStop(1, mixHex("#eef3fb", "#7fb6e0", water)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }

      phase += 0.02 + cur.freq / 5000;
      const rows = Math.max(1, Math.round(cur.rows));
      const M = 64; const spacing = w / M; const A = spacing * 1.15 * cur.level; const cyc = Math.max(1.2, Math.min(20, cur.freq / 45));
      const dark = cur.medium > 0.5; const dotBase = dark ? [13, 59, 102] : [26, 22, 20];
      const rowGap = Math.min(34, (h * 0.34) / rows);
      for (let r = 0; r < rows; r++) {
        const y = mid + (r - (rows - 1) / 2) * rowGap;
        for (let i = 0; i < M; i++) {
          const bx = (i + 0.5) * spacing; const t = (bx / w) * cyc * Math.PI * 2 - phase;
          const disp = A * waveVal(userVoice.current, t);
          // komprese: blízká levá tečka → tmavší/větší
          const t2 = ((bx - spacing) / w) * cyc * Math.PI * 2 - phase; const gap = spacing + (disp - A * waveVal(userVoice.current, t2));
          const comp = Math.max(0, Math.min(1, 1 - gap / spacing));
          const op = (space ? 0.0 : 0.35 + comp * 0.55) * (1 - Math.max(0, cur.medium - 1));
          ctx.globalAlpha = op; ctx.fillStyle = `rgb(${dotBase[0]},${dotBase[1]},${dotBase[2]})`;
          ctx.beginPath(); ctx.arc(bx + disp, y, 2 + comp * 1.8, 0, 7); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (space) { ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "700 14px system-ui"; ctx.textAlign = "center"; ctx.fillText("— ticho —", w / 2, mid - 30); }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, [started, N]);

  const sec = SECTIONS[step]; const txt = sec[lang]; const dark = sec.medium === "space";
  const ctrlColor = dark ? "#fff" : INK;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}><canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} /></div>

      <div style={{ position: "fixed", top: 16, left: 18, zIndex: 6 }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: dark ? "rgba(255,255,255,0.7)" : "var(--text-muted)", textDecoration: "none" }}>{u.back}</Link>
      </div>

      {/* mute — pořád dostupné */}
      {started && (
        <button onClick={toggleMute} aria-label={muted ? u.unmute : u.mute} title={muted ? u.unmute : u.mute}
          style={{ position: "fixed", top: 14, right: 16, zIndex: 7, width: 42, height: 42, borderRadius: 12, border: `2.5px solid ${ctrlColor}`, background: dark ? "rgba(8,10,24,0.5)" : "#fff", color: ctrlColor, boxShadow: dark ? "none" : `3px 3px 0 ${INK}`, cursor: "pointer", fontSize: 16 }}>{muted ? "🔇" : "🔊"}</button>
      )}

      {started && (
        <div style={{ position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)", zIndex: 6, display: "flex", flexDirection: "column", gap: 7, marginTop: 34 }}>
          {SECTIONS.map((_, i) => <div key={i} style={{ width: i === step ? 9 : 6, height: i === step ? 9 : 6, borderRadius: "50%", background: i <= step ? ctrlColor : (dark ? "rgba(255,255,255,0.3)" : "rgba(26,22,20,0.25)"), transition: "all .2s" }} />)}
        </div>
      )}

      {started && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: "8vh", zIndex: 5, display: "flex", justifyContent: "center", padding: "0 22px", pointerEvents: "none" }}>
          <div key={step} className="sb-card" style={{ maxWidth: 560, textAlign: "center", background: dark ? "rgba(8,10,24,0.6)" : "rgba(255,255,255,0.8)", border: `2.5px solid ${dark ? "rgba(255,255,255,0.3)" : INK}`, borderRadius: 18, boxShadow: dark ? "none" : `5px 5px 0 ${INK}`, padding: "20px 24px", color: ctrlColor, backdropFilter: "blur(6px)", pointerEvents: "auto" }}>
            <p style={{ ...display, fontSize: "clamp(22px,5vw,32px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>{txt.t}</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 15.5, lineHeight: 1.55, color: dark ? "rgba(255,255,255,0.85)" : "var(--text-secondary)" }}>{txt.p}</p>

            {sec.interactive === "freq" && (<div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "#4aa3ff" }}>{u.low}</span>
              <input type="range" min={60} max={900} value={freqUI} onChange={(e) => { const v = +e.target.value; userFreq.current = v; setFreqUI(v); }} style={{ flex: 1, accentColor: ctrlColor }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "#ff6fae" }}>{u.high}</span>
            </div>)}
            {sec.interactive === "amp" && (<div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700 }}>{u.quiet}</span>
              <input type="range" min={0} max={1} step={0.01} value={ampUI} onChange={(e) => { const v = +e.target.value; userGain.current = v; setAmpUI(v); }} style={{ flex: 1, accentColor: ctrlColor }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700 }}>{u.loud}</span>
            </div>)}
            {sec.interactive === "wave" && (<div style={{ display: "flex", gap: 7, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
              {VOICES.map((v) => <button key={v.id} onClick={() => { userVoice.current = v.id; setVoiceUI(v.id); applyVoice(v.id); }} style={{ padding: "6px 11px", borderRadius: 999, border: `2px solid ${ctrlColor}`, background: voiceUI === v.id ? ctrlColor : "transparent", color: voiceUI === v.id ? (dark ? INK : "#fff") : ctrlColor, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{v[lang]}</button>)}
            </div>)}

            {step === N - 1 && <Link href={lang === "cs" ? "/music-blaster" : "/music-blaster"} style={{ display: "inline-block", marginTop: 16, fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: ctrlColor, textDecoration: "underline", textUnderlineOffset: 3, pointerEvents: "auto" }}>{u.toMusic}</Link>}
          </div>
        </div>
      )}

      {started && step < N - 1 && <div style={{ position: "fixed", bottom: "2.5vh", left: "50%", transform: "translateX(-50%)", zIndex: 6, fontFamily: "var(--font-sans)", fontSize: 12, color: dark ? "rgba(255,255,255,0.6)" : "var(--text-muted)", animation: "sb-bob 2s ease-in-out infinite" }}>{u.scroll} ↓</div>}

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

      <div ref={trackRef} style={{ height: started ? `${N * 100}vh` : "100vh" }} />

      <style>{`@keyframes sb-bob { 0%,100%{ transform:translateX(-50%) translateY(0);} 50%{ transform:translateX(-50%) translateY(6px);} }
        .sb-card { animation: sb-in .5s cubic-bezier(.22,1,.36,1); }
        @keyframes sb-in { from{ opacity:0; transform: translateY(14px);} to{opacity:1; transform:none;} }`}</style>
    </>
  );
}

function waveVal(voiceId: string, t: number): number {
  const v = voiceOf(voiceId);
  if (v?.h) { let s = 0, n = 0; for (let k = 0; k < v.h.length; k++) { s += v.h[k] * Math.sin((k + 1) * t); n += v.h[k]; } return s / (n || 1); }
  const x = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (voiceId === "square") return Math.sin(t) >= 0 ? 1 : -1;
  if (voiceId === "saw") return x / Math.PI - 1;
  if (voiceId === "triangle") return x < Math.PI ? (x / Math.PI) * 2 - 1 : 3 - (x / Math.PI) * 2;
  return Math.sin(t);
}
function mixHex(a: string, b: string, k: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, k))));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
