"use client";

import Sparkline from "./Sparkline";
import {
  empireInfo,
  indicatorInfo,
  indicatorData,
  type EmpireKey,
  type IndicatorKey,
} from "@/lib/bigCycleData";

interface Props {
  empireKey: EmpireKey;
}

const INDICATOR_KEYS = Object.keys(indicatorData) as IndicatorKey[];

export default function EmpireDetail({ empireKey }: Props) {
  const empire = empireInfo[empireKey];

  return (
    <div className="fade-in px-4 sm:px-8 py-6 max-w-5xl">
      {/* Empire header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span
            className="inline-block rounded-full"
            style={{ width: 12, height: 12, background: empire.color, flexShrink: 0 }}
          />
          <p
            className="text-xs tracking-widest uppercase"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              color: empire.color,
              letterSpacing: "0.22em",
            }}
          >
            {empire.years}
          </p>
        </div>
        <h2
          className="text-3xl sm:text-4xl leading-tight mb-3"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#2c1810" }}
        >
          {empire.label}
        </h2>
        <p
          className="text-base leading-relaxed max-w-2xl"
          style={{ fontFamily: "var(--font-crimson), Georgia, serif", color: "#4a2e1c" }}
        >
          {empire.description}
        </p>
      </div>

      {/* Divider */}
      <div
        className="ornament-rule mb-6"
        style={{ color: "#8b7355" }}
      >
        <span
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "0.68rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Key Indicators
        </span>
      </div>

      {/* Indicators grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {INDICATOR_KEYS.map((indKey) => {
          const series = indicatorData[indKey][empireKey];
          const info = indicatorInfo[indKey];
          const current = series[series.length - 1];
          const peak = Math.max(...series.map((d) => d.value));
          const peakYear = series.find((d) => d.value === peak)?.year;
          const trend =
            series.length >= 2
              ? current.value - series[series.length - 2].value
              : 0;

          return (
            <div
              key={indKey}
              className="border rounded-sm px-4 pt-4 pb-3 flex flex-col gap-2"
              style={{
                borderColor: "#c4b896",
                background: "rgba(255,255,255,0.16)",
              }}
            >
              {/* Indicator name */}
              <div
                className="text-xs leading-tight"
                style={{
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  color: "#2c1810",
                  fontWeight: 600,
                }}
              >
                {info.label}
              </div>

              {/* Sparkline */}
              <div className="w-full" style={{ height: 48 }}>
                <Sparkline
                  data={series}
                  color={empire.color}
                  width={220}
                  height={48}
                />
              </div>

              {/* Stats row */}
              <div className="flex items-end justify-between mt-1">
                <div>
                  <div
                    className="text-2xl font-bold leading-none"
                    style={{
                      fontFamily: "var(--font-playfair), Georgia, serif",
                      color: empire.color,
                    }}
                  >
                    {current.value}
                  </div>
                  <div
                    className="text-xs opacity-50 mt-0.5"
                    style={{
                      fontFamily: "var(--font-crimson), Georgia, serif",
                      color: "#5c3a1e",
                    }}
                  >
                    current score
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-xs"
                    style={{
                      fontFamily: "var(--font-crimson), Georgia, serif",
                      color: "#8b7355",
                    }}
                  >
                    Peak: <span style={{ color: empire.color }}>{peak}</span>
                    {peakYear && (
                      <span className="opacity-60"> ({peakYear})</span>
                    )}
                  </div>
                  {trend !== 0 && (
                    <div
                      className="text-xs mt-0.5"
                      style={{
                        color: trend > 0 ? "#2e6b4f" : "#8b1a1a",
                        fontFamily: "var(--font-crimson), Georgia, serif",
                      }}
                    >
                      {trend > 0 ? "▲" : "▼"} {Math.abs(trend)} recent
                    </div>
                  )}
                </div>
              </div>

              {/* Source attribution */}
              <div
                className="text-xs leading-tight mt-1 pt-2 border-t"
                style={{
                  borderColor: "#c4b89640",
                  fontFamily: "var(--font-crimson), Georgia, serif",
                  color: "#8b7355",
                  opacity: 0.7,
                }}
              >
                {info.source.split(";")[0].trim()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Composite summary */}
      <div
        className="mt-8 border-l-2 pl-5 py-2"
        style={{ borderColor: empire.color }}
      >
        <p
          className="text-xs uppercase tracking-widest mb-1"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            color: empire.color,
            letterSpacing: "0.18em",
          }}
        >
          Reading the indicators
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{
            fontFamily: "var(--font-crimson), Georgia, serif",
            color: "#4a2e1c",
          }}
        >
          {empireKey === "dutch" &&
            "The Dutch Republic rose on the back of extraordinary commercial innovation, financial sophistication, and naval power. Its decline followed the classic pattern: success bred complacency, debt expanded to fund wars, and larger rivals (Britain, France) grew strong enough to challenge it."}
          {empireKey === "british" &&
            "Britain's rise was driven by the industrial revolution, a self-reinforcing cycle of trade, military power, and sterling's reserve status. Its post-WWI decline mirrors the US today: debt accumulated to fight wars, the reserve currency share declined, and internal inequalities rose."}
          {empireKey === "us" &&
            "The US reached peak power in 1950, holding every indicator simultaneously. Today the picture is mixed: technology leadership remains strong, but debt, governance, wealth equality, and reserve currency share are all trending negatively — the classic late-cycle configuration."}
          {empireKey === "china" &&
            "China's story is one of historical dominance, catastrophic decline during the 'Century of Humiliation', and a remarkable modern renaissance. It now leads in economy and trade, and is closing rapidly on technology and military — though governance and reserve currency remain areas where the West holds structural advantages."}
        </p>
      </div>
    </div>
  );
}
