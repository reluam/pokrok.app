export default function ThreeSituationsSection() {
  const situations = [
    {
      title: 'Zaseknutí v systému',
      description: "Děláš všechno 'správně', ale vnitřně cítíš prázdnotu a chybí ti skutečný smysl.",
    },
    {
      title: 'Chaos v hlavě',
      description: 'Máš vize a sny, ale nedokážeš je přetavit do reality. Pomůžu ti určit, co je podstatné.',
    },
    {
      title: 'Cizí očekávání',
      description: 'Hledáš odvahu začít se rozhodovat podle sebe, ne podle toho, co se od tebe čeká.',
    },
  ]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-12 md:mb-16 text-center">
          Tři situace, ve kterých ti <span className="gradient-text">pomůžu</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {situations.map((situation, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border-2 border-primary-100 p-8 hover:border-primary-300 hover:shadow-xl transition-all duration-300"
            >
              <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
                {situation.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {situation.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
