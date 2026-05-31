"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { calculateResult, calcUi, Answers } from "@/lib/questions";
import type { Lang } from "@/lib/dictionaries";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serif: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

export function Result({ answers, onRestart, lang }: { answers: Answers; onRestart: () => void; lang: Lang }) {
  const { duration, funnyNotes } = calculateResult(answers, lang);
  const t = calcUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";
  const isCountdown = duration.seconds !== undefined;

  const [timeLeft, setTimeLeft] = useState<number>(duration.seconds ?? 0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!isCountdown) return;
    if (timeLeft <= 0) { setExpired(true); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, isCountdown]);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", padding: "80px 24px" }}>
      <div style={{ position: "fixed", top: "24px", left: "24px" }}>
        <Link href={homeHref} style={{
          fontFamily: "var(--font-sans)", fontSize: "12px",
          letterSpacing: "0.04em", color: "var(--text-muted)", textDecoration: "none",
        }}>
          {t.back}
        </Link>
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>

        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase",
          letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: "32px",
        }}>
          {t.resultLabel}
        </p>

        {/* Main number / display */}
        {expired ? (
          <div style={{ marginBottom: "24px" }}>
            <span style={{ fontSize: "64px", display: "block", marginBottom: "16px" }}>💨</span>
            <p style={{
              ...display, fontSize: "clamp(28px, 6vw, 44px)", fontWeight: 900,
              lineHeight: 1.1, color: "var(--text-primary)", marginBottom: "12px",
            }}>
              {t.expiredTitle}
            </p>
            <p style={{ ...serif, fontSize: "20px", color: "var(--text-secondary)" }}>
              {t.expiredSub}
            </p>
          </div>
        ) : isCountdown ? (
          <div style={{ marginBottom: "24px" }}>
            <span style={{
              ...display,
              fontSize: "clamp(96px, 22vw, 160px)",
              fontWeight: 900,
              lineHeight: 1,
              color: timeLeft <= 10 ? "#dc2626" : "var(--text-primary)",
              display: "block",
              fontVariantNumeric: "tabular-nums",
              transition: "color 300ms ease",
            }}>
              {timeLeft}
            </span>
            <span style={{
              fontFamily: "var(--font-sans)", fontSize: "14px",
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: "var(--text-muted)", display: "block", marginBottom: "12px",
            }}>
              {t.seconds}
            </span>
            <p style={{ ...serif, fontSize: "18px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              {duration.headline}
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: "24px" }}>
            <span style={{
              ...display,
              fontSize: "clamp(52px, 11vw, 88px)",
              fontWeight: 900,
              lineHeight: 1.05,
              color: "var(--text-primary)",
              display: "block",
              marginBottom: "8px",
            }}>
              {duration.display}
            </span>
            <p style={{ ...serif, fontSize: "20px", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0" }}>
              {duration.headline}
            </p>
          </div>
        )}

        {/* Funny notes */}
        {!expired && funnyNotes.length > 0 && (
          <div style={{
            background: "#fff",
            border: "2.5px solid var(--border)",
            borderRadius: "16px",
            boxShadow: "4px 4px 0 var(--border)",
            padding: "20px 24px",
            marginTop: "40px",
            marginBottom: "32px",
            textAlign: "left",
          }}>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase",
              letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "12px",
            }}>
              {t.notesLabel}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "7px" }}>
              {funnyNotes.map((note, i) => (
                <li key={i} style={{
                  fontFamily: "var(--font-sans)", fontSize: "13px",
                  color: "var(--text-secondary)", display: "flex", gap: "8px", lineHeight: 1.5,
                }}>
                  <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>–</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <p style={{
          ...serif, fontSize: "13px", color: "var(--text-muted)",
          marginBottom: "40px", lineHeight: 1.6, marginTop: expired ? "32px" : "0",
        }}>
          {t.disclaimer}
        </p>

        <button
          onClick={onRestart}
          style={{
            background: "var(--text-primary)", color: "var(--bg)",
            border: "2.5px solid var(--text-primary)", borderRadius: "12px",
            boxShadow: "4px 4px 0 var(--text-primary)",
            padding: "12px 28px", fontFamily: "var(--font-sans)",
            fontSize: "14px", fontWeight: 600, cursor: "pointer",
          }}
        >
          {t.retry}
        </button>
      </div>
    </div>
  );
}
