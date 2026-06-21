"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { getQuestions, calcUi, Answers } from "@/lib/questions";
import type { Lang } from "@/lib/dictionaries";
import { Result } from "./Result";
import { PromptRegistration } from "./PromptRegistration";
import { PixelIcon } from "./PixelIcon";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serif: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

/* Pestrá paleta pro dlaždice + jemná „pixelová" mřížka přes pozadí */
const PALETTE: [string, string][] = [
  ["#ff6b6b", "#c0392b"], ["#4ecdc4", "#1a9e94"], ["#ffd93d", "#f0a500"],
  ["#6c5ce7", "#4834d4"], ["#ff9ff3", "#e84393"], ["#54a0ff", "#2e86de"],
  ["#1dd1a1", "#10ac84"], ["#feca57", "#ff9f43"], ["#a29bfe", "#6c5ce7"],
];
function tileBg(i: number): React.CSSProperties {
  const [a, b] = PALETTE[i % PALETTE.length];
  return {
    backgroundColor: a,
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0 7px, transparent 7px 14px)," +
      "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 7px, transparent 7px 14px)," +
      `linear-gradient(135deg, ${a}, ${b})`,
  };
}

export function QuestionFlow({ lang }: { lang: Lang }) {
  const questions = getQuestions(lang);
  const t = calcUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";

  const [step, setStep] = useState<"intro" | "questions" | "result">("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [animKey, setAnimKey] = useState(0);

  const advance = useCallback((nextIdx: number) => {
    setAnimKey((k) => k + 1);
    if (nextIdx >= questions.length) {
      setStep("result");
    } else {
      setCurrentIdx(nextIdx);
    }
  }, [questions.length]);

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    advance(currentIdx + 1);
  };

  const restart = () => {
    setAnswers({});
    setCurrentIdx(0);
    setAnimKey((k) => k + 1);
    setStep("intro");
  };

  // Zápis do Spaghetti účtů, jakmile uživatel uvidí svůj odhad (anonymous-first).
  const recordedRef = useRef(false);
  useEffect(() => {
    if (step !== "result" || recordedRef.current) return;
    recordedRef.current = true;
    fetch("/api/participation", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ experimentSlug: "time-remaining", payload: { answered: Object.keys(answers).length } }),
    }).catch(() => {});
  }, [step, answers]);

  if (step === "result") {
    return (
      <>
        <Result answers={answers} onRestart={restart} lang={lang} />
        <div style={{ position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", zIndex: 50, width: "min(440px, 92vw)" }}>
          <PromptRegistration
            trigger="on_result"
            headline="keep this — and see how it sits beside the next experiment."
            sub="no account needed to play; sign in to save your result across the series."
          />
        </div>
      </>
    );
  }

  const q = questions[currentIdx];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>

      {/* Back nav */}
      <div style={{ position: "fixed", top: "24px", left: "24px", zIndex: 10 }}>
        <Link
          href={homeHref}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            letterSpacing: "0.04em",
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          {t.back}
        </Link>
      </div>

      {step === "intro" && (
        <div
          key="intro"
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 24px",
          }}
        >
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            color: "var(--text-muted)",
            marginBottom: "28px",
          }}>
            {t.eyebrow}
          </p>

          <h1 style={{
            ...display,
            fontSize: "clamp(48px, 10vw, 80px)",
            lineHeight: 1.05,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: "20px",
          }}>
            {t.title}
          </h1>

          <p style={{
            ...serif,
            fontSize: "20px",
            color: "var(--text-secondary)",
            maxWidth: "400px",
            lineHeight: 1.5,
            marginBottom: "56px",
          }}>
            {t.intro}
          </p>

          <button
            onClick={() => { setStep("questions"); setAnimKey((k) => k + 1); }}
            style={{
              background: "var(--text-primary)",
              color: "var(--bg)",
              border: "2.5px solid var(--text-primary)",
              borderRadius: "12px",
              boxShadow: "4px 4px 0 var(--text-primary)",
              padding: "14px 32px",
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.01em",
              transition: "transform 140ms ease, box-shadow 140ms ease",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.transform = "translate(-2px,-2px)";
              (e.target as HTMLElement).style.boxShadow = "6px 6px 0 var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.transform = "";
              (e.target as HTMLElement).style.boxShadow = "4px 4px 0 var(--text-primary)";
            }}
          >
            {t.start}
          </button>
        </div>
      )}

      {step === "questions" && (
        <>
          {/* Progress dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", paddingTop: "32px" }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: i < currentIdx
                  ? "var(--text-primary)"
                  : i === currentIdx
                  ? "var(--text-secondary)"
                  : "var(--text-muted)",
                transform: i === currentIdx ? "scale(1.35)" : "scale(1)",
                transition: "all 200ms ease",
                opacity: i > currentIdx ? 0.3 : 1,
              }} />
            ))}
          </div>

          {/* Question content */}
          <div
            key={animKey}
            style={{
              padding: "clamp(28px,5vw,56px) clamp(14px,4vw,40px) 80px",
              animation: "slideIn 0.4s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <p style={{
              fontFamily: "var(--font-sans)",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--text-muted)",
              marginBottom: "20px",
              textAlign: "center",
            }}>
              {currentIdx + 1} / {questions.length}
            </p>

            <h2 style={{
              ...display,
              fontSize: "clamp(26px, 5vw, 42px)",
              lineHeight: 1.2,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              textAlign: "center",
              maxWidth: "820px",
              margin: "0 auto",
              marginBottom: q.subtext ? "8px" : "0",
            }}>
              {q.text}
            </h2>

            {q.subtext && (
              <p style={{
                ...serif,
                fontSize: "15px",
                color: "var(--text-muted)",
                textAlign: "center",
                maxWidth: "640px",
                margin: "0 auto",
              }}>
                {q.subtext}
              </p>
            )}

            {/* Full-width pixel tiles – jedna možnost = jedna dlaždice */}
            {q.options && (
              <div style={{
                maxWidth: "1100px",
                margin: "clamp(28px,4vw,44px) auto 0",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}>
                {q.options.map((opt, i) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(q.id, opt.id)}
                    style={{
                      position: "relative",
                      width: "100%",
                      minHeight: "clamp(74px, 12vh, 124px)",
                      border: "3px solid var(--border)",
                      borderRadius: "16px",
                      boxShadow: "4px 4px 0 var(--border)",
                      cursor: "pointer",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "16px",
                      padding: "16px 24px",
                      color: "#fff",
                      ...tileBg(i),
                      transition: "transform 140ms ease, box-shadow 140ms ease",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.transform = "translate(-2px,-2px)";
                      el.style.boxShadow = "7px 7px 0 var(--border)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.transform = "";
                      el.style.boxShadow = "4px 4px 0 var(--border)";
                    }}
                  >
                    <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}><PixelIcon optionId={opt.id} size={48} /></span>
                    <span style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                      <span style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "clamp(16px,2.4vw,22px)",
                        fontWeight: 800,
                        letterSpacing: "0.01em",
                        textShadow: "0 2px 4px rgba(0,0,0,0.45)",
                      }}>
                        {opt.label}
                      </span>
                      {opt.note && (
                        <span style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "12px",
                          fontWeight: 600,
                          opacity: 0.92,
                          marginTop: "3px",
                          textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                        }}>
                          {opt.note}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
