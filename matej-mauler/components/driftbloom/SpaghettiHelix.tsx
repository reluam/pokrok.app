"use client";

// A spaghetti double helix — two noodle strands winding around each other with rungs between, the
// pasta stand-in for DNA. Scrolls seamlessly (the pattern is drawn 2× wide and translated -50%).
export function SpaghettiHelix({ width = 280, height = 76 }: { width?: number; height?: number }) {
  const A = height * 0.3, mid = height / 2, W2 = width * 2, period = 30;
  const yOf = (x: number, ph: number) => mid + Math.sin(x / period + ph) * A;
  const strand = (ph: number) => {
    let d = `M 0 ${yOf(0, ph).toFixed(1)}`;
    for (let x = 6; x <= W2; x += 6) d += ` L ${x} ${yOf(x, ph).toFixed(1)}`;
    return d;
  };
  const rungs: { x: number; y1: number; y2: number; front: boolean }[] = [];
  for (let x = period * 0.5; x <= W2; x += period * 0.7) {
    rungs.push({ x, y1: yOf(x, 0), y2: yOf(x, Math.PI), front: Math.cos(x / period) > 0 });
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: "block", overflow: "hidden" }}>
      <g className="db-helix-move">
        {rungs.filter((r) => !r.front).map((r, i) => (
          <line key={`b${i}`} x1={r.x} y1={r.y1} x2={r.x} y2={r.y2} stroke="rgba(200,60,40,0.35)" strokeWidth={3} strokeLinecap="round" />
        ))}
        <path d={strand(0)} fill="none" stroke="#e6c073" strokeWidth={6} strokeLinecap="round" />
        <path d={strand(Math.PI)} fill="none" stroke="#edcf8f" strokeWidth={6} strokeLinecap="round" />
        {rungs.filter((r) => r.front).map((r, i) => (
          <line key={`f${i}`} x1={r.x} y1={r.y1} x2={r.x} y2={r.y2} stroke="rgba(200,60,40,0.6)" strokeWidth={3} strokeLinecap="round" />
        ))}
      </g>
    </svg>
  );
}
