"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { getQuestions, calcUi, Answers } from "@/lib/questions";
import type { Lang } from "@/lib/dictionaries";
import { Result } from "./Result";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serif: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };

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

  if (step === "result") {
    return <Result answers={answers} onRestart={restart} lang={lang} />;
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
              maxWidth: "640px",
              margin: "0 auto",
              padding: "48px 24px 80px",
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
              marginBottom: q.subtext ? "8px" : "36px",
            }}>
              {q.text}
            </h2>

            {q.subtext && (
              <p style={{
                ...serif,
                fontSize: "15px",
                color: "var(--text-muted)",
                textAlign: "center",
                marginBottom: "36px",
              }}>
                {q.subtext}
              </p>
            )}

            {/* Select options */}
            {q.options && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "10px",
              }}>
                {q.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(q.id, opt.id)}
                    style={{
                      background: "#fff",
                      border: "2px solid var(--border)",
                      borderRadius: "14px",
                      boxShadow: "3px 3px 0 var(--border)",
                      padding: "16px 18px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      textAlign: "left",
                      transition: "transform 140ms ease, box-shadow 140ms ease",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.transform = "translate(-2px,-2px)";
                      el.style.boxShadow = "5px 5px 0 var(--border)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.transform = "";
                      el.style.boxShadow = "3px 3px 0 var(--border)";
                    }}
                  >
                    <span style={{ fontSize: "28px", lineHeight: 1, flexShrink: 0 }}>{opt.emoji}</span>
                    <div>
                      <span style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        display: "block",
                      }}>
                        {opt.label}
                      </span>
                      {opt.note && (
                        <span style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          display: "block",
                          marginTop: "2px",
                        }}>
                          {opt.note}
                        </span>
                      )}
                    </div>
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
