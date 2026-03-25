import Link from "next/link";
import Image from "next/image";
import HandDrawnFrame from "./HandDrawnFrame";
import DecorativeShapes from "./DecorativeShapes";

export default function Medailonek() {
  return (
    <section className="relative pt-10 pb-20 md:pt-12 md:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <DecorativeShapes position="left" />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Foto vlevo */}
          <div className="order-2 md:order-1 flex justify-center md:justify-start">
            <div className="max-w-md w-full">
              <HandDrawnFrame>
                <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-xl shadow-black/10">
                  <Image
                    src="/matej-photo.jpg"
                    alt="Matěj"
                    fill
                    className="object-cover rounded-2xl"
                    priority
                    fetchPriority="high"
                    sizes="(max-width: 768px) 364px, 400px"
                  />
                </div>
              </HandDrawnFrame>
            </div>
          </div>

          {/* Text vpravo */}
          <div className="order-1 md:order-2 space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground" style={{ fontWeight: 600 }}>
              <span className="hand-drawn-underline">Ahoj, jsem Matěj.</span>
            </h2>
            
            <div className="space-y-4 text-lg md:text-xl text-foreground/80 leading-relaxed">
              <p>
                Od mala jsem si přál jednu věc — fungovat jako normální člověk. Dělat věci, které ostatní zvládali přirozeně. Ale čím víc jsem se snažil, tím víc mi to nešlo. Žil jsem v budoucnosti — pořád jsem viděl, kam chci jít, ale neviděl jsem, kde jsem.
              </p>

              <p>
                Pak mi moje terapeutka řekla něco, co mi změnilo život: <em>Tvůj život je mozaika. Máš krásnou představu, jak má vypadat. Ale neskládáš ji. Dílek po dílku.</em>
              </p>

              <p>
                Trvalo mi deset lekcí, než jsem to pochopil. A další rok, než jsem se to naučil žít. Ale funguje to. Čím víc se soustředím na to, co dělám teď, tím víc můj život dává smysl.
              </p>

              <p>
                Proto jsem založil žiju life. Abych zkoumal, jak žít vědoměji. A abych to, co objevím, předával dál.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
