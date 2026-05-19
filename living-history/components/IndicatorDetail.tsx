"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import {
  indicatorInfo,
  indicatorData,
  empireInfo,
  type IndicatorKey,
  type EmpireKey,
} from "@/lib/bigCycleData";

interface Props {
  indicatorKey: IndicatorKey;
}

const EMPIRE_KEYS: EmpireKey[] = ["dutch", "british", "us", "china"];

interface TooltipState {
  empire: EmpireKey;
  year: number;
  value: number;
  x: number;
  y: number;
}

export default function IndicatorDetail({ indicatorKey }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const indicator = indicatorInfo[indicatorKey];

  const drawChart = useCallback(() => {
    if (!svgRef.current || !containerRef.current || containerWidth === 0) return;

    const isMobile = containerWidth < 600;
    const margin = { top: 40, right: isMobile ? 12 : 32, bottom: 52, left: isMobile ? 36 : 52 };
    const svgH = Math.min(420, Math.max(280, containerWidth * 0.42));
    const W = containerWidth - margin.left - margin.right;
    const H = svgH - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", containerWidth).attr("height", svgH);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Collect all data points for this indicator to determine year extent
    const allPts = EMPIRE_KEYS.flatMap((ek) =>
      indicatorData[indicatorKey][ek].map((d) => d.year)
    );
    const [minYear, maxYear] = d3.extent(allPts) as [number, number];

    const xScale = d3.scaleLinear().domain([minYear, maxYear]).range([0, W]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([H, 0]);

    // Horizontal grid lines
    g.selectAll("line.h-grid")
      .data(yScale.ticks(5))
      .join("line")
      .attr("x1", 0).attr("x2", W)
      .attr("y1", (d) => yScale(d)).attr("y2", (d) => yScale(d))
      .attr("stroke", "#8b7355").attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "4 6").attr("opacity", 0.4);

    // Draw a line + dots per empire
    EMPIRE_KEYS.forEach((ek) => {
      const series = indicatorData[indicatorKey][ek];
      const eInfo = empireInfo[ek];

      const lineGen = d3
        .line<{ year: number; value: number }>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.value))
        .curve(d3.curveCatmullRom.alpha(0.5));

      const areaGen = d3
        .area<{ year: number; value: number }>()
        .x((d) => xScale(d.year))
        .y0(H).y1((d) => yScale(d.value))
        .curve(d3.curveCatmullRom.alpha(0.5));

      // Area fill
      g.append("path")
        .datum(series)
        .attr("fill", eInfo.color)
        .attr("fill-opacity", 0.07)
        .attr("d", areaGen as never);

      // Line
      g.append("path")
        .datum(series)
        .attr("fill", "none")
        .attr("stroke", eInfo.color)
        .attr("stroke-width", 2)
        .attr("d", lineGen as never);

      // Interactive dots
      series.forEach((pt) => {
        g.append("circle")
          .attr("cx", xScale(pt.year))
          .attr("cy", yScale(pt.value))
          .attr("r", 12)
          .attr("fill", "transparent")
          .attr("cursor", "pointer")
          .on("mouseenter", (ev: MouseEvent) => {
            setTooltip({ empire: ek, year: pt.year, value: pt.value, x: ev.clientX, y: ev.clientY });
          })
          .on("mouseleave", () => setTooltip(null));

        g.append("circle")
          .attr("cx", xScale(pt.year))
          .attr("cy", yScale(pt.value))
          .attr("r", 3.5)
          .attr("fill", eInfo.color)
          .attr("stroke", "#e8dfc8")
          .attr("stroke-width", 1.2)
          .attr("pointer-events", "none");
      });
    });

    // X axis
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(
        d3.range(
          Math.ceil(minYear / 100) * 100,
          Math.floor(maxYear / 100) * 100 + 1,
          100
        ).concat([2025])
      )
      .tickFormat((d) => String(d))
      .tickSize(3);

    g.append("g")
      .attr("transform", `translate(0,${H})`)
      .call(xAxis)
      .call((ax) => ax.select(".domain").attr("stroke", "#8b7355"))
      .call((ax) => ax.selectAll(".tick line").attr("stroke", "#8b7355").attr("opacity", 0.5))
      .call((ax) =>
        ax.selectAll("text")
          .attr("fill", "#5c3a1e")
          .attr("font-family", "var(--font-playfair), Georgia, serif")
          .attr("font-size", "11px")
          .attr("dy", "1.2em")
      );

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5).tickSize(3))
      .call((ax) => ax.select(".domain").attr("stroke", "#8b7355"))
      .call((ax) => ax.selectAll(".tick line").attr("stroke", "#8b7355").attr("opacity", 0.5))
      .call((ax) =>
        ax.selectAll("text")
          .attr("fill", "#5c3a1e")
          .attr("font-family", "var(--font-playfair), Georgia, serif")
          .attr("font-size", "11px")
      );

    // Y label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", isMobile ? -28 : -42)
      .attr("x", -H / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#8b7355")
      .attr("font-size", "10px")
      .attr("font-family", "var(--font-playfair), Georgia, serif")
      .attr("letter-spacing", "0.1em")
      .text("SCORE (0–100)");
  }, [containerWidth, indicatorKey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.getBoundingClientRect().width));
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Current rankings
  const rankings = EMPIRE_KEYS
    .map((ek) => {
      const series = indicatorData[indicatorKey][ek];
      return { key: ek, value: series[series.length - 1].value };
    })
    .sort((a, b) => b.value - a.value);

  return (
    <div className="fade-in px-4 sm:px-8 py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <p
          className="text-xs tracking-widest uppercase mb-1"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            color: "#8b7355",
            letterSpacing: "0.22em",
          }}
        >
          Key Indicator
        </p>
        <h2
          className="text-3xl sm:text-4xl leading-tight mb-3"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#2c1810" }}
        >
          {indicator.label}
        </h2>
        <p
          className="text-base leading-relaxed max-w-2xl"
          style={{ fontFamily: "var(--font-crimson), Georgia, serif", color: "#4a2e1c" }}
        >
          {indicator.description}
        </p>
        <p
          className="text-xs mt-3 leading-relaxed max-w-2xl"
          style={{
            fontFamily: "var(--font-crimson), Georgia, serif",
            color: "#8b7355",
            opacity: 0.8,
          }}
        >
          <span style={{ fontWeight: 600, letterSpacing: "0.05em" }}>Source: </span>
          {indicator.source}
        </p>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="w-full relative">
        <svg ref={svgRef} className="w-full" />
        {tooltip && (
          <div
            className="chart-tooltip fade-in"
            style={{
              left: Math.min(tooltip.x + 16, window.innerWidth - 220),
              top: tooltip.y - 8,
            }}
          >
            <div
              className="text-xs font-bold tracking-wider mb-1"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: empireInfo[tooltip.empire].color,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {empireInfo[tooltip.empire].label}
            </div>
            <div
              style={{ fontFamily: "var(--font-crimson), Georgia, serif", color: "#2c1810" }}
            >
              <span className="text-xl font-bold">{tooltip.value}</span>
              <span className="text-sm opacity-60"> / 100 in {tooltip.year}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend row */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {EMPIRE_KEYS.map((ek) => (
          <div key={ek} className="flex items-center gap-2">
            <div
              className="rounded-full"
              style={{ width: 9, height: 9, background: empireInfo[ek].color, flexShrink: 0 }}
            />
            <span
              className="text-xs"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#5c3a1e" }}
            >
              {empireInfo[ek].label}
            </span>
          </div>
        ))}
      </div>

      {/* Current rankings */}
      <div className="mt-6">
        <div
          className="ornament-rule mb-4"
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
            Current Rankings
          </span>
        </div>
        <div className="flex flex-col gap-2 max-w-sm">
          {rankings.map((r, i) => {
            const eInfo = empireInfo[r.key];
            return (
              <div key={r.key} className="flex items-center gap-3">
                <span
                  className="text-xs opacity-50 w-5 text-right"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#5c3a1e" }}
                >
                  {i + 1}.
                </span>
                <div
                  className="h-5 rounded-sm"
                  style={{
                    width: `${r.value * 2}px`,
                    background: eInfo.color,
                    opacity: 0.7,
                    minWidth: 4,
                    transition: "width 0.4s ease",
                  }}
                />
                <span
                  className="text-xs"
                  style={{ fontFamily: "var(--font-crimson), Georgia, serif", color: "#2c1810" }}
                >
                  {eInfo.label}
                </span>
                <span
                  className="text-xs opacity-60"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: eInfo.color }}
                >
                  {r.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
