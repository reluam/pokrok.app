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
                Dlouho jsem hledal návod na život. Zkoušel jsem spoustu cest — hudbu, e-commerce, festivaly — a nic nesedlo. Pak jsem pochopil, že ten návod si musím poskládat sám. Ne z jednoho zázračného niche, ale ze správné kombinace věcí.
              </p>

              <p>
                Tenhle kousek internetu jsem vytvořil, abys nemusel/a začínat od nuly. Najdeš tady{" "}
                <Link href="/muj-kompas" className="text-accent hover:text-accent-hover transition-colors">
                  můj kompas
                </Link>
                {" "}— principy a lekce, které mi fungují. Můžeš si{" "}
                <Link href="/tvoje-mapa" className="text-accent hover:text-accent-hover transition-colors">
                  nakreslit svou vlastní mapu
                </Link>
                , kde zmapuješ kde jsi a kam chceš. A pokud chceš průvodce na cestu, můžeme se potkat na{" "}
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
