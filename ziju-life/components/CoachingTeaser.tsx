import Link from "next/link";

const signs = [
  "Zkoušel/a jsi knížky, appky i frameworky — ale nic ti nevydrželo.",
  "Víš, co chceš změnit, ale sám/sama se v tom točíš dokola.",
  "Chceš jít hlouběji a rychleji, než to zvládneš na vlastní pěst.",
];

export default function CoachingTeaser() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-[36px] border border-black/6 shadow-lg overflow-hidden bg-white/80 backdrop-blur px-8 py-10 md:px-12 md:py-14 space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              Koučink
            </h2>
            <p className="text-base text-foreground/65 leading-relaxed max-w-2xl">
              Laboratoř a inspirace ti dají nástroje a podněty. Ale někdy potřebuješ někoho, kdo se tě zeptá na tu správnou otázku, pomůže ti vidět, co sám nevidíš, a podrží tě v akci. Ne další informace — ale průvodce, který jde pod povrch.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground/45 mb-3">
              Může být pro tebe, pokud:
            </p>
            <ul className="space-y-2.5">
              {signs.map((s) => (
                <li key={s} className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 border-accent/50 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                  </span>
                  <span className="text-sm text-foreground/70 leading-snug">
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Link
              href="/koucing"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold bg-accent text-white hover:bg-accent-hover transition-colors shadow-md"
            >
              Zjistit víc o koučinku →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
