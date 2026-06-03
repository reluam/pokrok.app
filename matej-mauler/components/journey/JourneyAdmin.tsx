"use client";

import { useEffect, useState } from "react";
import type { Area, AreaIntro, Chapter, Section, SectionType } from "@/lib/journey/areas";

// ── helpers ────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function insertAt(text: string, start: number, end: number, wrap: [string, string]): string {
  const sel = text.slice(start, end) || "text";
  return text.slice(0, start) + wrap[0] + sel + wrap[1] + text.slice(end);
}

// ── Formatting toolbar ──────────────────────────────────────────────────────

function FormatBar({ targetId }: { targetId: string }) {
  const applyBold = () => {
    const el = document.getElementById(targetId) as HTMLTextAreaElement | null;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    el.value = insertAt(value, s, e, ["**", "**"]);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
    el.setSelectionRange(s + 2, s + 2 + (e - s || 4));
  };

  const applyLink = () => {
    const el = document.getElementById(targetId) as HTMLTextAreaElement | null;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const url = prompt("URL:");
    if (!url) return;
    const label = value.slice(s, e) || "odkaz";
    el.value = value.slice(0, s) + `[${label}](${url})` + value.slice(e);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
  };

  const btn: React.CSSProperties = {
    padding: "2px 8px", fontSize: 12, cursor: "pointer",
    background: "#f0f0f0", border: "1px solid #ccc", borderRadius: 3,
  };

  return (
    <span style={{ display: "inline-flex", gap: 4, marginBottom: 4 }}>
      <button type="button" style={btn} onMouseDown={(e) => { e.preventDefault(); applyBold(); }}><strong>B</strong></button>
      <button type="button" style={btn} onMouseDown={(e) => { e.preventDefault(); applyLink(); }}>link</button>
      <span style={{ fontSize: 11, color: "#999", alignSelf: "center" }}>**tučně** [text](url)</span>
    </span>
  );
}

// ── Section editor ──────────────────────────────────────────────────────────

