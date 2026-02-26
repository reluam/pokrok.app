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
                <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-gray-100">
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
                Většinu života jsem strávil snahou pochopit, jak se tenhle život vlastně hraje. Jako nejisté dítě jsem neuměl číst v lidech ani v systémech, ale pomalu (a často s rozpaky) jsem se to začal učit.
              </p>
              
              <p>
                To učení mi zůstalo a i dnes neustále hledám, co reálně funguje. Experimentuji s vědou a technologiemi, biorytmy a stravou i meditací a hledáním vnitřního klidu.
              </p>
              
              <p>
                A tenhle kousek internetu jsem vytvořil, abys nemusel/a začínat od nuly. Najdeš tady inspiraci v mých textech, podporu v začínající komunitě parťáků a individuální koučink, pokud se rozhodneš to vzít od podlahy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
