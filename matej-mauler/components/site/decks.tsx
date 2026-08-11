"use client";

import { useCallback, useState } from "react";
import type { Lang } from "@/lib/dictionaries";
import { BELIEFS } from "@/lib/site/beliefs";
import { COPY } from "@/lib/site/copy";
import { THOUGHTS } from "@/lib/site/thoughts";

/** Krok v kruhu — obě komponenty se dají listovat donekonečna oběma směry. */
function step(current: number, delta: number, total: number) {
  return (current + delta + total) % total;
}

/**
 * Rotátor přesvědčení: vždy jen jedno, velké. Přepíná se tečkami nebo klikem
 * na text. Bez autoplay — nic se nehýbe samo, dokud návštěvník nechce.
 */
export function BeliefRotator({ lang }: { lang: Lang }) {
  const [i, setI] = useState(0);
  const b = BELIEFS[i];

  return (
    <div className="mm-beliefs">
      <p className="mm-beliefs-heading">{COPY.beliefsHeading[lang]}</p>
      <button
        type="button"
        className="mm-belief"
        onClick={() => setI((v) => step(v, 1, BELIEFS.length))}
        aria-label={COPY.next[lang]}
      >
        {/* key → text se při přepnutí znovu vykreslí, takže naběhne animace */}
        <span key={b.id} className="mm-belief-claim">{b.claim[lang]}</span>
      </button>
      <p key={`s-${b.id}`} className="mm-belief-support">{b.support[lang]}</p>

      <div className="mm-dots" role="tablist" aria-label={COPY.beliefsHeading[lang]}>
        {BELIEFS.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={idx === i}
            aria-label={item.claim[lang]}
            className={`mm-dot${idx === i ? " is-active" : ""}`}
            onClick={() => setI(idx)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Myšlenky jako řada: vidíš vždy jednu a klikáš doleva/doprava, dokud tě to baví.
 * Šipky fungují i z klávesnice (element má tabIndex a onKeyDown).
 */
export function ThoughtDeck({ lang }: { lang: Lang }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const total = THOUGHTS.length;
  const t = THOUGHTS[i];

  const go = useCallback((delta: 1 | -1) => {
    setDir(delta);
    setI((v) => step(v, delta, total));
  }, [total]);

  return (
    <div
      className="mm-deck"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      }}
    >
      <article key={t.id} className={`mm-card mm-card--${dir > 0 ? "next" : "prev"}`}>
        <h4 className="mm-card-title">{t.title[lang]}</h4>
        <p className="mm-card-lead">{t.lead[lang]}</p>
        {t.body.map((p, idx) => <p key={idx} className="mm-card-text">{p[lang]}</p>)}
      </article>

      <div className="mm-deck-nav">
        <button type="button" className="mm-deck-btn" onClick={() => go(-1)} aria-label={COPY.prev[lang]}>←</button>
        <span className="mm-deck-count" aria-live="polite">{i + 1} / {total}</span>
        <button type="button" className="mm-deck-btn" onClick={() => go(1)} aria-label={COPY.next[lang]}>→</button>
      </div>
    </div>
  );
}
