// Lehké CSS mini-vizualizace pro karty experimentů (deterministické → bez hydration mismatch).

const MOTIF: Record<string, "bars" | "wave" | "stars" | "grid" | "rings"> = {
  radio: "bars", musicvote: "bars", anthem: "bars",
  sonify: "wave", foundry: "wave",
  vvv: "stars", journey: "stars",
  cas: "grid", odds: "rings",
};

const STAR_POS = [
  [12, 30], [22, 65], [34, 22], [44, 50], [55, 72], [64, 32],
  [74, 58], [83, 26], [88, 68], [28, 44], [50, 28], [70, 76], [18, 80], [60, 52],
];
const GRID_ON = new Set([1, 4, 7, 9, 12, 15, 18, 20, 23, 27, 30, 33, 36, 39, 41, 44]);

export function ExperimentPreview({ slug, color }: { slug: string; color: string }) {
  const motif = MOTIF[slug] ?? "bars";
  return (
    <div className="exp-visual" style={{ background: color }}>
      {motif === "bars" && (
        <div className="m-bars">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.11}s` }} />
          ))}
        </div>
      )}
      {motif === "wave" && (
        <div className="m-wave">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.09}s` }} />
          ))}
        </div>
      )}
      {motif === "stars" && STAR_POS.map(([x, y], i) => (
        <span key={i} className="m-stars-dot" style={{ position: "absolute", width: 5, height: 5, borderRadius: "50%", background: "#1a1614", left: `${x}%`, top: `${y}%`, opacity: 0.2, animation: `m-twk 2.2s ease-in-out infinite`, animationDelay: `${(i % 7) * 0.3}s` }} />
      ))}
      {motif === "grid" && (
        <div className="m-grid">
          {Array.from({ length: 48 }).map((_, i) => (
            <span key={i} className={GRID_ON.has(i) ? "on" : ""} style={GRID_ON.has(i) ? { animationDelay: `${(i % 9) * 0.2}s` } : undefined} />
          ))}
        </div>
      )}
      {motif === "rings" && (
        <>
          {[0, 0.8, 1.6].map((d, i) => (
            <span key={i} style={{ position: "absolute", border: "2px solid #1a1614", borderRadius: "50%", animation: "m-ring 2.4s ease-out infinite", animationDelay: `${d}s` }} />
          ))}
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a1614", position: "relative" }} />
        </>
      )}
    </div>
  );
}
