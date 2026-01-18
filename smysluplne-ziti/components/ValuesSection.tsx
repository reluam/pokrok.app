import { Search, Heart, Eye, Smile } from 'lucide-react'

export default function ValuesSection() {
  const values = [
    {
      icon: Search,
      title: 'Zvídavost',
      description: 'Aktivně objevuji a poznávám nové způsoby, jak žít smysluplněji.',
    },
    {
      icon: Heart,
      title: 'Otevřenost',
      description: 'Přijímám nové nápady, myšlenky i kritiku s otevřenou myslí.',
    },
    {
      icon: Eye,
      title: 'Upřímnost',
      description: 'Věci popisuji tak, jak jsou.',
    },
    {
      icon: Smile,
      title: 'Radost',
      description: 'Jsem rád za příležitost být aktivním členem našeho světa.',
    },
  ]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-12 md:mb-16 text-center">
          Na čem <span className="gradient-text">Smyslužití</span> stojí
        </h2>
        
        {/* Grid: 4 hodnoty v jednom řádku */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {values.map((value) => {
            const Icon = value.icon
            return (
              <div
                key={value.title}
                className="text-center p-6 md:p-8 bg-white rounded-lg border border-primary-100 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-100 text-primary-600 mb-6">
                  <Icon size={32} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-4 font-serif">
                  {value.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {value.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
