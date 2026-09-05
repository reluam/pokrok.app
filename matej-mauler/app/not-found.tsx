"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/dictionaries";

/**
 * 404 je dvojjazyčná, ale jazyk si bere z cookie AŽ na klientovi — schválně.
 *
 * not-found boundary je součástí stromu každé routy, takže kdyby tahle stránka
 * sáhla na `cookies()` (přes getLang()), Next by zdynamičtěl CELOU aplikaci,
 * ne jen stránky, které jazyk potřebují. Ověřeno měřením: 12 statických rout
 * by spadlo na 2. Cenou je krátké bliknutí angličtiny na 404 — to je levnější
 * než ztráta route cache na celém webu.
 */

const COPY = {
  cs: {
    eyebrow: "Chyba 404",
    title: "Zamotal ses.",
    body: "Tahle stránka tu buď nikdy nebyla, nebo jsem ji smazal — jako 9 z 10 svých nápadů. Žádná velká ztráta.",
    back: "← Zpátky na Spaghetti.ltd",
  },
  en: {
    eyebrow: "Error 404",
    title: "You got tangled.",
    body: "This page either never existed, or I deleted it — like 9 out of 10 of my ideas. No great loss.",
    back: "← Back to Spaghetti.ltd",
  },
} as const;

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };

const readCookieLang = (): Lang => {
  const m = document.cookie.match(/(?:^|;\s*)lang=(cs|en)\b/);
  return m ? (m[1] as Lang) : "en";
};
// Cookie se během prohlížení 404 nemění → prázdný subscribe.
const noSubscribe = () => () => {};

export default function NotFound() {
  // useSyncExternalStore je přesně na „server a klient vidí jinou hodnotu":
  // server vrátí "en", klient přečte cookie. Žádný setState v efektu.
  const lang = useSyncExternalStore(noSubscribe, readCookieLang, () => "en" as Lang);
  const t = COPY[lang];

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 24px",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt=""
        width={120}
        height={120}
        style={{ marginBottom: "8px", animation: "nf-bob 3.5s ease-in-out infinite" }}
      />

      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.24em",
          color: "var(--text-muted)",
          marginBottom: "14px",
        }}
      >
        {t.eyebrow}
      </p>

      <h1
        style={{
          ...display,
          fontSize: "clamp(40px, 9vw, 72px)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.02,
          color: "var(--text-primary)",
          marginBottom: "18px",
        }}
      >
        {t.title}
      </h1>

      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "16px",
          lineHeight: 1.6,
          color: "var(--text-secondary)",
          maxWidth: "440px",
          marginBottom: "40px",
        }}
      >
        {t.body}
      </p>

      <Link
        href="/"
        style={{
          background: "var(--text-primary)",
          color: "var(--bg)",
          border: "2.5px solid var(--text-primary)",
          borderRadius: "12px",
          boxShadow: "4px 4px 0 var(--text-primary)",
          padding: "14px 28px",
          fontFamily: "var(--font-sans)",
          fontSize: "15px",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {t.back}
      </Link>

      <style>{`@keyframes nf-bob { 0%,100% { transform: translateY(-4px) rotate(-2deg); } 50% { transform: translateY(4px) rotate(2deg); } }`}</style>
    </main>
  );
}
