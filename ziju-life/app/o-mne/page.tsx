import Image from "next/image";
import DecorativeShapes from "@/components/DecorativeShapes";
import PosledniInspirace from "@/components/PosledniInspirace";
import RevealSection from "@/components/RevealSection";

export const dynamic = "force-static";

interface Pillar {
  title: string;
  description: string;
}

const pillars: Pillar[] = [
  {
    title: "Hravost",
    description: "Skoro nic není tak vážné, aby se to nedalo brát s nadhledem. A je třeba si to občas připomenout.",
  },
  {
    title: "Zvídavost",
    description: "Moje obrana proti autopilotovi. Je to neustálá potřeba koukat pod kapotu věcem, které \"prostě tak jsou\", a zjišťovat, jak doopravdy fungují.",
  },
  {
    title: "Upřímnost",
    description: "Lhaní si do kapsy je hrozná dřina, která nikam nevede. I malé lži mívají velké náklady.",
  },
  {
    title: "Otevřenost",
    description: "Ochota přiznat, že věci mohou být jinak, než si zrovna myslím. Protože bez otevřené hlavy se ta hra na život nedá moc dobře hrát.",
  },
  {
    title: "Radost",
    description: "Když se někomu něco podaří, tak chci mít upřímnou radost. Je skvělé, co jsme jako lidi dokázali.",
  },
];

export default function OMnePage() {
  return (
    <main className="min-h-screen">
      {/* Sekce 1: Ten moment – ve skleněném boxu */}
      <RevealSection>
        <section className="relative py-12 md:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <DecorativeShapes position="left" />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl backdrop-saturate-150 glass-grain px-6 md:px-10 py-8 md:py-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-center">
                <div className="md:col-span-2">
                  <h1
                    className="text-3xl md:text-4xl lg:text-5xl text-foreground mb-6"
                    style={{ fontWeight: 600 }}
                  >
                    Ten moment, kdy mi došlo, že{" "}
                    <span className="hand-drawn-underline">už mi není dvacet</span>
                  </h1>
                  <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed">
                    <p className="text-lg md:text-xl">
                      Kolem třicítky mě to trefilo. Došlo mi, že pokud budu mít fakt štěstí, mám před
                      sebou už jen dvě třetiny života. Tu první jsem strávil jako pozorovatel – učil jsem
                      se o lidech, o světě i o sobě, ale pořád jsem stál tak trochu bokem. Štvalo mě, že
                      ostatní mají tu sílu se světem hýbat a tvořit si ho podle sebe. Došlo mi, že už
                      nechci jen doufat, že to \"nějak vytočím\". Chci s tím světem konečně začít
                      interagovat.
                    </p>
                  </div>
                </div>
                <div className="relative w-full aspect-square washi-tape-photo washi-tape-sides">
                  <Image
                    src="/o-mne-moment.jpg"
                    alt="Ten moment"
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Sekce 2: Od hloubání k Žiju life – také ve skleněném boxu */}
      <RevealSection>
        <section className="relative py-12 md:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <DecorativeShapes position="right" />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl backdrop-saturate-150 glass-grain px-6 md:px-10 py-8 md:py-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-center">
                <div className="order-2 md:order-1 relative w-full aspect-square washi-tape-photo">
                  <Image
                    src="/o-mne-hloubani.jpg"
                    alt="Od hloubání k Žiju life"
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
                <div className="order-1 md:order-2 md:col-span-2">
                  <h2
                    className="text-3xl md:text-4xl lg:text-5xl text-foreground mb-6"
                    style={{ fontWeight: 600 }}
                  >
                    <span className="hand-drawn-underline">Od hloubání k Žiju life</span>
                  </h2>
                  <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed">
                    <p className="text-lg md:text-xl">
                      Půl roku jsem to v sobě převaloval. Hledal jsem způsob, jak zkušenosti z první
                      třetiny života nevyhodit z okna, ale předávat je dál a přitom se nepřestat učit.
                      Proto vzniklo Žiju life. Místo, kde společně můžeme přicházet na to, jak ten život
                      vlastně hrát.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Sekce 3: 5 věcí, o které se opírám */}
      <RevealSection>
        <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-6xl mx-auto relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground mb-12 text-center" style={{ fontWeight: 600 }}>
              <span className="hand-drawn-underline">5 věcí, o které se opírám</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pillars.map((pillar, index) => (
                <div
                  key={index}
                  className="bg-white/85 rounded-[24px] p-6 md:p-8 border border-white/60 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 backdrop-blur"
                  style={{ transform: `rotate(${index % 2 === 0 ? '-0.5deg' : '0.5deg'})` }}
                >
                  <h3 className="text-xl md:text-2xl text-foreground mb-4" style={{ fontWeight: 600 }}>
                    <span className="text-accent font-bold">{pillar.title}</span>
                  </h3>
                  <p className="text-foreground/80 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
                Takhle žiju life já. Pokud tě tenhle přístup baví, nech mi dole svůj mail a já ti dám vědět, na co jsem zrovna přišel. Nebo pojď rovnou do komunity a poděl se o to, jak se v tom chaosu snažíš žít ty.
              </p>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Poslední inspirace */}
      <PosledniInspirace />
    </main>
  );
}
