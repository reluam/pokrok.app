"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/track";
import Link from "next/link";
import { OPTIONS, type OptionId } from "@/lib/radioComposer";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };
const card: React.CSSProperties = { background: "#fff", border: "2px solid var(--border)", borderRadius: "14px", boxShadow: "3px 3px 0 var(--border)", padding: "14px" };
const lab: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" };

const UI = {
  cs: {
    back: "← Spaghetti.ltd", eyebrow: "Rádio renderované na serveru", title: "The Radio",
    modalTitle: "Zvukový projekt", modalText: "Tohle rádio hraje. Zapni si reproduktory, nebo si nasaď sluchátka — zvuk se spustí po vstupu.",
    intro: "Skladba se renderuje na serveru a všichni slyší totéž. Hlasováním rozhodneš, co se změní od příštího taktu.",
    enter: "Vstoupit ▶", tempo: "Tempo", key: "Tónina", genre: "Styl", round: "Kolo",
    voteHead: "Co změnit příště?", voteSub: "Jeden hlas za kolo. Vítěz se projeví od první doby nového taktu.",
    closesIn: "Hlasování končí za", applied: "Sečteno — změna přijde od příštího taktu…", voted: "✓ hlas přijat", votes: "hlasů",
    loading: "Ladím frekvenci…",
  },
  en: {
    back: "← Spaghetti.ltd", eyebrow: "A server-rendered radio", title: "The Radio",
    modalTitle: "An audio project", modalText: "This radio plays sound. Turn on your speakers or put on headphones — audio starts once you enter.",
    intro: "The track is rendered on the server and everyone hears the same thing. Your vote decides what changes from the next bar.",
    enter: "Enter ▶", tempo: "Tempo", key: "Key", genre: "Style", round: "Round",
    voteHead: "What changes next?", voteSub: "One vote per round. The winner applies from beat one of the next bar.",
    closesIn: "Voting closes in", applied: "Counted — the change lands on the next bar…", voted: "✓ vote in", votes: "votes",
    loading: "Tuning in…",
  },
} as const;

type NowInfo = {
  serverNow: number;
  current: { round: number; startedAt: number; durationMs: number; tempo: number; key: string; genre: string };
  next: { round: number; startedAt: number; durationMs: number } | null;
  voting: { round: number; closesAt: number; counts: Record<string, number> };
};

/** Rádio běžící na serveru: klient stahuje vyrenderované WAV segmenty,
    přehrává je gapless podle absolutních časů a hlasuje o další změně. */
