import Link from 'next/link'
import { ArrowRight, BookOpen, Smartphone, User } from 'lucide-react'

export default function WhereToStart() {
  const options = [
    {
      icon: BookOpen,
      title: 'Začněte čtením',
      description: 'Prozkoumejte články z laboratoře a najděte inspiraci pro svou cestu.',
      href: '/clanky',
      cta: 'Číst články',
    },
    {
      icon: Smartphone,
      title: 'Vyzkoušejte aplikaci',
      description: 'Aplikace Pokrok vám pomůže najít klid v hlavě a soustředit se na to, co skutečně má smysl.',
      href: '/aplikace',
      cta: 'Otevřít aplikaci',
    },
    {
      icon: User,
      title: 'Rezervujte konzultaci',
      description: 'Individuální coaching vám pomůže najít konkrétní kroky pro váš život.',
      href: '/coaching',
      cta: 'Rezervovat',
    },
  ]

  return (
    <section id="kde-zacit" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-primary-50/20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 text-center">
          Kde začít?
        </h2>
        <p className="text-lg text-text-secondary text-center mb-12 max-w-2xl mx-auto">
          Vyberte si cestu, která vám nejvíce vyhovuje. Všechny vedou ke stejnému cíli: 
          životu s větším smyslem a menším tlakem na výkon.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {options.map((option) => {
            const Icon = option.icon
            return (
              <div
                key={option.title}
                className="bg-white rounded-lg p-8 border border-primary-100 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 text-primary-600 mb-6">
                  <Icon size={24} />
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-4">
                  {option.title}
                </h3>
                <p className="text-text-secondary leading-relaxed mb-6">
                  {option.description}
                </p>
                <Link
                  href={option.href}
                  className="group inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                >
                  <span>{option.cta}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


