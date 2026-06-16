"use client";

import { useState } from "react";
import Link from "next/link";
import type { ExperimentRow, Stage } from "@/lib/experimentsDb";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans = "var(--font-sans)";
const inputS: React.CSSProperties = { width: "100%", background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "8px", padding: "8px 10px", fontFamily: sans, fontSize: "13px", color: "var(--text-primary)", outline: "none", marginBottom: "8px" };
const btn = (bg: string, color = "#fff"): React.CSSProperties => ({ background: bg, color, border: "none", borderRadius: "8px", padding: "7px 12px", fontFamily: sans, fontSize: "12px", fontWeight: 600, cursor: "pointer" });

const COLUMNS: { stage: Stage; title: string; hint: string; accent: string }[] = [
  { stage: "idea", title: "💡 Ideas", hint: "Ideas for new projects", accent: "#A78BFA" },
  { stage: "draft", title: "🛠 Drafts", hint: "In progress — only for you (404 to everyone else)", accent: "#F59E0B" },
  { stage: "published", title: "🚀 Published", hint: "Active — public on the homepage", accent: "#16A34A" },
];

export function ExperimentsAdmin({ initial, embedded = false }: { initial: ExperimentRow[]; embedded?: boolean }) {
  const [rows, setRows] = useState<ExperimentRow[]>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<ExperimentRow>>({});
  const [dragged, setDragged] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Stage | null>(null);
  const [newIdea, setNewIdea] = useState("");

  const editingRow = rows.find((r) => r.slug === editing) ?? null;

  const persistOrder = (next: ExperimentRow[]) => {
    fetch("/api/admin/experiments/reorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: next.map((x) => x.slug) }) }).catch(() => {});
  };

  // přesun karty do sloupce (volitelně před konkrétní kartu) — optimistický update + persistence
  const applyDrop = (slug: string, stage: Stage, beforeSlug?: string) => {
    setRows((prev) => {
      const moved = prev.find((r) => r.slug === slug);
      if (!moved) return prev;
      const rest = prev.filter((r) => r.slug !== slug);
      const updated: ExperimentRow = { ...moved, stage, published: stage === "published" };
      let idx: number;
      if (beforeSlug) { idx = rest.findIndex((r) => r.slug === beforeSlug); if (idx < 0) idx = rest.length; }
      else { const last = rest.map((r, i) => ({ r, i })).filter((x) => x.r.stage === stage).pop(); idx = last ? last.i + 1 : rest.length; }
      const next = [...rest.slice(0, idx), updated, ...rest.slice(idx)];
      if (moved.stage !== stage) fetch(`/api/admin/experiments/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) }).catch(() => {});
      persistOrder(next);
      return next;
    });
  };

  const patch = async (slug: string, f: Partial<ExperimentRow>) => {
    setRows((r) => r.map((x) => x.slug === slug ? { ...x, ...f, ...(f.stage ? { published: f.stage === "published" } : {}) } : x));
    await fetch(`/api/admin/experiments/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
  };
  const saveEdit = async () => { if (!editing) return; await patch(editing, draft); setEditing(null); };
  const del = async (slug: string) => {
    if (!confirm(`Delete "${slug}" from the list?`)) return;
    setRows((r) => r.filter((x) => x.slug !== slug));
    setEditing(null);
    await fetch(`/api/admin/experiments/${slug}`, { method: "DELETE" });
  };

  const addIdea = async () => {
    const title = newIdea.trim();
    if (!title) return;
    setNewIdea("");
    const res = await fetch("/api/admin/experiments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: "idea", title_cs: title }) });
    if (!res.ok) return;
    const { slug } = await res.json();
    const max = Math.max(-1, ...rows.map((r) => r.sort_order));
    setRows((r) => [...r, { slug, title_cs: title, title_en: title, desc_cs: "", desc_en: "", color: "#EDE9FE", href: "", external: false, sort_order: max + 1, published: false, stage: "idea", published_at: null }]);
  };

  const board = (
    <>
      <p style={{ fontFamily: sans, fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px" }}>
        Drag a card between columns by status. Click a card for details and settings.
      </p>

      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", overflowX: "auto", paddingBottom: "8px" }}>
        {COLUMNS.map((col) => {
          const items = rows.filter((r) => r.stage === col.stage);
          const pub = col.stage === "published";
          return (
            <div
              key={col.stage}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.stage); }}
              onDragLeave={() => setOverCol((s) => (s === col.stage ? null : s))}
              onDrop={(e) => { e.preventDefault(); setOverCol(null); if (dragged) applyDrop(dragged, col.stage); setDragged(null); }}
              style={{
                flex: "1 1 0", minWidth: "240px",
                background: overCol === col.stage ? "rgba(124,92,214,0.06)" : "rgba(26,22,20,0.025)",
                border: `2px solid ${overCol === col.stage ? col.accent : "var(--border)"}`,
                borderRadius: "16px", padding: "12px", opacity: pub ? 0.82 : 1, transition: "background .15s, border-color .15s",
              }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "2px" }}>
                <p style={{ ...display, fontSize: "15px", fontWeight: 900 }}>{col.title}</p>
                <span style={{ fontFamily: sans, fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>{items.length}</span>
              </div>
              <p style={{ fontFamily: sans, fontSize: "10.5px", color: "var(--text-muted)", margin: "0 0 12px" }}>{col.hint}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: "40px" }}>
                {items.map((r) => (
                  <div
                    key={r.slug}
                    draggable
                    onDragStart={() => setDragged(r.slug)}
                    onDragEnd={() => { setDragged(null); setOverCol(null); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setOverCol(null); if (dragged && dragged !== r.slug) applyDrop(dragged, col.stage, r.slug); setDragged(null); }}
                    onClick={() => { setEditing(r.slug); setDraft({ ...r }); }}
                    style={{
                      background: "#fff", border: `2px solid ${dragged === r.slug ? col.accent : "var(--border)"}`,
                      borderRadius: "12px", boxShadow: "2px 2px 0 var(--border)", padding: "10px 12px",
                      cursor: "grab", opacity: dragged === r.slug ? 0.5 : 1,
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: 11, height: 11, borderRadius: 3, background: r.color, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />
                      <p style={{ ...display, fontSize: "14px", fontWeight: 800, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title_en || r.title_cs || r.slug}</p>
                    </div>
                    <p style={{ fontFamily: sans, fontSize: "10.5px", color: "var(--text-muted)", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.href ? r.href : <span style={{ fontStyle: "italic" }}>just an idea for now</span>}
                    </p>
                  </div>
                ))}
                {items.length === 0 && <p style={{ fontFamily: sans, fontSize: "11.5px", color: "var(--text-muted)", textAlign: "center", padding: "10px 0", fontStyle: "italic" }}>empty</p>}
              </div>

              {col.stage === "idea" && (
                <div style={{ marginTop: "10px", display: "flex", gap: "6px" }}>
                  <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addIdea(); }}
                    placeholder="+ new idea…" style={{ ...inputS, marginBottom: 0, flex: 1, fontSize: "12.5px" }} />
                  <button onClick={addIdea} style={{ ...btn(col.accent), flexShrink: 0 }}>Add</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div style={embedded ? undefined : { minHeight: "100dvh", background: "var(--bg)" }}>
      {!embedded && (
        <div style={{ background: "#fff", borderBottom: "2.5px solid var(--border)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>🍝</span>
            <h1 style={{ ...display, fontSize: "20px", fontWeight: 900 }}>Projects</h1>
          </div>
          <Link href="/admin" style={{ fontFamily: sans, fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>← Admin</Link>
        </div>
      )}

      <div style={{ margin: embedded ? "0" : "0 auto", maxWidth: embedded ? undefined : "980px", padding: embedded ? "8px 0 0" : "24px" }}>
        {board}
      </div>

      {/* detail + nastavení projektu */}
      {editingRow && (
        <div onClick={() => setEditing(null)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,12,24,0.45)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 18px", overflowY: "auto" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "6px 6px 0 var(--border)", padding: "20px 22px", width: "100%", maxWidth: "520px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "14px" }}>
              <p style={{ ...display, fontSize: "18px", fontWeight: 900 }}>{editingRow.title_en || editingRow.title_cs || editingRow.slug}</p>
              <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: sans, fontSize: "18px", color: "var(--text-muted)" }}>×</button>
            </div>

            {/* fáze */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              {COLUMNS.map((c) => {
                const on = (draft.stage ?? editingRow.stage) === c.stage;
                return (
                  <button key={c.stage} onClick={() => setDraft({ ...draft, stage: c.stage, published: c.stage === "published" })}
                    style={{ flex: 1, ...btn(on ? c.accent : "#fff", on ? "#fff" : "var(--text-primary)"), border: `2px solid ${on ? c.accent : "var(--border)"}`, fontWeight: 700 }}>
                    {c.title}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <input style={inputS} value={draft.title_en ?? ""} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} placeholder="Title" />
              <input style={inputS} value={draft.title_cs ?? ""} onChange={(e) => setDraft({ ...draft, title_cs: e.target.value })} placeholder="Title (CS — optional, for later)" />
            </div>
            <textarea style={{ ...inputS, minHeight: "52px", resize: "vertical" }} value={draft.desc_en ?? ""} onChange={(e) => setDraft({ ...draft, desc_en: e.target.value })} placeholder="Description / notes about the idea" />
            <textarea style={{ ...inputS, minHeight: "52px", resize: "vertical" }} value={draft.desc_cs ?? ""} onChange={(e) => setDraft({ ...draft, desc_cs: e.target.value })} placeholder="Description (CS — optional, for later)" />
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input style={{ ...inputS, width: "110px", marginBottom: 0 }} value={draft.color ?? ""} onChange={(e) => setDraft({ ...draft, color: e.target.value })} placeholder="#color" />
              <input style={{ ...inputS, flex: 1, marginBottom: 0 }} value={draft.href ?? ""} onChange={(e) => setDraft({ ...draft, href: e.target.value })} placeholder="/href (required to publish)" />
              <label style={{ fontFamily: sans, fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                <input type="checkbox" checked={!!draft.external} onChange={(e) => setDraft({ ...draft, external: e.target.checked })} /> ext
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" }}>
              <span style={{ fontFamily: sans, fontSize: "12px", color: "var(--text-muted)" }}>Publish date:</span>
              <input type="date" style={{ ...inputS, width: "170px", marginBottom: 0 }} value={(draft.published_at ?? "").slice(0, 10)} onChange={(e) => setDraft({ ...draft, published_at: e.target.value })} />
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={saveEdit} style={btn("var(--text-primary)")}>Save</button>
              {editingRow.href && <a href={editingRow.href} target="_blank" rel="noopener noreferrer" style={{ ...btn("#fff", "var(--text-primary)"), border: "1.5px solid var(--border)", textDecoration: "none" }}>preview ↗</a>}
              <button onClick={() => del(editingRow.slug)} style={{ ...btn("#FEF2F2", "#b91c1c"), marginLeft: "auto" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
