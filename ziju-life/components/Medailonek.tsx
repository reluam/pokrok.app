import Image from "next/image";
import Link from "next/link";
import DecorativeShapes from "./DecorativeShapes";

export default function Medailonek() {
  return (
    <section className="relative pt-10 pb-20 md:pt-12 md:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <DecorativeShapes position="left" />
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Foto vlevo – čtvercové, lehce natočené doleva */}
          <div className="order-2 md:order-1 flex justify-center md:justify-start">
            <div
              className="relative w-64 h-64 md:w-80 md:h-80"
              style={{ transform: "rotate(-4deg)" }}
            >
              {/* Tmavý rámeček */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{ background: "#2d3039" }}
              />
              {/* Fotka uvnitř */}
              <div className="absolute inset-[6px] overflow-hidden rounded-xl">
                <Image
                  src="/matej-photo.jpg"
                  alt="Matěj"
                  fill
                  className="object-cover scale-105"
                  style={{ objectPosition: "center 10%" }}
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 768px) 256px, 320px"
                />
              </div>
            </div>
          </div>

          {/* Text vpravo */}
          <div className="order-1 md:order-2 space-y-5">
            <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground" style={{ fontWeight: 600 }}>
              Ahoj, jsem Matěj.
            </h2>

            <div className="space-y-4 text-lg md:text-xl text-foreground/80 leading-relaxed">
              <p>
                Mám rád dobré jídlo, sport a smysluplnou práci. Věřím, že vědomý život přináší radost a vnitřní klid, a chci sdílet nástroje, které mi na této cestě pomáhají.
              </p>
              <p>
                Tvořím praktické nástroje, sdílím inspiraci a snažím se, aby osobní rozvoj byl přístupný pro každého.
              </p>
            </div>

            <Link
              href="/o-mne"
              className="btn-playful inline-block px-8 py-3 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              Chci vědět víc &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
