// Hravé bannery experimentů ve stylu neal.fun — každý projekt má vlastní vizuální svět
// (pozadí, motiv, typografii) a název zabudovaný přímo do obrázku.

type Skin = { bg: string; ink: string; shadow?: string };

const SKINS: Record<string, Skin> = {
  encyklopedie: { bg: "linear-gradient(135deg,#FEF3C7 0%,#FDE68A 100%)", ink: "#6b4310" },
  sound: { bg: "linear-gradient(135deg,#E0E7FF 0%,#C7D2FE 100%)", ink: "#27348b" },
  music: { bg: "linear-gradient(135deg,#efe9fb 0%,#ddd0f7 100%)", ink: "#5b2e96" },
  radio: { bg: "linear-gradient(135deg,#DCFCE7 0%,#bbf7d0 100%)", ink: "#14532d" },
  brain: { bg: "linear-gradient(160deg,#1b1230 0%,#3a1d4d 100%)", ink: "#fbcfe8", shadow: "0 1px 18px rgba(244,114,182,0.4)" },
  "decision-maker": { bg: "linear-gradient(135deg,#E0F2FE 0%,#bae6fd 100%)", ink: "#0c4a6e" },
};

// Synapse network — deterministické body + spoje
const NET_NODES: [number, number][] = [[40, 40], [95, 90], [150, 45], [210, 95], [265, 55], [120, 130], [200, 28], [300, 110], [70, 110], [250, 130]];
const NET_EDGES: [number, number][] = [[0, 1], [1, 2], [2, 4], [1, 5], [4, 7], [2, 6], [0, 8], [5, 9], [4, 3], [3, 9]];

// Encyklopedie — síť propojených hesel nudlemi (to, čím encyklopedie doslova je)
const ENC_NODES: [number, number][] = [[42, 50], [108, 30], [172, 70], [240, 38], [298, 92], [78, 112], [208, 120], [148, 92]];
const ENC_EDGES: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 7], [0, 5], [5, 7], [7, 6], [6, 4]];
const ENC_PATHS: string[] = ENC_EDGES.map(([a, b], i) => {
  const [x1, y1] = ENC_NODES[a], [x2, y2] = ENC_NODES[b];
  const nx = -(y2 - y1), ny = x2 - x1, len = Math.hypot(nx, ny) || 1;
  const bow = 16 * (i % 2 ? 1 : -1);
  const cx = (x1 + x2) / 2 + (nx / len) * bow, cy = (y1 + y2) / 2 + (ny / len) * bow;
  return `M ${x1} ${y1} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2} ${y2}`;
});

function Art({ slug }: { slug: string }) {
  switch (slug) {
    case "encyklopedie": // síť hesel propojených nudlemi — mapa poznání
      return (
        <svg className="exp-art-svg" viewBox="0 0 340 152" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {ENC_PATHS.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#b8861f" strokeWidth={3.5} strokeLinecap="round" opacity={0.42} />
          ))}
          {ENC_NODES.map(([x, y], i) => (
            <circle key={i} className="exp-syn" cx={x} cy={y} r={i % 3 === 0 ? 5.5 : 3.8} fill="#a8690f" style={{ animationDelay: `${(i % 5) * 0.35}s` }} />
          ))}
        </svg>
      );
    case "sound": // sinusová vlna přes celou šířku
      return (
        <svg className="exp-art-svg" viewBox="0 0 340 152" preserveAspectRatio="none" aria-hidden>
          <path className="exp-sine" d="M0 76 Q 28 26 56 76 T 112 76 T 168 76 T 224 76 T 280 76 T 336 76 T 392 76 T 448 76" fill="none" stroke="#3b51c4" strokeWidth={4} strokeLinecap="round" opacity={0.5} />
          <path className="exp-sine2" d="M0 76 Q 28 116 56 76 T 112 76 T 168 76 T 224 76 T 280 76 T 336 76 T 392 76 T 448 76" fill="none" stroke="#6d82e6" strokeWidth={3} strokeLinecap="round" opacity={0.4} />
        </svg>
      );
    case "music": // ekvalizér dole + plovoucí noty
      return (
        <div className="exp-art-fill" aria-hidden>
          <div className="exp-eq">{Array.from({ length: 26 }).map((_, i) => <span key={i} style={{ animationDelay: `${(i % 8) * 0.1}s`, animationDuration: `${0.7 + (i % 4) * 0.2}s` }} />)}</div>
          {["♪", "♫", "♩"].map((n, i) => <span key={i} className="exp-note" style={{ left: `${16 + i * 32}%`, animationDelay: `${i * 0.8}s` }}>{n}</span>)}
        </div>
      );
    case "radio": // jen vysílací kruhy ze středu
      return (
        <div className="exp-art-fill" aria-hidden>
          {[0, 0.7, 1.4, 2.1].map((d, i) => <span key={i} className="exp-broadcast" style={{ animationDelay: `${d}s` }} />)}
          <span className="exp-broadcast-core" />
        </div>
      );
    case "brain": // synaptická síť s pulzem
      return (
        <svg className="exp-art-svg" viewBox="0 0 340 152" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {NET_EDGES.map(([a, b], i) => (
            <line key={i} x1={NET_NODES[a][0]} y1={NET_NODES[a][1]} x2={NET_NODES[b][0]} y2={NET_NODES[b][1]} stroke="#f472b6" strokeWidth={1.5} opacity={0.4} />
          ))}
          {NET_NODES.map(([x, y], i) => (
            <circle key={i} className="exp-syn" cx={x} cy={y} r={3.5} fill="#f9a8d4" style={{ animationDelay: `${(i % 5) * 0.3}s` }} />
          ))}
        </svg>
      );
    case "decision-maker": // přetahovaná nudle s uzlem
      return (
        <svg className="exp-art-svg" viewBox="0 0 340 152" preserveAspectRatio="xMidYMid meet" aria-hidden>
          <circle cx={44} cy={76} r={10} fill="#60a5fa" stroke="#0c4a6e" strokeWidth={2} />
          <circle cx={296} cy={76} r={10} fill="#f59e0b" stroke="#0c4a6e" strokeWidth={2} />
          <path className="exp-tug exp-tug-l" d="M 44 76 Q 107 118 170 104" fill="none" stroke="#c8a24a" strokeWidth={4} strokeLinecap="round" />
          <path className="exp-tug exp-tug-r" d="M 170 104 Q 233 118 296 76" fill="none" stroke="#c8a24a" strokeWidth={4} strokeLinecap="round" />
          <circle className="exp-knot" cx={170} cy={104} r={6} fill="#0c4a6e" />
        </svg>
      );
    default: // obecný hravý fallback — plovoucí kuličky
      return (
        <div className="exp-art-fill" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="exp-float" style={{ left: `${(i * 11 + 6) % 96}%`, top: `${(i * 37) % 70 + 12}%`, animationDelay: `${i * 0.4}s`, width: 8 + (i % 3) * 5, height: 8 + (i % 3) * 5 }} />
          ))}
        </div>
      );
  }
}

export function ExperimentPreview({ slug, title, color, lang = "cs" }: { slug: string; title?: string; color: string; lang?: "cs" | "en" }) {
  void lang;
  const skin = SKINS[slug];
  return (
    <div className="exp-banner" style={{ background: skin?.bg ?? color }}>
      <Art slug={slug} />
      {title && <span className="exp-banner-title" style={{ color: skin?.ink ?? "#1a1614", textShadow: skin?.shadow }}>{title}</span>}
    </div>
  );
}
