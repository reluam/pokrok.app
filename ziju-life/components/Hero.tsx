import Image from "next/image";
import DecorativeShapes from "./DecorativeShapes";

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden paper-texture">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-background.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-[#FDFDF7]/40 backdrop-blur-md" style={{ zIndex: 1 }}></div>
      </div>
      
      {/* Decorative shapes */}
      <DecorativeShapes variant="hero" />
      
      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8 md:space-y-12">
        <h1 className="text-4xl md:text-5xl lg:text-6xl leading-tight text-foreground">
          Vypni autopilota a začni <span className="hand-drawn-underline">žít life</span> podle sebe.
        </h1>
        
        <p className="text-lg md:text-xl lg:text-2xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
          Většinu dne neřídíš ty, ale tvůj autopilot. Ukážu ti, jak převzít řízení a nastavit autopilota, aby tě vezl, kam chceš ty.
        </p>
        
        <div className="flex justify-center items-center pt-4">
          <a
            href="#choose-your-path"
            className="btn-playful px-8 py-4 bg-accent text-white rounded-full text-xl font-bold hover:bg-accent-hover transition-colors w-full sm:w-auto shadow-lg hover:shadow-xl"
          >
            Chci převzít řízení
          </a>
        </div>
      </div>
    </section>
  );
}
