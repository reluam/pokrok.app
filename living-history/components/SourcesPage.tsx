"use client";

import { indicatorInfo, type IndicatorKey } from "@/lib/bigCycleData";

const INDICATOR_KEYS: IndicatorKey[] = [
  "economy",
  "trade",
  "military",
  "reserve_currency",
  "education",
  "innovation",
  "governance",
  "wealth_equality",
];

interface SourceEntry {
  title: string;
  authors: string;
  year: string;
  description: string;
  url?: string;
}

const POWER_INDEX_SOURCES: SourceEntry[] = [
  {
    title: "Maddison Project Database 2020",
    authors: "Bolt, J. & van Zanden, J. L.",
    year: "2020",
    description:
      "GDP estimates 1500–2018 in Geary-Khamis 2011 USD (PPP). The global standard for long-run historical GDP comparisons. Used to compute Economy sub-index of the Composite Power Index.",
    url: "https://doi.org/10.34894/INZBF2",
  },
  {
    title: "National Material Capabilities v6.0",
    authors: "Singer, J. D., Bremer, S. & Stuckey, J.",
    year: "1972 / 2016",
    description:
      "Composite Index of National Capability (CINC): mean of military personnel share, military expenditure share, iron/steel production, energy consumption, urban population, and total population shares. 1816–2016. Used for Military sub-index.",
    url: "https://correlatesofwar.org",
  },
  {
    title: "Globalizing Capital: A History of the International Monetary System (3rd ed.)",
    authors: "Eichengreen, B.",
    year: "2019",
    description:
      "Historical reconstruction of global reserve currency shares from the Amsterdam guilder era through the euro. Used for Finance/Reserve Currency sub-index (pre-1900 and sterling era).",
  },
  {
    title: "IMF Currency Composition of Official Foreign Exchange Reserves (COFER)",
    authors: "International Monetary Fund",
    year: "2024",
    description:
      "Quarterly data on the currency composition of official foreign exchange reserves. Used for USD reserve currency share 1965–2024.",
    url: "https://data.imf.org/regular.aspx?key=41175",
  },
  {
    title: "WTO Historical Statistics of World Trade",
    authors: "World Trade Organization / Estevadeordal, Frantz & Taylor",
    year: "2003 / 2024",
    description:
      "Pre-1914 world trade data from Estevadeordal et al. (2003); 1948–2024 from WTO historical series. Used for Trade sub-index.",
  },
];

const METHODOLOGY: { label: string; text: string }[] = [
  {
    label: "Composite Power Index",
    text:
      "Mean of four sub-indices (Economy, Trade, Military, Reserve Currency), each independently normalised to a 0–100 scale with documented maximum anchors. Scale is absolute — empire peaks differ rather than each empire being normalised to 100. Maximum observed: USA 1945 ≈ 79.",
  },
  {
    label: "Indicator detail data",
    text:
      "Each of the 8 Key Indicator charts uses independent normalisation with a documented maximum anchor. Education uses raw literacy rate (0–100 %); Governance uses Polity V formula (score + 10) / 20 × 100; all others are ratio variables (share of world total or share of global reserve). Pre-1816 data is estimated from Modelski & Thompson (1988) for military and from Mokyr (2002) for innovation.",
  },
  {
    label: "Future projections",
    text:
      "Three scenario paths (Managed Transition, American Renaissance, Pax Sinica) are qualitative extrapolations based on current trends in Maddison-style GDP growth, IMF projections, and SIPRI military expenditure forecasts. They are not quantitative model outputs and should be treated as illustrative.",
  },
];

