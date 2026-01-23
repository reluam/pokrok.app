import Image from "next/image";
import HandDrawnFrame from "./HandDrawnFrame";
import DecorativeShapes from "./DecorativeShapes";

export default function Medailonek() {
  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50 paper-texture overflow-hidden">
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
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              </HandDrawnFrame>
            </div>
          </div>

          {/* Text vpravo */}
          <div className="order-1 md:order-2 space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground" style={{ fontWeight: 400 }}>
              <span className="hand-drawn-underline">Ahoj, jsem Matěj.</span>
            </h2>
            
            <div className="space-y-4 text-lg md:text-xl text-foreground/80 leading-relaxed">
              <p>
                Většinu života jsem strávil snahou pochopit, jak se tenhle 'život' vlastně hraje. Jako nejisté dítě jsem neuměl číst v lidech ani v systémech, ale pomalu a trapně jsem to postupně začal zjišťovat.
              </p>
              
              <p>
                Dnes jsem již ostřílený začátečník a zkouším nové a další věci – od neúspěšné hudební kariéry, přes hromadu nedokončených aplikací a tutových byznysů až po Žiju.life, což je mé poslední dílo (snad ne i poslední naděje) a zároveň vyvrcholení první třetiny mé životní cesty.
              </p>
              
              <p>
                Protože už mám dost chabých pokusů o úspěch a taky protože to začalo být lonely, tak jsem založil komunitu pro lidi, kteří to mají podobně. Místo, kde můžeme naše experimenty a cesty sdílet nebo se jen inspirovat, ale hlavně - nebrat ten život (ani sebe) tak vážně.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
