import { CONTACTS, PERSON_DOMAIN, PERSON_NAME } from "@/lib/about";
import type { Lang } from "@/lib/dictionaries";
import { projects } from "@/lib/projects";
import { COPY } from "@/lib/site/copy";
import { SECTIONS } from "@/lib/site/sections";
import { TIMELINE } from "@/lib/site/timeline";
import type { SubstackPost } from "@/lib/substack";

/** Obsah jednotlivých panelů pásu. Čistě prezentační — stav drží SiteStrip. */

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
              <h3 className="mm-tl-org">{t.org}</h3>
              <p className="mm-tl-role">{t.role[lang]}</p>
              <p className="mm-tl-text">{t.body[lang]}</p>
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
      <p className="mm-panel-lead">{s.summary[lang]}</p>
      <div className="mm-projects">
        {projects.map((p) => {
          const cls = `mm-project${p.status === "past" ? " is-past" : ""}`;
          return p.url ? (
            <a key={p.name} href={p.url} className={cls} data-type={p.typeStyle} target="_blank" rel="noopener noreferrer">
              {p.name}
            </a>
          ) : (
            <span key={p.name} className={cls} data-type={p.typeStyle}>{p.name}</span>
          );
        })}
      </div>
      <p className="mm-panel-note">{COPY.projectsNote[lang]}</p>
    </div>
  );
}

export function ThoughtsPanel({ lang, posts }: { lang: Lang; posts: SubstackPost[] }) {
  const s = SECTIONS[3];
  return (
    <div className="mm-inner">
      <h2 className="mm-panel-title">{s.title[lang]}</h2>
      <p className="mm-panel-lead">{s.summary[lang]}</p>
      {posts.length === 0 ? (
        <p className="mm-panel-note">{COPY.thoughtsEmpty[lang]}</p>
      ) : (
        <ul className="mm-posts">
          {posts.map((p) => (
            <li key={p.link}>
              <a href={p.link} className="mm-post" target="_blank" rel="noopener noreferrer">
                <span className="mm-post-date">
                  {p.isoDate ? new Date(p.isoDate).toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-GB", { year: "numeric", month: "short" }) : ""}
                </span>
                <span className="mm-post-title">{p.title}</span>
                <span className="mm-post-excerpt">{p.excerpt}</span>
              </a>
            </li>
          ))}
        </ul>
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
