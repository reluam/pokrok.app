interface ContentItem {
  title: string;
  description: string;
  date: string;
  type: "článek" | "kniha" | "experiment";
}

const sampleContent: ContentItem[] = [
  {
    title: "Jak jsem přestal být projektový manažer",
    description: "Ve 30 jsem vystoupil z kolečka. Co jsem se naučil o změně kariéry a hledání vlastního směru.",
    date: "Leden 2025",
    type: "článek",
  },
  {
    title: "5 pilířů Žiju life",
    description: "Zvídavost, Otevřenost, Upřímnost, Hravost a Radost. Jak tyhle hodnoty mění můj přístup k životu.",
    date: "Prosinec 2024",
    type: "článek",
  },
  {
    title: "Testuju: Intermittent fasting",
    description: "Můj měsíční experiment s časově omezeným stravováním. Co funguje, co ne, a proč to možná není pro každého.",
    date: "Listopad 2024",
    type: "experiment",
  },
];

export default function ContentGrid() {
  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50 paper-texture overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground" style={{ fontWeight: 400 }}>
            <span className="hand-drawn-underline">Inspirace z laboratoře</span>
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Moje nejnovější články, tipy na knihy, diety nebo systémy, které zrovna testuju na vlastní kůži.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleContent.map((item, index) => (
            <article
              key={index}
              className="bg-white rounded-2xl p-6 md:p-8 border-2 border-black/5 hover:border-accent/50 transition-all hover:shadow-xl hover:-translate-y-1 space-y-4 transform"
              style={{ transform: `rotate(${index % 2 === 0 ? '-0.5deg' : '0.5deg'})` }}
            >
              <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-medium rounded-full border border-accent/20">
                {item.type}
              </span>
              <h3 className="text-xl md:text-2xl text-foreground" style={{ fontWeight: 400 }}>
                {item.title}
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                {item.description}
              </p>
              <p className="text-sm text-foreground/50">
                {item.date}
              </p>
            </article>
          ))}
        </div>
        
        <div className="text-center">
          <a
            href="/inspirace"
            className="btn-playful inline-block px-8 py-4 border-2 border-foreground/20 rounded-full text-lg font-medium hover:border-accent hover:text-accent transition-colors shadow-md hover:shadow-lg"
          >
            Zobrazit všechny inspirace
          </a>
        </div>
      </div>
    </section>
  );
}
