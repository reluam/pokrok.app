import Link from "next/link";

const benefits = [
  {
    emoji: "🪞",
    name: "Nový pohled",
    desc: "Uvidíš věci, které sám nevidíš. Správná otázka ti odblokuje víc než sto rad.",
    tag: "Reflexe",
    iconBg: "rgba(176,167,245,0.2)",
    tagBg: "rgba(176,167,245,0.2)",
    tagColor: "#7b6fcf",
  },
  {
    emoji: "🎯",
    name: "Jasný směr",
    desc: "Přestaneš se točit dokola. Pojmenujeme, co chceš, a uděláme první krok.",
    tag: "Akce",
    iconBg: "rgba(78,205,196,0.15)",
    tagBg: "rgba(78,205,196,0.15)",
    tagColor: "#2a9d95",
  },
  {
    emoji: "🤝",
    name: "Průvodce, ne rádce",
    desc: "Nejsem tu, abych ti říkal, co máš dělat. Jsem tu, abych tě podržel, když to děláš.",
    tag: "Podpora",
    iconBg: "rgba(255,217,102,0.25)",
    tagBg: "rgba(255,217,102,0.25)",
    tagColor: "#a07c00",
  },
];

const signs = [
  "Zkoušel/a jsi knížky, appky i frameworky — ale nic ti nevydrželo.",
  "Víš, co chceš změnit, ale sám/sama se v tom točíš dokola.",
  "Chceš jít hlouběji a rychleji, než to zvládneš na vlastní pěst.",
];

export default function CoachingTeaser() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-0 rounded-[36px] border border-black/6 shadow-lg overflow-hidden bg-white/80 backdrop-blur">

          {/* Levý sloupec — co klient získá (kartičky) */}
          <div className="flex flex-col justify-center gap-3 px-8 py-10 md:px-10 md:py-14 lg:border-r border-black/6">
            {benefits.map((b) => (
              <div
                key={b.name}
                className="flex items-start gap-4 rounded-2xl px-5 py-4 border border-black/5 bg-white/60"
              >
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: b.iconBg }}
                >
                  {b.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm mb-0.5">{b.name}</p>
                  <p className="text-sm text-foreground/55 leading-relaxed mb-2">{b.desc}</p>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: b.tagBg, color: b.tagColor }}
                  >
                    {b.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pravý sloupec — koučink popis + pro koho */}
          <div className="flex flex-col justify-between gap-8 px-8 py-10 md:px-12 md:py-14">
            <div className="flex flex-col gap-6">
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
                Osobní průvodce
              </h2>

              <p className="text-base text-foreground/65 leading-relaxed">
                Laboratoř a inspirace ti dají nástroje a podněty. Ale někdy potřebuješ někoho, kdo se tě zeptá na tu správnou otázku, pomůže ti vidět, co sám nevidíš, a podrží tě v akci. Ne další informace — ale průvodce, který jde pod povrch.
              </p>

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
            </div>

            <div>
              <Link
                href="/koucing"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold bg-accent text-white hover:bg-accent-hover transition-colors shadow-md"
              >
                Zjistit víc →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
