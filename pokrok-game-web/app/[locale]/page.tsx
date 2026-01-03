'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useTranslations, useLocale } from 'next-intl'
import { Target, CheckCircle, Calendar, Eye, BarChart3, ArrowRight, Check, ListTodo, Flame, TrendingUp, LayoutDashboard, Heart } from 'lucide-react'
import { DevVersionTooltip } from './components/DevVersionTooltip'

// Force dynamic rendering - this page requires user authentication check
export const dynamic = 'force-dynamic'

export default function HomePage() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()
  const t = useTranslations()
  const locale = useLocale()

  // Redirect signed-in users to game
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push(`/${locale}/main-panel`)
    }
  }, [isLoaded, isSignedIn, router, locale])

  // Don't render anything while checking auth or if redirecting
  if (!isLoaded || (isLoaded && isSignedIn)) {
    return null
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Navigation */}
      <nav className="border-b-2 border-primary-500 bg-white/90 backdrop-blur-sm sticky top-0 z-50 box-playful-highlight-primary">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Target className="w-6 h-6 md:w-8 md:h-8 text-primary-600" />
              <span className="text-lg md:text-2xl font-bold font-playful text-text-primary">{t('app.name')}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs md:text-sm text-gray-500 font-mono">v0.1.0</span>
                <DevVersionTooltip iconSize="w-3 h-3 md:w-4 md:h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Link 
                href={`#pricing`}
                className="text-sm md:text-base text-text-primary hover:text-primary-600 font-semibold font-playful transition-colors"
              >
                {locale === 'cs' ? 'Ceník' : 'Pricing'}
              </Link>
              <Link 
                href={`/${locale}/sign-in`}
                className="text-sm md:text-base text-text-primary hover:text-primary-600 font-semibold font-playful transition-colors"
              >
                {t('homepage.signIn')}
              </Link>
              <Link href={`/${locale}/sign-up`} className="btn-playful-primary px-4 py-2 text-sm md:text-base">
                {t('homepage.startFree') || 'Začít zdarma'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold font-playful text-text-primary mb-4 md:mb-6 leading-tight px-2">
            {t('homepage.hero.title') || 'Životní plánovač pro lidi, kteří chtějí dosáhnout svých cílů'}
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-text-secondary mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-2">
            {t('homepage.hero.description') || 'Pokrok vám pomůže získat jasnost a smysluplnost v tom, jak dosáhnout toho, co v životě chcete. Rozdělte velké cíle na malé kroky, budujte návyky a sledujte svůj pokrok.'}
          </p>
          <div className="flex flex-col gap-3 md:gap-4 justify-center items-center px-2">
            <Link href={`/${locale}/sign-up`} className="w-full sm:w-auto">
              <button className="btn-playful-primary w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg flex items-center justify-center gap-2">
                {t('homepage.startFree') || 'Začít zdarma'}
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </Link>
            <div className="text-xs sm:text-sm text-text-secondary text-center max-w-md">
              {locale === 'cs' 
                ? 'Aplikace nabízí free verzi a po dobu trvání alfy budou zdarma všechny funkce.'
                : 'The app offers a free version and during the alpha period all features are free.'}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-8 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playful text-text-primary mb-3 md:mb-4">
              {t('homepage.problem.title') || 'Máte velké cíle, ale nevíte, kde začít?'}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-text-secondary px-2">
              {t('homepage.problem.subtitle') || 'Mnoho lidí má představu o tom, čeho chtějí dosáhnout, ale chybí jim jasnost v tom, jak na to.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
            {[
              { 
                icon: '❓', 
                text: t('homepage.problem.overwhelmed') || 'Cítíte se přehlceni všemi věcmi, které chcete udělat',
                description: t('homepage.problem.overwhelmedDesc') || 'Máte spoustu nápadů a cílů, ale nevíte, na co se soustředit'
              },
              { 
                icon: '🎯', 
                text: t('homepage.problem.noClarity') || 'Chybí vám jasnost v prioritách',
                description: t('homepage.problem.noClarityDesc') || 'Nevíte, které cíle jsou důležité a které mohou počkat'
              },
              { 
                icon: '📉', 
                text: t('homepage.problem.noProgress') || 'Nevidíte pokrok směrem k cílům',
                description: t('homepage.problem.noProgressDesc') || 'Cíle zůstávají jen na papíře, bez konkrétních kroků k jejich dosažení'
              },
            ].map((item, index) => (
              <div key={index} className="card-playful-white">
                <div className="text-3xl md:text-4xl mb-3 md:mb-4">{item.icon}</div>
                <h3 className="text-base md:text-lg font-semibold font-playful text-text-primary mb-2">{item.text}</h3>
                <p className="text-sm md:text-base text-text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-8 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playful text-text-primary mb-3 md:mb-4">
              {t('homepage.solution.title') || 'Pokrok vám pomůže získat jasnost'}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-text-secondary px-2">
              {t('homepage.solution.subtitle') || 'Rozdělte své cíle na malé kroky, budujte návyky a sledujte pokrok. Získejte smysluplnost v tom, jak dosáhnout toho, co chcete.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
            {[
              { 
                icon: Eye, 
                text: t('homepage.solution.clarity') || 'Získejte jasnost',
                description: t('homepage.solution.clarityDesc') || 'Vidíte přesně, na co se máte soustředit dnes a proč',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50'
              },
              { 
                icon: Target, 
                text: t('homepage.solution.meaning') || 'Najděte smysluplnost',
                description: t('homepage.solution.meaningDesc') || 'Každý krok má svůj smysl a vede vás k vašim cílům',
                color: 'text-primary-600',
                bgColor: 'bg-primary-50'
              },
              { 
                icon: TrendingUp, 
                text: t('homepage.solution.progress') || 'Sledujte pokrok',
                description: t('homepage.solution.progressDesc') || 'Vidíte, jak se posouváte vpřed a co už jste dokázali',
                color: 'text-green-600',
                bgColor: 'bg-green-50'
              },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="card-playful-white">
                  <div className={`w-10 h-10 md:w-12 md:h-12 ${item.bgColor} rounded-playful-lg flex items-center justify-center mb-3 md:mb-4`}>
                    <Icon className={`w-5 h-5 md:w-6 md:h-6 ${item.color}`} />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold font-playful text-text-primary mb-2">{item.text}</h3>
                  <p className="text-sm md:text-base text-text-secondary">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playful text-text-primary mb-3 md:mb-4">
                {t('homepage.features.title') || 'Jak vám Pokrok pomůže dosáhnout cílů'}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-text-secondary px-2">
                {t('homepage.features.subtitle') || 'Jednoduché nástroje pro životní plánování, které vám dají jasnost a smysluplnost'}
              </p>
            </div>

            {/* Clarity / Focus View */}
            <div className="mb-12 md:mb-20">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-playful text-text-primary mb-6 md:mb-8 text-center">
                {t('homepage.features.clarity.title') || 'Clarity - Jasnost v tom, na co se soustředit'}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 items-center">
                <div>
                  <h4 className="text-xl sm:text-2xl font-semibold font-playful text-text-primary mb-3 md:mb-4">
                    {t('homepage.features.clarity.subtitle') || 'Začněte každý den s jasností'}
                  </h4>
                  <p className="text-base md:text-lg text-text-secondary mb-4 md:mb-6">
                    {t('homepage.features.clarity.description') || 'Focus view vám ukáže pouze to, na co se máte soustředit dnes. Vidíte své návyky, kroky z aktivních cílů a vše, co potřebujete dokončit. Žádné rozptýlení, jen to, co je důležité.'}
                  </p>
                  <ul className="space-y-2 md:space-y-3">
                    {[
                      t('homepage.features.clarity.benefit1') || 'Zobrazuje pouze kroky z aktivních cílů - vidíte, co je opravdu důležité',
                      t('homepage.features.clarity.benefit2') || 'Kompaktní přehled dnešních návyků - budujte pozitivní rutiny',
                      t('homepage.features.clarity.benefit3') || 'Rychlý přehled pokroku - vidíte, jak se posouváte vpřed',
                    ].map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 md:gap-3">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm md:text-base text-text-primary">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card-playful-white">
                  <div className="space-y-3 md:space-y-4">
                    <div className="box-playful-highlight-primary p-3 md:p-4">
                      <h5 className="font-semibold font-playful text-sm md:text-base text-text-primary mb-2 md:mb-3">{t('homepage.features.clarity.exampleTitle') || 'Dnešní fokus'}</h5>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs md:text-sm">
                          <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                          <span className="text-text-primary">{t('homepage.features.clarity.example1') || 'Dokončit návrh projektu'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm">
                          <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-gray-300 rounded-playful-sm" />
                          <span className="text-text-primary">{t('homepage.features.clarity.example2') || 'Příprava na prezentaci'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="box-playful-highlight-primary p-3 md:p-4">
                      <h5 className="font-semibold font-playful text-sm md:text-base text-text-primary mb-2 md:mb-3">{t('homepage.features.clarity.habitsTitle') || 'Návyky'}</h5>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs md:text-sm">
                          <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                          <span className="text-text-primary">{t('homepage.features.clarity.habit1') || 'Ranní cvičení'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm">
                          <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-gray-300 rounded-playful-sm" />
                          <span className="text-text-primary">{t('homepage.features.clarity.habit2') || 'Čtení 30 minut'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Areas containing Goals, Habits, Steps */}
            <div className="mb-12 md:mb-20">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-playful text-text-primary mb-6 md:mb-12 text-center">
                {t('homepage.features.management.title') || 'Rozdělte cíle na kroky a budujte návyky'}
              </h3>
              
              {/* Areas Box - Main container */}
              <div className="card-playful-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-50 rounded-playful-lg flex items-center justify-center flex-shrink-0">
                    <LayoutDashboard className="w-6 h-6 md:w-8 md:h-8 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-bold font-playful text-text-primary mb-2">{t('homepage.features.management.areas.title') || 'Oblasti'}</h4>
                    <p className="text-sm md:text-base text-text-secondary">{t('homepage.features.management.areas.description') || 'Organizujte své cíle, návyky a kroky do oblastí života, jako je Zdraví, Kariéra, Vztahy nebo cokoliv jiného, co má pro vás smysl. Oblasti vám pomohou mít přehled o různých aspektech vašeho života.'}</p>
                  </div>
                </div>
                
                {/* Goals, Habits, Steps inside Areas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8 pt-6 md:pt-8 border-t-2 border-primary-200">
                  {[
                    {
                      icon: Target,
                      title: t('homepage.features.management.goals.title') || 'Cíle',
                      description: t('homepage.features.management.goals.description') || 'Nastavte si krátkodobé i dlouhodobé cíle. Organizujte je podle priorit a sledujte pokrok. Každý cíl má svůj smysl a vede vás k tomu, čeho chcete dosáhnout.',
                      color: 'text-primary-600',
                      bgColor: 'bg-primary-50',
                    },
                    {
                      icon: Flame,
                      title: t('homepage.features.management.habits.title') || 'Návyky',
                      description: t('homepage.features.management.habits.description') || 'Budujte pozitivní návyky s denní, týdenní nebo měsíční frekvencí. Sledujte své streak a pokrok. Malé každodenní kroky vedou k velkým změnám.',
                      color: 'text-blue-600',
                      bgColor: 'bg-blue-50',
                    },
                    {
                      icon: ListTodo,
                      title: t('homepage.features.management.steps.title') || 'Kroky',
                      description: t('homepage.features.management.steps.description') || 'Rozdělte své cíle na malé, dosažitelné kroky. Plánujte je na konkrétní dny a sledujte jejich dokončení. Každý krok vás přibližuje k vašim cílům.',
                      color: 'text-green-600',
                      bgColor: 'bg-green-50',
                    },
                  ].map((feature, index) => {
                    const Icon = feature.icon
                    return (
                      <div key={index} className="box-playful-highlight-primary p-4 md:p-5">
                        <div className={`w-8 h-8 md:w-10 md:h-10 ${feature.bgColor} rounded-playful-lg flex items-center justify-center mb-2 md:mb-3`}>
                          <Icon className={`w-4 h-4 md:w-5 md:h-5 ${feature.color}`} />
                        </div>
                        <h5 className="text-base md:text-lg font-semibold font-playful text-text-primary mb-2">{feature.title}</h5>
                        <p className="text-xs md:text-sm text-text-secondary">{feature.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Calendar & Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
              <div className="card-playful-white">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <Calendar className="w-6 h-6 md:w-8 md:h-8 text-primary-600" />
                  <h3 className="text-xl md:text-2xl font-bold font-playful text-text-primary">
                    {t('homepage.features.calendar.title') || 'Kalendář'}
                  </h3>
                </div>
                <p className="text-base md:text-lg text-text-secondary mb-3 md:mb-4">
                  {t('homepage.features.calendar.description') || 'Vizualizujte své kroky a návyky v kalendářovém zobrazení. Plánujte dopředu a mějte přehled o svém čase. Vidíte, jak se vaše úsilí hromadí a přibližuje vás k cílům.'}
                </p>
                <ul className="space-y-2">
                  {[
                    t('homepage.features.calendar.benefit1') || 'Denní, týdenní, měsíční a roční zobrazení',
                    t('homepage.features.calendar.benefit2') || 'Vizuální přehled dokončených úkolů',
                    t('homepage.features.calendar.benefit3') || 'Snadné plánování a přesouvání kroků',
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm md:text-base text-text-primary">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-playful-white">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-primary-600" />
                  <h3 className="text-xl md:text-2xl font-bold font-playful text-text-primary">
                    {t('homepage.features.statistics.title') || 'Statistiky'}
                  </h3>
                </div>
                <p className="text-base md:text-lg text-text-secondary mb-3 md:mb-4">
                  {t('homepage.features.statistics.description') || 'Sledujte svůj pokrok s detailními statistikami. Vidíte, kolik kroků jste dokončili, jak dlouhý máte streak a celkový pokrok. Každý dokončený krok vás přibližuje k vašim cílům.'}
                </p>
                <ul className="space-y-2">
                  {[
                    t('homepage.features.statistics.benefit1') || 'Přehled dokončených kroků a návyků',
                    t('homepage.features.statistics.benefit2') || 'Streak statistiky pro návyky',
                    t('homepage.features.statistics.benefit3') || 'Celkový pokrok v procentech',
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm md:text-base text-text-primary">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playful text-text-primary mb-3 md:mb-4">
                {locale === 'cs' ? 'Ceník' : 'Pricing'}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-text-secondary px-2">
                {locale === 'cs' 
                  ? 'Jednoduché a transparentní ceny'
                  : 'Simple and transparent pricing'}
              </p>
            </div>

            {/* Alpha Notice */}
            <div className="card-playful-primary mb-8 md:mb-12">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="flex-shrink-0">
                  <span className="inline-block px-3 py-1 bg-primary-600 text-white text-sm font-bold font-playful rounded-playful-md box-playful-highlight">
                    {locale === 'cs' ? 'ALFA VERZE' : 'ALPHA'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold font-playful text-text-primary mb-2 md:mb-3">
                    {locale === 'cs' 
                      ? 'Momentálně je celá aplikace zdarma'
                      : 'Currently the entire app is free'}
                  </h3>
                  <p className="text-sm md:text-base text-text-secondary mb-3 md:mb-4">
                    {locale === 'cs'
                      ? 'V současnosti běžíme v alfa verzi aplikace. Po dobu trvání alfy jsou všechny funkce zdarma a dostupné všem uživatelům. Využijte této příležitosti a vyzkoušejte všechny funkce bez omezení.'
                      : 'We are currently running in alpha version. During the alpha period, all features are free and available to all users. Take advantage of this opportunity and try all features without limitations.'}
                  </p>
                  <div className="box-playful-highlight-primary p-4 md:p-5">
                    <h4 className="font-semibold font-playful text-text-primary mb-2 md:mb-3">
                      {locale === 'cs' ? 'Co je možné v aplikaci dělat:' : 'What you can do in the app:'}
                    </h4>
                    <ul className="space-y-2 text-sm md:text-base text-text-primary">
                      {[
                        locale === 'cs' ? 'Organizovat cíle, kroky a návyky do oblastí' : 'Organize goals, steps and habits into areas',
                        locale === 'cs' ? 'Vytvářet krátkodobé i dlouhodobé cíle s termíny' : 'Create short-term and long-term goals with deadlines',
                        locale === 'cs' ? 'Plánovat kroky na konkrétní dny nebo jako opakující se' : 'Plan steps for specific days or as recurring',
                        locale === 'cs' ? 'Budovat návyky s denní, týdenní nebo měsíční frekvencí' : 'Build habits with daily, weekly or monthly frequency',
                        locale === 'cs' ? 'Sledovat pokrok v kalendáři a statistikách' : 'Track progress in calendar and statistics',
                        locale === 'cs' ? 'Používat všechny zobrazení (Feed, Oblasti, Kalendář, Statistiky)' : 'Use all views (Feed, Areas, Calendar, Statistics)'
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Future Pricing */}
            <div className="card-playful-primary">
              <h3 className="text-xl md:text-2xl font-bold font-playful text-text-primary mb-4 md:mb-6 text-center">
                {locale === 'cs' ? 'Ceník po ukončení alfy' : 'Pricing after alpha'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Free Tier */}
                <div className="card-playful-white">
                  <h4 className="text-xl md:text-2xl font-bold font-playful text-text-primary mb-2 md:mb-3">
                    {locale === 'cs' ? 'Free' : 'Free'}
                  </h4>
                  <div className="mb-4 md:mb-6">
                    <span className="text-3xl md:text-4xl font-bold text-text-primary">$0</span>
                    <span className="text-text-secondary">/{locale === 'cs' ? 'měsíc' : 'month'}</span>
                  </div>
                  <ul className="space-y-2 md:space-y-3 mb-6 text-sm md:text-base text-text-primary">
                    {[
                      locale === 'cs' ? 'Historie aktuálního měsíce' : 'Current month history',
                      locale === 'cs' ? 'Plánovač úkolů a přehled měsíce (jen aktuální měsíc)' : 'Task planner and month overview (current month only)',
                      locale === 'cs' ? '3 oblasti s neomezenými cíli, kroky a návyky' : '3 Areas with unlimited goals, steps and habits',
                      locale === 'cs' ? 'Základní zobrazení a filtrování' : 'Basic views and filtering'
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Paid Tier */}
                <div className="card-playful-white bg-primary-500 text-white relative">
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 bg-white text-primary-600 text-xs font-bold font-playful rounded-playful-sm box-playful-highlight">
                      {locale === 'cs' ? 'DOPORUČENO' : 'RECOMMENDED'}
                    </span>
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold font-playful mb-2 md:mb-3">
                    {locale === 'cs' ? 'Premium' : 'Premium'}
                  </h4>
                  <div className="mb-4 md:mb-6">
                    <span className="text-3xl md:text-4xl font-bold">$8</span>
                    <span className="opacity-90">/{locale === 'cs' ? 'měsíc' : 'month'}</span>
                    <div className="text-sm md:text-base opacity-90 mt-1">
                      {locale === 'cs' ? 'nebo $78 ročně' : 'or $78/year'}
                    </div>
                  </div>
                  <ul className="space-y-2 md:space-y-3 mb-6 text-sm md:text-base">
                    {[
                      locale === 'cs' ? 'Historie za celou dobu' : 'All time history',
                      locale === 'cs' ? 'Statistiky' : 'Statistics',
                      locale === 'cs' ? 'Neomezené oblasti' : 'Unlimited Areas',
                      locale === 'cs' ? 'Neomezené cíle, kroky a návyky' : 'Unlimited goals, steps and habits',
                      locale === 'cs' ? 'Detailní přehled a filtrování pro cíle, návyky a kroky' : 'Detailed overview and filtering for goals, habits and steps'
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-center text-sm md:text-base text-text-secondary mt-6 md:mt-8">
                {locale === 'cs'
                  ? 'Přesné detaily cen budou zveřejněny před ukončením alfy.'
                  : 'Exact pricing details will be announced before the end of alpha.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Heart className="w-12 h-12 md:w-16 md:h-16 text-primary-600 mx-auto mb-4 md:mb-6" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playful text-text-primary mb-4 md:mb-6 px-2">
              {locale === 'cs' ? (
                <>Pokrok <strong>není</strong> další aplikace pro <em>produktivitu</em></>
              ) : (
                <>Pokrok is <strong>not</strong> another <em>productivity</em> app</>
              )}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-text-secondary mb-4 md:mb-8 leading-relaxed px-2">
              {t('homepage.philosophy.description') || 'Pokrok je aplikace pro život, jaký chcete mít. Pomáhá vám žít takový život, jaký si přejete - ne jen být produktivnější, ale skutečně dosáhnout toho, co v životě chcete.'}
            </p>
            <p className="text-sm sm:text-base md:text-lg text-text-light leading-relaxed px-2">
              {t('homepage.philosophy.flexibility') || 'Používejte Pokrok tak, jak potřebujete - denně pro každodenní plánování, týdně pro přehled nad týdnem, nebo dokonce měsíčně pro reflexi a plánování dopředu. Pokrok je váš parťák k životu, jaký chcete mít.'}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-primary-500">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-playful text-white mb-4 md:mb-6 px-2">
              {t('homepage.cta.title') || 'Začněte dosahovat svých cílů'}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-primary-100 mb-6 md:mb-8 px-2">
              {t('homepage.cta.subtitle') || 'Získejte jasnost a smysluplnost v tom, jak dosáhnout toho, co v životě chcete'}
            </p>
            <Link href={`/${locale}/sign-up`} className="block w-full sm:w-auto mx-auto">
              <button className="btn-playful-primary w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-white text-primary-600 text-base md:text-lg flex items-center justify-center gap-2 mx-auto">
                {t('homepage.startFree') || 'Začít zdarma'}
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </Link>
            <p className="text-primary-100 text-xs sm:text-sm mt-3 md:mt-4 px-2 max-w-md mx-auto">
              {locale === 'cs' 
                ? 'Aplikace nabízí free verzi a po dobu trvání alfy budou zdarma všechny funkce.'
                : 'The app offers a free version and during the alpha period all features are free.'}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-primary text-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-3 md:mb-0">
              <Target className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
              <span className="text-lg md:text-xl font-bold font-playful">{t('app.name')}</span>
            </div>
            <div className="text-xs md:text-sm text-center md:text-left text-gray-300">
              © {new Date().getFullYear()} {t('app.name')}. {t('homepage.footer.rights') || 'Všechna práva vyhrazena.'}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
