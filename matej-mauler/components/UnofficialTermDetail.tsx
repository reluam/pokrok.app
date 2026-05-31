"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MathCaptcha } from "./MathCaptcha";

type Definition = {
  id: number;
  content: string;
  author_name: string;
  created_at: string;
  votes: number;
};

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
}

export function UnofficialTermDetail({ slug }: { slug: string }) {
  const [termName, setTermName] = useState<string | null>(null);
  const [defs, setDefs] = useState<Definition[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, answer: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const captchaValid = Number(captcha.answer) === captcha.a + captcha.b && captcha.answer !== "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch term info
      const termsRes = await fetch("/api/42/unofficial");
      if (termsRes.ok) {
        const terms = await termsRes.json();
        const found = terms.find((t: { slug: string; name: string }) => t.slug === slug);
        if (!found) { setNotFound(true); return; }
        setTermName(found.name);
      }
      // Fetch definitions
      const defsRes = await fetch(`/api/42/${slug}/definitions`);
      if (defsRes.ok) {
        const data = await defsRes.json();
        // Sort newest first
        setDefs([...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/42/${slug}/definitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, authorName, captchaA: captcha.a, captchaB: captcha.b, captchaAnswer: captcha.answer }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Chyba.");
      } else {
        setContent("");
        setAuthorName("");
        setShowForm(false);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-sans)", color: "var(--text-muted)" }}>Načítám...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-muted)" }}>Termín nenalezen.</p>
        <Link href="/42" style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-secondary)" }}>← zpět na 42</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ position: "fixed", top: "24px", left: "24px", zIndex: 10 }}>
        <Link href="/42" style={{
          fontFamily: "var(--font-sans)", fontSize: "12px",
          letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none",
        }}>
          ← 42
        </Link>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "80px 24px 80px" }}>
        {/* Badge */}
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase",
          letterSpacing: "0.18em", color: "#D97706", marginBottom: "16px",
        }}>
          ⚠️ Neoficiální termín — přidán komunitou
        </p>

        {/* Name */}
        <h1 style={{
          ...display, fontSize: "clamp(36px, 7vw, 60px)", fontWeight: 900,
          lineHeight: 1.1, letterSpacing: "-0.02em",
          color: "var(--text-primary)", marginBottom: "40px",
        }}>
          {termName}
        </h1>

        {/* Definitions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: "11px", textTransform: "uppercase",
            letterSpacing: "0.1em", color: "var(--text-muted)",
          }}>
            {defs.length} {defs.length === 1 ? "definice" : defs.length < 5 ? "definice" : "definic"}
          </p>
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              background: showForm ? "var(--text-primary)" : "#fff",
              color: showForm ? "var(--bg)" : "var(--text-primary)",
              border: "2px solid var(--border)", borderRadius: "10px",
              boxShadow: "3px 3px 0 var(--border)",
              padding: "8px 16px", fontFamily: "var(--font-sans)",
              fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}
          >
            {showForm ? "Zrušit" : "+ Přidat definici"}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{
            background: "#fff", border: "2.5px solid var(--border)",
            borderRadius: "16px", boxShadow: "4px 4px 0 var(--border)",
            padding: "20px 24px", marginBottom: "20px",
          }}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Vlastní definice termínu..."
              rows={3}
              style={{
                width: "100%", background: "#FAFAF7",
                border: "2px solid var(--border)", borderRadius: "10px",
                padding: "10px 14px", fontFamily: "var(--font-sans)", fontSize: "14px",
                color: "var(--text-primary)", outline: "none", resize: "vertical", marginBottom: "10px",
              }}
            />
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Jméno (nepovinné)"
              style={{
                width: "100%", background: "#FAFAF7",
                border: "2px solid var(--border)", borderRadius: "10px",
                padding: "10px 14px", fontFamily: "var(--font-sans)", fontSize: "13px",
                color: "var(--text-primary)", outline: "none", marginBottom: "12px",
              }}
            />
            <div style={{ marginBottom: "12px" }}>
              <MathCaptcha onChange={setCaptcha} />
            </div>
            {error && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "#b91c1c", marginBottom: "10px" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting || content.trim().length < 10 || !captchaValid}
              style={{
                background: "var(--text-primary)", color: "var(--bg)",
                border: "2px solid var(--text-primary)", borderRadius: "10px",
                boxShadow: "3px 3px 0 var(--text-primary)",
                padding: "10px 22px", fontFamily: "var(--font-sans)",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                opacity: (submitting || content.trim().length < 10 || !captchaValid) ? 0.4 : 1,
              }}
            >
              {submitting ? "Odesílám..." : "Odeslat →"}
            </button>
          </form>
        )}

        {/* Definitions list — newest first */}
        {defs.length === 0 ? (
          <p style={{ ...serifItalic, fontSize: "16px", color: "var(--text-muted)" }}>
            Zatím žádné definice. Buď první.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {defs.map((d, i) => (
              <div key={d.id} style={{
                background: i === 0 ? "#FFFBEB" : "#fff",
                border: `2px solid ${i === 0 ? "#D97706" : "var(--border)"}`,
                borderRadius: "14px",
                boxShadow: `3px 3px 0 ${i === 0 ? "#D97706" : "var(--border)"}`,
                padding: "18px 22px",
              }}>
                <p style={{
                  fontFamily: "var(--font-sans)", fontSize: "14px",
                  color: "var(--text-primary)", lineHeight: 1.65, marginBottom: "10px",
                }}>
                  {d.content}
                </p>
                <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)" }}>
                    {d.author_name} · {formatDate(d.created_at)}
                  </p>
                  {i === 0 && (
                    <span style={{
                      fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase",
                      letterSpacing: "0.08em", color: "#D97706", background: "#FEF9C3",
                      border: "1px solid #D97706", borderRadius: "999px",
                      padding: "2px 8px",
                    }}>
                      Nejnovější
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
