"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/dictionaries";

const INK = "#1a1614";
const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
type Wave = "sine" | "square" | "sawtooth" | "triangle";
type Medium = "air" | "water" | "space";

type Sec = {
  cs: { t: string; p: string }; en: { t: string; p: string };
  freqVis: number; amp: number; audioFreq: number; gain: number; filter: number;
  type: Wave; medium: Medium; interactive?: "freq" | "amp" | "wave";
};

const SECTIONS: Sec[] = [
  { cs: { t: "Co je zvuk?", p: "Zvuk je chvění. Něco se rozkmitá — struna, hlas, reproduktor — a vzduch kolem se roztřese s ním." }, en: { t: "What is sound?", p: "Sound is shaking. Something starts to vibrate — a string, a voice, a speaker — and the air around it shakes too." }, freqVis: 5, amp: 0.45, audioFreq: 110, gain: 0.5, filter: 18000, type: "sine", medium: "air" },
  { cs: { t: "Běží jako vlna", p: "To chvění se rozběhne vzduchem dál a dál — jako kruhy na vodě, když hodíš kamínek." }, en: { t: "It runs like a wave", p: "That shaking spreads through the air, on and on — like ripples on water when you toss a pebble." }, freqVis: 6, amp: 0.5, audioFreq: 110, gain: 0.5, filter: 18000, type: "sine", medium: "air" },
  { cs: { t: "A doběhne k uchu", p: "Vlna dorazí k tobě, rozechvěje ti bubínek v uchu — a ty to slyšíš." }, en: { t: "And reaches your ear", p: "The wave arrives, shakes your eardrum — and you hear it." }, freqVis: 6, amp: 0.5, audioFreq: 160, gain: 0.5, filter: 18000, type: "sine", medium: "air" },
  { cs: { t: "Rychlost = výška", p: "Čím rychleji se to třese, tím vyšší tón. Zatáhni za posuvník a slyš to." }, en: { t: "Speed = pitch", p: "The faster it shakes, the higher the tone. Drag the slider and hear it." }, freqVis: 12, amp: 0.5, audioFreq: 330, gain: 0.5, filter: 18000, type: "sine", medium: "air", interactive: "freq" },
  { cs: { t: "Basy a výšky", p: "Pomalé chvění je hluboká basa — dlouhá, líná vlna. Rychlé je pisklavá výška — krátká, hustá vlna." }, en: { t: "Bass and treble", p: "Slow shaking is deep bass — a long, lazy wave. Fast is squeaky treble — a short, dense wave." }, freqVis: 16, amp: 0.5, audioFreq: 520, gain: 0.5, filter: 18000, type: "sine", medium: "air" },
  { cs: { t: "Velikost = hlasitost", p: "Jak vysoká je vlna, tak hlasitý je zvuk. Malá vlnka šeptá, velká duní. Zkus to." }, en: { t: "Size = loudness", p: "How tall the wave is, that's how loud it is. A tiny ripple whispers, a big one booms. Try it." }, freqVis: 8, amp: 0.6, audioFreq: 200, gain: 0.5, filter: 18000, type: "sine", medium: "air", interactive: "amp" },
  { cs: { t: "Barva zvuku", p: "Stejný tón umí znít měkce, ostře nebo drsně — podle tvaru vlny. To je barva zvuku. Přepínej." }, en: { t: "The color of sound", p: "The same tone can sound soft, sharp or rough — depending on the wave shape. That's timbre. Switch it." }, freqVis: 9, amp: 0.5, audioFreq: 220, gain: 0.5, filter: 18000, type: "sine", medium: "air", interactive: "wave" },
  { cs: { t: "Potřebuje médium", p: "Aby se zvuk nesl, musí mít co rozkmitat — vzduch, vodu, zeď. Bez ničeho to nejde." }, en: { t: "It needs a medium", p: "To travel, sound needs something to shake — air, water, a wall. With nothing, it can't." }, freqVis: 8, amp: 0.5, audioFreq: 180, gain: 0.5, filter: 18000, type: "sine", medium: "air" },
  { cs: { t: "Pod vodou", p: "Ve vodě je zvuk rychlejší, ale zní temně a tlumeně — voda je hustá a pohltí výšky." }, en: { t: "Underwater", p: "In water sound is faster, but dark and muffled — water is dense and soaks up the highs." }, freqVis: 5, amp: 0.55, audioFreq: 90, gain: 0.7, filter: 420, type: "sine", medium: "water" },
  { cs: { t: "Ve vesmíru ticho", p: "Tady není vzduch. Zvuk nemá co rozkmitat — a tak je úplné ticho. Žádné médium, žádný zvuk." }, en: { t: "Silence in space", p: "There's no air here. Sound has nothing to shake — so it's total silence. No medium, no sound." }, freqVis: 4, amp: 0, audioFreq: 80, gain: 0, filter: 8000, type: "sine", medium: "space" },
  { cs: { t: "Ohyb za roh", p: "Basy se umí ohnout za roh a projít stěnou. Výšky ne — ty se zastaví. Proto od souseda slyšíš jen dunění, ne melodii." }, en: { t: "Bending around corners", p: "Bass can bend around corners and pass through walls. Treble can't — it stops. That's why you hear the neighbor's thump, not the tune." }, freqVis: 4, amp: 0.55, audioFreq: 70, gain: 0.55, filter: 700, type: "sine", medium: "air" },
  { cs: { t: "Jak ho zastavit", p: "Chceš ticho? Těžká zeď zvuk odrazí. Měkká věc — pěna, hlína, koberec — ho spolkne. Hmota blokuje, měkkost pohlcuje." }, en: { t: "How to stop it", p: "Want quiet? A heavy wall reflects sound. A soft thing — foam, soil, a rug — swallows it. Mass blocks, softness absorbs." }, freqVis: 7, amp: 0.4, audioFreq: 150, gain: 0.45, filter: 1400, type: "sine", medium: "air" },
  { cs: { t: "A to je celé", p: "Zvuk je jen rozkmitaný vzduch, co doběhne k uchu. Umíš ho zrychlit, zesílit, ohnout i ztišit. Teď ho slyšíš — i vidíš." }, en: { t: "That's all there is", p: "Sound is just shaken air reaching your ear. You can speed it up, make it louder, bend it, quiet it. Now you hear it — and see it." }, freqVis: 7, amp: 0.5, audioFreq: 180, gain: 0.5, filter: 18000, type: "sine", medium: "air" },
];

