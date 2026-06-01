"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  musicUi, midiToName, findInst, optionsForStep, emptyTracks, SCALE_LABEL, STEPS,
  type Assignment, type PartEvent, type Option, type TrackName, type FinishedItem,
} from "@/lib/music";
import { startLoop } from "@/lib/musicPlayback";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };
const TRACK_COLOR: Record<TrackName, string> = { melody: "#16A34A", bass: "#2563EB", pluck: "#9333EA", drums: "#D97706" };

function getToken(): string {
  try {
    const k = "mv3-token";
    let v = localStorage.getItem(k);
    if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(k, v); }
    return v;
  } catch { return Math.random().toString(36).slice(2); }
}

type Screen = "intro" | "building" | "done";

export function MusicMakerApp({ lang, finished }: { lang: Lang; finished: FinishedItem[] }) {
  const t = musicUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";

  const [screen, setScreen] = useState<Screen>("intro");
  const [busy, setBusy] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [events, setEvents] = useState<PartEvent[]>([]);
  const [stepOptions, setStepOptions] = useState<Option[]>([]);
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ songId: number; complete: boolean } | null>(null);
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const stopPlay = () => { if (stopRef.current) stopRef.current(); stopRef.current = null; setPlaying(false); };
  useEffect(() => () => stopPlay(), []);

  // Spočítej možnosti aktuálního kroku
  useEffect(() => {
    if (screen !== "building" || !assignment || events.length >= STEPS) { setStepOptions([]); return; }
    let prev: number | null = null;
    for (let i = events.length - 1; i >= 0; i--) if (events[i].type === "note" && events[i].midi != null) { prev = events[i].midi; break; }
    setStepOptions(optionsForStep(assignment.track, assignment.scaleRoot, assignment.scaleName, prev));
  }, [screen, assignment, events]);

  const start = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/music/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: getToken() }) });
      if (res.ok) { setAssignment(await res.json()); setEvents([]); setEmail(""); setResult(null); setScreen("building"); }
    } catch {}
    setBusy(false);
  };

  const pick = (opt: Option) => {
    if (events.length >= STEPS) return;
    const ev: PartEvent = assignment!.track === "drums"
      ? { type: "drum", midi: null, combo: opt.payload.combo ?? "none" }
      : { type: opt.payload.midi == null ? "rest" : "note", midi: opt.payload.midi ?? null, combo: null };
    setEvents((prev) => [...prev, ev]);
  };

  const playOwn = () => {
    if (!assignment) return;
    stopPlay();
    const tracks = emptyTracks();
    tracks[assignment.track] = events;
    setPlaying(true);
    stopRef.current = startLoop(tracks, {
      melody: findInst("melody", assignment.track === "melody" ? assignment.inst : null),
      bass: findInst("bass", assignment.track === "bass" ? assignment.inst : null),
      pluck: findInst("pluck", assignment.track === "pluck" ? assignment.inst : null),
    }, assignment.tempo);
  };

  const submit = async () => {
    if (!assignment) return;
    setBusy(true); stopPlay();
    try {
      const res = await fetch("/api/music/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partId: assignment.partId, token: getToken(), events, email }) });
      const j = await res.json();
      if (res.ok && j.ok) { setResult({ songId: j.songId, complete: j.complete }); setScreen("done"); }
    } catch {}
    setBusy(false);
  };

  const reset = () => { stopPlay(); setAssignment(null); setEvents([]); setResult(null); setScreen("intro"); };

  const cardWrap = (children: React.ReactNode) => (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ padding: "20px 24px 0" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
      </div>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 24px 80px" }}>{children}</div>
    </div>
  );

  /* ── INTRO ── */
  if (screen === "intro") {
    return cardWrap(<>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)", marginBottom: "12px" }}>{t.eyebrow}</p>
        <h1 style={{ ...display, fontSize: "clamp(34px, 7.5vw, 56px)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em", marginBottom: "16px" }}>{t.title}</h1>
        <p style={{ ...serifItalic, fontSize: "17px", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: "480px", margin: "0 auto 28px" }}>{t.intro}</p>
        <button onClick={start} disabled={busy}
          style={{ background: "var(--text-primary)", color: "var(--bg)", border: "2.5px solid var(--text-primary)", borderRadius: "12px", boxShadow: "4px 4px 0 var(--text-primary)", padding: "14px 32px", fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, cursor: "pointer", opacity: busy ? 0.5 : 1 }}>
          {busy ? t.assigning : t.startBtn}
        </button>
      </div>
      {finished.length > 0 && (
        <>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "12px" }}>{t.finishedHeading}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {finished.map((f) => (
              <Link key={f.id} href={`/music/song/${f.id}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "12px", boxShadow: "3px 3px 0 var(--border)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ ...display, fontSize: "15px", fontWeight: 800, color: "var(--text-primary)" }}>#{f.id} · {SCALE_LABEL[f.scaleName] ?? f.scaleName} · {f.tempo} BPM</span>
                  <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: "13px" }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>);
  }

  /* ── DONE ── */
  if (screen === "done" && result) {
    return cardWrap(<div style={{ textAlign: "center", paddingTop: "20px" }}>
      <p style={{ fontSize: "44px", marginBottom: "12px" }}>🎵</p>
      <h1 style={{ ...display, fontSize: "30px", fontWeight: 900, marginBottom: "14px" }}>{t.doneTitle}</h1>
      <p style={{ ...serifItalic, fontSize: "17px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "28px", maxWidth: "440px", margin: "0 auto 28px" }}>
        {result.complete ? t.doneComplete : t.doneWaiting}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
        <Link href={`/music/song/${result.songId}`} style={{ textDecoration: "none" }}>
          <span style={{ display: "inline-block", background: result.complete ? "#16A34A" : "#fff", color: result.complete ? "#fff" : "var(--text-primary)", border: `2.5px solid ${result.complete ? "#16A34A" : "var(--border)"}`, borderRadius: "12px", boxShadow: `4px 4px 0 ${result.complete ? "#15803d" : "var(--border)"}`, padding: "12px 26px", fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700 }}>
            {t.openSong}
          </span>
        </Link>
        <button onClick={reset} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: "14px", cursor: "pointer", textDecoration: "underline", marginTop: "6px" }}>{t.again}</button>
      </div>
    </div>);
  }

  /* ── BUILDING ── */
  if (!assignment) return cardWrap(<p style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>…</p>);
  const finishedBuilding = events.length >= STEPS;
  const isDrums = assignment.track === "drums";
  const color = TRACK_COLOR[assignment.track];

  return cardWrap(<>
    {/* Task header */}
    <div style={{ background: "#fff", border: `2.5px solid ${color}`, borderRadius: "16px", boxShadow: `4px 4px 0 ${color}`, padding: "18px 20px", marginBottom: "16px" }}>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "6px" }}>{t.yourTask}</p>
      <p style={{ ...display, fontSize: "26px", fontWeight: 900, color }}>{t.trackName[assignment.track]}</p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
        {!isDrums && `${t.instrument}: ${findInst(assignment.track, assignment.inst).label[lang]} · `}
        {t.scale}: {SCALE_LABEL[assignment.scaleName] ?? assignment.scaleName} · {t.tempo}: {assignment.tempo} BPM
      </p>
      <p style={{ ...serifItalic, fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>{t.blindNote}</p>
    </div>

    {/* Progress grid */}
    <div style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "4px 4px 0 var(--border)", padding: "16px", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)" }}>{t.step} {Math.min(events.length + 1, STEPS)} {t.of} {STEPS}</span>
        <button onClick={playing ? stopPlay : playOwn} disabled={events.length === 0}
          style={{ background: playing ? color : "var(--text-primary)", color: "#fff", border: "none", borderRadius: "8px", padding: "7px 14px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, cursor: events.length ? "pointer" : "default", opacity: events.length ? 1 : 0.4 }}>
          {playing ? t.stop : t.play}
        </button>
      </div>
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
        {Array.from({ length: STEPS }).map((_, i) => {
          const ev = events[i];
          const filled = !!ev;
          const dim = ev && (ev.type === "rest" || (ev.type === "drum" && (!ev.combo || ev.combo === "none")));
          let txt = String(i + 1);
          if (filled) txt = ev.type === "drum" ? (dim ? "·" : (ev.combo ?? "").split("_").map((p) => p[0]?.toUpperCase()).join("")) : (ev.type === "rest" ? "·" : midiToName(ev.midi!).replace(/[0-9]/g, ""));
          return (
            <div key={i} style={{ minWidth: "30px", height: "30px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700,
              background: !filled ? "rgba(26,22,20,0.05)" : dim ? "rgba(26,22,20,0.1)" : color,
              color: filled && !dim ? "#fff" : "var(--text-muted)",
              border: "1px solid " + (!filled ? "rgba(26,22,20,0.1)" : dim ? "rgba(26,22,20,0.15)" : color) }}>{txt}</div>
          );
        })}
      </div>
    </div>

    {/* Options or finish */}
    {!finishedBuilding ? (
      <div style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "4px 4px 0 var(--border)", padding: "18px" }}>
        <p style={{ ...display, fontSize: "17px", fontWeight: 800, marginBottom: "14px" }}>{isDrums ? t.pickDrum : t.pickNote}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px" }}>
          {stepOptions.map((opt) => (
            <button key={opt.id} onClick={() => pick(opt)}
              style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "12px", boxShadow: "2px 2px 0 var(--border)", padding: "12px 10px", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", cursor: "pointer", transition: "transform 120ms ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-1px,-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>
              {opt.label[lang]}
            </button>
          ))}
        </div>
      </div>
    ) : (
      <div style={{ background: "#fff", border: "2.5px solid #16A34A", borderRadius: "16px", boxShadow: "4px 4px 0 #16A34A", padding: "20px" }}>
        <p style={{ ...display, fontSize: "19px", fontWeight: 800, marginBottom: "14px" }}>{t.finishTitle}</p>
        <label style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>{t.emailLabel}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder}
          style={{ width: "100%", background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "10px", padding: "11px 14px", fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-primary)", outline: "none", marginBottom: "14px" }} />
        <button onClick={submit} disabled={busy}
          style={{ background: "#16A34A", color: "#fff", border: "2.5px solid #16A34A", borderRadius: "12px", boxShadow: "4px 4px 0 #15803d", padding: "13px 28px", fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700, cursor: "pointer", opacity: busy ? 0.5 : 1 }}>
          {busy ? t.submitting : t.submit}
        </button>
      </div>
    )}
  </>);
}
