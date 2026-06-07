"use client";

import { useEffect, useRef, useState } from "react";
import { type PublicSong, songsUi } from "@/lib/songsDb";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };

function fmt(t: number): string {
  if (!isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function fmtDate(iso: string, lang: Lang): string {
  const d = new Date(iso + "T00:00:00");
  return lang === "cs"
    ? d.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
const LIKED_KEY = "spaghetti-liked-songs";
const NAME_KEY = "spaghetti-comment-name";

export function SongsPlayer({ songs, lang, compact = false }: { songs: PublicSong[]; lang: Lang; compact?: boolean }) {
  const t = songsUi[lang];
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoplay = useRef(false);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const [likes, setLikes] = useState<Record<string, number>>(() => Object.fromEntries(songs.map((s) => [s.slug, s.likes])));
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const song = songs[idx];

  // localStorage: lajky + jméno
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIKED_KEY);
      if (raw) setLiked(new Set(JSON.parse(raw)));
      const n = localStorage.getItem(NAME_KEY);
      if (n) setName(n);
    } catch {}
  }, []);

  // hlasitost
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume, idx]);

  // přepnutí songu → reload + případně autoplay; reset formuláře zprávy
  useEffect(() => {
    setSent(false); setText("");
    const a = audioRef.current; if (!a) return;
    a.load(); setCur(0); setDur(0);
    if (autoplay.current) { a.play().catch(() => {}); autoplay.current = false; }
  }, [idx]);

  if (!song) return null;

  const go = (d: -1 | 1) => {
    const j = idx + d;
    if (j < 0 || j >= songs.length) return;
    autoplay.current = playing;
    setIdx(j);
  };

  const toggle = () => {
    const a = audioRef.current; if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current; if (!a || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
  };

  const toggleLike = async () => {
    const isLiked = liked.has(song.slug);
    const delta = isLiked ? -1 : 1;
    // optimisticky
    setLikes((m) => ({ ...m, [song.slug]: Math.max(0, (m[song.slug] ?? 0) + delta) }));
    const nextLiked = new Set(liked);
    if (isLiked) nextLiked.delete(song.slug); else nextLiked.add(song.slug);
    setLiked(nextLiked);
    try { localStorage.setItem(LIKED_KEY, JSON.stringify([...nextLiked])); } catch {}
    try {
      const res = await fetch(`/api/songs/${song.slug}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta }) });
      if (res.ok) { const d = await res.json(); setLikes((m) => ({ ...m, [song.slug]: d.likes })); }
    } catch {}
  };

  const submitFeedback = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try { localStorage.setItem(NAME_KEY, name); } catch {}
    try {
      const res = await fetch(`/api/songs/${song.slug}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ author: name, content: text }) });
      if (res.ok) { setText(""); setSent(true); }
    } catch {}
    setSending(false);
  };

  const pct = dur ? (cur / dur) * 100 : 0;
  const likeCount = likes[song.slug] ?? 0;
  const isLiked = liked.has(song.slug);
  const arrow = (dir: -1 | 1) => {
    const disabled = dir === -1 ? idx === 0 : idx === songs.length - 1;
    return (
      <button onClick={() => go(dir)} disabled={disabled} aria-label={dir === -1 ? t.prev : t.next}
        style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid var(--border)", background: "#fff", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.28 : 1, color: "var(--text-primary)", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {dir === -1 ? "‹" : "›"}
      </button>
    );
  };

  return (
    <div style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "18px", boxShadow: "5px 5px 0 var(--border)", padding: "20px", maxWidth: "620px" }}>
      {/* horní řádek: cover + meta + pozice */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ width: 84, height: 84, flexShrink: 0, borderRadius: "12px", overflow: "hidden", border: "2px solid var(--border)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {song.coverUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={song.coverUrl} alt="" width={84} height={84} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            : <span style={{ fontSize: "32px" }}>🎵</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
            <h3 style={{ ...display, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>{song.title}</h3>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>{idx + 1} {t.of} {songs.length}</span>
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{fmtDate(song.date, lang)}</p>
          {song.note && <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.45, marginTop: "6px" }}>{song.note}</p>}
        </div>
      </div>

      {/* seek */}
      <div onClick={seek} style={{ height: 8, background: "rgba(26,22,20,0.12)", borderRadius: "999px", cursor: "pointer", position: "relative", marginBottom: "6px" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "var(--text-primary)", borderRadius: "999px" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", marginBottom: "14px" }}>
        <span>{fmt(cur)}</span><span>{fmt(dur)}</span>
      </div>

      {/* ovládání */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        {arrow(-1)}
        <button onClick={toggle} aria-label={playing ? t.pause : t.play} style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--text-primary)", color: "var(--bg)", border: "none", cursor: "pointer", fontSize: "17px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {playing ? "❚❚" : "▶"}
        </button>
        {arrow(1)}

        {/* hlasitost */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: "110px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }} aria-hidden>🔊</span>
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} aria-label={t.volume} style={{ flex: 1, accentColor: "var(--text-primary)", cursor: "pointer" }} />
        </div>

        {/* like */}
        <button onClick={toggleLike} aria-label="like" style={{ display: "flex", alignItems: "center", gap: "6px", background: isLiked ? "var(--text-primary)" : "#fff", color: isLiked ? "var(--bg)" : "var(--text-primary)", border: "2px solid var(--border)", borderRadius: "999px", padding: "7px 14px", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>
          <span>{isLiked ? "♥" : "♡"}</span>{likeCount}
        </button>
      </div>

      {/* soukromá zpráva autorovi (plná verze) */}
      {!compact && (
        <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: "1.5px solid rgba(26,22,20,0.1)" }}>
          <p style={{ ...display, fontSize: "16px", fontWeight: 700, marginBottom: "2px" }}>{t.feedbackTitle}</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>{t.feedbackHint}</p>

          {sent ? (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-primary)", fontWeight: 600 }}>{t.sent}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePh} maxLength={40}
                style={{ background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "8px", padding: "8px 10px", fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-primary)", outline: "none" }} />
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t.commentPh} maxLength={2000} rows={3}
                style={{ background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "8px", padding: "8px 10px", fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-primary)", outline: "none", resize: "vertical" }} />
              <button onClick={submitFeedback} disabled={sending || !text.trim()} style={{ alignSelf: "flex-start", background: "var(--text-primary)", color: "var(--bg)", border: "none", borderRadius: "10px", padding: "9px 18px", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, cursor: text.trim() ? "pointer" : "default", opacity: text.trim() && !sending ? 1 : 0.5 }}>{t.send}</button>
            </div>
          )}
        </div>
      )}

      <audio
        ref={audioRef}
        src={song.audioUrl}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => { setDur(e.currentTarget.duration); e.currentTarget.volume = volume; }}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}
