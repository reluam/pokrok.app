// Lehké CSS/SVG mini-vizualizace pro karty experimentů.
// Pozn.: odds motiv je server-rendered náhoda (stránka je force-dynamic) → nové číslo při každém načtení.

import { scenarios } from "@/lib/odds";

type Motif = "bars" | "eq" | "wave" | "stars" | "digits" | "book" | "path" | "rings" | "odds";

const MOTIF: Record<string, Motif> = {
  encyklopedie: "book",
  sound: "wave",
  music: "bars",
  radio: "eq",
  brain: "rings",
};

const STAR_POS = [
  [12, 30], [22, 65], [34, 22], [44, 50], [55, 72], [64, 32],
  [74, 58], [83, 26], [88, 68], [28, 44], [50, 28], [70, 76], [18, 80], [60, 52],
];

// Cesta životem – body a poslední je cíl (vlajka)
const PATH_PTS: [number, number][] = [[16, 64], [48, 38], [80, 62], [112, 34], [144, 58]];
const FLAG: [number, number] = [174, 40];

export function ExperimentPreview({ slug, color, lang = "cs" }: { slug: string; color: string; lang?: "cs" | "en" }) {
  const motif = MOTIF[slug] ?? "bars";
  const oddsScenario = motif === "odds" ? scenarios[Math.floor(Math.random() * scenarios.length)] : null;
  return (
    <div className="exp-visual" style={{ background: color }}>
      {motif === "bars" && (
        <div className="m-bars">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.11}s` }} />
          ))}
        </div>
      )}

      {/* Spaghetti Radio – ekvalizér přes celou šířku */}
      {motif === "eq" && (
        <div className="m-eq">
          {Array.from({ length: 22 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${(i % 7) * 0.1}s`, animationDuration: `${0.7 + (i % 4) * 0.18}s` }} />
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

      {/* How much time – měnící se čísla přes celou šířku */}
      {motif === "digits" && (
        <div className="m-digits">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="m-digit">
              <span className="m-reel" style={{ animationDuration: `${0.85 + (i % 4) * 0.22}s` }}>
                {"0123456789".split("").map((d, j) => <b key={j}>{d}</b>)}
                <b>0</b>
              </span>
            </span>
          ))}
        </div>
      )}

      {/* VVV – listující kniha */}
      {motif === "book" && (
        <div className="m-book">
          <span className="pg l" />
          <span className="pg r" />
          <span className="leaf" style={{ background: color }} />
        </div>
      )}

      {/* Journey – cesta z kuliček, postupné zvýraznění, cílová vlajka */}
      {motif === "path" && (
        <svg className="m-path" viewBox="0 0 200 92" width="88%" preserveAspectRatio="xMidYMid meet">
          <polyline
            className="m-path-line"
            points={[...PATH_PTS, FLAG].map(([x, y]) => `${x},${y}`).join(" ")}
            pathLength={1}
            fill="none"
          />
          {PATH_PTS.map(([x, y], i) => (
            <circle key={i} className="m-path-dot" cx={x} cy={y} r="5" style={{ animationDelay: `${i * 0.42}s` }} />
          ))}
          {/* cílová vlajka */}
          <g className="m-flag">
            <line x1={FLAG[0]} y1={FLAG[1]} x2={FLAG[0]} y2={FLAG[1] - 26} />
            <rect x={FLAG[0]} y={FLAG[1] - 26} width="22" height="15" />
            <rect className="chk" x={FLAG[0]} y={FLAG[1] - 26} width="5.5" height="7.5" />
            <rect className="chk" x={FLAG[0] + 11} y={FLAG[1] - 26} width="5.5" height="7.5" />
            <rect className="chk" x={FLAG[0] + 5.5} y={FLAG[1] - 18.5} width="5.5" height="7.5" />
            <rect className="chk" x={FLAG[0] + 16.5} y={FLAG[1] - 18.5} width="5.5" height="7.5" />
          </g>
        </svg>
      )}

      {/* odds – náhodná pravděpodobnost přímo v kartě (nové číslo při každém načtení) */}
      {motif === "odds" && oddsScenario && (
        <div className="m-odds">
          <span className="m-odds-q">{lang === "en" ? oddsScenario.question.en : oddsScenario.question.cs}</span>
          <span className="m-odds-v">{oddsScenario.odds}</span>
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
