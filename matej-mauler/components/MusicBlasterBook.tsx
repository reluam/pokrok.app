"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/dictionaries";

const INK = "#1a1614";
const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
type LaneKey = "kick" | "snare" | "hat" | "bass";
type Pat = Record<LaneKey, number[]>;
const LANES: LaneKey[] = ["kick", "snare", "hat", "bass"];
const LANE_COL: Record<LaneKey, string> = { kick: "#e8556d", snare: "#f4a259", hat: "#4eb4cf", bass: "#7b6cf6" };

type Vibe = { id: string; cs: string; en: string; bpm: number; swing: number; bassType: OscillatorType; chordType: OscillatorType; leadType: OscillatorType; cutoff: number; rev: number; prog: number[]; pad: boolean; pat: Pat; mel: number[] };
const VIBES: Vibe[] = [
  { id: "lofi", cs: "lo-fi", en: "lo-fi", bpm: 78, swing: 0.18, bassType: "triangle", chordType: "triangle", leadType: "sine", cutoff: 1500, rev: 0.4, prog: [0, 5, 3, 4], pad: true,
    pat: { kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1], bass: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0] }, mel: [0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0] },
  { id: "house", cs: "house", en: "house", bpm: 122, swing: 0, bassType: "sawtooth", chordType: "sawtooth", leadType: "square", cutoff: 2200, rev: 0.22, prog: [5, 3, 0, 4], pad: false,
    pat: { kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], bass: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] }, mel: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0] },
  { id: "epic", cs: "epické", en: "epic", bpm: 88, swing: 0, bassType: "sine", chordType: "sawtooth", leadType: "triangle", cutoff: 1900, rev: 0.6, prog: [0, 4, 5, 3], pad: true,
    pat: { kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], hat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bass: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0] }, mel: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
];
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const KEYS = [{ n: "C", m: 60 }, { n: "F", m: 65 }, { n: "G", m: 67 }, { n: "A", m: 69 }];
const m2f = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const chordTones = (scale: number[], root: number, deg: number) => [0, 2, 4, 6].map((s) => { const i = deg + s; return root + scale[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7); });

type SecInt = "tempo" | "mood" | "vibe" | "mix" | "studio";
const SECTIONS: { cs: { t: string; p: string }; en: { t: string; p: string }; interactive?: SecInt }[] = [
  { cs: { t: "Co je hudba?", p: "Zvuk je jen chvění vzduchu. Hudba je zvuk, který někdo uspořádal — do času a do výšek. Pojďme jednu skladbu poskládat po vrstvách." }, en: { t: "What is music?", p: "Sound is just shaking air. Music is sound someone organized — in time and pitch. Let's build a track layer by layer." } },
  { cs: { t: "Rytmus = tep", p: "Základ je rytmus — pravidelný tep, do kterého všechno zapadá. Zkus tempo a swing — to lehké pohoupání rytmu." }, en: { t: "Rhythm = pulse", p: "It starts with rhythm — a steady pulse everything snaps to. Try the tempo and swing (that gentle groove)." }, interactive: "tempo" },
  { cs: { t: "Basa drží spodek", p: "Basa je hluboký tón, co dává skladbě pevnou půdu pod nohama. Slyšíš, jak to najednou stojí?" }, en: { t: "Bass holds the bottom", p: "Bass is the low tone that gives the track solid ground. Hear how it suddenly stands firm?" } },
  { cs: { t: "Akordy = nálada", p: "Víc tónů naráz je akord. Tady to jsou bohaté septakordy. Přepni dur/moll a tóninu — a slyš, jak se mění nálada." }, en: { t: "Chords = mood", p: "Several notes at once make a chord — here, rich seventh chords. Switch major/minor and the key, and hear the mood change." }, interactive: "mood" },
  { cs: { t: "Melodie = příběh", p: "Melodie je jeden hlas, co si zpívá svou cestu nahoru a dolů — vždy z tónů akordu, ať to ladí. To je to, co si broukáš." }, en: { t: "Melody = the story", p: "Melody is a single voice singing up and down — always from the chord's notes, so it fits. It's the part you hum." } },
  { cs: { t: "Zvuk = vibe", p: "Stejné party, jiný zvuk. Přepni vibe — lo-fi, house, epické — a celá skladba dostane jiný charakter i tempo." }, en: { t: "Sound = the vibe", p: "Same parts, different sound. Switch the vibe — lo-fi, house, epic — and the whole track changes character and tempo." }, interactive: "vibe" },
  { cs: { t: "Mix = vrstvy", p: "Skladba je vrstvy hrající spolu. Zapínej a vypínej je a poslouchej, jak každá přidá svůj díl." }, en: { t: "Mix = layers", p: "A track is layers playing together. Toggle them on and off and hear what each one adds." }, interactive: "mix" },
  { cs: { t: "Studio — tvoř", p: "Teď jsi u kniplů. Klikej do mřížky a skládej vlastní beat, lad tempo, swing, tóninu i vibe. Zbytek (akordy, melodie) ladí sám." }, en: { t: "Studio — make it", p: "Now you're at the controls. Click the grid to build your own beat; tweak tempo, swing, key and vibe. The rest (chords, melody) stays in tune by itself." }, interactive: "studio" },
  { cs: { t: "Teď to umíš", p: "Hudba je chytře poskládaný zvuk — tep, spodek, nálada a příběh, sladěné do času. A ty teď víš jak na to." }, en: { t: "Now you get it", p: "Music is cleverly arranged sound — pulse, bottom, mood and story, locked in time. And now you know how." } },
];

