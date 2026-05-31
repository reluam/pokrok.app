"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MathCaptcha } from "./MathCaptcha";
import type { VVVTerm } from "@/app/vvv/page";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

/* ── Entry warning ─────────────────────────────────────────────── */

function EntryWarning({ onEnter }: { onEnter: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "repeating-linear-gradient(-45deg, #1a1614 0px, #1a1614 24px, #FCD34D 24px, #FCD34D 48px)",
      padding: "24px",
    }}>
      <div style={{
        background: "#FAFAF7",
        border: "4px solid #1a1614",
        borderRadius: "20px",
        boxShadow: "8px 8px 0 #1a1614",
        padding: "40px 36px",
        maxWidth: "480px",
        width: "100%",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "40px", marginBottom: "12px", lineHeight: 1 }}>⚠️</p>
        <h2 style={{
          ...display, fontSize: "28px", fontWeight: 900,
          letterSpacing: "-0.02em", marginBottom: "8px",
        }}>
          UPOZORNĚNÍ
        </h2>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "11px",
          textTransform: "uppercase", letterSpacing: "0.15em",
          color: "var(--text-muted)", marginBottom: "20px",
        }}>
          Veškeré vesmírné vědění
        </p>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "14px",
          lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: "28px",
        }}>
          Tato encyklopedie obsahuje veškeré vesmírné vědění — včetně znalostí
          přidaných kýmkoliv s přístupem k internetu a minimální zodpovědností.
          <br /><br />
          Vstupem souhlasíte s tím, že nebudete pohoršeni tím, co uvidíte.
        </p>
        <button onClick={onEnter} style={{
          background: "#1a1614", color: "#FAFAF7",
          border: "2.5px solid #1a1614", borderRadius: "12px",
          boxShadow: "4px 4px 0 #FCD34D",
          padding: "14px 32px", fontFamily: "var(--font-sans)",
          fontSize: "15px", fontWeight: 700, cursor: "pointer",
          letterSpacing: "0.02em",
        }}>
          Vstoupit do encyklopedie →
        </button>
      </div>
    </div>
  );
}

/* ── Term card ─────────────────────────────────────────────────── */