export function RadioApp({ lang }: { lang: Lang }) {
  const t = UI[lang];
  const [entered, setEntered] = useState(false);
  const [now, setNow] = useState<NowInfo | null>(null);
  const [secLeft, setSecLeft] = useState(0);
  const [closed, setClosed] = useState(false);
  const [myVote, setMyVote] = useState<{ round: number; option: OptionId } | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const offsetRef = useRef(0); // serverNow - Date.now()
  const scheduledRef = useRef<Map<number, { src?: AudioBufferSourceNode }>>(new Map());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const stopAll = () => {
    if (pollRef.current) clearInterval(pollRef.current); pollRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null;
    for (const [, s] of scheduledRef.current) { try { s.src?.stop(); } catch {} }
    scheduledRef.current.clear();
    try { ctxRef.current?.close(); } catch {}
    ctxRef.current = null;
  };
  useEffect(() => () => stopAll(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const ensureScheduled = async (seg: { round: number; startedAt: number; durationMs: number }) => {
    const ctx = ctxRef.current; if (!ctx) return;
    if (scheduledRef.current.has(seg.round)) return;
    scheduledRef.current.set(seg.round, {});
    try {
      const res = await fetch(`/api/radio/segment/${seg.round}`, { cache: "force-cache" });
      if (!res.ok) { scheduledRef.current.delete(seg.round); return; }
      const buf = await ctx.decodeAudioData(await res.arrayBuffer());
      const serverNow = Date.now() + offsetRef.current;
      const startIn = (seg.startedAt - serverNow) / 1000;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(analyserRef.current!);
      if (startIn <= 0.03) {
        const offset = Math.min(-startIn + 0.05, buf.duration - 0.05);
        if (offset < buf.duration - 0.1) src.start(ctx.currentTime + 0.05, offset);
        else { scheduledRef.current.delete(seg.round); return; }
      } else {
        src.start(ctx.currentTime + startIn);
      }
      scheduledRef.current.set(seg.round, { src });
      // úklid starých
      for (const [r, s] of scheduledRef.current) if (r < seg.round - 2) { try { s.src?.stop(); } catch {} scheduledRef.current.delete(r); }
    } catch {
      scheduledRef.current.delete(seg.round);
    }
  };

  const sync = async () => {
    try {
      const res = await fetch("/api/radio/now", { cache: "no-store" });
      if (!res.ok) return;
      const d: NowInfo = await res.json();
      offsetRef.current = d.serverNow - Date.now();
      setNow(d);
      ensureScheduled(d.current);
      if (d.next) ensureScheduled(d.next);
    } catch {}
  };

  useEffect(() => { track("radio", "open"); }, []);

  const enter = () => {
    track("radio", "interact");
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === "suspended") ctx.resume();
    const analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
    const gain = ctx.createGain(); gain.gain.value = 0.95;
    analyser.connect(gain).connect(ctx.destination);
    ctxRef.current = ctx; analyserRef.current = analyser;
    try { const v = JSON.parse(localStorage.getItem("radio-vote") ?? "null"); if (v) setMyVote(v); } catch {}
    sync();
    pollRef.current = setInterval(sync, 3000);
    setEntered(true);
  };

  // odpočet uzávěrky hlasování
  useEffect(() => {
    if (!entered) return;
    const i = setInterval(() => {
      const meta = nowRef.current;
      if (!meta) return;
      const left = (meta.voting.closesAt - (Date.now() + offsetRef.current)) / 1000;
      setSecLeft(Math.max(0, Math.ceil(left)));
      setClosed(left <= 0);
    }, 250);
    return () => clearInterval(i);
  }, [entered]);
  const nowRef = useRef<NowInfo | null>(null);
  useEffect(() => { nowRef.current = now; }, [now]);

  // waveform — jen ta, velká, nahoře
  useEffect(() => {
    if (!entered) return;
    const cv = canvasRef.current; if (!cv) return;
    const ctx2 = cv.getContext("2d"); if (!ctx2) return;
    const resize = () => { const r = cv.getBoundingClientRect(); cv.width = r.width * 2; cv.height = r.height * 2; };
    resize(); window.addEventListener("resize", resize);
    const drawWave = () => {
      const an = analyserRef.current;
      const w = cv.width, h = cv.height;
      const g = ctx2.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#070b18"); g.addColorStop(1, "#10162c");
      ctx2.fillStyle = g; ctx2.fillRect(0, 0, w, h);
      if (an) {
        const td = new Uint8Array(an.fftSize); an.getByteTimeDomainData(td);
        // zrcadlená výplň
        ctx2.beginPath();
        for (let i = 0; i < td.length; i++) { const x = (i / (td.length - 1)) * w; const y = h / 2 + (td[i] / 128 - 1) * h * 0.42; if (i === 0) ctx2.moveTo(x, y); else ctx2.lineTo(x, y); }
        for (let i = td.length - 1; i >= 0; i--) { const x = (i / (td.length - 1)) * w; const y = h / 2 - (td[i] / 128 - 1) * h * 0.42; ctx2.lineTo(x, y); }
        ctx2.closePath();
        ctx2.fillStyle = "rgba(96,165,250,0.12)"; ctx2.fill();
        // linka
        ctx2.beginPath();
        for (let i = 0; i < td.length; i++) { const x = (i / (td.length - 1)) * w; const y = h / 2 + (td[i] / 128 - 1) * h * 0.42; if (i === 0) ctx2.moveTo(x, y); else ctx2.lineTo(x, y); }
        ctx2.lineWidth = 3; ctx2.strokeStyle = "rgba(147,197,253,0.95)";
        ctx2.shadowColor = "rgba(96,165,250,0.8)"; ctx2.shadowBlur = 14;
        ctx2.stroke(); ctx2.shadowBlur = 0;
      }
      rafRef.current = requestAnimationFrame(drawWave);
    };
    drawWave();
    return () => { window.removeEventListener("resize", resize); if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
  }, [entered]);

  const vote = (option: OptionId) => {
    const meta = nowRef.current; if (!meta || closed) return;
    const round = meta.voting.round;
    if (myVote?.round === round) return;
    const mine = { round, option };
    setMyVote(mine);
    try { localStorage.setItem("radio-vote", JSON.stringify(mine)); } catch {}
    setNow((p) => p ? { ...p, voting: { ...p.voting, counts: { ...p.voting.counts, [option]: (p.voting.counts[option] ?? 0) + 1 } } } : p);
    fetch("/api/radio/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ round, option }) }).catch(() => {});
  };

  const votedThisRound = !!now && myVote?.round === now.voting.round;
  const totalVotes = now ? Object.values(now.voting.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ padding: "16px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)" }}>{t.eyebrow}</span>
      </div>

      <div style={{ maxWidth: "880px", margin: "0 auto", padding: "16px 24px 60px" }}>
        {/* zvukový modál — zvuk až po vstupu */}
        {!entered && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(10,12,24,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <div style={{ ...card, maxWidth: 440, width: "100%", textAlign: "center", padding: "30px 28px", animation: "radioModalIn 360ms cubic-bezier(0.22,1,0.36,1)" }}>
              <p style={{ fontSize: "40px", margin: "0 0 8px" }}>🎧</p>
              <h1 style={{ ...display, fontSize: "26px", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 8px" }}>{t.modalTitle}</h1>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 6px" }}>{t.modalText}</p>
              <p style={{ ...serifItalic, fontSize: "13px", color: "var(--text-muted)", margin: "0 0 20px" }}>{t.intro}</p>
              <button onClick={enter} style={{ background: "var(--text-primary)", color: "var(--bg)", border: "2.5px solid var(--text-primary)", borderRadius: "12px", boxShadow: "5px 5px 0 var(--text-primary)", padding: "14px 36px", fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 800, cursor: "pointer" }}>{t.enter}</button>
            </div>
            <style>{`@keyframes radioModalIn { from { opacity: 0; transform: translateY(26px) scale(0.96); } to { opacity: 1; transform: none; } }`}</style>
          </div>
        )}

        {/* waveform nahoře */}
        <div style={{ position: "relative", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "5px 5px 0 var(--border)", overflow: "hidden", background: "#070b18" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "26vh", minHeight: "180px", display: "block" }} />
          {entered && !now && (
            <p style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-sans)", fontSize: "13px", margin: 0 }}>{t.loading}</p>
          )}
        </div>

        {/* info chips */}
        <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
          <div style={{ ...card, flex: 1, display: "flex", justifyContent: "space-around", textAlign: "center", minWidth: "260px", padding: "10px 14px" }}>
            <div><p style={lab}>{t.tempo}</p><p style={{ ...display, fontSize: "18px", fontWeight: 800 }}>{now?.current.tempo ?? "—"}</p></div>
            <div><p style={lab}>{t.key}</p><p style={{ ...display, fontSize: "18px", fontWeight: 800 }}>{now?.current.key ?? "—"}</p></div>
            <div><p style={lab}>{t.genre}</p><p style={{ ...display, fontSize: "18px", fontWeight: 800 }}>{now?.current.genre ?? "—"}</p></div>
            <div><p style={lab}>{t.round}</p><p style={{ ...display, fontSize: "18px", fontWeight: 800 }}>#{now?.current.round ?? "—"}</p></div>
          </div>
        </div>

        {/* hlasování */}
        <div style={{ ...card, marginTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "6px", marginBottom: "4px" }}>
            <p style={{ ...display, fontSize: "17px", fontWeight: 800, margin: 0 }}>{t.voteHead}</p>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700, color: closed ? "var(--text-muted)" : secLeft <= 4 ? "#dc2626" : "var(--text-secondary)" }}>
              {entered ? (closed ? t.applied : `${t.closesIn} ${secLeft}s`) : "—"}
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", margin: "0 0 12px" }}>{t.voteSub}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {OPTIONS.map((o) => {
              const count = now?.voting.counts[o.id] ?? 0;
              const mine = votedThisRound && myVote?.option === o.id;
              const disabled = !entered || closed || votedThisRound;
              const share = totalVotes > 0 ? count / totalVotes : 0;
              return (
                <button key={o.id} onClick={() => vote(o.id)} disabled={disabled && !mine}
                  style={{
                    position: "relative", textAlign: "left", border: `2px solid ${mine ? "var(--text-primary)" : "var(--border)"}`,
                    background: mine ? "var(--text-primary)" : "#fff", color: mine ? "var(--bg)" : "var(--text-primary)",
                    borderRadius: "12px", boxShadow: mine ? "3px 3px 0 var(--border)" : "2px 2px 0 var(--border)", padding: "12px 14px",
                    cursor: disabled ? "default" : "pointer", opacity: disabled && !mine ? 0.55 : 1, overflow: "hidden",
                  }}>
                  <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${share * 100}%`, background: mine ? "rgba(255,255,255,0.12)" : "rgba(26,22,20,0.06)", transition: "width .4s ease" }} />
                  <span style={{ position: "relative", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 800 }}>{o.emoji} {o.label[lang]}{mine && <span style={{ fontWeight: 600 }}> · {t.voted}</span>}</span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "11.5px", opacity: 0.75 }}>{o.desc[lang]}</span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "10.5px", opacity: 0.6 }}>{count} {t.votes}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
