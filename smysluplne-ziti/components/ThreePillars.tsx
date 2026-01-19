import { BookOpen, Smartphone, User } from 'lucide-react'
import Link from 'next/link'

export default function ThreePillars() {
  const pillars = [
    {
      icon: BookOpen,
      title: 'Inspirace & Realita',
      subtitle: 'Studovna',
      description: 'Sdílím články a výsledky svých pokusů. Žádné teorie z klobouku, ale věci, které mají hlavu a patu.',
      href: '/knihovna',
    },
    {
      icon: Smartphone,
      title: 'Aplikace Pokrok',
      subtitle: 'Nástroj',
      description: 'Postavil jsem ji tak, jak sám žiju. Pomáhá srovnat chaos v hlavě do konkrétních cílů a návyků.',
      href: '/aplikace',
    },
    {
      icon: User,
      title: 'Společná cesta',
      subtitle: 'Coaching',
      description: 'Pokud cítíš, že se v tom točíš sám, podíváme se společně na to, jak dostat smysluplnost do tvých všedních dnů.',
      href: '/coaching',
    },
  ]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-12 text-center animate-fade-in-up">
          Tři pilíře cesty
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <Link
                key={pillar.title}
                href={pillar.href}
                className="group text-center p-8 bg-white rounded-lg border border-primary-100 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-6 group-hover:bg-primary-200 transition-colors">
                  <Icon size={32} />
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2 group-hover:text-primary-600 transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  {pillar.subtitle}
                </p>
                <p className="text-text-secondary leading-relaxed">
                  {pillar.description}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