const UI = {
  cs: { back: "← Spaghetti.ltd", eyebrow: "Hudební experience", title: "Jak vzniká hudba", start: "Start ▶", audio: "🔊 Zapni si zvuk a poskládej skladbu.", scroll: "scrolluj dolů", mute: "Ztlumit", unmute: "Zvuk", tempo: "tempo", swing: "swing", major: "dur", minor: "moll", lanes: { kick: "kop", snare: "snare", hat: "hi-hat", bass: "basa" }, layers: { drums: "bicí", bass: "basa", chord: "akordy", mel: "melodie" }, editHint: "👆 klikej do mřížky a tvoř beat", toEnd: "" },
  en: { back: "← Spaghetti.ltd", eyebrow: "A music experience", title: "How music is made", start: "Start ▶", audio: "🔊 Turn your sound on and build a track.", scroll: "scroll down", mute: "Mute", unmute: "Sound", tempo: "tempo", swing: "swing", major: "major", minor: "minor", lanes: { kick: "kick", snare: "snare", hat: "hi-hat", bass: "bass" }, layers: { drums: "drums", bass: "bass", chord: "chords", mel: "melody" }, editHint: "👆 click the grid to make a beat", toEnd: "" },
} as const;

export function MusicBlasterBook({ lang }: { lang: Lang }) {
  const u = UI[lang]; const homeHref = lang === "cs" ? "/cs" : "/"; const N = SECTIONS.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [step, setStep] = useState(0);

  const bpm = useRef(78); const [bpmUI, setBpmUI] = useState(78);
  const swing = useRef(0.18); const [swingUI, setSwingUI] = useState(18);
  const minor = useRef(false); const [minorUI, setMinorUI] = useState(false);
  const keyM = useRef(60); const [keyUI, setKeyUI] = useState(60);
  const vibe = useRef<Vibe>(VIBES[0]); const [vibeUI, setVibeUI] = useState("lofi");
  const mute = useRef<Record<"drums" | "bass" | "chord" | "mel", boolean>>({ drums: false, bass: false, chord: false, mel: false });
  const [muteUI, setMuteUI] = useState({ drums: false, bass: false, chord: false, mel: false });
  const pat = useRef<Pat>(clonePat(VIBES[0].pat));

  const ac = useRef<AudioContext | null>(null);
  const bus = useRef<Record<"drums" | "bass" | "chord" | "mel", GainNode | null>>({ drums: null, bass: null, chord: null, mel: null });
  const master = useRef<GainNode | null>(null);
  const revIn = useRef<GainNode | null>(null);
  const enable = useRef({ drums: false, bass: false, chord: false, mel: false });
  const pending = useRef<{ step: number; time: number }[]>([]);
  const curStep = useRef(0);
  const grid = useRef({ gx: 0, gy: 0, cw: 0, rh: 0, gap: 0, on: false });
  const melCount = useRef(0);

  const applyVibe = (v: Vibe) => { vibe.current = v; setVibeUI(v.id); bpm.current = v.bpm; setBpmUI(v.bpm); swing.current = v.swing; setSwingUI(Math.round(v.swing * 100)); pat.current = clonePat(v.pat); if (revIn.current && ac.current) revIn.current.gain.setTargetAtTime(v.rev, ac.current.currentTime, 0.1); };

  const start = () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const a = new AC(); ac.current = a;
    const comp = a.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.25; comp.connect(a.destination);
    const ms = a.createGain(); ms.gain.value = muted ? 0 : 0.9; ms.connect(comp); master.current = ms;
    const conv = a.createConvolver(); const L = (a.sampleRate * 2.4) | 0; const b = a.createBuffer(2, L, a.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 2.6); }
    conv.buffer = b; const rIn = a.createGain(); rIn.gain.value = vibe.current.rev; const rOut = a.createGain(); rOut.gain.value = 0.9; rIn.connect(conv).connect(rOut).connect(ms); revIn.current = rIn;
    (["drums", "bass", "chord", "mel"] as const).forEach((k) => { const g = a.createGain(); g.gain.value = 0; g.connect(ms); if (k === "chord" || k === "mel") g.connect(rIn); bus.current[k] = g; });

    let s = 0; let nextT = a.currentTime + 0.12;
    const sec16 = () => 60 / bpm.current / 4;
    const schedule = () => {
      const aa = ac.current; if (!aa) return;
      while (nextT < aa.currentTime + 0.13) {
        const st = s % 16; const sw = st % 2 === 1 ? swing.current * sec16() * 0.66 : 0; const t = nextT + sw;
        playStep(st, s, t); pending.current.push({ step: st, time: t });
        nextT += sec16(); s = (s + 1) % 64;
      }
    };
    timer.current = window.setInterval(schedule, 25);
    setStarted(true);
  };

  const playStep = (st: number, glob: number, t: number) => {
    const a = ac.current; if (!a) return; const v = vibe.current; const scale = minor.current ? SCALES.minor : SCALES.major;
    const bar = Math.floor(glob / 16) % 4; const deg = v.prog[bar % v.prog.length]; const tones = chordTones(scale, keyM.current, deg);
    const barSec = (60 / bpm.current / 4) * 16; const p = pat.current; const en = enable.current;
    if (en.drums) {
      if (p.kick[st]) kick(a, bus.current.drums!, t, p.kick[st]);
      if (p.snare[st]) snare(a, bus.current.drums!, t, p.snare[st]);
      if (p.hat[st]) hat(a, bus.current.drums!, t, p.hat[st], st % 4 === 2);
    }
    if (en.bass && p.bass[st]) bass(a, bus.current.bass!, t, m2f(tones[0] - 12), v, (60 / bpm.current / 4) * 1.7);
    if (en.chord && st === 0) { const dur = v.pad ? barSec * 1.04 : (60 / bpm.current / 4) * 1.4; tones.forEach((n) => chordNote(a, bus.current.chord!, t, m2f(n), v, dur, v.pad ? 0.25 : 0.006)); }
    if (en.chord && !v.pad && (st === 6 || st === 10 || st === 14)) tones.forEach((n) => chordNote(a, bus.current.chord!, t, m2f(n), v, (60 / bpm.current / 4) * 1.1, 0.006));
    if (en.mel && v.mel[st]) { const note = tones[melCount.current % 4] + 12; melCount.current++; lead(a, bus.current.mel!, t, m2f(note), v, (60 / bpm.current / 4) * 1.6); }
  };

  const timer = useRef(0);
  const toggleMute = () => setMuted((m) => { const nm = !m; if (master.current && ac.current) master.current.gain.setTargetAtTime(nm ? 0 : 0.9, ac.current.currentTime, 0.03); return nm; });
  const toggleLayer = (k: "drums" | "bass" | "chord" | "mel") => { mute.current[k] = !mute.current[k]; setMuteUI({ ...mute.current }); };
  useEffect(() => () => { clearInterval(timer.current); try { ac.current?.close(); } catch {} }, []);

  // scroll → vrstvy + vizualizace gridu
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);
    const onDown = (e: PointerEvent) => {
      const g = grid.current; if (!g.on) return; const x = e.clientX - g.gx, y = e.clientY - g.gy;
      if (x < 0 || y < 0 || x > g.cw * 16 || y > (g.rh + g.gap) * 4) return;
      const stp = Math.floor(x / g.cw), lane = Math.floor(y / (g.rh + g.gap)); if (lane < 0 || lane > 3 || stp < 0 || stp > 15) return;
      const lk = LANES[lane]; const def = lk === "kick" ? 1 : lk === "snare" ? 0.9 : lk === "hat" ? 0.6 : 0.9;
      pat.current[lk][stp] = pat.current[lk][stp] > 0 ? 0 : def;
    };
    cv.addEventListener("pointerdown", onDown);

    const g = { d: 0.12, b: 0.12, c: 0.12, m: 0.12 }; let raf = 0, last = -1;
    const lerp = (a: number, x: number, k: number) => a + (x - a) * k;
    const loop = () => {
      const tr = trackRef.current; let p = 0; if (tr) { const dd = tr.offsetHeight - innerHeight; p = dd > 0 ? Math.min(1, Math.max(0, -tr.getBoundingClientRect().top / dd)) : 0; }
      const idx = Math.min(N - 1, Math.round(p * (N - 1)));
      if (idx !== last) { last = idx; setStep(idx); }
      const reach = { drums: idx >= 1, bass: idx >= 2, chord: idx >= 3, mel: idx >= 4 };
      enable.current = { drums: started && reach.drums && !mute.current.drums, bass: started && reach.bass && !mute.current.bass, chord: started && reach.chord && !mute.current.chord, mel: started && reach.mel && !mute.current.mel };
      if (ac.current) { const now = ac.current.currentTime; bus.current.drums?.gain.setTargetAtTime(enable.current.drums ? 0.9 : 0, now, 0.12); bus.current.bass?.gain.setTargetAtTime(enable.current.bass ? 0.85 : 0, now, 0.12); bus.current.chord?.gain.setTargetAtTime(enable.current.chord ? 0.42 : 0, now, 0.18); bus.current.mel?.gain.setTargetAtTime(enable.current.mel ? 0.5 : 0, now, 0.18); }

      // playhead z fronty
      if (ac.current) { const now = ac.current.currentTime; while (pending.current.length && pending.current[0].time <= now) curStep.current = pending.current.shift()!.step; if (pending.current.length > 40) pending.current.splice(0, pending.current.length - 40); }

      const w = innerWidth, h = innerHeight; ctx.clearRect(0, 0, w, h);
      const grd = ctx.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#FAFAF7"); grd.addColorStop(1, "#efe9fb"); ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      const act = [reach.drums, reach.bass, reach.chord, reach.mel];
      g.d = lerp(g.d, reach.drums ? 1 : 0.12, 0.08); g.b = lerp(g.b, reach.bass ? 1 : 0.12, 0.08); g.c = lerp(g.c, reach.chord ? 1 : 0.12, 0.08); g.m = lerp(g.m, reach.mel ? 1 : 0.12, 0.08);
      const op = [g.d, g.b, g.c, g.m];
      const gw = Math.min(620, w * 0.82), gx = (w - gw) / 2, cw = gw / 16, rh = 40, gap = 12, gy = h * 0.26;
      grid.current = { gx, gy, cw, rh, gap, on: started };
      const cs = started ? curStep.current : -1; const p2 = pat.current; const arr = [p2.kick, p2.snare, p2.hat, p2.bass];
      for (let r = 0; r < 4; r++) {
        const y = gy + r * (rh + gap); const col = LANE_COL[LANES[r]];
        for (let c = 0; c < 16; c++) {
          if (c === cs) { ctx.globalAlpha = 0.08; ctx.fillStyle = INK; roundRect(ctx, gx + c * cw, y - 3, cw, rh + 6, 6); ctx.fill(); }
          const on = arr[r][c] > 0; ctx.globalAlpha = on ? op[r] : (act[r] ? 0.14 : 0.08); ctx.fillStyle = on ? col : INK;
          roundRect(ctx, gx + c * cw + 3, y + 4, cw - 6, rh - 8, 6); ctx.fill();
          if (on && c === cs) { ctx.globalAlpha = 0.9; ctx.fillStyle = "#fff"; roundRect(ctx, gx + c * cw + 3, y + 4, cw - 6, rh - 8, 6); ctx.fill(); ctx.globalAlpha = 1; }
        }
        ctx.globalAlpha = act[r] ? 0.85 : 0.35; ctx.fillStyle = INK; ctx.font = "700 12px system-ui"; ctx.textAlign = "right"; ctx.fillText(u.lanes[LANES[r]], gx - 12, y + rh / 2 + 4);
      }
      // akordy + melodie jako pulzující indikátory nad mřížkou
      const harm = [{ lab: u.layers.chord, on: reach.chord, o: g.c, col: "#9b6cff" }, { lab: u.layers.mel, on: reach.mel, o: g.m, col: "#ffb43c" }];
      harm.forEach((hh, i) => { const cx = gx + gw - 60 + i * 30; const yy = gy - 26; const beat = started && hh.on ? 0.5 + 0.5 * Math.sin((curStep.current / 4) * Math.PI) : 0; ctx.globalAlpha = hh.o; ctx.fillStyle = hh.col; ctx.beginPath(); ctx.arc(cx, yy, 5 + beat * 4, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); cv.removeEventListener("pointerdown", onDown); };
  }, [started, N, u]);

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
        <div style={{ position: "fixed", left: 0, right: 0, bottom: "6vh", zIndex: 5, display: "flex", justifyContent: "center", padding: "0 22px", pointerEvents: "none" }}>
          <div key={step} className="mb-card" style={{ maxWidth: 540, width: "100%", textAlign: "center", background: "rgba(255,255,255,0.72)", border: `1px solid rgba(26,22,20,0.1)`, borderRadius: 22, boxShadow: "0 16px 44px rgba(26,22,20,0.12)", padding: "16px 28px 20px", color: INK, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", pointerEvents: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7b6cf6" }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, letterSpacing: "0.24em", color: "var(--text-muted)" }}>{String(step + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</span>
            </div>
            <p style={{ ...display, fontSize: "clamp(21px,4.6vw,30px)", fontWeight: 700, letterSpacing: "-0.025em", marginBottom: 7 }}>{txt.t}</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>{txt.p}</p>

            {(sec.interactive === "tempo" || sec.interactive === "studio") && (<div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <Row label={`${u.tempo} · ${bpmUI} BPM`}><input type="range" min={60} max={150} value={bpmUI} onChange={(e) => { const v = +e.target.value; bpm.current = v; setBpmUI(v); }} style={{ width: "100%", accentColor: INK }} /></Row>
              <Row label={`${u.swing} · ${swingUI}%`}><input type="range" min={0} max={60} value={swingUI} onChange={(e) => { const v = +e.target.value; swing.current = v / 100; setSwingUI(v); }} style={{ width: "100%", accentColor: INK }} /></Row>
            </div>)}
            {(sec.interactive === "mood" || sec.interactive === "studio") && (<div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => { minor.current = false; setMinorUI(false); }} style={pill(!minorUI)}>{u.major}</button>
              <button onClick={() => { minor.current = true; setMinorUI(true); }} style={pill(minorUI)}>{u.minor}</button>
              <span style={{ width: 10 }} />
              {KEYS.map((k) => <button key={k.m} onClick={() => { keyM.current = k.m; setKeyUI(k.m); }} style={pill(keyUI === k.m)}>{k.n}</button>)}
            </div>)}
            {(sec.interactive === "vibe" || sec.interactive === "studio") && (<div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {VIBES.map((v) => <button key={v.id} onClick={() => applyVibe(v)} style={pill(vibeUI === v.id)}>{v[lang]}</button>)}
            </div>)}
            {(sec.interactive === "mix" || sec.interactive === "studio") && (<div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {(["drums", "bass", "chord", "mel"] as const).map((k) => <button key={k} onClick={() => toggleLayer(k)} style={pill(!muteUI[k])}>{u.layers[k]}</button>)}
            </div>)}
            {sec.interactive === "studio" && <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginTop: 12 }}>{u.editHint}</p>}
            {step === N - 1 && <Link href={homeHref} style={{ display: "inline-block", marginTop: 14, fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: INK, textDecoration: "underline", textUnderlineOffset: 3 }}>← Spaghetti.ltd</Link>}
          </div>
        </div>
      )}

      {started && step < N - 1 && <div style={{ position: "fixed", bottom: "2vh", left: "50%", transform: "translateX(-50%)", zIndex: 6, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", animation: "mb-bob 2s ease-in-out infinite" }}>{u.scroll} ↓</div>}

      {!started && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 640, width: "100%" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.28em", color: "var(--text-muted)", marginBottom: 26 }}>{u.eyebrow}</p>
            <MusicHero />
            <h1 style={{ ...display, fontSize: "clamp(36px,8.5vw,68px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.02, margin: "26px 0 28px" }}>{u.title}</h1>
            <button onClick={start} className="mb-start" style={{ background: INK, color: "#fff", border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: `5px 5px 0 ${INK}`, padding: "16px 42px", fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>{u.start}</button>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, lineHeight: 1.5, color: "var(--text-muted)", marginTop: 22, maxWidth: 360 }}>{u.audio}</p>
          </div>
        </div>
      )}

      <div ref={trackRef} style={{ height: started ? `${N * 100}vh` : "100vh" }} />
      <style>{`@keyframes mb-bob { 0%,100%{ transform:translateX(-50%) translateY(0);} 50%{ transform:translateX(-50%) translateY(6px);} } .mb-card{ animation: mb-in .5s cubic-bezier(.22,1,.36,1);} @keyframes mb-in{ from{opacity:0; transform:translateY(14px);} to{opacity:1; transform:none;} }
        .mb-start{ transition: transform .12s ease, box-shadow .12s ease; } .mb-start:hover{ transform:translate(-2px,-2px); box-shadow:7px 7px 0 ${INK}; } .mb-start:active{ transform:translate(2px,2px); box-shadow:2px 2px 0 ${INK}; }`}</style>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 3, textAlign: "left" }}>{label}</div>{children}</div>;
}
const pill = (active: boolean): React.CSSProperties => ({ padding: "7px 14px", borderRadius: 999, border: `2px solid ${INK}`, background: active ? INK : "transparent", color: active ? "#fff" : INK, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, cursor: "pointer" });
const clonePat = (p: Pat): Pat => ({ kick: [...p.kick], snare: [...p.snare], hat: [...p.hat], bass: [...p.bass] });

function MusicHero() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1); const CH = 104; let w = 0;
    const fit = () => { w = Math.min(560, cv.parentElement?.clientWidth || 560); cv.style.width = w + "px"; cv.style.height = CH + "px"; cv.width = w * dpr; cv.height = CH * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fit(); const onR = () => fit(); addEventListener("resize", onR);
    let t = 0, raf = 0; const cols = ["#e8556d", "#f4a259", "#4eb4cf", "#7b6cf6"];
    const loop = () => {
      ctx.clearRect(0, 0, w, CH); const n = 22, bw = w / n, base = CH * 0.9;
      for (let i = 0; i < n; i++) { const hgt = (0.2 + 0.8 * Math.abs(Math.sin(t * 1.6 + i * 0.6) * Math.cos(t * 0.7 + i))) * CH * 0.7; ctx.globalAlpha = 0.85; ctx.fillStyle = cols[i % 4]; const x = i * bw + bw * 0.2; roundRect(ctx, x, base - hgt, bw * 0.6, hgt, 3); ctx.fill(); }
      ctx.globalAlpha = 1; t += 0.03; raf = requestAnimationFrame(loop);
    };
    loop(); return () => { cancelAnimationFrame(raf); removeEventListener("resize", onR); };
  }, []);
  return <canvas ref={ref} style={{ display: "block", margin: "0 auto", width: "100%", maxWidth: 560 }} />;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { const rr = Math.min(r, h / 2, w / 2); ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath(); }