const UI = {
  cs: { back: "← Spaghetti.ltd", eyebrow: "Zvuková experience", title: "Cesta po zvukové vlně", start: "Start ▶", audio: "🔊 Zapni si zvuk a pusť se hloub.", scroll: "scrolluj dolů", low: "basa", high: "výška", quiet: "tiše", loud: "nahlas", waves: ["měkká", "ostrá", "drsná", "jemná"] },
  en: { back: "← Spaghetti.ltd", eyebrow: "A sound experience", title: "A journey along a sound wave", start: "Start ▶", audio: "🔊 Turn your sound on and dive deeper.", scroll: "scroll down", low: "bass", high: "treble", quiet: "soft", loud: "loud", waves: ["soft", "sharp", "rough", "smooth"] },
} as const;

const WAVE_TYPES: Wave[] = ["sine", "square", "sawtooth", "triangle"];

export function SoundBlasterBook({ lang }: { lang: Lang }) {
  const u = UI[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";
  const N = SECTIONS.length;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);

  // interaktivní hodnoty (refy pro smyčku) + state pro zobrazení
  const ovFreq = useRef(330); const [freqUI, setFreqUI] = useState(330);
  const ovAmp = useRef(0.5); const [ampUI, setAmpUI] = useState(0.5);
  const ovWave = useRef<Wave>("sine"); const [waveUI, setWaveUI] = useState<Wave>("sine");

  // audio
  const ac = useRef<AudioContext | null>(null);
  const osc = useRef<OscillatorNode | null>(null);
  const gain = useRef<GainNode | null>(null);
  const filt = useRef<BiquadFilterNode | null>(null);

  const start = () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const a = new AC(); ac.current = a;
    const o = a.createOscillator(); o.type = "sine"; o.frequency.value = SECTIONS[0].audioFreq;
    const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 18000;
    const g = a.createGain(); g.gain.value = 0;
    o.connect(f).connect(g).connect(a.destination); o.start();
    osc.current = o; gain.current = g; filt.current = f;
    g.gain.setTargetAtTime(SECTIONS[0].gain * 0.18, a.currentTime, 0.3);
    setStarted(true);
  };
  useEffect(() => () => { try { osc.current?.stop(); ac.current?.close(); } catch {} }, []);

  // hlavní smyčka: scroll → morf vlny + tónu + kreslení
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);

    const cur = { freqVis: SECTIONS[0].freqVis, amp: 0, audioFreq: SECTIONS[0].audioFreq, gain: 0, filter: 18000, medium: 0 };
    let phase = 0, raf = 0, lastStep = 0;
    const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3 }));
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

    const loop = () => {
      // progres podle scrollu
      const track = trackRef.current;
      let p = 0;
      if (track) { const dist = track.offsetHeight - innerHeight; p = dist > 0 ? Math.min(1, Math.max(0, -track.getBoundingClientRect().top / dist)) : 0; }
      const sf = p * (N - 1); const idx = Math.min(N - 1, Math.round(sf));
      if (idx !== lastStep) { lastStep = idx; setStep(idx); }
      const s = SECTIONS[idx];
      const inter = started ? s.interactive : undefined;
      const tFreqVis = inter === "freq" ? 2 + (ovFreq.current / 60) : s.freqVis;
      const tAmp = inter === "amp" ? ovAmp.current : s.amp;
      const tAFreq = inter === "freq" ? ovFreq.current : s.audioFreq;
      const tGain = inter === "amp" ? ovAmp.current : s.gain;
      cur.freqVis = lerp(cur.freqVis, tFreqVis, 0.07);
      cur.amp = lerp(cur.amp, started ? tAmp : 0, 0.07);
      cur.audioFreq = lerp(cur.audioFreq, tAFreq, 0.08);
      cur.gain = lerp(cur.gain, started ? tGain : 0, 0.06);
      cur.filter = lerp(cur.filter, s.filter, 0.06);
      const medT = s.medium === "water" ? 1 : s.medium === "space" ? 2 : 0;
      cur.medium = lerp(cur.medium, medT, 0.05);

      // audio
      if (osc.current && gain.current && filt.current && ac.current) {
        const now = ac.current.currentTime;
        osc.current.frequency.setTargetAtTime(cur.audioFreq, now, 0.05);
        gain.current.gain.setTargetAtTime(cur.gain * 0.18, now, 0.08);
        filt.current.frequency.setTargetAtTime(cur.filter, now, 0.08);
        const wantType = inter === "wave" ? ovWave.current : s.type;
        if (osc.current.type !== wantType) osc.current.type = wantType;
      }

      // kreslení
      const w = innerWidth, h = innerHeight, mid = h / 2;
      const space = cur.medium > 1.3;
      // pozadí (mix air→water→space)
      if (space) { ctx.fillStyle = "#05060f"; ctx.fillRect(0, 0, w, h); ctx.fillStyle = "#fff"; for (const st of stars) { ctx.globalAlpha = 0.4 + 0.5 * Math.sin(phase * 0.6 + st.x * 9); ctx.beginPath(); ctx.arc(st.x * w, st.y * h, st.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
      else { const water = Math.min(1, cur.medium); const top = mixHex("#FAFAF7", "#cfe6ff", water), bot = mixHex("#eef3fb", "#7fb6e0", water); const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }

      phase += 0.025 + cur.audioFreq / 4000;
      if (!space) {
        const A = cur.amp * h * 0.3; const type = (osc.current?.type as Wave) || "sine";
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) { const t = (x / w) * cur.freqVis * Math.PI * 2 - phase; const y = mid - waveVal(type, t) * A; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.lineWidth = 3.5; ctx.strokeStyle = cur.medium > 0.5 ? "#0d3b66" : INK; ctx.lineJoin = "round"; ctx.stroke();
        // body „vzduch"
        ctx.fillStyle = cur.medium > 0.5 ? "rgba(13,59,102,0.25)" : "rgba(26,22,20,0.18)";
        for (let i = 0; i < 40; i++) { const bx = (i / 40) * w; const t = (bx / w) * cur.freqVis * Math.PI * 2 - phase; ctx.beginPath(); ctx.arc(bx, mid - waveVal(type, t) * A, 2, 0, 7); ctx.fill(); }
      } else { ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "700 14px system-ui"; ctx.textAlign = "center"; ctx.fillText("— ticho —", w / 2, mid - 14); }

      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, [started, N]);

  const sec = SECTIONS[step]; const txt = sec[lang]; const dark = sec.medium === "space";

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}><canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} /></div>

      {/* back */}
      <div style={{ position: "fixed", top: 16, left: 18, zIndex: 6 }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: dark ? "rgba(255,255,255,0.7)" : "var(--text-muted)", textDecoration: "none" }}>{u.back}</Link>
      </div>

      {/* progress dots */}
      {started && (
        <div style={{ position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)", zIndex: 6, display: "flex", flexDirection: "column", gap: 7 }}>
          {SECTIONS.map((_, i) => <div key={i} style={{ width: i === step ? 9 : 6, height: i === step ? 9 : 6, borderRadius: "50%", background: i <= step ? (dark ? "#fff" : INK) : (dark ? "rgba(255,255,255,0.3)" : "rgba(26,22,20,0.25)"), transition: "all .2s" }} />)}
        </div>
      )}

      {/* aktuální koncept */}
      {started && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: "8vh", zIndex: 5, display: "flex", justifyContent: "center", padding: "0 22px", pointerEvents: "none" }}>
          <div key={step} className="sb-card" style={{ maxWidth: 540, textAlign: "center", background: dark ? "rgba(8,10,24,0.6)" : "rgba(255,255,255,0.78)", border: `2.5px solid ${dark ? "rgba(255,255,255,0.3)" : INK}`, borderRadius: 18, boxShadow: dark ? "none" : `5px 5px 0 ${INK}`, padding: "20px 24px", color: dark ? "#fff" : INK, backdropFilter: "blur(6px)", pointerEvents: "auto" }}>
            <p style={{ ...display, fontSize: "clamp(22px,5vw,32px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>{txt.t}</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 15.5, lineHeight: 1.55, color: dark ? "rgba(255,255,255,0.85)" : "var(--text-secondary)" }}>{txt.p}</p>

            {sec.interactive === "freq" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "#4aa3ff" }}>{u.low}</span>
                <input type="range" min={60} max={900} value={freqUI} onChange={(e) => { const v = +e.target.value; ovFreq.current = v; setFreqUI(v); }} style={{ flex: 1, accentColor: dark ? "#fff" : INK }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "#ff6fae" }}>{u.high}</span>
              </div>
            )}
            {sec.interactive === "amp" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700 }}>{u.quiet}</span>
                <input type="range" min={0} max={1} step={0.01} value={ampUI} onChange={(e) => { const v = +e.target.value; ovAmp.current = v; setAmpUI(v); }} style={{ flex: 1, accentColor: dark ? "#fff" : INK }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700 }}>{u.loud}</span>
              </div>
            )}
            {sec.interactive === "wave" && (
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
                {WAVE_TYPES.map((wt, i) => <button key={wt} onClick={() => { ovWave.current = wt; setWaveUI(wt); }} style={{ padding: "6px 12px", borderRadius: 999, border: `2px solid ${dark ? "#fff" : INK}`, background: waveUI === wt ? (dark ? "#fff" : INK) : "transparent", color: waveUI === wt ? (dark ? INK : "#fff") : (dark ? "#fff" : INK), fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{u.waves[i]}</button>)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* scroll hint */}
      {started && step < N - 1 && <div style={{ position: "fixed", bottom: "2.5vh", left: "50%", transform: "translateX(-50%)", zIndex: 6, fontFamily: "var(--font-sans)", fontSize: 12, color: dark ? "rgba(255,255,255,0.6)" : "var(--text-muted)", animation: "sb-bob 2s ease-in-out infinite" }}>{u.scroll} ↓</div>}

      {/* start overlay */}
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

      {/* scroll délka */}
      <div ref={trackRef} style={{ height: started ? `${N * 100}vh` : "100vh" }} />

      <style>{`@keyframes sb-bob { 0%,100%{ transform:translateX(-50%) translateY(0);} 50%{ transform:translateX(-50%) translateY(6px);} }
        .sb-card { animation: sb-in .5s cubic-bezier(.22,1,.36,1); }
        @keyframes sb-in { from{ opacity:0; transform: translateY(14px);} to{opacity:1; transform:none;} }`}</style>
    </>
  );
}

function waveVal(type: Wave, t: number): number {
  const x = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (type === "sine") return Math.sin(t);
  if (type === "square") return Math.sin(t) >= 0 ? 1 : -1;
  if (type === "sawtooth") return x / Math.PI - 1;
  return x < Math.PI ? (x / Math.PI) * 2 - 1 : 3 - (x / Math.PI) * 2; // triangle
}
function mixHex(a: string, b: string, k: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, k))));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
