"use client";

import { useState, useEffect, useCallback } from "react";
import { MathCaptcha } from "./MathCaptcha";

type Definition = {
  id: number;
  term_slug: string;
  content: string;
  author_name: string;
  votes: number;
  created_at: string;
};

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };

function getVoterKey(): string {
  const key = "42-voter-key";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const fresh = Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem(key, fresh);
  return fresh;
}

export function CommunitySection({ termSlug }: { termSlug: string }) {
  const [stage, setStage] = useState<"hidden" | "warning" | "open">("hidden");
  const [defs, setDefs] = useState<Definition[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, answer: "" });

  const fetchDefs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/42/${termSlug}/definitions`);
      if (res.ok) setDefs(await res.json());
    } finally {
      setLoading(false);
    }
  }, [termSlug]);

  const reveal = () => {
    setStage("open");
    fetchDefs();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/42/${termSlug}/definitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, authorName, captchaA: captcha.a, captchaB: captcha.b, captchaAnswer: captcha.answer }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Chyba při odesílání.");
      } else {
        setContent("");
        setAuthorName("");
        fetchDefs();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (defId: number) => {
    if (votedIds.has(defId)) return;
    const voterKey = getVoterKey();
    const res = await fetch(`/api/42/definitions/${defId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterKey }),
    });
    if (res.ok) {
      const { votes } = await res.json();
      setDefs((prev) => prev.map((d) => d.id === defId ? { ...d, votes } : d));
      setVotedIds((prev) => new Set([...prev, defId]));
    } else if (res.status === 409) {
      setVotedIds((prev) => new Set([...prev, defId]));
    }
  };

  // Load voted IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`42-voted-${termSlug}`);
      if (stored) setVotedIds(new Set(JSON.parse(stored)));
    } catch {}
  }, [termSlug]);

  // Persist voted IDs
  useEffect(() => {
    if (votedIds.size > 0) {
      localStorage.setItem(`42-voted-${termSlug}`, JSON.stringify([...votedIds]));
    }
  }, [votedIds, termSlug]);

  if (stage === "hidden") {
    return (
      <button
        onClick={() => setStage("warning")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#fff",
          border: "2.5px dashed var(--border)",
          borderRadius: "16px",
          padding: "16px 24px",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--text-secondary)",
          width: "100%",
          textAlign: "left",
          transition: "background 140ms ease",
        }}
      >
        <span style={{ fontSize: "20px" }}>⚠️</span>
        <span>Nebezpečná sekce — obsah od veřejnosti</span>
        <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--text-muted)" }}>Odkrýt →</span>
      </button>
    );
  }

  if (stage === "warning") {
    return (
      <div style={{
        background: "#fff",
        border: "2.5px solid var(--border)",
        borderRadius: "16px",
        boxShadow: "4px 4px 0 var(--border)",
        padding: "28px 28px 24px",
      }}>
        <p style={{ fontSize: "28px", marginBottom: "12px" }}>⚠️</p>
        <h3 style={{ ...display, fontSize: "20px", fontWeight: 800, marginBottom: "12px" }}>
          Nebezpečná sekce
        </h3>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "14px",
          color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "24px",
        }}>
          Tato sekce obsahuje definice napsané kýmkoliv na internetu.
          Může obsahovat humor, nepřesnosti, nebo naprostý nesmysl.
          Průvodce za obsah neručí.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={reveal}
            style={{
              background: "var(--text-primary)", color: "var(--bg)",
              border: "2px solid var(--text-primary)", borderRadius: "10px",
              boxShadow: "3px 3px 0 var(--text-primary)",
              padding: "10px 22px", fontFamily: "var(--font-sans)",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}
          >
            Rozumím, odkrýt →
          </button>
          <button
            onClick={() => setStage("hidden")}
            style={{
              background: "transparent", color: "var(--text-muted)",
              border: "2px solid var(--border)", borderRadius: "10px",
              padding: "10px 22px", fontFamily: "var(--font-sans)",
              fontSize: "13px", cursor: "pointer",
            }}
          >
            Zpět
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{
        fontFamily: "var(--font-sans)", fontSize: "11px", textTransform: "uppercase",
        letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "16px",
      }}>
        ⚠️ Obsah od veřejnosti — může obsahovat nesmysly
      </p>

      {/* Existing definitions */}
      {loading ? (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-muted)" }}>
          Načítám...
        </p>
      ) : defs.length === 0 ? (
        <p style={{
          fontFamily: "var(--font-display)", fontStyle: "italic",
          fontSize: "16px", color: "var(--text-muted)", marginBottom: "24px",
        }}>
          Zatím žádné definice. Buď první.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
          {defs.map((d) => (
            <div key={d.id} style={{
              background: "#fff",
              border: "2px solid var(--border)",
              borderRadius: "14px",
              boxShadow: "3px 3px 0 var(--border)",
              padding: "16px 20px",
              display: "flex",
              gap: "16px",
              alignItems: "flex-start",
            }}>
              {/* Vote */}
              <button
                onClick={() => handleVote(d.id)}
                disabled={votedIds.has(d.id)}
                title={votedIds.has(d.id) ? "Již jsi hlasoval/a" : "Hlasovat"}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "2px", background: "none", border: "none", cursor: votedIds.has(d.id) ? "default" : "pointer",
                  padding: "4px 8px",
                  color: votedIds.has(d.id) ? "var(--text-secondary)" : "var(--text-muted)",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "16px" }}>{votedIds.has(d.id) ? "▲" : "△"}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600 }}>
                  {d.votes}
                </span>
              </button>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: "var(--font-sans)", fontSize: "14px",
                  color: "var(--text-primary)", lineHeight: 1.6,
                }}>
                  {d.content}
                </p>
                <p style={{
                  fontFamily: "var(--font-sans)", fontSize: "11px",
                  color: "var(--text-muted)", marginTop: "6px",
                }}>
                  {d.author_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add definition form */}
      <form onSubmit={handleSubmit}>
        <p style={{
          ...display, fontSize: "16px", fontWeight: 700,
          marginBottom: "12px", color: "var(--text-primary)",
        }}>
          Přidat vlastní definici
        </p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Vlastní definice termínu..."
          rows={3}
          style={{
            width: "100%", background: "#fff",
            border: "2px solid var(--border)", borderRadius: "12px",
            padding: "12px 16px", fontFamily: "var(--font-sans)", fontSize: "14px",
            color: "var(--text-primary)", outline: "none", resize: "vertical",
            marginBottom: "10px",
          }}
        />
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "10px" }}>
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Jméno (nepovinné)"
            style={{
              background: "#fff", border: "2px solid var(--border)", borderRadius: "10px",
              padding: "10px 14px", fontFamily: "var(--font-sans)", fontSize: "13px",
              color: "var(--text-primary)", outline: "none", flex: "1", minWidth: "160px",
            }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <MathCaptcha onChange={setCaptcha} />
        </div>
        <div>
          <button
            type="submit"
            disabled={submitting || content.trim().length < 10 || Number(captcha.answer) !== captcha.a + captcha.b}
            style={{
              background: "var(--text-primary)", color: "var(--bg)",
              border: "2px solid var(--text-primary)", borderRadius: "10px",
              boxShadow: "3px 3px 0 var(--text-primary)",
              padding: "10px 20px", fontFamily: "var(--font-sans)",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
              opacity: (submitting || content.trim().length < 10 || Number(captcha.answer) !== captcha.a + captcha.b) ? 0.4 : 1,
            }}
          >
            {submitting ? "Odesílám..." : "Odeslat →"}
          </button>
        </div>
        {error && (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "#b91c1c", marginTop: "8px" }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
