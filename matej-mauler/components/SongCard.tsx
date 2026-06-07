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

export function SongCard({ song, lang }: { song: PublicSong; lang: Lang }) {
  const t = songsUi[lang];
  const audioRef = useRef<HTMLAudioElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const [likeCount, setLikeCount] = useState(song.likes);
  const [liked, setLiked] = useState(false);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIKED_KEY);
      if (raw) setLiked(new Set<string>(JSON.parse(raw)).has(song.slug));
    } catch {}
  }, [song.slug]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  // jen jeden song hraje naráz
  useEffect(() => {
    const onOther = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      if (id !== song.slug && audioRef.current) audioRef.current.pause();
    };
    window.addEventListener("song-play", onOther);
    return () => window.removeEventListener("song-play", onOther);
  }, [song.slug]);

  const toggle = () => {
    const a = audioRef.current; if (!a) return;
    if (a.paused) { window.dispatchEvent(new CustomEvent("song-play", { detail: song.slug })); a.play().catch(() => {}); }
    else a.pause();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current; if (!a || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
  };

  const toggleLike = async () => {
    const delta = liked ? -1 : 1;
    setLikeCount((c) => Math.max(0, c + delta));
    setLiked(!liked);
    try {
      const raw = localStorage.getItem(LIKED_KEY);
      const set = new Set<string>(raw ? JSON.parse(raw) : []);
      if (liked) set.delete(song.slug); else set.add(song.slug);
      localStorage.setItem(LIKED_KEY, JSON.stringify([...set]));
    } catch {}
    try {
      const res = await fetch(`/api/songs/${song.slug}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta }) });
      if (res.ok) { const d = await res.json(); setLikeCount(d.likes); }
    } catch {}
  };

  const grow = () => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/songs/${song.slug}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: text }) });
      if (res.ok) { setText(""); setSent(true); }
    } catch {}
    setSending(false);
  };

  const pct = dur ? (cur / dur) * 100 : 0;

  return (
    <div style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "4px 4px 0 var(--border)", padding: "16px 18px" }}>
      {/* hlavička */}
      <div style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: "10px", overflow: "hidden", border: "2px solid var(--border)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {song.coverUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={song.coverUrl} alt="" width={64} height={64} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            : <span style={{ fontSize: "26px" }}>🎵</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
            <h3 style={{ ...display, fontSize: "19px", fontWeight: 700, letterSpacing: "-0.01em" }}>{song.title}</h3>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)" }}>{fmtDate(song.date, lang)}</span>
          </div>
          {song.note && <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.45, marginTop: "4px" }}>{song.note}</p>}
        </div>
      </div>

      {/* seek */}
      <div onClick={seek} style={{ height: 8, background: "rgba(26,22,20,0.12)", borderRadius: "999px", cursor: "pointer", position: "relative", marginBottom: "6px" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "var(--text-primary)", borderRadius: "999px" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", marginBottom: "12px" }}>
        <span>{fmt(cur)}</span><span>{fmt(dur)}</span>
      </div>

      {/* ovládání */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <button onClick={toggle} aria-label={playing ? t.pause : t.play} style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--text-primary)", color: "var(--bg)", border: "none", cursor: "pointer", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {playing ? "❚❚" : "▶"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: "110px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }} aria-hidden>🔊</span>
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} aria-label={t.volume} style={{ flex: 1, accentColor: "var(--text-primary)", cursor: "pointer" }} />
        </div>
        <button onClick={toggleLike} aria-label="like" style={{ display: "flex", alignItems: "center", gap: "6px", background: liked ? "var(--text-primary)" : "#fff", color: liked ? "var(--bg)" : "var(--text-primary)", border: "2px solid var(--border)", borderRadius: "999px", padding: "7px 14px", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>
          <span>{liked ? "♥" : "♡"}</span>{likeCount}
        </button>
      </div>

      {/* vzkaz autorovi — jen jedno auto-rostoucí pole */}
      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1.5px solid rgba(26,22,20,0.08)" }}>
        {sent ? (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>{t.sent}</p>
        ) : (
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <textarea
              ref={taRef}
              rows={1}
              value={text}
              onChange={(e) => { setText(e.target.value); grow(); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={t.feedbackTitle}
              maxLength={2000}
              style={{ flex: 1, resize: "none", overflow: "hidden", minHeight: "40px", maxHeight: "160px", background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "10px", padding: "9px 12px", fontFamily: "var(--font-sans)", fontSize: "13px", lineHeight: 1.4, color: "var(--text-primary)", outline: "none" }}
            />
            <button onClick={send} disabled={sending || !text.trim()} aria-label={t.send} style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "10px", background: "var(--text-primary)", color: "var(--bg)", border: "none", cursor: text.trim() ? "pointer" : "default", opacity: text.trim() && !sending ? 1 : 0.45, fontSize: "15px" }}>➤</button>
          </div>
        )}
      </div>

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
