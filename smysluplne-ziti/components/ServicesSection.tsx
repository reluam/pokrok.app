import { BookOpen, Users, User } from 'lucide-react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function ServicesSection() {
  const services = [
    {
      icon: Users,
      title: 'Komunita Smyslužití',
      tag: 'Sdílená cesta',
      description: 'Smysl se lépe žije ve skupině. Připoj se k lidem na stejné cestě a sdílej své pokroky v naší komunitě na platformě Skool.',
      href: 'https://www.skool.com/smysluziti-9755',
      buttonText: 'Vstoupit do komunity',
    },
    {
      icon: BookOpen,
      title: 'Články a inspirace',
      description: 'Ztělesnění zvídavosti. Sdílím studie, reporty z mých experimentů a cestu z hlavy zpátky do reality.',
      href: '/clanky',
      buttonText: 'Číst články',
    },
    {
      icon: User,
      title: 'Individuální Coaching',
      description: 'Upřímný pohled na tvůj směr. Podpořím tě na tvé vlastní cestě Smyslužitím.',
      href: '/coaching',
      buttonText: 'Chci začít svou cestu',
    },
  ]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-primary-50/30">
      <div className="max-w-7xl mx-auto">
        {/* Propojovací text */}
        <div className="max-w-4xl mx-auto mb-12 md:mb-16">
          <p className="text-lg md:text-xl text-text-secondary text-center leading-relaxed">
            Tyto hodnoty nejsou jen slova na webu, ale způsob, jakým přistupuji ke všemu, co dělám. Ať už hledáš inspiraci, nástroj pro své dny, nebo parťáka na cestu, Smyslužití ti nabízí tři konkrétní cesty, jak tyto hodnoty přenést i do tvého života.
          </p>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-12 md:mb-16 text-center">
          Cesty ke <span className="gradient-text">Smyslužití</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div
                key={service.title}
                className="group bg-white rounded-lg border-2 border-primary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-8 md:p-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-100 text-primary-600 mb-6 group-hover:bg-primary-200 transition-colors">
                    <Icon size={32} />
                  </div>
                  {service.tag && (
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-primary-600 bg-primary-50 rounded-full mb-3">
                      {service.tag}
                    </span>
                  )}
                  <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-4 group-hover:text-primary-600 transition-colors font-serif">
                    {service.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed mb-6 text-base md:text-lg">
                    {service.description}
                  </p>
                  {service.href.startsWith('http') ? (
                    <a
                      href={service.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-all duration-300 group-hover:shadow-lg"
                    >
                      <span>{service.buttonText}</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                  ) : (
                    <Link
                      href={service.href}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-all duration-300 group-hover:shadow-lg"
                    >
                      <span>{service.buttonText}</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
