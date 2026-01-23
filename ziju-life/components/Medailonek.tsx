import Image from "next/image";

export default function Medailonek() {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Foto vlevo */}
          <div className="order-2 md:order-1">
            <div className="relative w-full aspect-square max-w-md mx-auto md:mx-0">
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-200">
                {/* Placeholder - nahraďte skutečnou fotkou */}
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/10">
                  <span className="text-foreground/40 text-sm">Fotka Matěje</span>
                </div>
                {/* Odkomentujte, až budete mít fotku:
                <Image
                  src="/matej-photo.jpg"
                  alt="Matěj"
                  fill
                  className="object-cover"
                  priority
                />
                */}
              </div>
            </div>
          </div>

          {/* Text vpravo */}
          <div className="order-1 md:order-2 space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Ahoj, jsem Matěj.
            </h2>
            
            <div className="space-y-4 text-lg md:text-xl text-foreground/80 leading-relaxed">
              <p>
                Většinu života jsem strávil snahou pochopit, jak se tenhle 'život' vlastně hraje. Jako nejisté dítě jsem neuměl číst v lidech ani v systémech, tak jsem si začal psát vlastní manuál. Studoval jsem lidi, svět a dešifroval každé sociální gesto.
              </p>
              
              <p>
                Dnes jsem profesionální začátečník. Na ziju.life zkouším všechno – od diet a biohackingu po nové mindsety. Většinou si nabiju pusu, ale občas najdu poklad. A přesně o tyhle poklady a faily se s tebou dělím. Bez filtru a s hravostí.
              </p>
              
              <p>
                Dlouho jsem tuhle cestu šlapal sám, ale došlo mi, že v týmu je to větší fun. Proto jsem vytvořil komunitu lidí, kteří to mají podobně. Místo, kde můžeme naše experimenty a cesty sdílet, vzájemně se inspirovat a nebrat ten život (ani sebe) tak vážně.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