function SectionEditor({
  sec, idx, total,
  onChange, onDelete, onMove,
}: {
  sec: Section; idx: number; total: number;
  onChange: (s: Section) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const csId = `ta-cs-${sec.id}`;
  const enId = `ta-en-${sec.id}`;

  const box: React.CSSProperties = {
    border: "1px solid #ddd", borderRadius: 6, padding: 12,
    background: sec.type === "quote" ? "#fffef0" : "#fff",
  };
  const label: React.CSSProperties = { fontSize: 12, color: "#666", display: "block", marginBottom: 4 };
  const ta: React.CSSProperties = {
    width: "100%", minHeight: 64, padding: "6px 8px", fontSize: 13,
    fontFamily: "inherit", resize: "vertical", border: "1px solid #ccc",
    borderRadius: 4, lineHeight: 1.5, boxSizing: "border-box",
  };

  return (
    <div style={box}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <select
          value={sec.type}
          onChange={e => onChange({ ...sec, type: e.target.value as SectionType })}
          style={{ fontSize: 12, padding: "2px 6px", borderRadius: 4 }}
        >
          <option value="text">Text</option>
          <option value="quote">Quote</option>
        </select>
        <span style={{ flex: 1 }} />
        <button type="button" disabled={idx === 0}        onClick={() => onMove(-1)} style={{ fontSize: 14, cursor: "pointer", background: "none", border: "none" }}>↑</button>
        <button type="button" disabled={idx === total - 1} onClick={() => onMove(1)}  style={{ fontSize: 14, cursor: "pointer", background: "none", border: "none" }}>↓</button>
        <button type="button" onClick={onDelete}
          style={{ fontSize: 12, color: "#c00", cursor: "pointer", background: "none", border: "none" }}>✕ Smazat</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={label}>CZ</label>
          <FormatBar targetId={csId} />
          <textarea id={csId} style={ta} value={sec.cs}
            onChange={e => onChange({ ...sec, cs: e.target.value })} />
        </div>
        <div>
          <label style={label}>EN</label>
          <FormatBar targetId={enId} />
          <textarea id={enId} style={ta} value={sec.en}
            onChange={e => onChange({ ...sec, en: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

// ── Chapter editor ──────────────────────────────────────────────────────────

function ChapterEditor({ chapter, onChange }: { chapter: Chapter; onChange: (c: Chapter) => void }) {
  const inp: React.CSSProperties = {
    width: "100%", padding: "6px 10px", fontSize: 14,
    border: "1px solid #ccc", borderRadius: 4, boxSizing: "border-box",
  };
  const label: React.CSSProperties = { fontSize: 12, color: "#666", display: "block", marginBottom: 4, marginTop: 10 };

  const updateSection = (i: number, sec: Section) => {
    const sections = [...chapter.sections];
    sections[i] = sec;
    onChange({ ...chapter, sections });
  };

  const deleteSection = (i: number) => {
    const sections = chapter.sections.filter((_, idx) => idx !== i);
    onChange({ ...chapter, sections });
  };

  const moveSection = (i: number, dir: -1 | 1) => {
    const sections = [...chapter.sections];
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    [sections[i], sections[j]] = [sections[j], sections[i]];
    onChange({ ...chapter, sections });
  };

  const addSection = () => {
    onChange({
      ...chapter,
      sections: [...chapter.sections, { id: uid(), type: "text", cs: "", en: "" }],
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={label}>CZ Subtitle</label>
          <input style={inp} value={chapter.cs.subtitle}
            onChange={e => onChange({ ...chapter, cs: { ...chapter.cs, subtitle: e.target.value } })} />
          <label style={label}>CZ Title</label>
          <input style={inp} value={chapter.cs.title}
            onChange={e => onChange({ ...chapter, cs: { ...chapter.cs, title: e.target.value } })} />
        </div>
        <div>
          <label style={label}>EN Subtitle</label>
          <input style={inp} value={chapter.en.subtitle}
            onChange={e => onChange({ ...chapter, en: { ...chapter.en, subtitle: e.target.value } })} />
          <label style={label}>EN Title</label>
          <input style={inp} value={chapter.en.title}
            onChange={e => onChange({ ...chapter, en: { ...chapter.en, title: e.target.value } })} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {chapter.sections.map((sec, i) => (
          <SectionEditor
            key={sec.id} sec={sec} idx={i} total={chapter.sections.length}
            onChange={s => updateSection(i, s)}
            onDelete={() => deleteSection(i)}
            onMove={dir => moveSection(i, dir)}
          />
        ))}
        <button type="button" onClick={addSection} style={{
          padding: "8px 16px", fontSize: 13, cursor: "pointer",
          background: "#f5f5f5", border: "1px dashed #bbb", borderRadius: 6,
        }}>
          + Přidat sekci
        </button>
      </div>
    </div>
  );
}

// ── Area editor ─────────────────────────────────────────────────────────────

function AreaEditor({
  area, onChange, onMoveUp, onMoveDown, isFirst, isLast,
}: {
  area: Area;
  onChange: (a: Area) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [activeChapterIdx, setActiveChapterIdx] = useState<number | null>(
    area.chapters.length > 0 ? 0 : null
  );

  const inp: React.CSSProperties = {
    padding: "6px 10px", fontSize: 14,
    border: "1px solid #ccc", borderRadius: 4, boxSizing: "border-box",
  };
  const label: React.CSSProperties = { fontSize: 12, color: "#666", display: "block", marginBottom: 4 };

  const updateChapter = (i: number, ch: Chapter) => {
    const chapters = [...area.chapters];
    chapters[i] = ch;
    onChange({ ...area, chapters });
  };

  const addChapter = () => {
    const newId = area.chapters.length > 0 ? Math.max(...area.chapters.map(c => c.id)) + 1 : 1;
    const newCh: Chapter = {
      id: newId, slug: `chapter-${newId}`, order: area.chapters.length,
      en: { subtitle: "New Chapter", title: "New question?" },
      cs: { subtitle: "Nová kapitola", title: "Nová otázka?" },
      sections: [{ id: uid(), type: "text", en: "", cs: "" }],
    };
    const chapters = [...area.chapters, newCh];
    onChange({ ...area, chapters });
    setActiveChapterIdx(chapters.length - 1);
  };

  const deleteChapter = (i: number) => {
    if (!confirm(`Smazat kapitolu "${area.chapters[i].cs.subtitle}"?`)) return;
    const chapters = area.chapters.filter((_, idx) => idx !== i);
    onChange({ ...area, chapters });
    setActiveChapterIdx(chapters.length > 0 ? Math.min(i, chapters.length - 1) : null);
  };

  const moveChapter = (i: number, dir: -1 | 1) => {
    const chapters = [...area.chapters];
    const j = i + dir;
    if (j < 0 || j >= chapters.length) return;
    [chapters[i], chapters[j]] = [chapters[j], chapters[i]];
    onChange({ ...area, chapters });
    setActiveChapterIdx(j);
  };

  const blankIntro = (): AreaIntro => ({ eyebrow: "", title: "", tagline: "" });
  const updateIntro = (l: "cs" | "en", field: keyof AreaIntro, val: string) => {
    const base = area.intro ?? { en: blankIntro(), cs: blankIntro() };
    onChange({ ...area, intro: { ...base, [l]: { ...base[l], [field]: val } } });
  };

  return (
    <div style={{ display: "flex", gap: 0, height: "100%" }}>
      {/* Chapter list sidebar */}
      <div style={{
        width: 200, flexShrink: 0, borderRight: "1px solid #e5e5e5",
        padding: "16px 0", display: "flex", flexDirection: "column",
      }}>
        {/* Area name */}
        <div style={{ padding: "0 12px 12px", borderBottom: "1px solid #f0f0f0", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <label style={{ ...label, margin: 0, flex: 1 }}>Oblast</label>
            <button disabled={isFirst}  onClick={onMoveUp}   style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: isFirst ? 0.3 : 1 }}>↑</button>
            <button disabled={isLast}   onClick={onMoveDown} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: isLast ? 0.3 : 1 }}>↓</button>
          </div>
          <input style={{ ...inp, width: "100%", marginBottom: 4 }} value={area.cs.name}
            onChange={e => onChange({ ...area, cs: { name: e.target.value } })} placeholder="CZ název" />
          <input style={{ ...inp, width: "100%" }} value={area.en.name}
            onChange={e => onChange({ ...area, en: { name: e.target.value } })} placeholder="EN name" />
        </div>

        <button onClick={() => setActiveChapterIdx(-1)} style={{
          display: "block", width: "100%", textAlign: "left",
          padding: "8px 9px", marginBottom: 8, fontSize: 12, cursor: "pointer",
          background: activeChapterIdx === -1 ? "#f0f4ff" : "none",
          border: "none", borderLeft: activeChapterIdx === -1 ? "3px solid #4f46e5" : "3px solid transparent",
          color: activeChapterIdx === -1 ? "#4f46e5" : "#333",
        }}>
          ✦ Úvod oblasti
        </button>

        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", padding: "0 12px 6px", margin: 0 }}>
          Kapitoly
        </p>
        {area.chapters.map((ch, i) => (
          <div key={ch.id} style={{
            display: "flex", alignItems: "center",
            background: activeChapterIdx === i ? "#f0f4ff" : "none",
            borderLeft: activeChapterIdx === i ? "3px solid #4f46e5" : "3px solid transparent",
          }}>
            <button onClick={() => setActiveChapterIdx(i)} style={{
              flex: 1, textAlign: "left", padding: "8px 8px 8px 9px",
              background: "none", border: "none", cursor: "pointer", fontSize: 12,
              color: activeChapterIdx === i ? "#4f46e5" : "#333",
            }}>
              <strong>{i + 1}.</strong> {ch.cs.subtitle}
            </button>
            <button onClick={() => moveChapter(i, -1)} disabled={i === 0}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, opacity: i === 0 ? 0.3 : 0.6, padding: "0 4px" }}>↑</button>
            <button onClick={() => moveChapter(i, 1)} disabled={i === area.chapters.length - 1}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, opacity: i === area.chapters.length - 1 ? 0.3 : 0.6, padding: "0 4px" }}>↓</button>
            <button onClick={() => deleteChapter(i)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 13, padding: "0 8px" }}>✕</button>
          </div>
        ))}
        <button onClick={addChapter} style={{
          display: "block", width: "calc(100% - 24px)", margin: "8px 12px 0",
          padding: "6px", fontSize: 12, cursor: "pointer",
          background: "none", border: "1px dashed #bbb", borderRadius: 5, color: "#666",
        }}>
          + Nová kapitola
        </button>
      </div>

      {/* Content editor */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        {activeChapterIdx === -1 ? (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>Úvod oblasti</h3>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 20px" }}>
              Úvodní obrazovka, která se zobrazí při otevření oblasti (před scrollováním do obsahu).
            </p>
            {(["cs", "en"] as const).map((l) => {
              const v = area.intro?.[l] ?? { eyebrow: "", title: "", tagline: "" };
              const inp2: React.CSSProperties = { width: "100%", padding: "6px 10px", fontSize: 14, border: "1px solid #ccc", borderRadius: 4, boxSizing: "border-box", marginBottom: 8 };
              return (
                <div key={l} style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, color: "#666", margin: "0 0 6px", fontWeight: 600 }}>{l === "cs" ? "🇨🇿 Čeština" : "🇬🇧 English"}</p>
                  <input style={inp2} value={v.eyebrow} placeholder={l === "cs" ? "Nadtitulek (např. Životní cesta)" : "Eyebrow (e.g. Life's path)"}
                    onChange={e => updateIntro(l, "eyebrow", e.target.value)} />
                  <input style={inp2} value={v.title} placeholder={l === "cs" ? "Velký nadpis (např. Cesta)" : "Big title (e.g. Journey)"}
                    onChange={e => updateIntro(l, "title", e.target.value)} />
                  <textarea style={{ ...inp2, minHeight: 60, fontFamily: "inherit", resize: "vertical" }} value={v.tagline}
                    placeholder={l === "cs" ? "Podtitulek / věta" : "Tagline / sentence"}
                    onChange={e => updateIntro(l, "tagline", e.target.value)} />
                </div>
              );
            })}
          </>
        ) : activeChapterIdx === null || area.chapters[activeChapterIdx] === undefined ? (
          <div style={{ color: "#888", paddingTop: 40, textAlign: "center" }}>
            ← Vyber kapitolu nebo úvod
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>
              Kapitola {area.chapters[activeChapterIdx].id}: {area.chapters[activeChapterIdx].cs.subtitle}
            </h3>
            <ChapterEditor
              chapter={area.chapters[activeChapterIdx]}
              onChange={ch => updateChapter(activeChapterIdx, ch)}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ── Main admin page ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [activeAreaIdx, setActiveAreaIdx] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/journey/areas")
      .then(r => r.json())
      .then(d => {
        setAreas(d.areas ?? []);
        setLoading(false);
        if ((d.areas ?? []).length > 0) setActiveAreaIdx(0);
      });
  }, []);

  const save = async () => {
    setStatus("saving");
    try {
      await fetch("/api/journey/areas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areas }),
      });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  };

  const updateArea = (i: number, area: Area) => {
    const next = [...areas];
    next[i] = area;
    setAreas(next);
  };

  const addArea = () => {
    const newArea: Area = {
      id: uid(),
      slug: `area-${uid()}`,
      order: areas.length,
      en: { name: "New Area" },
      cs: { name: "Nová oblast" },
      chapters: [],
    };
    const next = [...areas, newArea];
    setAreas(next);
    setActiveAreaIdx(next.length - 1);
  };

  const deleteArea = (i: number) => {
    if (!confirm(`Smazat oblast "${areas[i].cs.name}"?`)) return;
    const next = areas.filter((_, idx) => idx !== i);
    setAreas(next);
    setActiveAreaIdx(next.length > 0 ? Math.min(i, next.length - 1) : null);
  };

  const moveArea = (i: number, dir: -1 | 1) => {
    const next = [...areas];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    // update order values
    next.forEach((a, idx) => { a.order = idx; });
    setAreas(next);
    setActiveAreaIdx(j);
  };

  const page: React.CSSProperties = {
    minHeight: "100vh", background: "#f9f9f9",
    fontFamily: "system-ui, sans-serif", color: "#111",
  };
  const headerStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 16, padding: "16px 32px",
    background: "#fff", borderBottom: "1px solid #e5e5e5",
    position: "sticky", top: 0, zIndex: 10,
  };
  const sidebar: React.CSSProperties = {
    width: 220, flexShrink: 0, padding: "24px 0",
    background: "#fff", borderRight: "1px solid #e5e5e5",
    minHeight: "calc(100vh - 57px)",
  };
  const content: React.CSSProperties = {
    flex: 1, overflow: "hidden",
  };

  const saveLabel = status === "saving" ? "Ukládám…"
                  : status === "saved"  ? "Uloženo"
                  : status === "error"  ? "Chyba"
                  : "Uložit";

  if (loading) return (
    <div style={{ ...page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      Načítám…
    </div>
  );

  return (
    <div style={page}>
      <div style={headerStyle}>
        <a href="/journey" style={{ fontSize: 13, color: "#666", textDecoration: "none" }}>← Journey</a>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, flex: 1 }}>Admin</h1>
        <button onClick={save} style={{
          padding: "8px 20px", fontSize: 14, fontWeight: 600,
          background: status === "saved" ? "#22c55e" : "#111",
          color: "#fff", border: "none", borderRadius: 6, cursor: "pointer",
          transition: "background 300ms",
        }}>
          {saveLabel}
        </button>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 57px)" }}>
        {/* Area list sidebar */}
        <nav style={sidebar}>
          <div style={{ padding: "0 20px 8px" }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", margin: 0 }}>
              Oblasti
            </p>
          </div>
          {areas.map((area, i) => (
            <div key={area.id} style={{
              display: "flex", alignItems: "center",
              background: activeAreaIdx === i ? "#f0f4ff" : "none",
              borderLeft: activeAreaIdx === i ? "3px solid #4f46e5" : "3px solid transparent",
            }}>
              <button onClick={() => setActiveAreaIdx(i)} style={{
                flex: 1, textAlign: "left", padding: "10px 8px 10px 17px",
                background: "none", border: "none", cursor: "pointer", fontSize: 13,
                color: activeAreaIdx === i ? "#4f46e5" : "#333",
              }}>
                <strong>{i + 1}.</strong> {area.cs.name}
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{area.chapters.length} kapitol</div>
              </button>
              <button onClick={() => moveArea(i, -1)} disabled={i === 0}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: i === 0 ? 0.3 : 0.6, padding: "0 4px" }}>↑</button>
              <button onClick={() => moveArea(i, 1)} disabled={i === areas.length - 1}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: i === areas.length - 1 ? 0.3 : 0.6, padding: "0 4px" }}>↓</button>
              <button onClick={() => deleteArea(i)}
                style={{ padding: "0 12px", background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 14 }}>
                ✕
              </button>
            </div>
          ))}
          <button onClick={addArea} style={{
            display: "block", width: "calc(100% - 40px)", margin: "12px 20px 0",
            padding: "8px", fontSize: 12, cursor: "pointer",
            background: "none", border: "1px dashed #bbb", borderRadius: 5, color: "#666",
          }}>
            + Nová oblast
          </button>
        </nav>

        {/* Area editor */}
        <main style={content}>
          {activeAreaIdx === null || areas[activeAreaIdx] === undefined ? (
            <div style={{ color: "#888", paddingTop: 60, textAlign: "center" }}>
              ← Vyber oblast pro úpravy
            </div>
          ) : (
            <AreaEditor
              key={areas[activeAreaIdx].id}
              area={areas[activeAreaIdx]}
              onChange={a => updateArea(activeAreaIdx, a)}
              onMoveUp={() => moveArea(activeAreaIdx, -1)}
              onMoveDown={() => moveArea(activeAreaIdx, 1)}
              isFirst={activeAreaIdx === 0}
              isLast={activeAreaIdx === areas.length - 1}
            />
          )}
        </main>
      </div>
    </div>
  );
}
