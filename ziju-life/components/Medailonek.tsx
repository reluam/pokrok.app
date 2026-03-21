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
                Většinu života jsem strávil snahou pochopit, jak se tenhle život vlastně hraje. Jako nejisté dítě jsem neuměl číst v lidech ani v systémech, ale pomalu — a často s rozpaky — jsem se to začal učit.
              </p>

              <p>
                Časem jsem zjistil, že právě toto zkoumání je to, co mi dává smysl. Experimentuji s tím, jak funguje naše tělo i hlava — od spánku a stravy přes mentální modely až po meditaci. Ne proto, abych našel jeden zázračný hack, ale abych zjistil, které věci vedou k více prožitému životu.
              </p>

              <p>
                Tenhle kousek internetu jsem vytvořil, abych mohl sdílet, co jsem objevil — a pomoct ti najít to, co funguje pro tebe. Sepsal jsem{" "}
                <Link href="/muj-kompas" className="text-accent hover:text-accent-hover transition-colors">
                  svůj kompas
                </Link>
                {" "}s principy a lekcemi, které mě vedou. Vytvořil jsem{" "}
                <Link href="/tvoje-mapa" className="text-accent hover:text-accent-hover transition-colors">
                  Tvoji mapu
                </Link>
                {" "}— průvodce, který ti pomůže zmapovat, kde jsi a kam chceš. A pokud nechceš tu cestu jít sám, můžeme ji jít spolu v rámci{" "}
                <Link href="/koucing" className="text-accent hover:text-accent-hover transition-colors">
                  koučinku
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
