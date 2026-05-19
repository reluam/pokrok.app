"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import {
  historicalData,
  historicalEvents,
  scenarios,
  type HistoricalEvent,
  type Scenario,
  type DataPoint,
} from "@/lib/bigCycleData";

interface TooltipState {
  event: HistoricalEvent;
  x: number;
  y: number;
}

const EMPIRE_CONFIG = {
  dutch:   { label: "Dutch Republic",  color: "#c87941", gradId: "grad-dutch"   },
  british: { label: "British Empire",  color: "#2e6b4f", gradId: "grad-british" },
  us:      { label: "United States",   color: "#1e3a5f", gradId: "grad-us"      },
  china:   { label: "China",           color: "#8b1a1a", gradId: "grad-china"   },
} as const;

type EmpireKey = keyof typeof EMPIRE_CONFIG;

// Linear interpolation between two data points
function interpolate(
  data: DataPoint[],
  year: number,
  empire: EmpireKey
): number {
  const pts = data.filter((d) => d[empire] !== undefined);
  const before = [...pts].reverse().find((d) => d.year <= year);
  const after = pts.find((d) => d.year >= year);
  if (!before) return (after?.[empire] as number) ?? 50;
  if (!after) return (before[empire] as number) ?? 50;
  if (before.year === after.year) return (before[empire] as number) ?? 50;
  const t = (year - before.year) / (after.year - before.year);
  return (
    (before[empire] as number) +
    t * ((after[empire] as number) - (before[empire] as number))
  );
}

