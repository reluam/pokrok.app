"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  musicUi, midiToShort, findInst, baseRootForTrack, scaleRows, isRoot,
  emptyTracks, SCALE_LABEL, STEPS, DRUM_LANES, DRUM_LABEL,
  type Assignment, type NoteCell, type DrumCell, type DrumLane, type TrackName, type FinishedItem,
} from "@/lib/music";
import { startLoop } from "@/lib/musicPlayback";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };
const TRACK_COLOR: Record<TrackName, string> = { melody: "#16A34A", bass: "#2563EB", pluck: "#9333EA", drums: "#D97706" };
const COL_W = 32, ROW_H = 22;

function getToken(): string {
  try {
    const k = "mv3-token";
    let v = localStorage.getItem(k);
    if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(k, v); }
    return v;
  } catch { return Math.random().toString(36).slice(2); }
}

/* ── Piano roll ────────────────────────────────────────────────── */

function PianoRoll({ baseRoot, scaleRoot, scaleName, notes, setNotes, color, playing, tempo }: {
  baseRoot: number; scaleRoot: number; scaleName: string;
  notes: NoteCell[]; setNotes: (n: NoteCell[]) => void; color: string;
  playing: boolean; tempo: number;
}) {
  const rows = [...scaleRows(baseRoot, scaleName)].reverse(); // shora nejvyšší
  const gridRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<NoteCell | null>(null);
  const mode = useRef<"none" | "draw" | "del" | "resize">("none");
  const idxRef = useRef(-1);
  const moved = useRef(false);
  const draftRef = useRef<NoteCell | null>(null);

  const W = STEPS * COL_W;
  const H = rows.length * ROW_H;
  const rowTop = (midi: number) => rows.indexOf(midi);
  const barSec = (STEPS * 60) / tempo;

  const locate = (e: React.PointerEvent) => {
    const el = gridRef.current!; const r = el.getBoundingClientRect();
    const x = e.clientX - r.left + el.scrollLeft; const y = e.clientY - r.top;
    const col = Math.max(0, Math.min(STEPS - 1, Math.floor(x / COL_W)));
    const ri = Math.max(0, Math.min(rows.length - 1, Math.floor(y / ROW_H)));
    return { x, col, midi: rows[ri] };
  };

  const down = (e: React.PointerEvent) => {
    const { x, col, midi } = locate(e);
    moved.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const idx = notes.findIndex((n) => n.midi === midi && col >= n.start && col < n.start + n.len);
    if (idx >= 0) {
      const n = notes[idx];
      const rightPx = (n.start + n.len) * COL_W;
      if (x >= rightPx - 11) { mode.current = "resize"; idxRef.current = idx; }
      else { mode.current = "del"; idxRef.current = idx; }
    } else {
      mode.current = "draw"; const d = { midi, start: col, len: 1 }; draftRef.current = d; setDraft(d);
    }
  };
  const move = (e: React.PointerEvent) => {
    if (mode.current === "none") return;
    moved.current = true;
    const { col } = locate(e);
    if (mode.current === "draw" && draftRef.current) {
      const len = Math.max(1, Math.min(STEPS - draftRef.current.start, col - draftRef.current.start + 1));
      if (len !== draftRef.current.len) { const d = { ...draftRef.current, len }; draftRef.current = d; setDraft(d); }
    } else if (mode.current === "resize" && idxRef.current >= 0) {
      const n = notes[idxRef.current];
      const len = Math.max(1, Math.min(STEPS - n.start, col - n.start + 1));
      if (len !== n.len) setNotes(notes.map((x, i) => i === idxRef.current ? { ...x, len } : x));
    }
  };
  const up = () => {
    if (mode.current === "draw" && draftRef.current) {
      const d = draftRef.current;
      setNotes([...notes.filter((n) => !(n.midi === d.midi && d.start < n.start + n.len && n.start < d.start + d.len)), d]);
    } else if (mode.current === "del" && idxRef.current >= 0 && !moved.current) {
      setNotes(notes.filter((_, i) => i !== idxRef.current));
    }
    mode.current = "none"; idxRef.current = -1; draftRef.current = null; setDraft(null);
  };

  return (
    <div style={{ border: "2px solid var(--border)", borderRadius: "12px", overflow: "hidden", background: "#fff" }}>
      {/* header beats */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "#FAFAF7" }}>
        <div style={{ width: 34, flexShrink: 0 }} />
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div style={{ display: "flex", width: W }}>
            {Array.from({ length: STEPS }).map((_, c) => (
              <div key={c} style={{ width: COL_W, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 700, color: c % 4 === 0 ? "var(--text-secondary)" : "var(--text-muted)", padding: "3px 0", borderLeft: c % 4 === 0 ? "1px solid rgba(0,0,0,0.12)" : "none" }}>
                {c % 4 === 0 ? c / 4 + 1 : ""}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex" }}>
        {/* gutter labels */}
        <div style={{ flexShrink: 0, width: 34, background: "#FAFAF7", borderRight: "1px solid var(--border)" }}>
          {rows.map((m) => {
            const root = isRoot(m, scaleRoot);
            return (
              <div key={m} style={{ height: ROW_H, fontSize: 9, lineHeight: `${ROW_H}px`, textAlign: "center", fontFamily: "var(--font-sans)", color: root ? color : "var(--text-secondary)", fontWeight: root ? 800 : 500 }}>
                {midiToShort(m)}
              </div>
            );
          })}
        </div>

        {/* grid */}
        <div style={{ overflowX: "auto", flex: 1 }}>
          <div ref={gridRef} onPointerDown={down} onPointerMove={move} onPointerUp={up}
            style={{ position: "relative", width: W, height: H, touchAction: "none", cursor: "crosshair" }}>
            {/* rows */}
            {rows.map((m, ri) => (
              <div key={m} style={{ position: "absolute", top: ri * ROW_H, left: 0, width: W, height: ROW_H,
                background: isRoot(m, scaleRoot) ? "rgba(0,0,0,0.05)" : ri % 2 ? "rgba(0,0,0,0.018)" : "transparent",
                borderBottom: "1px solid rgba(0,0,0,0.05)" }} />
            ))}
            {/* beat columns */}
            {Array.from({ length: STEPS }).map((_, c) => (
              <div key={c} style={{ position: "absolute", left: c * COL_W, top: 0, width: COL_W, height: H,
                background: Math.floor(c / 4) % 2 ? "rgba(0,0,0,0.015)" : "transparent",
                borderLeft: "1px solid " + (c % 4 === 0 ? "rgba(0,0,0,0.16)" : "rgba(0,0,0,0.05)") }} />
            ))}
            {/* notes */}
            {notes.map((n, i) => rowTop(n.midi) >= 0 && (
              <div key={i} style={{
                position: "absolute", left: n.start * COL_W + 2, top: rowTop(n.midi) * ROW_H + 2,
                width: n.len * COL_W - 4, height: ROW_H - 4, borderRadius: 5,
                background: `linear-gradient(180deg, ${color}, ${color}cc)`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)",
                border: "1px solid rgba(0,0,0,0.15)",
              }}>
                <div style={{ position: "absolute", right: 0, top: 0, width: 9, height: "100%", cursor: "ew-resize", borderRadius: "0 5px 5px 0", background: "rgba(255,255,255,0.25)" }} />
              </div>
            ))}
            {/* draft */}
            {draft && rowTop(draft.midi) >= 0 && (
              <div style={{ position: "absolute", left: draft.start * COL_W + 2, top: rowTop(draft.midi) * ROW_H + 2, width: draft.len * COL_W - 4, height: ROW_H - 4, borderRadius: 5, background: color, opacity: 0.5 }} />
            )}
            {/* playhead */}
            {playing && (
              <div style={{ position: "absolute", top: 0, left: 0, width: 2, height: H, background: "rgba(0,0,0,0.45)", animation: `phMove ${barSec}s linear infinite`, pointerEvents: "none" }} />
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes phMove { from { transform: translateX(0); } to { transform: translateX(${W}px); } }`}</style>
    </div>
  );
}

/* ── Drum grid ─────────────────────────────────────────────────── */

const DRUM_EMOJI: Record<DrumLane, string> = { kick: "🥁", clap: "👏", hihat: "🎩" };

function DrumGrid({ drums, setDrums, lang, playing, tempo }: { drums: DrumCell[]; setDrums: (d: DrumCell[]) => void; lang: Lang; playing: boolean; tempo: number }) {
  const has = (lane: DrumLane, step: number) => drums.some((d) => d.lane === lane && d.step === step);
  const toggle = (lane: DrumLane, step: number) => {
    if (has(lane, step)) setDrums(drums.filter((d) => !(d.lane === lane && d.step === step)));
    else setDrums([...drums, { lane, step }]);
  };
  const barSec = (STEPS * 60) / tempo;
  const W = STEPS * 30;

  return (
    <div style={{ border: "2px solid var(--border)", borderRadius: "12px", background: "#fff", padding: "12px", overflowX: "auto" }}>
      <div style={{ position: "relative", width: W + 52 }}>
        {/* beat header */}
        <div style={{ display: "flex", marginLeft: 52, marginBottom: 6 }}>
          {Array.from({ length: STEPS }).map((_, c) => (
            <div key={c} style={{ width: 30, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 700, color: c % 4 === 0 ? "var(--text-secondary)" : "var(--text-muted)" }}>{c % 4 === 0 ? c / 4 + 1 : ""}</div>
          ))}
        </div>
        {DRUM_LANES.map((lane) => (
          <div key={lane} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ width: 44, fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
              <span>{DRUM_EMOJI[lane]}</span>{DRUM_LABEL[lane][lang]}
            </span>
            <div style={{ display: "flex", gap: 3 }}>
              {Array.from({ length: STEPS }).map((_, s) => {
                const on = has(lane, s);
                return (
                  <button key={s} onClick={() => toggle(lane, s)}
                    style={{ width: 27, height: 30, flexShrink: 0, borderRadius: 6, cursor: "pointer",
                      background: on ? `linear-gradient(180deg, ${TRACK_COLOR.drums}, ${TRACK_COLOR.drums}cc)` : Math.floor(s / 4) % 2 ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.025)",
                      boxShadow: on ? "0 1px 3px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)" : "none",
                      border: "1px solid " + (on ? "#b45309" : "rgba(0,0,0,0.08)"), transition: "background 100ms" }} />
                );
              })}
            </div>
          </div>
        ))}
        {playing && (
          <div style={{ position: "absolute", top: 22, left: 52, width: 2, bottom: 0, background: "rgba(0,0,0,0.4)", animation: `phMoveD ${barSec}s linear infinite`, pointerEvents: "none" }} />
        )}
      </div>
      <style>{`@keyframes phMoveD { from { transform: translateX(0); } to { transform: translateX(${W}px); } }`}</style>
    </div>
  );
}

/* ── Hlavní ────────────────────────────────────────────────────── */

type Screen = "intro" | "building" | "done";

export function MusicMakerApp({ lang, finished: initialFinished }: { lang: Lang; finished: FinishedItem[] }) {
  const t = musicUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";

  const [finished, setFinished] = useState<FinishedItem[]>(initialFinished);
  const [screen, setScreen] = useState<Screen>("intro");
  const [busy, setBusy] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [notes, setNotes] = useState<NoteCell[]>([]);
  const [drums, setDrums] = useState<DrumCell[]>([]);
  const [email, setEmail] = useState("");
  const [warn, setWarn] = useState("");
  const [result, setResult] = useState<{ songId: number; complete: boolean } | null>(null);
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const stopPlay = () => { if (stopRef.current) stopRef.current(); stopRef.current = null; setPlaying(false); };
  useEffect(() => () => stopPlay(), []);

  // Hotové songy načti na pozadí (neblokuje zobrazení stránky)
  useEffect(() => {
    fetch("/api/music/finished", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => Array.isArray(d) && setFinished(d))
      .catch(() => {});
  }, []);

  const start = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/music/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: getToken() }) });
      if (res.ok) { setAssignment(await res.json()); setNotes([]); setDrums([]); setEmail(""); setWarn(""); setResult(null); setScreen("building"); }
    } catch {}
    setBusy(false);
  };

  const playOwn = () => {
    if (!assignment) return;
    stopPlay();
    const tracks = emptyTracks();
    if (assignment.track === "drums") tracks.drums = drums; else tracks[assignment.track] = notes;
    setPlaying(true);
    stopRef.current = startLoop(tracks, {
      melody: findInst("melody", assignment.track === "melody" ? assignment.inst : null),
      bass: findInst("bass", assignment.track === "bass" ? assignment.inst : null),
      pluck: findInst("pluck", assignment.track === "pluck" ? assignment.inst : null),
    }, assignment.tempo);
  };

  const submit = async () => {
    if (!assignment) return;
    const isDrums = assignment.track === "drums";
    if ((isDrums && drums.length === 0) || (!isDrums && notes.length === 0)) { setWarn(t.emptyWarn); return; }
    setBusy(true); stopPlay();
    try {
      const data = { notes: isDrums ? [] : notes, drums: isDrums ? drums : [] };
      const res = await fetch("/api/music/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partId: assignment.partId, token: getToken(), data, email }) });
      const j = await res.json();
      if (res.ok && j.ok) { setResult({ songId: j.songId, complete: j.complete }); setScreen("done"); }
    } catch {}
    setBusy(false);
  };

  const reset = () => { stopPlay(); setAssignment(null); setNotes([]); setDrums([]); setResult(null); setScreen("intro"); };

  const wrap = (children: React.ReactNode, maxW = "600px") => (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ padding: "20px 24px 0" }}><Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link></div>
      <div style={{ maxWidth: maxW, margin: "0 auto", padding: "32px 24px 80px" }}>{children}</div>
    </div>
  );

  if (screen === "intro") {
    return wrap(<>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)", marginBottom: "12px" }}>{t.eyebrow}</p>
        <h1 style={{ ...display, fontSize: "clamp(34px, 7.5vw, 56px)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em", marginBottom: "16px" }}>{t.title}</h1>
        <p style={{ ...serifItalic, fontSize: "17px", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: "480px", margin: "0 auto 28px" }}>{t.intro}</p>
        <button onClick={start} disabled={busy} style={{ background: "var(--text-primary)", color: "var(--bg)", border: "2.5px solid var(--text-primary)", borderRadius: "12px", boxShadow: "4px 4px 0 var(--text-primary)", padding: "14px 32px", fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, cursor: "pointer", opacity: busy ? 0.5 : 1 }}>{busy ? t.assigning : t.startBtn}</button>
      </div>
      {finished.length > 0 && (<>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "12px" }}>{t.finishedHeading}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {finished.map((f) => (
            <Link key={f.id} href={`/music/song/${f.id}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "12px", boxShadow: "3px 3px 0 var(--border)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ ...display, fontSize: "15px", fontWeight: 800, color: "var(--text-primary)" }}>#{f.id} · {SCALE_LABEL[f.scaleName] ?? f.scaleName} · {f.tempo} BPM</span>
                <span style={{ color: "var(--text-muted)" }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </>)}
    </>);
  }

  if (screen === "done" && result) {
    return wrap(<div style={{ textAlign: "center", paddingTop: "20px" }}>
      <p style={{ fontSize: "44px", marginBottom: "12px" }}>🎵</p>
      <h1 style={{ ...display, fontSize: "30px", fontWeight: 900, marginBottom: "14px" }}>{t.doneTitle}</h1>
      <p style={{ ...serifItalic, fontSize: "17px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "28px", maxWidth: "440px", margin: "0 auto 28px" }}>{result.complete ? t.doneComplete : t.doneWaiting}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
        <Link href={`/music/song/${result.songId}`} style={{ textDecoration: "none" }}>
          <span style={{ display: "inline-block", background: result.complete ? "#16A34A" : "#fff", color: result.complete ? "#fff" : "var(--text-primary)", border: `2.5px solid ${result.complete ? "#16A34A" : "var(--border)"}`, borderRadius: "12px", boxShadow: `4px 4px 0 ${result.complete ? "#15803d" : "var(--border)"}`, padding: "12px 26px", fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700 }}>{t.openSong}</span>
        </Link>
        <button onClick={reset} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: "14px", cursor: "pointer", textDecoration: "underline", marginTop: "6px" }}>{t.again}</button>
      </div>
    </div>);
  }

  if (!assignment) return wrap(<p style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>…</p>);
  const isDrums = assignment.track === "drums";
  const color = TRACK_COLOR[assignment.track];
  const hasContent = isDrums ? drums.length > 0 : notes.length > 0;

  return wrap(<>
    <div style={{ background: "#fff", border: `2.5px solid ${color}`, borderRadius: "16px", boxShadow: `4px 4px 0 ${color}`, padding: "18px 20px", marginBottom: "16px" }}>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: "6px" }}>{t.yourTask}</p>
      <p style={{ ...display, fontSize: "26px", fontWeight: 900, color }}>{t.trackName[assignment.track]}</p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
        {!isDrums && `${t.instrument}: ${findInst(assignment.track, assignment.inst).label[lang]} · `}
        {t.scale}: {SCALE_LABEL[assignment.scaleName] ?? assignment.scaleName} · {t.tempo}: {assignment.tempo} BPM
      </p>
      <p style={{ ...serifItalic, fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>{t.blindNote}</p>
    </div>

    {/* Editor */}
    <div style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "4px 4px 0 var(--border)", padding: "16px", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "10px", flexWrap: "wrap" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", flex: 1, minWidth: "180px" }}>{isDrums ? t.gridHintDrum : t.gridHintNote}</p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { stopPlay(); isDrums ? setDrums([]) : setNotes([]); }} style={{ background: "transparent", border: "2px solid var(--border)", borderRadius: "8px", padding: "6px 12px", fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>{t.clear}</button>
          <button onClick={playing ? stopPlay : playOwn} disabled={!hasContent} style={{ background: playing ? color : "var(--text-primary)", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 14px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, cursor: hasContent ? "pointer" : "default", opacity: hasContent ? 1 : 0.4 }}>{playing ? t.stop : t.play}</button>
        </div>
      </div>
      <div style={{ maxHeight: "340px", overflowY: "auto" }}>
        {isDrums
          ? <DrumGrid drums={drums} setDrums={setDrums} lang={lang} playing={playing} tempo={assignment.tempo} />
          : <PianoRoll baseRoot={baseRootForTrack(assignment.scaleRoot, assignment.track)} scaleRoot={assignment.scaleRoot} scaleName={assignment.scaleName} notes={notes} setNotes={setNotes} color={color} playing={playing} tempo={assignment.tempo} />}
      </div>
    </div>

    {/* Submit */}
    <div style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "4px 4px 0 var(--border)", padding: "18px" }}>
      <label style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>{t.emailLabel}</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder}
        style={{ width: "100%", background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "10px", padding: "11px 14px", fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-primary)", outline: "none", marginBottom: "12px" }} />
      {warn && <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "#b45309", marginBottom: "10px" }}>{warn}</p>}
      <button onClick={submit} disabled={busy} style={{ background: "#16A34A", color: "#fff", border: "2.5px solid #16A34A", borderRadius: "12px", boxShadow: "4px 4px 0 #15803d", padding: "13px 28px", fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700, cursor: "pointer", opacity: busy ? 0.5 : 1 }}>{busy ? t.submitting : t.submit}</button>
    </div>
  </>);
}
