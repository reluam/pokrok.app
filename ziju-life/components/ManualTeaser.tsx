import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ManualTeaser() {
  return (
    <section className="relative py-6 md:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* Tvoje mapa — primární karta */}
        <Link
          href="/tvoje-mapa"
          className="group flex flex-col sm:flex-row items-start gap-5 bg-accent/5 border-2 border-accent/25 rounded-[24px] p-7 shadow-md hover:shadow-xl hover:-translate-y-0.5 hover:border-accent/50 transition-all"
        >
          <span className="text-4xl flex-shrink-0">🗺️</span>
          <div className="flex-1">
            <p className="text-xl font-bold text-foreground group-hover:text-accent transition-colors mb-1">Tvoje mapa</p>
            <p className="text-sm text-foreground/65 leading-relaxed max-w-xl">
              Zmapuj kde jsi, pojmenuj co tě brzdí a naplánuj kam chceš. Interaktivní průvodce zdarma.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-accent mt-auto flex-shrink-0">
            Začít <ArrowRight size={15} />
          </span>
        </Link>

        {/* Dva menší */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Můj kompas */}
          <Link
            href="/muj-kompas"
            className="group flex flex-col gap-4 bg-white/85 rounded-[24px] p-7 border border-white/60 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all backdrop-blur"
          >
            <span className="text-3xl">📖</span>
            <div className="flex-1">
              <p className="text-lg font-bold text-foreground group-hover:text-accent transition-colors mb-1">Můj kompas</p>
              <p className="text-sm text-foreground/65 leading-relaxed">
                Matějův osobní soubor principů, hodnot a lekcí. Inspirace pro tvůj vlastní kompas.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent mt-auto">
              Prozkoumat <ArrowRight size={15} />
            </span>
          </Link>

          {/* Inspirace */}
          <Link
            href="/inspirace"
            className="group flex flex-col gap-4 bg-white/85 rounded-[24px] p-7 border border-white/60 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all backdrop-blur"
          >
            <span className="text-3xl">✨</span>
            <div className="flex-1">
              <p className="text-lg font-bold text-foreground group-hover:text-accent transition-colors mb-1">Inspirace</p>
              <p className="text-sm text-foreground/65 leading-relaxed">
                Knihy, podcasty, články a nápady, které mě formovaly a budou užitečné i pro tebe.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent mt-auto">
              Prozkoumat <ArrowRight size={15} />
            </span>
          </Link>

        </div>
      </div>
    </section>
  );
}
