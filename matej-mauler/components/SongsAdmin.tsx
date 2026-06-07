"use client";

import { useState } from "react";
import Link from "next/link";
import type { SongRow } from "@/lib/songsDb";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const inputS: React.CSSProperties = { width: "100%", background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "8px", padding: "8px 10px", fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-primary)", outline: "none", marginBottom: "8px" };
const btn = (bg: string, color = "#fff"): React.CSSProperties => ({ background: bg, color, border: "none", borderRadius: "8px", padding: "7px 12px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, cursor: "pointer" });

type Draft = Partial<SongRow>;
export type AdminMessage = { id: number; author: string; content: string; created_at: string; song_slug: string; song_title: string };

function fmtMsgDate(iso: string) {
  return new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function SongsAdmin({ initial, initialMessages = [] }: { initial: SongRow[]; initialMessages?: AdminMessage[] }) {
  const [rows, setRows] = useState<SongRow[]>(initial);
  const [messages, setMessages] = useState<AdminMessage[]>(initialMessages);
  const delMessage = async (id: number) => {
    if (!confirm("Smazat zprávu?")) return;
    setMessages((m) => m.filter((x) => x.id !== id));
    await fetch(`/api/admin/songs/messages/${id}`, { method: "DELETE" });
  };
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [adding, setAdding] = useState(false);
  const [neu, setNeu] = useState<Draft>({});
  const [busy, setBusy] = useState(false);

  const patch = async (slug: string, f: Draft) => {
    setRows((r) => r.map((x) => x.slug === slug ? { ...x, ...f } : x));
    await fetch(`/api/admin/songs/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
  };
  const togglePub = (r: SongRow) => patch(r.slug, { published: !r.published });
  const del = async (slug: string) => {
    if (!confirm(`Smazat song "${slug}"?`)) return;
    setRows((r) => r.filter((x) => x.slug !== slug));
    await fetch(`/api/admin/songs/${slug}`, { method: "DELETE" });
  };
  const startEdit = (r: SongRow) => { setEditing(r.slug); setDraft({ ...r }); };
  const saveEdit = async () => { if (!editing) return; await patch(editing, draft); setEditing(null); };
  const addNew = async () => {
    if (!neu.title || !neu.audio_url) { alert("Vyplň aspoň název a odkaz na audio (mp3)."); return; }
    setBusy(true);
    const res = await fetch("/api/admin/songs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(neu) });
    setBusy(false);
    if (res.ok) location.reload();
    else alert("Nepodařilo se uložit.");
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
          Draft = jen pro tebe. Publikováno = veřejně na /songs i v náhledu na homepage. Audio = veřejná adresa .mp3.
        </p>

        <button onClick={() => setAdding((a) => !a)} style={{ ...btn("var(--text-primary)"), marginBottom: "14px" }}>{adding ? "Zavřít" : "+ Nový song"}</button>

        {adding && (
          <div style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "12px", padding: "16px", marginBottom: "18px" }}>
            {field("Název", "title", neu, setNeu, "Půlnoční špagety")}
            {field("Odkaz na audio (.mp3)", "audio_url", neu, setNeu, "https://… .mp3")}
            {field("Obrázek / cover (URL, nepovinné)", "cover_url", neu, setNeu, "https://… .jpg")}
            {field("Datum vydání", "released_at", neu, setNeu, "", "date")}
            {field("Poznámka CS", "note_cs", neu, setNeu, "O čem to je…")}
            {field("Note EN", "note_en", neu, setNeu, "What it's about…")}
            <button onClick={addNew} disabled={busy} style={{ ...btn("#16A34A"), marginTop: "4px", opacity: busy ? 0.6 : 1 }}>{busy ? "Ukládám…" : "Uložit (jako draft)"}</button>
          </div>
        )}

        {rows.length === 0 && <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-muted)" }}>Zatím žádné songy.</p>}

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
                  <button onClick={() => togglePub(r)} style={btn(r.published ? "#d97706" : "#16A34A")}>{r.published ? "skrýt" : "publikovat"}</button>
                  <button onClick={() => del(r.slug)} style={btn("#FEF2F2", "#b91c1c")}>×</button>
                </div>
              </div>

              <audio src={r.audio_url} controls preload="none" style={{ width: "100%", height: "32px", marginTop: "10px" }} />

              {editing === r.slug && (
                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                  {field("Název", "title", draft, setDraft)}
                  {field("Odkaz na audio (.mp3)", "audio_url", draft, setDraft)}
                  {field("Cover (URL)", "cover_url", draft, setDraft)}
                  {field("Datum vydání", "released_at", draft, setDraft, "", "date")}
                  {field("Poznámka CS", "note_cs", draft, setDraft)}
                  {field("Note EN", "note_en", draft, setDraft)}
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    <button onClick={saveEdit} style={btn("#16A34A")}>Uložit</button>
                    <button onClick={() => setEditing(null)} style={btn("transparent", "var(--text-muted)")}>Zrušit</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Zprávy od posluchačů (soukromé) */}
        <div style={{ marginTop: "32px", paddingTop: "20px", borderTop: "2px solid var(--border)" }}>
          <h2 style={{ ...display, fontSize: "18px", fontWeight: 900, marginBottom: "4px" }}>Zprávy od posluchačů</h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>Soukromé — vidíš je jen ty. {messages.length} celkem.</p>
          {messages.length === 0 ? (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-muted)" }}>Zatím žádné zprávy.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {messages.map((m) => (
                <div key={m.id} style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "12px", padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", marginBottom: "6px" }}>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)" }}>
                      <strong style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{m.author?.trim() || "Anonym"}</strong> · {m.song_title} · {fmtMsgDate(m.created_at)}
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