export default function BigCycleChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeScenario, setActiveScenario] = useState<string>("transition");
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [width, setWidth] = useState(0);

  const currentScenario: Scenario =
    scenarios.find((s) => s.key === activeScenario) ?? scenarios[0];

  const drawChart = useCallback(() => {
    if (!svgRef.current || !containerRef.current || width === 0) return;

    const containerWidth = width;
    const isMobile = containerWidth < 640;
    const margin = {
      top: 48,
      right: isMobile ? 16 : 40,
      bottom: 56,
      left: isMobile ? 36 : 56,
    };
    const svgHeight = Math.min(520, Math.max(340, containerWidth * 0.48));
    const innerW = containerWidth - margin.left - margin.right;
    const innerH = svgHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg
      .attr("width", containerWidth)
      .attr("height", svgHeight)
      .attr("viewBox", `0 0 ${containerWidth} ${svgHeight}`);

    const defs = svg.append("defs");

    // Gradient per empire (area fill)
    Object.entries(EMPIRE_CONFIG).forEach(([, cfg]) => {
      const grad = defs
        .append("linearGradient")
        .attr("id", cfg.gradId)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");
      grad
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", cfg.color)
        .attr("stop-opacity", "0.25");
      grad
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", cfg.color)
        .attr("stop-opacity", "0.02");
    });

    // Future region gradient
    const futureGrad = defs
      .append("linearGradient")
      .attr("id", "grad-future")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    futureGrad
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#c9a84c")
      .attr("stop-opacity", "0");
    futureGrad
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#c9a84c")
      .attr("stop-opacity", "0.08");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear().domain([1500, 2100]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 85]).range([innerH, 0]);

    // Horizontal grid lines
    g.append("g")
      .selectAll("line.h-grid")
      .data(yScale.ticks(5))
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#8b7355")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "4 6")
      .attr("opacity", 0.45);

    // Century marker lines
    g.append("g")
      .selectAll("line.century")
      .data([1500, 1600, 1700, 1800, 1900, 2000, 2100])
      .join("line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", 0)
      .attr("y2", innerH)
      .attr("stroke", "#8b7355")
      .attr("stroke-width", 0.4)
      .attr("stroke-dasharray", "2 6")
      .attr("opacity", 0.35);

    // Future region tint
    const futureX = xScale(2025);
    g.append("rect")
      .attr("x", futureX)
      .attr("y", 0)
      .attr("width", innerW - futureX)
      .attr("height", innerH)
      .attr("fill", "url(#grad-future)");

    // "PROJECTED" label
    g.append("text")
      .attr("x", futureX + (innerW - futureX) / 2)
      .attr("y", 16)
      .attr("text-anchor", "middle")
      .attr("fill", "#8b7355")
      .attr("font-size", isMobile ? "9px" : "10px")
      .attr("font-family", "var(--font-playfair), Georgia, serif")
      .attr("letter-spacing", "0.18em")
      .text("PROJECTED");

    // Line/area generators (historical)
    const histLine = (empire: EmpireKey) =>
      d3
        .line<DataPoint>()
        .x((d) => xScale(d.year))
        .y((d) => yScale((d[empire] as number) ?? 0))
        .defined((d) => d[empire] !== undefined)
        .curve(d3.curveCatmullRom.alpha(0.5));

    const histArea = (empire: EmpireKey) =>
      d3
        .area<DataPoint>()
        .x((d) => xScale(d.year))
        .y0(yScale(0))
        .y1((d) => yScale((d[empire] as number) ?? 0))
        .defined((d) => d[empire] !== undefined)
        .curve(d3.curveCatmullRom.alpha(0.5));

    // Draw each empire
    (Object.keys(EMPIRE_CONFIG) as EmpireKey[]).forEach((empire) => {
      const cfg = EMPIRE_CONFIG[empire];
      const data = historicalData.filter((d) => d.year <= 2025);

      // Area fill
      g.append("path")
        .datum(data)
        .attr("fill", `url(#${cfg.gradId})`)
        .attr("d", histArea(empire) as never);

      // Line stroke
      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", cfg.color)
        .attr("stroke-width", empire === "us" || empire === "china" ? 2.2 : 1.8)
        .attr("d", histLine(empire) as never);
    });

    // Future scenario lines
    const futureLineGen = d3
      .line<{ year: number; us: number; china: number }>()
      .x((d) => xScale(d.year))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // US future
    g.append("path")
      .datum(currentScenario.points)
      .attr("fill", "none")
      .attr("stroke", EMPIRE_CONFIG.us.color)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "8 4")
      .attr("opacity", 0.75)
      .attr(
        "d",
        futureLineGen.y((d) => yScale(d.us)) as never
      );

    // China future
    g.append("path")
      .datum(currentScenario.points)
      .attr("fill", "none")
      .attr("stroke", EMPIRE_CONFIG.china.color)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "8 4")
      .attr("opacity", 0.75)
      .attr(
        "d",
        futureLineGen.y((d) => yScale(d.china)) as never
      );

    // Historical event dots
    historicalEvents.forEach((ev) => {
      const empireForY: EmpireKey =
        ev.empire === "global"
          ? "us"
          : (ev.empire as EmpireKey);
      const yVal = interpolate(historicalData, ev.year, empireForY);
      const cx = xScale(ev.year);
      const cy = yScale(ev.year === 2025 ? yVal + 4 : yVal);
      const color =
        ev.empire === "global"
          ? "#5c3a1e"
          : EMPIRE_CONFIG[ev.empire as EmpireKey].color;

      // Invisible hit-area
      g.append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 12)
        .attr("fill", "transparent")
        .attr("cursor", "pointer")
        .on("mouseenter", (mouseEvent: MouseEvent) => {
          setTooltip({
            event: ev,
            x: mouseEvent.clientX,
            y: mouseEvent.clientY,
          });
        })
        .on("mouseleave", () => setTooltip(null));

      // Visible dot
      g.append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", ev.year === 2025 ? 5 : 3.5)
        .attr("fill", color)
        .attr("stroke", "#e8dfc8")
        .attr("stroke-width", 1.5)
        .attr("pointer-events", "none");

      // "NOW" pulsing ring
      if (ev.year === 2025) {
        g.append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 9)
          .attr("fill", "none")
          .attr("stroke", "#2c1810")
          .attr("stroke-width", 1)
          .attr("opacity", 0.35)
          .attr("pointer-events", "none");
      }
    });

    // "NOW" vertical line
    g.append("line")
      .attr("x1", xScale(2025))
      .attr("x2", xScale(2025))
      .attr("y1", 0)
      .attr("y2", innerH)
      .attr("stroke", "#2c1810")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "6 3")
      .attr("opacity", 0.6);

    g.append("text")
      .attr("x", xScale(2025))
      .attr("y", -8)
      .attr("text-anchor", "middle")
      .attr("fill", "#2c1810")
      .attr("font-size", "10px")
      .attr("font-family", "var(--font-playfair), Georgia, serif")
      .attr("letter-spacing", "0.15em")
      .attr("font-weight", "bold")
      .text("NOW");

    // X axis
    const xTicks = isMobile
      ? [1500, 1600, 1700, 1800, 1900, 2000, 2100]
      : [1500, 1600, 1700, 1800, 1900, 2000, 2025, 2050, 2100];

    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(xTicks)
      .tickFormat((d) => String(d))
      .tickSize(4);

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(xAxis)
      .call((ax) => ax.select(".domain").attr("stroke", "#8b7355"))
      .call((ax) =>
        ax
          .selectAll(".tick line")
          .attr("stroke", "#8b7355")
          .attr("opacity", 0.6)
      )
      .call((ax) =>
        ax
          .selectAll("text")
          .attr("fill", "#5c3a1e")
          .attr("font-family", "var(--font-playfair), Georgia, serif")
          .attr("font-size", isMobile ? "10px" : "11px")
          .attr("dy", "1.2em")
      );

    // Y axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => String(d))
      .tickSize(4);

    g.append("g")
      .call(yAxis)
      .call((ax) => ax.select(".domain").attr("stroke", "#8b7355"))
      .call((ax) =>
        ax
          .selectAll(".tick line")
          .attr("stroke", "#8b7355")
          .attr("opacity", 0.6)
      )
      .call((ax) =>
        ax
          .selectAll("text")
          .attr("fill", "#5c3a1e")
          .attr("font-family", "var(--font-playfair), Georgia, serif")
          .attr("font-size", isMobile ? "10px" : "11px")
      );

    // Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", isMobile ? -28 : -42)
      .attr("x", -innerH / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#8b7355")
      .attr("font-size", "10px")
      .attr("font-family", "var(--font-playfair), Georgia, serif")
      .attr("letter-spacing", "0.12em")
      .text("COMPOSITE POWER INDEX");
  }, [width, currentScenario]);

  // Observe container resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setWidth(el.getBoundingClientRect().width);
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  // Draw / redraw on width or scenario change
  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div className="w-full">
      {/* Chart */}
      <div ref={containerRef} className="w-full relative">
        <svg ref={svgRef} className="w-full" />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="chart-tooltip fade-in"
            style={{
              left: Math.min(tooltip.x + 16, window.innerWidth - 310),
              top: tooltip.y - 12,
            }}
          >
            <div
              className="text-xs font-bold tracking-widest mb-1"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: "#5c3a1e",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              {tooltip.event.year} — {tooltip.event.label}
            </div>
            <p
              className="text-sm leading-snug"
              style={{
                fontFamily: "var(--font-crimson), Georgia, serif",
                color: "#2c1810",
                fontSize: "0.9rem",
              }}
            >
              {tooltip.event.description}
            </p>
          </div>
        )}
      </div>

      {/* Legend + scenario controls */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between px-1">
        {/* Empire legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {(Object.entries(EMPIRE_CONFIG) as [EmpireKey, typeof EMPIRE_CONFIG[EmpireKey]][]).map(
            ([key, cfg]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="rounded-full"
                  style={{
                    width: 10,
                    height: 10,
                    background: cfg.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  className="text-xs tracking-wide"
                  style={{
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    color: "#5c3a1e",
                    fontSize: "0.75rem",
                  }}
                >
                  {cfg.label}
                </span>
              </div>
            )
          )}
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 18,
                height: 1.5,
                background: "repeating-linear-gradient(90deg,#2c1810 0px,#2c1810 6px,transparent 6px,transparent 10px)",
                flexShrink: 0,
              }}
            />
            <span
              className="text-xs tracking-wide"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: "#5c3a1e",
                fontSize: "0.75rem",
              }}
            >
              Projected trajectory
            </span>
          </div>
        </div>

        {/* Scenario selector */}
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Future scenario"
        >
          {scenarios.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveScenario(s.key)}
              className="px-3 py-1 text-xs border rounded-sm transition-colors duration-200 cursor-pointer"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                letterSpacing: "0.06em",
                fontSize: "0.72rem",
                ...(activeScenario === s.key
                  ? { background: "#5c3a1e", color: "#e8dfc8", borderColor: "#5c3a1e" }
                  : { background: "transparent", color: "#5c3a1e", borderColor: "#8b7355" }),
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active scenario description */}
      <div
        className="mt-4 border-l-2 pl-4 py-1"
        style={{ borderColor: "#8b7355" }}
      >
        <div
          className="text-xs mb-1"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            color: "#8b7355",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontSize: "0.68rem",
          }}
        >
          {currentScenario.tagline}
        </div>
        <p
          className="text-sm leading-relaxed"
          style={{
            fontFamily: "var(--font-crimson), Georgia, serif",
            color: "#4a2e1c",
            fontSize: "0.92rem",
          }}
        >
          {currentScenario.description}
        </p>
      </div>
    </div>
  );
}
