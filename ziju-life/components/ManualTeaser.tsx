import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ManualTeaser() {
  return (
    <section className="relative py-6 md:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-5 md:gap-6">

        {/* Můj kompas */}
        <Link
          href="/muj-kompas"
          className="group flex flex-col gap-4 bg-white/85 rounded-[24px] p-7 border border-white/60 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all backdrop-blur"
        >
          <span className="text-3xl">📖</span>
          <div className="flex-1">
            <p className="text-lg font-bold text-foreground group-hover:text-accent transition-colors mb-1">Můj kompas</p>
            <p className="text-sm text-foreground/65 leading-relaxed">
              Matějův osobní soubor principů, hodnot a lekcí. Není to dogma — je to inspirace pro tvůj vlastní kompas.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent mt-auto">
            Přečíst <ArrowRight size={15} />
          </span>
        </Link>

        {/* Tvoje mapa */}
        <Link
          href="/tvoje-mapa"
          className="group flex flex-col gap-4 bg-white/85 rounded-[24px] p-7 border border-white/60 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all backdrop-blur"
        >
          <span className="text-3xl">🗺️</span>
          <div className="flex-1">
            <p className="text-lg font-bold text-foreground group-hover:text-accent transition-colors mb-1">Tvoje mapa</p>
            <p className="text-sm text-foreground/65 leading-relaxed">
              Sedm zastávek od &quot;kde jsem&quot; po &quot;žiju podle sebe&quot;. Se cvičeními a šablonami.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent mt-auto">
            Projít <ArrowRight size={15} />
          </span>
        </Link>

      </div>
    </section>
  );
}
