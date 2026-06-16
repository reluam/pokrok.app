"use client";

import { useState } from "react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import type { SongRow } from "@/lib/songsDb";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const inputS: React.CSSProperties = { width: "100%", background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "8px", padding: "8px 10px", fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-primary)", outline: "none", marginBottom: "8px" };
const btn = (bg: string, color = "#fff"): React.CSSProperties => ({ background: bg, color, border: "none", borderRadius: "8px", padding: "7px 12px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, cursor: "pointer" });

type Draft = Partial<SongRow>;
export type AdminMessage = { id: number; author: string; content: string; created_at: string; song_slug: string; song_title: string };

function fmtMsgDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function SongsAdmin({ initial, initialMessages = [] }: { initial: SongRow[]; initialMessages?: AdminMessage[] }) {
  const [rows, setRows] = useState<SongRow[]>(initial);
  const [messages, setMessages] = useState<AdminMessage[]>(initialMessages);
  const delMessage = async (id: number) => {
    if (!confirm("Delete this message?")) return;
    setMessages((m) => m.filter((x) => x.id !== id));
    await fetch(`/api/admin/songs/messages/${id}`, { method: "DELETE" });
  };
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [adding, setAdding] = useState(false);
  const [neu, setNeu] = useState<Draft>({});
  const [busy, setBusy] = useState(false);
  const [upA, setUpA] = useState(false);
  const [upC, setUpC] = useState(false);

  const uploadTo = async (file: File, key: "audio_url" | "cover_url", setBusyFlag: (b: boolean) => void) => {
    setBusyFlag(true);
    try {
      const blob = await upload(`songs/${Date.now()}-${file.name}`, file, { access: "public", handleUploadUrl: "/api/admin/songs/upload" });
      setNeu((n) => ({ ...n, [key]: blob.url }));
    } catch (e) {
      alert("Upload failed: " + (e as Error).message);
    }
    setBusyFlag(false);
  };

  const patch = async (slug: string, f: Draft) => {
    setRows((r) => r.map((x) => x.slug === slug ? { ...x, ...f } : x));
    await fetch(`/api/admin/songs/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
  };
  const togglePub = (r: SongRow) => patch(r.slug, { published: !r.published });
  const del = async (slug: string) => {
    if (!confirm(`Delete the song "${slug}"?`)) return;
    setRows((r) => r.filter((x) => x.slug !== slug));
    await fetch(`/api/admin/songs/${slug}`, { method: "DELETE" });
  };
  const startEdit = (r: SongRow) => { setEditing(r.slug); setDraft({ ...r }); };
  const saveEdit = async () => { if (!editing) return; await patch(editing, draft); setEditing(null); };
  const addNew = async () => {
    if (!neu.title || !neu.audio_url) { alert("Fill in at least a title and an audio link (mp3)."); return; }
    setBusy(true);
    const res = await fetch("/api/admin/songs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(neu) });
    setBusy(false);
    if (res.ok) location.reload();
    else alert("Could not save.");
  };

  const field = (label: string, key: keyof SongRow, d: Draft, set: (d: Draft) => void, ph = "", type = "text") => (
    <label style={{ display: "block", marginBottom: "8px" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>{label}</span>
      <input style={{ ...inputS, marginBottom: 0 }} type={type} value={(d[key] as string) ?? ""} placeholder={ph} onChange={(e) => set({ ...d, [key]: e.target.value })} />
    </label>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ background: "#fff", borderBottom: "2.5px solid var(--border)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🎵</span>
          <h1 style={{ ...display, fontSize: "20px", fontWeight: 900 }}>Songs</h1>
        </div>
        <Link href="/admin" style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>← Admin</Link>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
          Draft = only for you. Published = public on /songs and in the homepage preview. Audio = a public .mp3 URL.
        </p>

        <button onClick={() => setAdding((a) => !a)} style={{ ...btn("var(--text-primary)"), marginBottom: "14px" }}>{adding ? "Close" : "+ New song"}</button>

        {adding && (
          <div style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "12px", padding: "16px", marginBottom: "18px" }}>
            {field("Title", "title", neu, setNeu, "Midnight spaghetti")}
            {field("Audio link (.mp3)", "audio_url", neu, setNeu, "https://… .mp3 (or upload below)")}
            <label style={{ display: "block", marginBottom: "10px" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>↑ Or upload audio to Blob {upA && "· uploading…"}</span>
              <input type="file" accept="audio/*" disabled={upA} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadTo(f, "audio_url", setUpA); }} style={{ fontFamily: "var(--font-sans)", fontSize: "12px" }} />
            </label>
            {field("Image / cover (URL, optional)", "cover_url", neu, setNeu, "https://… .jpg (or upload below)")}
            <label style={{ display: "block", marginBottom: "10px" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>↑ Or upload cover to Blob {upC && "· uploading…"}</span>
              <input type="file" accept="image/*" disabled={upC} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadTo(f, "cover_url", setUpC); }} style={{ fontFamily: "var(--font-sans)", fontSize: "12px" }} />
            </label>
            {field("Release date", "released_at", neu, setNeu, "", "date")}
            {field("Note", "note_en", neu, setNeu, "What it's about…")}
            {field("Note (CS — optional, for later)", "note_cs", neu, setNeu, "")}
            <button onClick={addNew} disabled={busy} style={{ ...btn("#16A34A"), marginTop: "4px", opacity: busy ? 0.6 : 1 }}>{busy ? "Saving…" : "Save (as draft)"}</button>
          </div>
        )}

        {rows.length === 0 && <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-muted)" }}>No songs yet.</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {rows.map((r) => (
            <div key={r.slug} style={{ background: "#fff", border: `2px solid ${r.published ? "#16A34A" : "var(--border)"}`, borderRadius: "12px", boxShadow: `3px 3px 0 ${r.published ? "#16A34A" : "var(--border)"}`, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "140px" }}>
                  <p style={{ ...display, fontSize: "15px", fontWeight: 800 }}>{r.title}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)" }}>{r.slug} · {r.released_at ?? "—"}</p>
                </div>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, color: r.published ? "#16A34A" : "var(--text-muted)", padding: "2px 8px", borderRadius: "999px", background: r.published ? "#DCFCE7" : "rgba(0,0,0,0.05)" }}>{r.published ? "publ." : "draft"}</span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => startEdit(r)} style={{ ...btn("#fff", "var(--text-primary)"), border: "1.5px solid var(--border)" }}>✎</button>
                  <button onClick={() => togglePub(r)} style={btn(r.published ? "#d97706" : "#16A34A")}>{r.published ? "hide" : "publish"}</button>
                  <button onClick={() => del(r.slug)} style={btn("#FEF2F2", "#b91c1c")}>×</button>
                </div>
              </div>

              <audio src={r.audio_url} controls preload="none" style={{ width: "100%", height: "32px", marginTop: "10px" }} />

              {editing === r.slug && (
                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                  {field("Title", "title", draft, setDraft)}
                  {field("Audio link (.mp3)", "audio_url", draft, setDraft)}
                  {field("Cover (URL)", "cover_url", draft, setDraft)}
                  {field("Release date", "released_at", draft, setDraft, "", "date")}
                  {field("Note", "note_en", draft, setDraft)}
                  {field("Note (CS — optional, for later)", "note_cs", draft, setDraft)}
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    <button onClick={saveEdit} style={btn("#16A34A")}>Save</button>
                    <button onClick={() => setEditing(null)} style={btn("transparent", "var(--text-muted)")}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Zprávy od posluchačů (soukromé) */}
        <div style={{ marginTop: "32px", paddingTop: "20px", borderTop: "2px solid var(--border)" }}>
          <h2 style={{ ...display, fontSize: "18px", fontWeight: 900, marginBottom: "4px" }}>Listener messages</h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>Private — only you can see them. {messages.length} total.</p>
          {messages.length === 0 ? (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-muted)" }}>No messages yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {messages.map((m) => (
                <div key={m.id} style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "12px", padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", marginBottom: "6px" }}>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)" }}>
                      <strong style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{m.author?.trim() || "Anonymous"}</strong> · {m.song_title} · {fmtMsgDate(m.created_at)}
                    </p>
                    <button onClick={() => delMessage(m.id)} style={btn("#FEF2F2", "#b91c1c")}>×</button>
                  </div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
