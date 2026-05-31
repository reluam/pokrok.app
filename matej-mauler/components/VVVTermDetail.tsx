"use client";

import { useState } from "react";
import Link from "next/link";
import { MathCaptcha } from "./MathCaptcha";
import { vvvUi } from "@/lib/vvvUi";
import type { Lang } from "@/lib/dictionaries";
import type { VVVTerm, VVVClarification } from "@/app/vvv/[slug]/page";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

function formatDate(iso: string, lang: Lang) {
  return new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "cs-CZ", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

type FeedItem = { type: "original" | "clarification"; content: string; author_name: string; created_at: string; id?: number };

export function VVVTermDetail({
  term: initialTerm,
  initialClarifications,
  lang,
}: {
  term: VVVTerm;
  initialClarifications: VVVClarification[];
  lang: Lang;
}) {
  const t = vvvUi[lang];
  const [term, setTerm] = useState(initialTerm);
  const [clarifications, setClarifications] = useState<VVVClarification[]>(initialClarifications);
  const [votes, setVotes] = useState(initialTerm.votes);
  const [voteMsg, setVoteMsg] = useState("");
  const [voting, setVoting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, answer: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const captchaOk = Number(captcha.answer) === captcha.a + captcha.b && captcha.answer !== "";

  // Build feed: clarifications + original, sorted newest first
  const feed: FeedItem[] = [
    ...clarifications.map(c => ({
      type: "clarification" as const,
      content: c.content,
      author_name: c.author_name,
      created_at: c.created_at,
      id: c.id,
    })),
    {
      type: "original" as const,
      content: term.description,
      author_name: term.author_name,
      created_at: term.created_at,
    },
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleVote = async () => {
    if (voting) return;
    setVoting(true);
    setVoteMsg("");
    const res = await fetch(`/api/vvv/terms/${term.slug}/vote`, { method: "POST" });
    const j = await res.json();
    if (res.ok) setVotes(j.votes);
    else setVoteMsg(j.error ?? "Chyba.");
    setVoting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/vvv/terms/${term.slug}/clarify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, authorName: authorName.trim() || t.defaultAuthor, captchaA: captcha.a, captchaB: captcha.b, captchaAnswer: captcha.answer }),
    });
    if (res.ok) {
      const newC = await res.json() as VVVClarification;
      setClarifications(prev => [newC, ...prev]);
      setContent(""); setAuthorName(""); setShowForm(false);
    } else {
      setError((await res.json()).error ?? t.captchaError);
    }
    setSubmitting(false);
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Top stripe */}
      <div style={{ height: "8px", background: "repeating-linear-gradient(-45deg, #1a1614 0px, #1a1614 10px, #FCD34D 10px, #FCD34D 20px)" }} />

      <div style={{ padding: "20px 24px 0" }}>
        <Link href="/vvv" style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>
          {t.backToList}
        </Link>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Source */}
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: term.source === "Komunita" ? "#D97706" : "var(--text-muted)", marginBottom: "16px" }}>
          {term.source === "Komunita" ? t.community : term.source}
        </p>

        {/* Name + vote */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "40px", flexWrap: "wrap" }}>
          <h1 style={{ ...display, fontSize: "clamp(32px, 7vw, 56px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em", flex: 1 }}>
            {term.name}
          </h1>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <button onClick={handleVote} title={t.voteTitle}
              style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "12px", boxShadow: "3px 3px 0 var(--border)", padding: "12px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "22px", lineHeight: 1 }}>👍</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 700 }}>{votes}</span>
            </button>
            {voteMsg && <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#D97706", textAlign: "center", maxWidth: "100px" }}>{voteMsg}</p>}
          </div>
        </div>

        {/* Feed header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
            {feed.length} {feed.length === 1 ? t.recordOne : feed.length < 5 ? t.recordFew : t.recordMany}
          </p>
          <button onClick={() => setShowForm(v => !v)}
            style={{ background: showForm ? "var(--text-primary)" : "#fff", color: showForm ? "var(--bg)" : "var(--text-primary)", border: "2px solid var(--border)", borderRadius: "10px", boxShadow: "2px 2px 0 var(--border)", padding: "8px 16px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            {showForm ? t.cancel : t.clarify}
          </button>
        </div>

        {/* Clarify form */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: "#fff", border: "2.5px solid var(--border)", borderRadius: "16px", boxShadow: "4px 4px 0 var(--border)", padding: "20px 24px", marginBottom: "16px" }}>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={t.clarifyPlaceholder} rows={3}
              style={{ width: "100%", background: "#FAFAF7", border: "2px solid var(--border)", borderRadius: "10px", padding: "10px 14px", fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-primary)", outline: "none", resize: "vertical", marginBottom: "10px", display: "block" }} />
            <input value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder={t.authorPlaceholder}
              style={{ width: "100%", background: "#FAFAF7", border: "2px solid var(--border)", borderRadius: "10px", padding: "10px 14px", fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-primary)", outline: "none", marginBottom: "12px", display: "block" }} />
            <div style={{ marginBottom: "12px" }}><MathCaptcha onChange={setCaptcha} /></div>
            {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "#b91c1c", marginBottom: "10px" }}>{error}</p>}
            <button type="submit" disabled={submitting || content.trim().length < 10 || !captchaOk}
              style={{ background: "var(--text-primary)", color: "var(--bg)", border: "2px solid var(--text-primary)", borderRadius: "10px", boxShadow: "3px 3px 0 var(--text-primary)", padding: "10px 22px", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: (submitting || content.trim().length < 10 || !captchaOk) ? 0.4 : 1 }}>
              {submitting ? t.sending : t.send}
            </button>
          </form>
        )}

        {/* Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {feed.map((item, i) => (
            <div key={item.type === "original" ? "orig" : item.id} style={{
              background: item.type === "original" ? "#F8F7F4" : "#fff",
              border: "2px solid var(--border)",
              borderRadius: "14px",
              boxShadow: "3px 3px 0 var(--border)",
              padding: "18px 22px",
              position: "relative",
            }}>
              {item.type === "original" && (
                <span style={{ position: "absolute", top: "14px", right: "14px", fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", background: "rgba(0,0,0,0.05)", borderRadius: "999px", padding: "2px 8px" }}>
                  {t.originalLabel}
                </span>
              )}
              <p style={{ ...serifItalic, fontSize: "17px", lineHeight: 1.65, color: "var(--text-primary)", marginBottom: "12px" }}>
                {item.content}
              </p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)" }}>
                {item.author_name} · {formatDate(item.created_at, lang)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stripe */}
      <div style={{ height: "8px", background: "repeating-linear-gradient(-45deg, #1a1614 0px, #1a1614 10px, #FCD34D 10px, #FCD34D 20px)" }} />
    </div>
  );
}
