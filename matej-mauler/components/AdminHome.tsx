"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dictionaries, type Lang } from "@/lib/dictionaries";
import { TEXT_GROUPS } from "@/lib/siteTextsShared";
import { ExperimentsAdmin } from "./ExperimentsAdmin";
import type { DashboardData } from "@/app/admin/page";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans = "var(--font-sans)";

type Tab = "overview" | "projects" | "about";

const PROJECT_LABEL: Record<string, string> = {
  encyklopedie: "🍝 Encyclopedia", sound: "🔊 Sound wave", music: "🎶 Music", radio: "📻 Radio", brain: "⚡ Synapse",
};

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: 14, boxShadow: "3px 3px 0 var(--border)", padding: "16px 20px", ...style }}>{children}</div>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p style={{ ...display, fontSize: 24, fontWeight: 900, lineHeight: 1.1 }}>{typeof value === "number" ? value.toLocaleString("en-US") : value}</p>
      <p style={{ fontFamily: sans, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>{label}</p>
    </div>
  );
}

/** Spaghetti HQ — dashboard: přehled metrik projektů, správa projektů a textů hlavní stránky. */
export function AdminHome({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  const logout = async () => { await fetch("/api/admin/auth", { method: "DELETE" }); router.push("/admin/login"); };

  const mBySlug = Object.fromEntries(data.metrics.map((m) => [m.slug, m]));
  const projectSlugs = ["encyklopedie", "sound", "music", "radio", "brain"];

  /* ── About editor ── */
  const [texts, setTexts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const g of TEXT_GROUPS) for (const key of g.keys) for (const lang of ["en"] as Lang[]) {
      const path = key.split(".");
      let def: unknown = dictionaries[lang];
      for (const part of path) def = (def as Record<string, unknown>)?.[part];
      init[`${lang}.${key}`] = data.overrides[lang][key] ?? String(def ?? "");
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* ── klasifikace slovních druhů (Synapse) ── */
  const [classifying, setClassifying] = useState(false);
  const [classifyMsg, setClassifyMsg] = useState("");
  const runClassify = async () => {
    setClassifying(true); setClassifyMsg("");
    try {
      const r = await fetch("/api/brain/classify", { method: "POST" });
      const j = await r.json();
      setClassifyMsg(r.ok ? `✓ classified ${j.classified}${j.remaining === "more" ? " (more remaining — run again)" : ""}` : `✗ ${j.error ?? "error"}`);
    } catch { setClassifyMsg("✗ error"); }
    setClassifying(false);
  };

  const saveTexts = async () => {
    setSaving(true); setSaved(false);
    const items: { key: string; lang: Lang; value: string | null }[] = [];
    for (const g of TEXT_GROUPS) for (const key of g.keys) for (const lang of ["en"] as Lang[]) {
      const path = key.split(".");
      let def: unknown = dictionaries[lang];
      for (const part of path) def = (def as Record<string, unknown>)?.[part];
      const v = texts[`${lang}.${key}`] ?? "";
      // shodné s defaultem = override smazat (budoucí úpravy v kódu se zase propíšou)
      items.push({ key, lang, value: v.trim() === String(def ?? "").trim() ? null : v });
    }
    const res = await fetch("/api/admin/texts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  };

  const menu: { id: Tab; label: string }[] = [
    { id: "overview", label: "📊 Overview" },
    { id: "projects", label: "🧪 Projects" },
    { id: "about", label: "📝 About" },
  ];
  const tools: [string, string][] = [
    ["/admin/encyclopedia", "🍝 Encyclopedia CMS"],
    ["/admin/brain", "⚡ Synapse — words"],
    ["/admin/songs", "🎤 Songs"],
    ["/admin/vvv", "📖 VVV"],
    ["/mapa", "🗺 Map"],
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", alignItems: "stretch" }}>
      {/* ── levé menu ── */}
      <aside style={{ width: 220, flexShrink: 0, background: "#fff", borderRight: "2.5px solid var(--border)", padding: "20px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 14px" }}>
          <span style={{ fontSize: 22 }}>🍝</span>
          <div>
            <p style={{ ...display, fontSize: 16, fontWeight: 900, lineHeight: 1 }}>Spaghetti HQ</p>
            <p style={{ fontFamily: sans, fontSize: 10, color: "var(--text-muted)" }}>admin</p>
          </div>
        </div>
        {menu.map((m) => (
          <button key={m.id} onClick={() => setTab(m.id)} style={{
            textAlign: "left", background: tab === m.id ? "var(--text-primary)" : "transparent",
            color: tab === m.id ? "var(--bg)" : "var(--text-primary)",
            border: "none", borderRadius: 10, padding: "9px 12px",
            fontFamily: sans, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
          }}>{m.label}</button>
        ))}
        <p style={{ fontFamily: sans, fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "16px 8px 4px" }}>Tools</p>
        {tools.map(([href, label]) => (
          <Link key={href} href={href} style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textDecoration: "none", padding: "6px 12px" }}>{label}</Link>
        ))}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "14px 8px 0" }}>
          <Link href="/" style={{ fontFamily: sans, fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>← Spaghetti.ltd</Link>
          <button onClick={logout} style={{ alignSelf: "flex-start", background: "transparent", color: "var(--text-muted)", border: "2px solid var(--border)", borderRadius: 8, padding: "5px 12px", fontFamily: sans, fontSize: 11.5, cursor: "pointer" }}>Log out →</button>
        </div>
      </aside>

      {/* ── obsah ── */}
      <main style={{ flex: 1, minWidth: 0, padding: "28px 28px 80px", maxWidth: 1020 }}>
        {tab === "overview" && (
          <>
            <h1 style={{ ...display, fontSize: 26, fontWeight: 900, marginBottom: 18 }}>Overview</h1>

            {/* srovnání projektů: otevření × interakce */}
            <Card style={{ marginBottom: 18, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: sans, fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "right" }}>
                    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Project</th>
                    {["Opened", "Interacted", "Conversion", "Opened 7 d", "Interactions 7 d"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectSlugs.map((slug) => {
                    const m = mBySlug[slug];
                    const rate = m && m.opens > 0 ? `${Math.round((m.interacts / m.opens) * 100)} %` : "—";
                    return (
                      <tr key={slug} style={{ borderBottom: "1px solid rgba(26,22,20,0.08)", textAlign: "right" }}>
                        <td style={{ textAlign: "left", padding: "10px 16px", fontWeight: 700 }}>{PROJECT_LABEL[slug] ?? slug}</td>
                        <td style={{ padding: "10px 16px" }}>{m?.opens?.toLocaleString("en-US") ?? 0}</td>
                        <td style={{ padding: "10px 16px" }}>{m?.interacts?.toLocaleString("en-US") ?? 0}</td>
                        <td style={{ padding: "10px 16px", fontWeight: 700 }}>{rate}</td>
                        <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>{m?.opens7?.toLocaleString("en-US") ?? 0}</td>
                        <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>{m?.interacts7?.toLocaleString("en-US") ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p style={{ fontFamily: sans, fontSize: 10.5, color: "var(--text-muted)", padding: "8px 16px 12px" }}>
                Counted once per session (page open / first interaction). Collected since deployment — no historical data.
              </p>
            </Card>

            {/* per-projekt statistiky */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              <Card>
                <p style={{ ...display, fontSize: 15, fontWeight: 800, marginBottom: 12 }}>⚡ Synapse</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Stat label="Words (cs)" value={data.brain.cs?.words ?? 0} />
                  <Stat label="Associations (cs)" value={data.brain.cs?.total ?? 0} />
                  <Stat label="Words (en)" value={data.brain.en?.words ?? 0} />
                  <Stat label="Associations (en)" value={data.brain.en?.total ?? 0} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                  <button onClick={runClassify} disabled={classifying} style={{
                    background: "var(--text-primary)", color: "var(--bg)", border: "none", borderRadius: 8,
                    padding: "7px 12px", fontFamily: sans, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    opacity: classifying ? 0.5 : 1,
                  }}>{classifying ? "Claude classifying…" : `🤖 Classify parts of speech (${data.brainUnclassified})`}</button>
                  {classifyMsg && <span style={{ fontFamily: sans, fontSize: 12, color: "var(--text-secondary)" }}>{classifyMsg}</span>}
                </div>
                <p style={{ fontFamily: sans, fontSize: 10.5, color: "var(--text-muted)", marginTop: 8 }}>
                  New words are classified automatically every night (cron 3:00). The button = right now.
                </p>
              </Card>
              <Card>
                <p style={{ ...display, fontSize: 15, fontWeight: 800, marginBottom: 12 }}>🍝 Encyclopedia</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Stat label="Entries" value={data.ency.terms} />
                  <Stat label="Synapses" value={data.ency.synapses} />
                  <Stat label="Red links" value={data.ency.reds} />
                  <Stat label="Wishes" value={data.ency.wishes} />
                </div>
              </Card>
              <Card>
                <p style={{ ...display, fontSize: 15, fontWeight: 800, marginBottom: 12 }}>📻 Radio</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Stat label="Rounds played" value={data.radio?.rounds ?? 0} />
                  <Stat label="Votes" value={data.radio?.votes ?? 0} />
                </div>
              </Card>
            </div>
          </>
        )}

        {tab === "projects" && (
          <>
            <h1 style={{ ...display, fontSize: 26, fontWeight: 900, marginBottom: 6 }}>Projects</h1>
            <p style={{ fontFamily: sans, fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
              Kanban: ideas on the left, in progress in the middle, active on the right. Drag cards by status, click a card to configure it.
            </p>
            <ExperimentsAdmin initial={data.rows} embedded />
          </>
        )}

        {tab === "about" && (
          <>
            <h1 style={{ ...display, fontSize: 26, fontWeight: 900, marginBottom: 6 }}>About — homepage copy</h1>
            <p style={{ fontFamily: sans, fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
              Changes are written to the homepage immediately. When you revert a text to its original wording, the override is removed and the default from code applies.
            </p>
            {TEXT_GROUPS.map((g) => (
              <Card key={g.group} style={{ marginBottom: 16 }}>
                <p style={{ ...display, fontSize: 15, fontWeight: 800, marginBottom: 12, textTransform: "capitalize" }}>{g.group}</p>
                {g.keys.map((key) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <p style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 5 }}>{key}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 8 }}>
                      {(["en"] as Lang[]).map((lang) => (
                        <div key={lang}>
                          <textarea
                            value={texts[`${lang}.${key}`] ?? ""}
                            onChange={(e) => setTexts((t) => ({ ...t, [`${lang}.${key}`]: e.target.value }))}
                            rows={Math.min(5, Math.max(1, Math.ceil((texts[`${lang}.${key}`]?.length ?? 0) / 60)))}
                            style={{
                              width: "100%", background: data.overrides[lang][key] ? "#FEF9C3" : "var(--bg)",
                              border: "2px solid var(--border)", borderRadius: 8, padding: "8px 10px",
                              fontFamily: sans, fontSize: 13, color: "var(--text-primary)", outline: "none", resize: "vertical",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </Card>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={saveTexts} disabled={saving} style={{
                background: "var(--text-primary)", color: "var(--bg)", border: "2px solid var(--text-primary)",
                borderRadius: 10, boxShadow: "3px 3px 0 var(--text-primary)", padding: "10px 20px",
                fontFamily: sans, fontSize: 13.5, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.5 : 1,
              }}>{saving ? "Saving…" : "Save texts"}</button>
              {saved && <span style={{ fontFamily: sans, fontSize: 13, color: "#16A34A", fontWeight: 600 }}>✓ Saved</span>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
