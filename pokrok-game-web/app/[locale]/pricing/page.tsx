'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useTranslations, useLocale } from 'next-intl'
import { Target, Check, ArrowLeft } from 'lucide-react'
import { DevVersionTooltip } from '../../components/DevVersionTooltip'

// Force dynamic rendering - this page requires user authentication check
export const dynamic = 'force-dynamic'

export default function PricingPage() {
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
                href={`/${locale}`}
                className="text-sm md:text-base text-text-primary hover:text-primary-600 font-semibold font-playful transition-colors"
              >
                {locale === 'cs' ? 'Úvod' : 'Home'}
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
          <div className="bg-white border-b-2 border-primary-500 box-playful-highlight-primary">
            <div className="px-8 py-12">
              <Link 
                href={`/${locale}`}
                className="inline-flex items-center gap-2 text-text-primary hover:text-primary-600 font-semibold font-playful transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                {locale === 'cs' ? 'Zpět na úvod' : 'Back to home'}
              </Link>

              <h1 className="text-4xl md:text-5xl font-bold font-playful text-text-primary mb-6">
                {locale === 'cs' ? 'Ceník' : 'Pricing'}
              </h1>

              {/* Alpha Notice */}
              <div className="card-playful-primary mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="inline-block px-3 py-1 bg-primary-600 text-white text-sm font-bold font-playful rounded-playful-md box-playful-highlight">
                      {locale === 'cs' ? 'ALFA VERZE' : 'ALPHA'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold font-playful text-text-primary mb-3">
                      {locale === 'cs' 
                        ? 'Momentálně je celá aplikace zdarma'
                        : 'Currently the entire app is free'}
                    </h3>
                    <p className="text-base text-text-secondary mb-4">
                      {locale === 'cs'
                        ? 'V současnosti běžíme v alfa verzi aplikace. Po dobu trvání alfy jsou všechny funkce zdarma a dostupné všem uživatelům.'
                        : 'We are currently running in alpha version. During the alpha period, all features are free and available to all users.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Future Pricing */}
              <div className="card-playful-primary">
                <h3 className="text-2xl font-bold font-playful text-text-primary mb-6 text-center">
                  {locale === 'cs' ? 'Ceník po ukončení alfy' : 'Pricing after alpha'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Free Tier */}
                  <div className="card-playful-white">
                    <h4 className="text-2xl font-bold font-playful text-text-primary mb-3">
                      {locale === 'cs' ? 'Free' : 'Free'}
                    </h4>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-text-primary">$0</span>
                      <span className="text-text-secondary">/{locale === 'cs' ? 'měsíc' : 'month'}</span>
                    </div>
                    <ul className="space-y-3 mb-6 text-base text-text-primary">
                      {[
                        locale === 'cs' ? 'Historie aktuálního měsíce' : 'Current month history',
                        locale === 'cs' ? '3 oblasti s neomezenými cíli, kroky a návyky' : '3 Areas with unlimited goals, steps and habits',
                        locale === 'cs' ? 'Základní zobrazení a filtrování' : 'Basic views and filtering'
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
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
                    <h4 className="text-2xl font-bold font-playful mb-3">
                      {locale === 'cs' ? 'Premium' : 'Premium'}
                    </h4>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">$8</span>
                      <span className="opacity-90">/{locale === 'cs' ? 'měsíc' : 'month'}</span>
                      <div className="text-base opacity-90 mt-1">
                        {locale === 'cs' ? 'nebo $78 ročně' : 'or $78/year'}
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6 text-base">
                      {[
                        locale === 'cs' ? 'Historie za celou dobu' : 'All time history',
                        locale === 'cs' ? 'Statistiky' : 'Statistics',
                        locale === 'cs' ? 'Neomezené oblasti' : 'Unlimited Areas',
                        locale === 'cs' ? 'Neomezené cíle, kroky a návyky' : 'Unlimited goals, steps and habits'
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="text-center text-sm text-text-secondary mt-8">
                  {locale === 'cs'
                    ? 'Přesné detaily cen budou zveřejněny před ukončením alfy.'
                    : 'Exact pricing details will be announced before the end of alpha.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

