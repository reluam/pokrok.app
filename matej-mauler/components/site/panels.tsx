"use client";

import { useState } from "react";
import { CONTACTS, PERSON_DOMAIN, PERSON_NAME } from "@/lib/about";
import type { Lang } from "@/lib/dictionaries";
import { projects } from "@/lib/projects";
import { COPY } from "@/lib/site/copy";
import { SECTIONS } from "@/lib/site/sections";
import { THOUGHTS } from "@/lib/site/thoughts";
import { TIMELINE } from "@/lib/site/timeline";
import type { SubstackPost } from "@/lib/substack";

/** Obsah jednotlivých panelů pásu. Stav pásu drží SiteStrip, tady jen rozbalování. */

export function HomePanel({ lang, onNavigate }: { lang: Lang; onNavigate: (index: number) => void }) {
  return (
    <div className="mm-inner">
      <header className="mm-header">
        <div className="mm-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={64} height={64} className="mm-logo" />
          <div>
            <h1 className="mm-name">{PERSON_NAME}</h1>
            <p className="mm-domain">{PERSON_DOMAIN}</p>
          </div>
        </div>
        <p className="mm-description">{COPY.description[lang]}</p>
        <p className="mm-motto">{COPY.motto[lang]}</p>
      </header>

      {/* Každá další sekce má tady svůj shrnující řádek se šipkou doprava. */}
      <ul className="mm-teasers">
        {SECTIONS.slice(1).map((s, i) => (
          <li key={s.id}>
            <a
              href={s.href}
              className="mm-teaser"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                onNavigate(i + 1);
              }}
            >
              <span className="mm-teaser-text">
                <span className="mm-teaser-title">{s.title[lang]}</span>
                <span className="mm-teaser-summary">{s.summary[lang]}</span>
              </span>
              <span className="mm-teaser-arrow" aria-hidden="true">→</span>
              <span className="sr-only">{COPY.goTo[lang]} {s.title[lang]}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WorkPanel({ lang }: { lang: Lang }) {
  const s = SECTIONS[1];
  return (
    <div className="mm-inner">
      <h2 className="mm-panel-title">{s.title[lang]}</h2>
      <p className="mm-panel-lead">{s.summary[lang]}</p>
      <ol className="mm-timeline">
        {TIMELINE.map((t) => (
          <li key={t.id} className={`mm-tl-item${t.current ? " is-current" : ""}`}>
            <span className="mm-tl-period">{t.current ? COPY.timelineNow[lang] : t.period}</span>
            <div className="mm-tl-body">
              <h3 className="mm-tl-role">{t.role[lang]}</h3>
              <p className="mm-tl-org">{t.org}</p>
              <p className="mm-tl-text">{t.body[lang]}</p>
              {t.bullets && t.bullets.length > 0 && (
                <ul className="mm-tl-bullets">
                  {t.bullets.map((b, i) => <li key={i}>{b[lang]}</li>)}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ProjectsPanel({ lang }: { lang: Lang }) {
  const s = SECTIONS[2];
  return (
    <div className="mm-inner">
      <h2 className="mm-panel-title">{s.title[lang]}</h2>
      <p className="mm-panel-lead">{COPY.nowIntro[lang]}</p>
      <ul className="mm-projects">
        {projects.map((p) => {
          const heading = (
            <span className="mm-project" data-type={p.typeStyle}>{p.name}</span>
          );
          return (
            <li key={p.name} className={`mm-project-item${p.status === "past" ? " is-past" : ""}`}>
              {p.url ? (
                <a className="mm-project-link" href={p.url} target="_blank" rel="noopener noreferrer">
                  {heading}
                  <span className="mm-project-arrow" aria-hidden="true">↗</span>
                </a>
              ) : (
                heading
              )}
              <p className="mm-project-blurb">{p.blurb[lang]}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Rozbalovací blok — používají ho krátké myšlenky i články. */
function Expandable({
  title,
  meta,
  preview,
  children,
  lang,
}: {
  title: string;
  meta?: React.ReactNode;
  preview: string;
  children: React.ReactNode;
  lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`mm-entry${open ? " is-open" : ""}`}>
      <button type="button" className="mm-entry-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="mm-entry-title">{title}</span>
        {meta}
        {!open && <span className="mm-entry-preview">{preview}</span>}
        <span className="mm-entry-toggle">{open ? COPY.collapse[lang] : COPY.expand[lang]}</span>
      </button>
      {open && <div className="mm-entry-body">{children}</div>}
    </div>
  );
}

export function ThoughtsPanel({ lang, posts }: { lang: Lang; posts: SubstackPost[] }) {
  const s = SECTIONS[3];
  return (
    <div className="mm-inner">
      <h2 className="mm-panel-title">{s.title[lang]}</h2>
      <p className="mm-panel-lead">{s.summary[lang]}</p>

      <h3 className="mm-block-heading">{COPY.thoughtsShort[lang]}</h3>
      <p className="mm-block-lead">{COPY.thoughtsShortLead[lang]}</p>
      <div className="mm-entries">
        {THOUGHTS.map((t) => (
          <Expandable key={t.id} lang={lang} title={t.title[lang]} preview={t.lead[lang]}>
            <p className="mm-entry-lead">{t.lead[lang]}</p>
            {t.body.map((p, i) => <p key={i}>{p[lang]}</p>)}
          </Expandable>
        ))}
      </div>

      <h3 className="mm-block-heading">{COPY.thoughtsArticles[lang]}</h3>
      {posts.length === 0 ? (
        <p className="mm-panel-note">{COPY.thoughtsEmpty[lang]}</p>
      ) : (
        <div className="mm-entries">
          {posts.map((p) => (
            <Expandable
              key={p.link}
              lang={lang}
              title={p.title}
              preview={p.excerpt}
              meta={
                <span className="mm-entry-meta">
                  {p.isoDate
                    ? new Date(p.isoDate).toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-GB", { year: "numeric", month: "long", day: "numeric" })
                    : ""}
                </span>
              }
            >
              {/* Vlastní text z vlastního feedu; HTML čistí sanitizeArticleHtml v lib/substack.ts */}
              <div className="mm-article" dangerouslySetInnerHTML={{ __html: p.contentHtml }} />
              <a className="mm-panel-out" href={p.link} target="_blank" rel="noopener noreferrer">
                {COPY.articleOrigin[lang]} <span aria-hidden="true">↗</span>
              </a>
            </Expandable>
          ))}
        </div>
      )}

      <a className="mm-panel-out" href="https://matejmauler.substack.com" target="_blank" rel="noopener noreferrer">
        {COPY.thoughtsAll[lang]} <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}

export function ContactPanel({ lang }: { lang: Lang }) {
  const s = SECTIONS[4];
  return (
    <div className="mm-inner">
      <h2 className="mm-panel-title">{s.title[lang]}</h2>
      <p className="mm-panel-lead">{s.summary[lang]}</p>
      <div className="mm-contacts">
        <span className="mm-contacts-label">{COPY.contactLabel[lang]}</span>
        <ul className="mm-contacts-list">
          {CONTACTS.map((c) => (
            <li key={c.id}>
              <a
                href={c.href}
                className="mm-contact"
                {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {c.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
