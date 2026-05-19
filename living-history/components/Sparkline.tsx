"use client";

import * as d3 from "d3";

interface Props {
  data: Array<{ year: number; value: number }>;
  color: string;
  width?: number;
  height?: number;
}

export default function Sparkline({ data, color, width = 120, height = 48 }: Props) {
  if (data.length < 2) return null;

  const xScale = d3
    .scaleLinear()
    .domain([data[0].year, data[data.length - 1].year])
    .range([0, width]);

  const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);

  const lineGen = d3
    .line<{ year: number; value: number }>()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveCatmullRom.alpha(0.5));

  const areaGen = d3
    .area<{ year: number; value: number }>()
    .x((d) => xScale(d.year))
    .y0(height)
    .y1((d) => yScale(d.value))
    .curve(d3.curveCatmullRom.alpha(0.5));

  const pathD = lineGen(data) ?? "";
  const areaD = areaGen(data) ?? "";
  const last = data[data.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      {/* Area fill */}
      <path d={areaD} fill={color} fillOpacity={0.12} />
      {/* Baseline */}
      <line
        x1={0}
        y1={height}
        x2={width}
        y2={height}
        stroke={color}
        strokeOpacity={0.2}
        strokeWidth={0.5}
      />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={1.6} />
      {/* Current value dot */}
      <circle
        cx={xScale(last.year)}
        cy={yScale(last.value)}
        r={2.8}
        fill={color}
      />
    </svg>
  );
}
