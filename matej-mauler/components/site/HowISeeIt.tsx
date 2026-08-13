"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { Lang } from "@/lib/dictionaries";
import type { Conviction } from "@/lib/site/beliefs";
import { BELIEFS } from "@/lib/site/beliefs";
import { COPY } from "@/lib/site/copy";
import { RULES } from "@/lib/site/thoughts";

/**
 * Sekce „Jak to vidím": nahoře trojúhelník tří přesvědčení (jak to podle mě je),
 * pod ním kruh pěti pravidel (jak se kvůli tomu chovám). Geometrie je v CSS —
 * tady je jen pořadí a disclosure. Nic se nehýbe samo.
 */

/** Jeden shluk uzlů se sdíleným panelem na `support` otevřené položky. */
function Cluster({
  items,
  lang,
  shape,
  idPrefix,
}: {
  items: Conviction[];
  lang: Lang;
  shape: "triangle" | "circle";
  idPrefix: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const active = items.find((i) => i.id === open) ?? null;
  const panelId = `${idPrefix}-support`;

  return (
    <div className={`mm-cluster mm-cluster--${shape}`}>
      <ul className="mm-nodes">
        {items.map((item, i) => (
          <li key={item.id} className="mm-node" style={{ "--i": i } as CSSProperties}>
            <button
              type="button"
              className={`mm-node-btn${open === item.id ? " is-open" : ""}`}
              aria-expanded={open === item.id}
              aria-controls={panelId}
              onClick={() => setOpen((v) => (v === item.id ? null : item.id))}
            >
              {item.claim[lang]}
            </button>
          </li>
        ))}
      </ul>

      <div id={panelId} className="mm-cluster-support">
        {/* key → text se při přepnutí znovu vykreslí, takže naběhne animace */}
        {active && <p key={active.id} className="mm-support-text">{active.support[lang]}</p>}
      </div>
    </div>
  );
}

export function HowISeeIt({ lang }: { lang: Lang }) {
  return (
    <div className="mm-hisi">
      <Cluster items={BELIEFS} lang={lang} shape="triangle" idPrefix="belief" />
      <p className="mm-hisi-divider">{COPY.inPractice[lang]}</p>
      <Cluster items={RULES} lang={lang} shape="circle" idPrefix="rule" />
    </div>
  );
}
