"use client";

import { useEffect, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Comments } from "./Comments";
import { ACCOUNTS_ENABLED } from "@/lib/features";
import type { Lang } from "@/lib/dictionaries";
import type { Bi, PanelTheme } from "@/lib/experiencePanel";
import { LanguageSwitcher } from "./LanguageSwitcher";

export type ExperiencePanelProps = {
  lang: Lang;
  /** Klíč vlákna komentářů + hodnocení (stabilní, např. "life-manual"). */
  slug: string;
  title: Bi;
  category?: string;
  description?: Bi;
  /** Volitelný návod — každý krok jako jedna položka. */
  guide?: Bi[];
  /** Experience zatím nemá českou verzi — v cs se přidá poznámka. */
  enOnly?: true;
  theme?: PanelTheme;
};

/**
 * Téma → inline CSS proměnné. Panel visí v layoutu mimo DOM experience, takže
 * si její proměnné nezdědí; nasazují se tady na kořen zásuvky i na úchyt.
 * Bez tématu vrací prázdno a globals.css spadne na Spaghetti fallbacky.
 */
function themeVars(t?: PanelTheme): React.CSSProperties {
  if (!t) return {};
  return {
    "--xp-bg": t.bg,
    "--xp-surface": t.surface,
    "--xp-ink": t.ink,
    "--xp-ink-soft": t.inkSoft,
    "--xp-ink-muted": t.inkMuted,
    "--xp-accent": t.accent,
    "--xp-border": t.border,
    "--xp-border-soft": t.borderSoft,
    "--xp-hover": t.hover,
    "--xp-font-display": t.fontDisplay,
    "--xp-font-body": t.fontBody,
  } as React.CSSProperties;
}

const clerkEnabled = ACCOUNTS_ENABLED && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Bez účtů panel nezmizí — popis a návod žádné přihlášení nepotřebují. Zmizí jen
// hodnocení a komentáře. Gate je bez hooků, takže varianta bez Clerku se nikdy
// nedostane k useUser() (a nespadne na chybějícím ClerkProvideru).
export function ExperiencePanel(props: ExperiencePanelProps) {
  if (!clerkEnabled) return <PanelBasic {...props} />;
  return <Panel {...props} />;
}

/** Panel bez účtů: jen „About" — chip, popis, návod. Žádný Clerk, žádný fetch. */
function PanelBasic({ lang, title, category, description, guide, enOnly, theme }: ExperiencePanelProps) {
  const vars = themeVars(theme);
  const [open, setOpen] = useState(false);
  return (
    <>
      {!open && (
        <button className="xp-tab" style={vars} onClick={() => setOpen(true)} aria-label="Open info">
          <span aria-hidden style={{ fontSize: 14 }}>›</span>
          <span>INFO</span>
        </button>
      )}

      <aside className={`xp-drawer${open ? " open" : ""}`} style={vars} aria-hidden={!open}>
        <div className="xp-head">
          <strong style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16, letterSpacing: "-0.01em" }}>{title[lang]}</strong>
          <button className="xp-close" onClick={() => setOpen(false)} aria-label="Close panel">×</button>
        </div>

        <div className="xp-body">
          {category && <span className="xp-chip">{category}</span>}
          {description && <p className="xp-desc">{description[lang]}</p>}

          {guide && guide.length > 0 && (
            <>
              <div className="xp-h">{lang === "cs" ? "Jak to funguje" : "How it works"}</div>
              <ol className="xp-guide">
                {guide.map((g, i) => (
                  <li key={i}>{g[lang]}</li>
                ))}
              </ol>
            </>
          )}

          {enOnly && lang === "cs" && (
            <p className="xp-desc" style={{ opacity: 0.7 }}>
              Pozn.: tahle experience je zatím jen anglicky. Čeština k ní přijde.
            </p>
          )}

          <div className="xp-h">{lang === "cs" ? "Jazyk" : "Language"}</div>
          <LanguageSwitcher lang={lang} />
        </div>
      </aside>
    </>
  );
}

