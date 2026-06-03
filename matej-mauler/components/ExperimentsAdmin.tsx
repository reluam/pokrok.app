"use client";

import { useState } from "react";
import Link from "next/link";
import type { ExperimentRow } from "@/lib/experimentsDb";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const inputS: React.CSSProperties = { width: "100%", background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "8px", padding: "8px 10px", fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-primary)", outline: "none", marginBottom: "8px" };
const btn = (bg: string, color = "#fff"): React.CSSProperties => ({ background: bg, color, border: "none", borderRadius: "8px", padding: "7px 12px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, cursor: "pointer" });

export function ExperimentsAdmin({ initial }: { initial: ExperimentRow[] }) {
  const [rows, setRows] = useState<ExperimentRow[]>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<ExperimentRow>>({});
  const [newExp, setNewExp] = useState<Partial<ExperimentRow>>({ color: "#EDE9FE" });

  const patch = async (slug: string, f: Partial<ExperimentRow>) => {
    setRows((r) => r.map((x) => x.slug === slug ? { ...x, ...f } : x));
    await fetch(`/api/admin/experiments/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
  };
  const togglePub = (r: ExperimentRow) => patch(r.slug, { published: !r.published });
  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= rows.length) return;
    const next = [...rows]; [next[i], next[j]] = [next[j], next[i]]; setRows(next);
    await fetch("/api/admin/experiments/reorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: next.map((x) => x.slug) }) });
  };
  const del = async (slug: string) => {
    if (!confirm(`Smazat experiment "${slug}" ze seznamu? (route v kódu zůstane)`)) return;
    setRows((r) => r.filter((x) => x.slug !== slug));
    await fetch(`/api/admin/experiments/${slug}`, { method: "DELETE" });
  };
  const startEdit = (r: ExperimentRow) => { setEditing(r.slug); setDraft({ ...r }); };
  const saveEdit = async () => { if (!editing) return; await patch(editing, draft); setEditing(null); };
  const addNew = async () => {
    const res = await fetch("/api/admin/experiments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newExp) });
    if (res.ok) location.reload();
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ background: "#fff", borderBottom: "2.5px solid var(--border)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🍝</span>
          <h1 style={{ ...display, fontSize: "20px", fontWeight: 900 }}>Experimenty</h1>
        </div>
        <Link href="/admin" style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>← Admin</Link>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
          Draft = jen pro tebe (route vrací 404 ostatním). Publikováno = veřejně na hlavní stránce.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {rows.map((r, i) => (
            <div key={r.slug} style={{ background: "#fff", border: `2px solid ${r.published ? "#16A34A" : "var(--border)"}`, borderRadius: "12px", boxShadow: `3px 3px 0 ${r.published ? "#16A34A" : "var(--border)"}`, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: r.color, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: "140px" }}>
                  <p style={{ ...display, fontSize: "15px", fontWeight: 800 }}>{r.title_cs}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)" }}>{r.slug} · {r.href}</p>
                </div>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, color: r.published ? "#16A34A" : "var(--text-muted)", padding: "2px 8px", borderRadius: "999px", background: r.published ? "#DCFCE7" : "rgba(0,0,0,0.05)" }}>{r.published ? "publ." : "draft"}</span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => move(i, -1)} style={btn("transparent", "var(--text-muted)")}>↑</button>
                  <button onClick={() => move(i, 1)} style={btn("transparent", "var(--text-muted)")}>↓</button>
                  <a href={r.href} target="_blank" rel="noopener noreferrer" style={{ ...btn("#fff", "var(--text-primary)"), border: "1.5px solid var(--border)", textDecoration: "none" }}>náhled</a>
                  <button onClick={() => startEdit(r)} style={{ ...btn("#fff", "var(--text-primary)"), border: "1.5px solid var(--border)" }}>✎</button>
                  <button onClick={() => togglePub(r)} style={btn(r.published ? "#d97706" : "#16A34A")}>{r.published ? "skrýt" : "publikovat"}</button>
                  <button onClick={() => del(r.slug)} style={btn("#FEF2F2", "#b91c1c")}>×</button>
                </div>
              </div>

              {editing === r.slug && (
                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <input style={inputS} value={draft.title_cs ?? ""} onChange={(e) => setDraft({ ...draft, title_cs: e.target.value })} placeholder="Název CS" />
                    <input style={inputS} value={draft.title_en ?? ""} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} placeholder="Title EN" />
                  </div>
                  <textarea style={{ ...inputS, minHeight: "44px" }} value={draft.desc_cs ?? ""} onChange={(e) => setDraft({ ...draft, desc_cs: e.target.value })} placeholder="Popis CS" />
                  <textarea style={{ ...inputS, minHeight: "44px" }} value={draft.desc_en ?? ""} onChange={(e) => setDraft({ ...draft, desc_en: e.target.value })} placeholder="Description EN" />
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input style={{ ...inputS, width: "120px", marginBottom: 0 }} value={draft.color ?? ""} onChange={(e) => setDraft({ ...draft, color: e.target.value })} placeholder="#barva" />
                    <input style={{ ...inputS, flex: 1, marginBottom: 0 }} value={draft.href ?? ""} onChange={(e) => setDraft({ ...draft, href: e.target.value })} placeholder="/href" />
                    <label style={{ fontFamily: "var(--font-sans)", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <input type="checkbox" checked={!!draft.external} onChange={(e) => setDraft({ ...draft, external: e.target.checked })} /> ext
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)" }}>Datum publikace:</span>
                    <input type="date" style={{ ...inputS, width: "170px", marginBottom: 0 }} value={(draft.published_at ?? "").slice(0, 10)} onChange={(e) => setDraft({ ...draft, published_at: e.target.value })} />
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button onClick={saveEdit} style={btn("var(--text-primary)")}>Uložit</button>
                    <button onClick={() => setEditing(null)} style={btn("transparent", "var(--text-muted)")}>Zrušit</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* nový draft */}
        <div style={{ marginTop: "16px" }}>
          {!adding ? (
            <button onClick={() => setAdding(true)} style={{ ...btn("#fff", "var(--text-primary)"), border: "2px dashed var(--border)", padding: "12px 18px", width: "100%" }}>+ Nový draft (registrace existující route)</button>
          ) : (
            <div style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "12px", padding: "14px" }}>
              <p style={{ ...display, fontSize: "15px", fontWeight: 800, marginBottom: "10px" }}>Nový draft</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <input style={inputS} onChange={(e) => setNewExp({ ...newExp, slug: e.target.value })} placeholder="slug (např. radio)" />
                <input style={inputS} onChange={(e) => setNewExp({ ...newExp, href: e.target.value })} placeholder="/href" />
                <input style={inputS} onChange={(e) => setNewExp({ ...newExp, title_cs: e.target.value })} placeholder="Název CS" />
                <input style={inputS} onChange={(e) => setNewExp({ ...newExp, title_en: e.target.value })} placeholder="Title EN" />
                <input style={inputS} onChange={(e) => setNewExp({ ...newExp, desc_cs: e.target.value })} placeholder="Popis CS" />
                <input style={inputS} onChange={(e) => setNewExp({ ...newExp, desc_en: e.target.value })} placeholder="Description EN" />
                <input style={inputS} defaultValue="#EDE9FE" onChange={(e) => setNewExp({ ...newExp, color: e.target.value })} placeholder="#barva" />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={addNew} style={btn("#16A34A")}>Vytvořit draft</button>
                <button onClick={() => setAdding(false)} style={btn("transparent", "var(--text-muted)")}>Zrušit</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
