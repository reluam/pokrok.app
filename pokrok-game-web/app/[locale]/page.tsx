'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useTranslations, useLocale } from 'next-intl'
import { Target, ArrowRight, Check } from 'lucide-react'
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
    <div className="min-h-screen bg-primary-50 flex flex-col p-4">
      {/* Top Navigation */}
      <nav className="border-b-2 border-primary-500 bg-white/90 backdrop-blur-sm sticky top-0 z-50 box-playful-highlight-primary p-4">
        <div className="container mx-auto">
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
                href={`/${locale}/pricing`}
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          {/* Hero Section */}
          <section className="bg-white border-b-2 border-primary-500 box-playful-highlight-primary mb-8">
            <div className="px-8 py-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playful text-text-primary mb-6 leading-tight">
                {t('homepage.hero.title') || 'Životní plánovač pro lidi, kteří chtějí dosáhnout svých cílů'}
              </h1>
              <p className="text-lg md:text-xl text-text-secondary mb-8 leading-relaxed">
                {t('homepage.hero.description') || 'Pokrok vám pomůže získat jasnost a smysluplnost v tom, jak dosáhnout toho, co v životě chcete.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Link href={`/${locale}/sign-up`} className="sm:w-auto">
                  <button className="btn-playful-primary w-full sm:w-auto px-8 py-4 text-lg flex items-center justify-center gap-2">
                    {t('homepage.startFree') || 'Začít zdarma'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <div className="text-sm text-text-secondary text-center sm:text-left">
                  {locale === 'cs' 
                    ? 'Aplikace nabízí free verzi a po dobu trvání alfy budou zdarma všechny funkce.'
                    : 'The app offers a free version and during the alpha period all features are free.'}
                </div>
              </div>
            </div>
          </section>

          {/* What is Pokrok Section */}
          <section className="bg-white border-b-2 border-primary-500 box-playful-highlight-primary mb-8">
            <div className="px-8 py-12">
              <h2 className="text-3xl md:text-4xl font-bold font-playful text-text-primary mb-6">
                {locale === 'cs' ? 'Co je Pokrok?' : 'What is Pokrok?'}
              </h2>
              <p className="text-lg text-text-secondary mb-6">
                {locale === 'cs' 
                  ? 'Pokrok je aplikace pro životní plánování, která vám pomůže získat jasnost a smysluplnost v tom, jak dosáhnout toho, co v životě chcete.'
                  : 'Pokrok is a life planning app that helps you gain clarity and meaning in how to achieve what you want in life.'}
              </p>
              <div className="card-playful-white p-6">
                <h3 className="text-xl font-bold font-playful text-text-primary mb-4">
                  {locale === 'cs' ? 'Hlavní funkce' : 'Main Features'}
                </h3>
                <ul className="space-y-3">
                  {[
                    locale === 'cs' ? 'Rozdělte velké cíle na malé kroky' : 'Break down big goals into small steps',
                    locale === 'cs' ? 'Budujte pozitivní návyky' : 'Build positive habits',
                    locale === 'cs' ? 'Organizujte cíle do oblastí života' : 'Organize goals into life areas',
                    locale === 'cs' ? 'Sledujte pokrok v kalendáři a statistikách' : 'Track progress in calendar and statistics'
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-base text-text-primary">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
