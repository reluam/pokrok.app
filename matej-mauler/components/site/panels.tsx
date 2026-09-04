"use client";

import { CONTACTS, PERSON_DOMAIN, PERSON_NAME } from "@/lib/about";
import type { Lang } from "@/lib/dictionaries";
import { COPY, DESCRIPTION } from "@/lib/site/copy";
import { SECTIONS } from "@/lib/site/sections";
import { COUNTRIES } from "@/lib/site/countries";
import { IDEAS } from "@/lib/site/ideas";

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
        {DESCRIPTION.map((p, i) => (
          <p key={i} className="mm-description">{p[lang]}</p>
        ))}
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

export function WorkPanel({
  lang,
  zoomed,
  activeCountryId,
  onSelectCountry,
  onToggleZoom,
}: {
  lang: Lang;
  zoomed: boolean;
  activeCountryId: string | null;
  onSelectCountry: (id: string | null) => void;
  onToggleZoom: () => void;
}) {
  const s = SECTIONS[1];
  return (
    <div className="mm-inner">
      <h2 className="mm-panel-title">{s.title[lang]}</h2>
      <p className="mm-panel-lead">{s.summary[lang]}</p>

      <button type="button" className="mm-zoom-toggle" onClick={onToggleZoom}>
        {zoomed ? COPY.zoomOut[lang] : COPY.zoomIn[lang]}
      </button>

      <ul className="mm-countries">
        {COUNTRIES.map((c) => (
          <li
            key={c.id}
            className={`mm-country-item${c.id === activeCountryId ? " is-active" : ""}`}
          >
            <h3 className="mm-country-org">
              <button
                type="button"
                className="mm-country-btn"
                onClick={() => onSelectCountry(c.id === activeCountryId ? null : c.id)}
              >
                {c.org}
              </button>
            </h3>
            <p className="mm-country-text">{c.body[lang]}</p>
            {c.bullets && c.bullets.length > 0 && (
              <ul className="mm-country-bullets">
                {c.bullets.map((b, i) => <li key={i}>{b[lang]}</li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * „Nad čím přemýšlím" — nápady, které Matěj nedělá a myslí si, že by měly
 * existovat. Obsah dodá lib/site/ideas.ts; zatím jen úvod sekce.
 */
export function IdeasPanel({ lang }: { lang: Lang }) {
  const s = SECTIONS[2];
  return (
    <div className="mm-inner">
      <h2 className="mm-panel-title">{s.title[lang]}</h2>
      <p className="mm-panel-lead">{COPY.ideasIntro[lang]}</p>
      <ul className="mm-ideas">
        {IDEAS.map((idea) => (
          <li key={idea.id} className="mm-idea">
            <h3 className="mm-idea-title">{idea.title[lang]}</h3>
            <p className="mm-idea-what">{idea.what[lang]}</p>
            <p className="mm-idea-why">{idea.why[lang]}</p>
            {idea.hard && <p className="mm-idea-hard">{idea.hard[lang]}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ContactPanel({ lang }: { lang: Lang }) {
  const s = SECTIONS[3];
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