function Panel({ lang, slug, title, category, description, guide, enOnly, theme }: ExperiencePanelProps) {
  const vars = themeVars(theme);
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"about" | "comments">("about");
  const [summary, setSummary] = useState<{ avg: number; count: number; mine: number | null }>({ avg: 0, count: 0, mine: null });
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/ratings?page=${encodeURIComponent(slug)}`, { cache: "no-store" });
        const d = await res.json();
        if (active) setSummary({ avg: Number(d.avg) || 0, count: Number(d.count) || 0, mine: d.mine ?? null });
      } catch {
        /* ticho */
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, isSignedIn]);

  const rate = async (value: number) => {
    if (busy || !isSignedIn) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ page: slug, value }),
      });
      if (res.ok) {
        const d = await res.json();
        setSummary({ avg: Number(d.avg) || 0, count: Number(d.count) || 0, mine: d.mine ?? value });
      }
    } finally {
      setBusy(false);
    }
  };

  const starState = hover || summary.mine || 0;

  return (
    <>
      {!open && (
        <button className="xp-tab" style={vars} onClick={() => setOpen(true)} aria-label="Open info & comments">
          <span aria-hidden style={{ fontSize: 14 }}>›</span>
          <span>INFO</span>
        </button>
      )}

      <aside className={`xp-drawer${open ? " open" : ""}`} style={vars} aria-hidden={!open}>
        <div className="xp-head">
          <strong style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16, letterSpacing: "-0.01em" }}>{title[lang]}</strong>
          <button className="xp-close" onClick={() => setOpen(false)} aria-label="Close panel">×</button>
        </div>

        <div className="xp-tabbar">
          <button className={`xp-tabbtn${tab === "about" ? " active" : ""}`} onClick={() => setTab("about")}>About</button>
          <button className={`xp-tabbtn${tab === "comments" ? " active" : ""}`} onClick={() => setTab("comments")}>Comments</button>
        </div>

        <div className="xp-body">
          {tab === "about" ? (
            <>
              {category && <span className="xp-chip">{category}</span>}
              {description && <p className="xp-desc">{description[lang]}</p>}

              {guide && guide.length > 0 && (
                <>
                  <div className="xp-h">{lang === "cs" ? "Jak to funguje" : "How it works"}</div>
                  <ol className="xp-guide">
                    {guide.map((g, i) => (
                      <li key={i}>{g[lang]}</li>
                    ))}
                  </ol>
                </>
              )}

              {enOnly && lang === "cs" && (
                <p className="xp-desc" style={{ opacity: 0.7 }}>
                  Pozn.: tahle experience je zatím jen anglicky. Čeština k ní přijde.
                </p>
              )}

              <div className="xp-h">Rating</div>
              <div className="xp-stars" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className="xp-star"
                    disabled={!isSignedIn || busy}
                    onMouseEnter={() => isSignedIn && setHover(n)}
                    onClick={() => rate(n)}
                    style={{ color: starState >= n ? "#1a1614" : "rgba(26,22,20,0.2)", cursor: isSignedIn ? "pointer" : "default" }}
                    aria-label={`Rate ${n} of 5`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="xp-rating-meta">
                {summary.count > 0 ? (
                  <>
                    {summary.avg.toFixed(1)} · {summary.count} {summary.count === 1 ? "rating" : "ratings"}
                    {summary.mine ? ` · you: ${summary.mine}★` : ""}
                  </>
                ) : (
                  "No ratings yet"
                )}
              </p>
              {!isSignedIn && (
                <SignInButton mode="modal">
                  <button className="sbtn" style={{ fontSize: 12, padding: "7px 14px", marginTop: 4 }}>Sign in to rate</button>
                </SignInButton>
              )}

              <div className="xp-h">{lang === "cs" ? "Jazyk" : "Language"}</div>
              <LanguageSwitcher lang={lang} />
            </>
          ) : (
            <Comments pageSlug={slug} />
          )}
        </div>
      </aside>
    </>
  );
}
