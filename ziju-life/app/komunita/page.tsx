import DecorativeShapes from "@/components/DecorativeShapes";

interface Feature {
  title: string;
  description: string;
}

const whatAwaits: Feature[] = [
  {
    title: "Prostor pro tvůj příběh",
    description: "Možnost sdílet své problémy i vítězství v bezpečném prostředí. Zjistíš, že v tom nejsi sám a že tvoje zkušenost může pomoci ostatním.",
  },
  {
    title: "Knihovna ověřených tipů",
    description: "Přístup k praktickým radám a nástrojům, které jsme osobně vyzkoušeli. Šetříme si navzájem čas tím, že sdílíme, co reálně funguje.",
  },
  {
    title: "Společné výzvy",
    description: "Pravidelné výzvy, které nám pomáhají nezůstat jen u slov. Zkoušíme nové věci, sdílíme jejich dopad na náš život a vzájemně se držíme na cestě k lepšímu životu.",
  },
];

export default function KomunitaPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Sekce */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <DecorativeShapes variant="hero" />
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-8 md:space-y-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl text-foreground">
            Společný prostor pro ty, kteří chtějí žít vědoměji.
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
            Místo, kde sdílíme své cesty, hledáme odpovědi na životní výzvy a vzájemně se inspirujeme.
          </p>
          
          <a
            href="https://www.skool.com/zijem-life-3913"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
          >
            Chci se přidat (Skool)
          </a>
        </div>
      </section>

      {/* Sekce: Co tě u nás čeká? */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50 paper-texture overflow-hidden">
        <DecorativeShapes position="left" />
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground mb-12 text-center" style={{ fontWeight: 600 }}>
            Co tě u nás čeká?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whatAwaits.map((feature, index) => (
              <div
                key={index}
                className="bg-white/50 rounded-2xl p-6 md:p-8 border-2 border-black/5 hover:border-accent/30 transition-all hover:shadow-xl"
              >
                <h3 className="text-xl md:text-2xl text-foreground mb-4" style={{ fontWeight: 600 }}>
                  <span className="text-accent font-bold">{feature.title}</span>
                </h3>
                <p className="text-foreground/80 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Sekce */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50 paper-texture overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground" style={{ fontWeight: 400 }}>
            Je to o nás, je to o tobě.
          </h2>
          
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            Celý tenhle prostor teprve začínám stavět a ty můžeš být u toho úplně od začátku. Pojď budovat tuhle komunitu se mnou a pojďme společně vytvořit místo, které nám dává smysl.
          </p>
          
          <a
            href="https://www.skool.com/zijem-life-3913"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-playful inline-block px-8 py-4 bg-accent text-white rounded-full text-xl font-bold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
          >
            Vstoupit do komunity na Skoolu
          </a>
        </div>
      </section>
    </main>
  );
}
