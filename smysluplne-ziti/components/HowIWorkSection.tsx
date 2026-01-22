import { Search, Heart, Eye, Smile, Sparkles } from 'lucide-react'

export default function HowIWorkSection() {
  const pillars = [
    { name: 'Zvídavost', icon: Search },
    { name: 'Otevřenost', icon: Heart },
    { name: 'Upřímnost', icon: Eye },
    { name: 'Hravost', icon: Sparkles },
    { name: 'Radost', icon: Smile },
  ]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-primary-50/30">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-8 md:mb-12 text-center">
          Tvoje cesta ke <span className="gradient-text">smysluplnému životu</span>
        </h2>
        <div className="bg-white rounded-lg border-2 border-primary-100 p-8 md:p-12 shadow-lg">
          <div className="space-y-6 mb-8">
            <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
              Věřím, že odpovědi na tvé nejdůležitější otázky už v tobě jsou – jen bývají umlčeny šumem okolí a každodenním shonem. Má práce spočívá v hlubokém individuálním dialogu, který ti pomůže tento vnitřní hlas znovu slyšet.
            </p>
            <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
              Při spolupráci se opírám o pět pilířů: <strong>Zvídavost</strong>, <strong>Otevřenost</strong>, <strong>Upřímnost</strong>, <strong>Hravost</strong> a <strong>Radost</strong>. Nejsou to pro mě jen slova, ale kompas, který nám pomůže navigovat k životu, který ti dává smysl. Společně vytvoříme prostor, kde odložíš to, co ti už neslouží, a začneš budovat realitu, která s tebou skutečně ladí.
            </p>
          </div>
          
          {/* Pilíře jako seznam s ikonkami */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 pt-6 border-t border-primary-100">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon
              return (
                <div key={pillar.name} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Icon className="text-primary-600" size={16} />
                  </div>
                  <span className="text-sm md:text-base font-semibold text-text-primary">
                    {pillar.name}
                  </span>
                  {index < pillars.length - 1 && (
                    <span className="text-text-light hidden md:inline">•</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
