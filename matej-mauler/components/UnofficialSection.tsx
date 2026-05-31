"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MathCaptcha } from "./MathCaptcha";

type UnofficialTerm = {
  id: number;
  slug: string;
  name: string;
  created_at: string;
  latest_content: string | null;
  latest_author: string | null;
};

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

export function UnofficialSection() {
  const [stage, setStage] = useState<"hidden" | "warning" | "open">("hidden");
  const [terms, setTerms] = useState<UnofficialTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, answer: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/42/unofficial");
      if (res.ok) setTerms(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const reveal = () => {
    setStage("open");
    fetchTerms();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/42/unofficial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content, authorName, captchaA: captcha.a, captchaB: captcha.b, captchaAnswer: captcha.answer }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Chyba.");
      } else {
        const { slug } = await res.json();
        router.push(`/42/${slug}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const captchaValid = Number(captcha.answer) === captcha.a + captcha.b && captcha.answer !== "";

  if (stage === "hidden") {
    return (
      <button
        onClick={() => setStage("warning")}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "transparent",
          border: "2px dashed rgba(26,22,20,0.2)",
          borderRadius: "14px", padding: "14px 20px", cursor: "pointer",
          fontFamily: "var(--font-sans)", fontSize: "14px",
          color: "var(--text-muted)", width: "100%", textAlign: "left",
          transition: "border-color 140ms ease",
        }}
      >
        <span>⚠️</span>
        <span>Zobrazit neoficiální termíny</span>
        <span style={{ marginLeft: "auto", fontSize: "12px" }}>Odkrýt →</span>
      </button>
    );
  }

  if (stage === "warning") {
    return (
      <div style={{
        background: "#FFFBEB",
        border: "2.5px solid #D97706",
        borderRadius: "16px",
        boxShadow: "4px 4px 0 #D97706",
        padding: "24px 28px",
      }}>
        <p style={{ fontSize: "24px", marginBottom: "10px" }}>⚠️</p>
        <h3 style={{ ...display, fontSize: "18px", fontWeight: 800, marginBottom: "10px", color: "var(--text-primary)" }}>
          Neoficiální termíny
        </h3>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
          Toto jsou termíny a definice přidané kýmkoliv na internetu.
          Průvodce za jejich obsah ani přesnost neručí.
          Mohou obsahovat humor, dezinformace nebo naprostý nesmysl.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={reveal} style={{
            background: "#D97706", color: "#fff",
            border: "2px solid #92400e", borderRadius: "10px",
            boxShadow: "3px 3px 0 #92400e",
            padding: "10px 20px", fontFamily: "var(--font-sans)",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}>
            Rozumím, zobrazit →
          </button>
          <button onClick={() => setStage("hidden")} style={{
            background: "transparent", color: "var(--text-muted)",
            border: "2px solid var(--border)", borderRadius: "10px",
            padding: "10px 20px", fontFamily: "var(--font-sans)",
            fontSize: "13px", cursor: "pointer",
          }}>
            Zpět
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "11px", textTransform: "uppercase",
          letterSpacing: "0.1em", color: "#D97706",
        }}>
          ⚠️ Obsah od veřejnosti
        </p>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          style={{
            background: showAddForm ? "var(--text-primary)" : "#fff",
            color: showAddForm ? "var(--bg)" : "var(--text-primary)",
            border: "2px solid var(--border)", borderRadius: "10px",
            boxShadow: "3px 3px 0 var(--border)",
            padding: "8px 16px", fontFamily: "var(--font-sans)",
            fontSize: "12px", fontWeight: 600, cursor: "pointer",
            transition: "all 140ms ease",
          }}
        >
          {showAddForm ? "Zrušit" : "+ Přidat termín"}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} style={{
          background: "#fff", border: "2.5px solid var(--border)",
          borderRadius: "16px", boxShadow: "4px 4px 0 var(--border)",
          padding: "20px 24px", marginBottom: "20px",
        }}>
          <p style={{ ...display, fontSize: "16px", fontWeight: 800, marginBottom: "14px" }}>Nový neoficiální termín</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Název termínu"
            style={{
              width: "100%", background: "#FAFAF7",
              border: "2px solid var(--border)", borderRadius: "10px",
              padding: "10px 14px", fontFamily: "var(--font-sans)", fontSize: "14px",
              color: "var(--text-primary)", outline: "none", marginBottom: "10px",
            }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Definice termínu..."
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
            disabled={submitting || name.trim().length < 2 || content.trim().length < 10 || !captchaValid}
            style={{
              background: "var(--text-primary)", color: "var(--bg)",
              border: "2px solid var(--text-primary)", borderRadius: "10px",
              boxShadow: "3px 3px 0 var(--text-primary)",
              padding: "10px 22px", fontFamily: "var(--font-sans)",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
              opacity: (submitting || name.trim().length < 2 || content.trim().length < 10 || !captchaValid) ? 0.4 : 1,
            }}
          >
            {submitting ? "Přidávám..." : "Přidat termín →"}
          </button>
        </form>
      )}

      {/* Terms list */}
      {loading ? (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-muted)" }}>Načítám...</p>
      ) : terms.length === 0 ? (
        <p style={{ ...serifItalic, fontSize: "16px", color: "var(--text-muted)" }}>
          Zatím žádné neoficiální termíny. Buď první.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {terms.map((t) => (
            <a key={t.slug} href={`/42/${t.slug}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: "#FFFBEB",
                border: "2.5px solid #D97706",
                borderRadius: "16px",
                boxShadow: "4px 4px 0 #D97706",
                padding: "18px 22px",
                transition: "transform 140ms ease, box-shadow 140ms ease",
                cursor: "pointer",
              }}
              className="unofficial-card"
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "14px" }}>⚠️</span>
                  <h3 style={{ ...display, fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>
                    {t.name}
                  </h3>
                </div>
                {t.latest_content ? (
                  <p style={{
                    fontFamily: "var(--font-sans)", fontSize: "13px",
                    color: "var(--text-secondary)", lineHeight: 1.5,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {t.latest_content}
                  </p>
                ) : (
                  <p style={{ ...serifItalic, fontSize: "13px", color: "var(--text-muted)" }}>
                    Zatím bez definice.
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
      <style>{`
        .unofficial-card:hover {
          transform: translate(-2px,-2px);
          box-shadow: 6px 6px 0 #D97706 !important;
        }
      `}</style>
    </div>
  );
}
