'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useTranslations, useLocale } from 'next-intl'
import { Target, ArrowRight, Check, Sparkles, TrendingUp, LayoutGrid, Zap } from 'lucide-react'
import { DevVersionTooltip } from './components/DevVersionTooltip'
import { LanguageSwitcher } from './components/LanguageSwitcher'

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
              <LanguageSwitcher />
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
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-5xl">
          {/* Hero Section - on background */}
          <section className="px-8 py-20 md:py-28">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              {/* Left side - Content */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-8">
                  <Target className="w-16 h-16 md:w-20 md:h-20 text-primary-600 mx-auto lg:mx-0 mb-6" />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playful text-text-primary mb-6 leading-tight">
                  {t('homepage.hero.title') || 'Životní plánovač pro lidi, kteří chtějí dosáhnout svých cílů'}
                </h1>
                <p className="text-lg md:text-xl text-text-secondary mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {t('homepage.hero.description') || 'Získejte jasnost a smysluplnost v tom, jak dosáhnout toho, co v životě chcete. Rozdělte velké cíle na malé kroky, budujte návyky a sledujte svůj pokrok.'}
                </p>
                <div className="flex flex-col items-center lg:items-start gap-6">
                  <Link href={`/${locale}/sign-up`}>
                    <button className="btn-playful-primary px-10 py-5 text-lg md:text-xl font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-shadow">
                      {t('homepage.startFree') || 'Začít zdarma'}
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </Link>
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-playful-md border-2 border-primary-300">
                      <Check className="w-4 h-4 text-primary-600" />
                      <p className="text-sm font-semibold text-primary-700">
                        {t('homepage.trialInfo') || (locale === 'cs' 
                          ? '14denní zkušební verze zdarma • Bez platební karty'
                          : '14-day free trial • No credit card required')}
                      </p>
                    </div>
                    <p className="text-sm text-text-secondary font-medium">
                      {locale === 'cs' 
                        ? 'Po dobu trvání alfy jsou všechny funkce zdarma'
                        : 'During the alpha period all features are free'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right side - App Screenshot */}
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <img 
                    src="/app-screenshot.png" 
                    alt={locale === 'cs' ? 'Screenshot aplikace Pokrok' : 'Pokrok app screenshot'}
                    className="w-full max-w-lg mx-auto lg:mx-0 rounded-playful-lg border-2 border-primary-300 shadow-2xl box-playful-highlight"
                    onError={(e) => {
                      // Hide image if it doesn't exist
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* What You Can Get Section */}
          <section className="px-4 pb-8">
            <div className="bg-white border-b-2 border-primary-500 box-playful-highlight-primary">
              <div className="px-8 py-12 md:py-16">
                <h2 className="text-3xl md:text-4xl font-bold font-playful text-text-primary mb-12 text-center">
                  {locale === 'cs' ? 'Co můžete získat' : 'What you can get'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {[
                    {
                      icon: Sparkles,
                      iconColor: 'text-yellow-500',
                      bgColor: 'bg-yellow-50',
                      title: locale === 'cs' ? 'Jasnost' : 'Clarity',
                      description: locale === 'cs' 
                        ? 'Získejte jasnou představu o tom, co chcete dosáhnout a jak toho dosáhnout.'
                        : 'Get a clear picture of what you want to achieve and how to achieve it.'
                    },
                    {
                      icon: TrendingUp,
                      iconColor: 'text-green-500',
                      bgColor: 'bg-green-50',
                      title: locale === 'cs' ? 'Motivace' : 'Motivation',
                      description: locale === 'cs'
                        ? 'Zůstaňte motivovaní sledováním svého pokroku a oslavováním úspěchů.'
                        : 'Stay motivated by tracking your progress and celebrating successes.'
                    },
                    {
                      icon: LayoutGrid,
                      iconColor: 'text-blue-500',
                      bgColor: 'bg-blue-50',
                      title: locale === 'cs' ? 'Organizace' : 'Organization',
                      description: locale === 'cs'
                        ? 'Mějte přehled o všech svých cílech, krocích a návycích na jednom místě.'
                        : 'Keep track of all your goals, steps and habits in one place.'
                    },
                    {
                      icon: Zap,
                      iconColor: 'text-purple-500',
                      bgColor: 'bg-purple-50',
                      title: locale === 'cs' ? 'Pokrok' : 'Progress',
                      description: locale === 'cs'
                        ? 'Dosáhněte svých cílů systematicky a efektivně díky jasnému plánování.'
                        : 'Achieve your goals systematically and efficiently through clear planning.'
                    }
                  ].map((item, index) => {
                    const IconComponent = item.icon
                    return (
                      <div key={index} className="card-playful-white p-8 hover:shadow-lg transition-shadow">
                        <div className={`w-14 h-14 ${item.bgColor} rounded-playful-md flex items-center justify-center mb-4 border-2 border-primary-200`}>
                          <IconComponent className={`w-7 h-7 ${item.iconColor}`} />
                        </div>
                        <h3 className="text-2xl font-bold font-playful text-text-primary mb-3">
                          {item.title}
                        </h3>
                        <p className="text-base text-text-secondary leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* What You Won't Get Section */}
          <section className="px-8 py-12 md:py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-playful text-text-primary mb-8">
              {locale === 'cs' ? 'Co nedostanete' : 'What you won\'t get'}
            </h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
                {locale === 'cs' 
                  ? 'Pokrok je skvělý nástroj, který vám pomůže dosáhnout vašich cílů, ale není to magická pilulka. Aplikace vám poskytne strukturu, organizaci a nástroje pro plánování, ale konečný úspěch závisí na vás. Pokrok vám pomůže na cestě, ale kroky musíte udělat sami.'
                  : 'Pokrok is a great tool that helps you achieve your goals, but it\'s not a magic pill. The app provides you with structure, organization, and planning tools, but your ultimate success depends on you. Pokrok will help you on your journey, but you must take the steps yourself.'}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