function TermCard({ term, onVote }: { term: VVVTerm; onVote: (slug: string) => Promise<{ votes?: number; error?: string }> }) {
  const [votes, setVotes] = useState(term.votes);
  const [voteError, setVoteError] = useState("");
  const [voting, setVoting] = useState(false);

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (voting) return;
    setVoting(true);
    setVoteError("");
    const res = await onVote(term.slug);
    if (res.votes !== undefined) setVotes(res.votes);
    if (res.error) setVoteError(res.error);
    setVoting(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <Link href={`/vvv/${term.slug}`} style={{ textDecoration: "none" }}>
        <div className="vvv-card" style={{
          background: "#fff",
          border: "2.5px solid var(--border)",
          borderRadius: "16px",
          boxShadow: "4px 4px 0 var(--border)",
          padding: "20px 20px 20px 22px",
          transition: "transform 140ms ease, box-shadow 140ms ease",
          cursor: "pointer",
        }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                <h2 style={{ ...display, fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" }}>
                  {term.name}
                </h2>
                <span style={{
                  fontFamily: "var(--font-sans)", fontSize: "10px",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  color: term.source === "Komunita" ? "#D97706" : "var(--text-muted)",
                  background: term.source === "Komunita" ? "#FEF9C3" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${term.source === "Komunita" ? "#D97706" : "var(--border)"}`,
                  borderRadius: "999px", padding: "2px 8px", whiteSpace: "nowrap",
                }}>
                  {term.source === "Komunita" ? "⚠️ komunita" : term.source.replace("The ", "").replace("Life, the Universe and Everything", "Život, vesmír...").replace("The Restaurant at the End of the Universe", "Restaurace na konci vesmíru").replace("Mostly Harmless", "Převážně neškodná")}
                </span>
              </div>
              <p style={{
                fontFamily: "var(--font-sans)", fontSize: "13px",
                color: "var(--text-secondary)", lineHeight: 1.55,
                display: "-webkit-box", WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {term.description}
              </p>
              <p style={{
                fontFamily: "var(--font-sans)", fontSize: "11px",
                color: "var(--text-muted)", marginTop: "8px",
              }}>
                {term.author_name}
              </p>
            </div>

            {/* Vote button */}
            <button
              onClick={handleVote}
              title="Hlasovat (1× za 24 hodin)"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "2px", background: "none", border: "2px solid var(--border)",
                borderRadius: "10px", boxShadow: "2px 2px 0 var(--border)",
                padding: "8px 12px", cursor: "pointer", flexShrink: 0,
                transition: "transform 140ms ease",
                color: "var(--text-primary)",
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: 1 }}>👍</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700 }}>
                {votes}
              </span>
            </button>
          </div>
        </div>
      </Link>
      {voteError && (
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "11px",
          color: "#D97706", marginTop: "4px", paddingLeft: "4px",
        }}>
          {voteError}
        </p>
      )}
    </div>
  );
}

/* ── Add term form ─────────────────────────────────────────────── */

function AddTermForm({ onAdded }: { onAdded: (term: VVVTerm) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, answer: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const captchaOk = Number(captcha.answer) === captcha.a + captcha.b && captcha.answer !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/vvv/terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, authorName, captchaA: captcha.a, captchaB: captcha.b, captchaAnswer: captcha.answer }),
    });
    if (res.ok) {
      const term = await res.json();
      onAdded(term);
      setName(""); setDescription(""); setAuthorName(""); setOpen(false);
    } else {
      setError((await res.json()).error ?? "Chyba.");
    }
    setSubmitting(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        background: "#fff", color: "var(--text-primary)",
        border: "2.5px solid var(--border)", borderRadius: "12px",
        boxShadow: "3px 3px 0 var(--border)",
        padding: "10px 20px", fontFamily: "var(--font-sans)",
        fontSize: "13px", fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", gap: "6px",
      }}>
        + Přidat termín
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: "#fff", border: "2.5px solid var(--border)",
      borderRadius: "16px", boxShadow: "4px 4px 0 var(--border)",
      padding: "24px",
    }}>
      <p style={{ ...display, fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>
        Nový termín
      </p>
      {[
        { val: name, set: setName, ph: "Název termínu", multi: false },
        { val: description, set: setDescription, ph: "Definice / popis...", multi: true },
        { val: authorName, set: setAuthorName, ph: "Jméno (nepovinné — výchozí: Neznámý dobrodinec)", multi: false },
      ].map(({ val, set, ph, multi }) =>
        multi ? (
          <textarea key={ph} value={val} onChange={e => set(e.target.value)} placeholder={ph} rows={3}
            style={{ width: "100%", background: "#FAFAF7", border: "2px solid var(--border)", borderRadius: "10px", padding: "10px 14px", fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-primary)", outline: "none", resize: "vertical", marginBottom: "10px", display: "block" }} />
        ) : (
          <input key={ph} value={val} onChange={e => set(e.target.value)} placeholder={ph}
            style={{ width: "100%", background: "#FAFAF7", border: "2px solid var(--border)", borderRadius: "10px", padding: "10px 14px", fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-primary)", outline: "none", marginBottom: "10px", display: "block" }} />
        )
      )}
      <div style={{ marginBottom: "14px" }}><MathCaptcha onChange={setCaptcha} /></div>
      {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "#b91c1c", marginBottom: "10px" }}>{error}</p>}
      <div style={{ display: "flex", gap: "10px" }}>
        <button type="submit" disabled={submitting || !name.trim() || description.trim().length < 10 || !captchaOk}
          style={{ background: "var(--text-primary)", color: "var(--bg)", border: "2px solid var(--text-primary)", borderRadius: "10px", boxShadow: "3px 3px 0 var(--text-primary)", padding: "10px 22px", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: (submitting || !name.trim() || description.trim().length < 10 || !captchaOk) ? 0.4 : 1 }}>
          {submitting ? "Přidávám..." : "Přidat →"}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          style={{ background: "transparent", color: "var(--text-muted)", border: "2px solid var(--border)", borderRadius: "10px", padding: "10px 16px", fontFamily: "var(--font-sans)", fontSize: "13px", cursor: "pointer" }}>
          Zrušit
        </button>
      </div>
    </form>
  );
}

/* ── Main app ──────────────────────────────────────────────────── */

export function VVVApp({ initialTerms }: { initialTerms: VVVTerm[] }) {
  const [acknowledged, setAcknowledged] = useState(true); // default true, set false after check
  const [terms, setTerms] = useState<VVVTerm[]>(initialTerms);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const ok = sessionStorage.getItem("vvv-acknowledged");
    if (!ok) setAcknowledged(false);
  }, []);

  const enter = () => {
    sessionStorage.setItem("vvv-acknowledged", "1");
    setAcknowledged(true);
  };

  const handleVote = useCallback(async (slug: string) => {
    const res = await fetch(`/api/vvv/terms/${slug}/vote`, { method: "POST" });
    const j = await res.json();
    if (res.ok) {
      setTerms(prev => prev.map(t => t.slug === slug ? { ...t, votes: j.votes } : t));
      return { votes: j.votes as number };
    }
    return { error: j.error as string };
  }, []);

  const handleAdded = (term: VVVTerm) => {
    setTerms(prev => [term, ...prev]);
  };

  const filtered = query
    ? terms.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase())
      )
    : terms;

  return (
    <>
      {!acknowledged && <EntryWarning onEnter={enter} />}

      <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
        {/* Header stripe */}
        <div style={{
          height: "8px",
          background: "repeating-linear-gradient(-45deg, #1a1614 0px, #1a1614 10px, #FCD34D 10px, #FCD34D 20px)",
        }} />

        {/* Back */}
        <div style={{ padding: "20px 24px 0" }}>
          <Link href="/" style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none" }}>
            ← matěj.mauler
          </Link>
        </div>

        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 24px 80px" }}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)", marginBottom: "12px" }}>
              Vast Void Vault
            </p>
            <h1 style={{ ...display, fontSize: "clamp(40px, 9vw, 72px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: "14px" }}>
              VVV
            </h1>
            <p style={{ ...serifItalic, fontSize: "17px", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: "500px", margin: "0 auto" }}>
              Encyklopedie kompletnější, než-li doposud uznáván Stopařův průvodce po galaxii.
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Hledat termín..."
              style={{ flex: 1, minWidth: "200px", background: "#fff", border: "2.5px solid var(--border)", borderRadius: "12px", boxShadow: "3px 3px 0 var(--border)", padding: "12px 16px", fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-primary)", outline: "none" }}
            />
          </div>

          {/* Add form */}
          <div style={{ marginBottom: "24px" }}>
            <AddTermForm onAdded={handleAdded} />
          </div>

          {/* Count */}
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", letterSpacing: "0.04em" }}>
            {filtered.length} {filtered.length === 1 ? "termín" : "termínů"}
            {query ? ` pro „${query}"` : ` z ${terms.length} celkem`}
          </p>

          {/* Term list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map(term => (
              <TermCard key={term.slug} term={term} onVote={handleVote} />
            ))}
          </div>
        </div>

        {/* Bottom stripe */}
        <div style={{ height: "8px", background: "repeating-linear-gradient(-45deg, #1a1614 0px, #1a1614 10px, #FCD34D 10px, #FCD34D 20px)" }} />
      </div>

      <style>{`
        .vvv-card:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 var(--border) !important; }
      `}</style>
    </>
  );
}
