import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
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
        <div className="absolute inset-0 bg-[#FFFAF5]/40 backdrop-blur-md" style={{ zIndex: 1 }}></div>
      </div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8 md:space-y-12">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
          Žiju life. A učím se to za pochodu.
        </h1>
        
        <p className="text-lg md:text-xl lg:text-2xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
          Nejsem guru. Jsem člověk, co si píše manuál na život sám. Sdílím svoje experimenty, faily a knowledge, aby tvůj life byl o něco víc v chillu a o něco míň na autopilota.
        </p>
        
        <div className="flex justify-center items-center pt-4">
          <a
            href="https://www.skool.com/ziju-life-9405"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-accent text-white rounded-full text-lg font-medium hover:bg-accent-hover transition-colors w-full sm:w-auto"
          >
            Chci do komunity (Free)
          </a>
        </div>
      </div>
    </section>
  );
}