function noise(a: AudioContext, sec: number) { const L = (a.sampleRate * sec) | 0; const b = a.createBuffer(1, L, a.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 1.5); return b; }
function kick(a: AudioContext, out: AudioNode, t: number, vel: number) {
  const o = a.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(145, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
  const g = a.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32); o.connect(g).connect(out); o.start(t); o.stop(t + 0.34);
  const c = a.createOscillator(); c.type = "triangle"; c.frequency.value = 900; const cg = a.createGain(); cg.gain.setValueAtTime(vel * 0.4, t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.03); c.connect(cg).connect(out); c.start(t); c.stop(t + 0.04);
}
function snare(a: AudioContext, out: AudioNode, t: number, vel: number) {
  const s = a.createBufferSource(); s.buffer = noise(a, 0.2); const bp = a.createBiquadFilter(); bp.type = "highpass"; bp.frequency.value = 1300; const g = a.createGain(); g.gain.setValueAtTime(vel * 0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.17); s.connect(bp).connect(g).connect(out); s.start(t); s.stop(t + 0.19);
  const o = a.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(130, t + 0.1); const og = a.createGain(); og.gain.setValueAtTime(vel * 0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.12); o.connect(og).connect(out); o.start(t); o.stop(t + 0.14);
}
function hat(a: AudioContext, out: AudioNode, t: number, vel: number, open: boolean) {
  const s = a.createBufferSource(); s.buffer = noise(a, 0.12); const hp = a.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7500; const g = a.createGain(); const dur = open ? 0.16 : 0.045; g.gain.setValueAtTime(vel * 0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(hp).connect(g).connect(out); s.start(t); s.stop(t + dur + 0.02);
}
function bass(a: AudioContext, out: AudioNode, t: number, freq: number, v: Vibe, dur: number) {
  const o = a.createOscillator(); o.type = v.bassType; o.frequency.value = freq; const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(180, t + dur * 0.9);
  const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
  const sub = a.createOscillator(); sub.type = "sine"; sub.frequency.value = freq / 2; const sg = a.createGain(); sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(0.3, t + 0.02); sg.gain.exponentialRampToValueAtTime(0.001, t + dur); sub.connect(sg).connect(out); sub.start(t); sub.stop(t + dur + 0.05);
}
function chordNote(a: AudioContext, out: AudioNode, t: number, freq: number, v: Vibe, dur: number, attack: number) {
  const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = v.cutoff;
  const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + attack); g.gain.setValueAtTime(0.16, t + Math.max(attack, dur * 0.55)); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  lp.connect(g).connect(out);
  [-6, 7].forEach((det) => { const o = a.createOscillator(); o.type = v.chordType; o.frequency.value = freq; o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 0.05); });
}
function lead(a: AudioContext, out: AudioNode, t: number, freq: number, v: Vibe, dur: number) {
  const o = a.createOscillator(); o.type = v.leadType; o.frequency.value = freq; const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(3600, t); lp.frequency.exponentialRampToValueAtTime(900, t + dur);
  const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.012); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
}