function SourceCard({ entry }: { entry: SourceEntry }) {
  return (
    <div
      className="border rounded-sm px-5 py-4"
      style={{ borderColor: "#c4b896", background: "rgba(255,255,255,0.14)" }}
    >
      <div
        className="text-sm font-semibold leading-snug mb-1"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#2c1810" }}
      >
        {entry.title}
      </div>
      <div
        className="text-xs mb-2"
        style={{ fontFamily: "var(--font-crimson), Georgia, serif", color: "#8b7355" }}
      >
        {entry.authors} · {entry.year}
        {entry.url && (
          <>
            {" "}·{" "}
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.72rem",
                color: "#5c3a1e",
                wordBreak: "break-all",
              }}
            >
              {entry.url}
            </span>
          </>
        )}
      </div>
      <p
        className="text-sm leading-relaxed"
        style={{ fontFamily: "var(--font-crimson), Georgia, serif", color: "#4a2e1c" }}
      >
        {entry.description}
      </p>
    </div>
  );
}

export default function SourcesPage() {
  return (
    <div className="fade-in px-4 sm:px-8 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <p
          className="text-xs tracking-widest uppercase mb-1"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            color: "#8b7355",
            letterSpacing: "0.22em",
          }}
        >
          Data Provenance
        </p>
        <h2
          className="text-3xl sm:text-4xl leading-tight mb-3"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#2c1810" }}
        >
          Sources &amp; Methodology
        </h2>
        <p
          className="text-base leading-relaxed max-w-2xl"
          style={{ fontFamily: "var(--font-crimson), Georgia, serif", color: "#4a2e1c" }}
        >
          All data in this application is synthesised from peer-reviewed academic datasets and
          international statistical organisations. No values are fabricated — each data series is
          traceable to a documented source with an explicit normalisation anchor.
        </p>
      </div>

      {/* Methodology */}
      <div className="ornament-rule mb-5" style={{ color: "#8b7355" }}>
        <span
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "0.68rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Methodology
        </span>
      </div>

      <div className="flex flex-col gap-3 mb-10">
        {METHODOLOGY.map((m) => (
          <div
            key={m.label}
            className="border-l-2 pl-4 py-1"
            style={{ borderColor: "#8b7355" }}
          >
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: "#8b7355",
                letterSpacing: "0.15em",
              }}
            >
              {m.label}
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ fontFamily: "var(--font-crimson), Georgia, serif", color: "#4a2e1c" }}
            >
              {m.text}
            </p>
          </div>
        ))}
      </div>

      {/* Power Index sources */}
      <div className="ornament-rule mb-5" style={{ color: "#8b7355" }}>
        <span
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "0.68rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Composite Power Index · Primary Sources
        </span>
      </div>

      <div className="flex flex-col gap-3 mb-10">
        {POWER_INDEX_SOURCES.map((s) => (
          <SourceCard key={s.title} entry={s} />
        ))}
      </div>

      {/* Per-indicator sources */}
      <div className="ornament-rule mb-5" style={{ color: "#8b7355" }}>
        <span
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "0.68rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Key Indicator Sources
        </span>
      </div>

      <div className="flex flex-col gap-4 mb-10">
        {INDICATOR_KEYS.map((key) => {
          const info = indicatorInfo[key];
          return (
            <div key={key} className="border rounded-sm px-5 py-4" style={{ borderColor: "#c4b896", background: "rgba(255,255,255,0.14)" }}>
              <div
                className="text-sm font-semibold mb-1"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#2c1810" }}
              >
                {info.label}
              </div>
              <div
                className="text-xs mb-2 leading-relaxed"
                style={{ fontFamily: "var(--font-crimson), Georgia, serif", color: "#8b7355" }}
              >
                {info.source}
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: "var(--font-crimson), Georgia, serif", color: "#4a2e1c" }}
              >
                {info.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div
        className="border-t pt-6 text-xs leading-relaxed"
        style={{
          borderColor: "#c4b896",
          fontFamily: "var(--font-crimson), Georgia, serif",
          color: "#8b7355",
          opacity: 0.75,
        }}
      >
        This application is based on{" "}
        <em>Principles for Dealing with the Changing World Order</em> by Ray Dalio and is intended
        for educational purposes only. Data values are synthesised interpretations of publicly
        available datasets and should not be cited as primary research. Refer to the original sources
        above for authoritative figures.
      </div>
    </div>
  );
}
