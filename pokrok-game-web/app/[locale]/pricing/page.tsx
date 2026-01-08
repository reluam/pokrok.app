'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useTranslations, useLocale } from 'next-intl'
import { Target, Check, ArrowLeft, Menu, X } from 'lucide-react'
import Image from 'next/image'
import { DevVersionTooltip } from '../components/DevVersionTooltip'
import { locales, type Locale } from '@/i18n/config'

// Force dynamic rendering - this page requires user authentication check
export const dynamic = 'force-dynamic'

export default function PricingPage() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()
  const t = useTranslations()
  const locale = useLocale()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)

  const switchLocale = (newLocale: Locale) => {
    setLanguageMenuOpen(false)
    // Set cookie immediately for instant locale change
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    
    // Save locale preference to database if user is logged in (async, doesn't block)
    fetch('/api/user/locale', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: newLocale })
    }).catch(err => {
      console.error('Failed to save locale preference to database:', err)
    })
    
    // Refresh the page to apply the new locale
    window.location.reload()
  }

  const languages = [
    { code: 'cs' as Locale, name: 'Čeština', flag: '🇨🇿' },
    { code: 'en' as Locale, name: 'English', flag: '🇬🇧' }
  ]

  const currentLanguage = languages.find(lang => lang.code === locale)

  // Redirect signed-in users to planner
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push(`/planner`)
    }
  }, [isLoaded, isSignedIn, router, locale])

  // Don't render anything while checking auth or if redirecting
  if (!isLoaded || (isLoaded && isSignedIn)) {
    return null
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Navigation */}
      <nav className="border-b-2 border-primary-500 bg-white sticky top-0 z-50 box-playful-highlight-primary">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo - clickable to home */}
            <Link href={`/`} className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity">
              <Image 
                src="/pokrok-logo.png" 
                alt={t('app.name') || 'Pokrok'} 
                width={120}
                height={40}
                className="h-6 md:h-8 w-auto"
                priority
              />
              <div className="flex items-center gap-1.5">
                <span className="text-xs md:text-sm text-primary-900">v0.1.0</span>
                <DevVersionTooltip iconSize="w-3 h-3 md:w-4 md:h-4" />
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-playful-lg bg-white border-2 border-primary-500 hover:bg-primary-50 transition-colors text-primary-900 font-medium text-sm box-playful-highlight"
                >
                  <span className="text-lg">{currentLanguage?.flag}</span>
                  <span>{currentLanguage?.name}</span>
                </button>

                {languageMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setLanguageMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-playful-lg border-2 border-primary-500 box-playful-highlight z-20">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => switchLocale(lang.code)}
                          className={`w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors flex items-center gap-2 ${
                            locale === lang.code ? 'bg-primary-50 font-semibold' : ''
                          }`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span>{lang.name}</span>
                          {locale === lang.code && (
                            <span className="ml-auto text-primary-600">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <Link 
                href={`/pricing`}
                className="text-sm md:text-base font-medium transition-colors text-primary-900 hover:text-primary-600 btn-playful-nav"
              >
                {locale === 'cs' ? 'Ceník' : 'Pricing'}
              </Link>
              <Link 
                href={`/sign-in`}
                className="text-sm md:text-base font-medium transition-colors text-primary-900 hover:text-primary-600 btn-playful-nav"
              >
                {t('homepage.signIn') || 'PŘIHLÁSIT SE'}
              </Link>
              <Link 
                href={`/sign-up`}
                className="px-4 py-2 bg-primary-600 text-white rounded-playful-lg hover:bg-primary-700 font-medium transition-colors text-sm md:text-base box-playful-highlight"
              >
                {t('homepage.startFree') || 'Začít zdarma'}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-primary-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
              <div className="flex flex-col gap-3">
                {/* Language Switcher Mobile */}
                <div className="relative">
                  <button
                    onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                    className="flex items-center gap-2 px-2 py-2 w-full text-left"
                  >
                    <span className="text-lg">{currentLanguage?.flag}</span>
                    <span className="text-sm text-primary-900">{currentLanguage?.name}</span>
                  </button>
                  {languageMenuOpen && (
                    <div className="mt-2 bg-white rounded-playful-lg border-2 border-primary-500 box-playful-highlight">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => switchLocale(lang.code)}
                          className={`w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors flex items-center gap-2 ${
                            locale === lang.code ? 'bg-primary-50 font-semibold' : ''
                          }`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span className="text-sm">{lang.name}</span>
                          {locale === lang.code && (
                            <span className="ml-auto text-primary-600">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Link 
                  href={`/pricing`}
                  className="text-sm font-medium px-2 py-2 transition-colors text-primary-900 hover:text-primary-600 btn-playful-nav"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {locale === 'cs' ? 'Ceník' : 'Pricing'}
                </Link>
                <Link 
                  href={`/sign-in`}
                  className="text-sm font-medium px-2 py-2 transition-colors text-primary-900 hover:text-primary-600 btn-playful-nav"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('homepage.signIn') || 'PŘIHLÁSIT SE'}
                </Link>
                <Link 
                  href={`/sign-up`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-playful-lg hover:bg-primary-700 font-medium transition-colors text-sm text-center box-playful-highlight"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('homepage.startFree') || 'Začít zdarma'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link 
            href={`/`}
            className="inline-flex items-center gap-2 mb-6 font-medium transition-colors text-primary-900 hover:text-primary-600 btn-playful-nav"
          >
            <ArrowLeft className="w-4 h-4" />
            {locale === 'cs' ? 'Zpět na úvod' : 'Back to home'}
          </Link>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-primary-900">
            {locale === 'cs' ? 'Ceník' : 'Pricing'}
          </h1>

          {/* Alpha Notice */}
          <div className="card-playful-white p-6 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="flex-shrink-0">
                <span className="inline-block px-3 py-1 bg-primary-600 text-white text-sm font-bold rounded-playful-md box-playful-highlight">
                  {locale === 'cs' ? 'ALFA VERZE' : 'ALPHA VERSION'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3 text-primary-900">
                  {locale === 'cs' 
                    ? 'Momentálně je celá aplikace zdarma'
                    : 'Currently the entire application is free'}
                </h3>
                <p className="text-base text-gray-700">
                  {locale === 'cs'
                    ? 'V současnosti běžíme v alfa verzi aplikace. Po dobu trvání alfy jsou všechny funkce zdarma a dostupné všem uživatelům.'
                    : 'We are currently running an alpha version of the application. For the duration of the alpha, all functions are free and available to all users.'}
                </p>
              </div>
            </div>
          </div>

          {/* Future Pricing */}
          <div className="card-playful-white p-6 md:p-8">
            <h3 className="text-2xl font-bold mb-6 text-center text-primary-900">
              {locale === 'cs' ? 'Ceník po ukončení alfy' : 'Pricing after alpha ends'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Free Tier */}
              <div className="card-playful-white p-6 md:p-8">
                <h4 className="text-2xl font-bold mb-3 text-primary-900">
                  {locale === 'cs' ? 'Free' : 'Free'}
                </h4>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary-900">$0</span>
                  <span className="text-gray-600">/{locale === 'cs' ? 'měsíc' : 'month'}</span>
                </div>
                <ul className="space-y-3 mb-6 text-base text-gray-700">
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

              {/* Premium Tier */}
              <div className="bg-primary-600 text-white rounded-playful-lg p-6 md:p-8 relative box-playful-highlight">
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-white text-primary-600 text-xs font-bold rounded-playful-md box-playful-highlight">
                    {locale === 'cs' ? 'DOPORUČENO' : 'RECOMMENDED'}
                  </span>
                </div>
                <h4 className="text-2xl font-bold mb-3">
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
                    locale === 'cs' ? 'Neomezené cíle, kroky a návyky' : 'Unlimited goals, steps and habits',
                    locale === 'cs' ? 'Asistent' : 'Assistant'
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-8">
              {locale === 'cs'
                ? 'Přesné detaily cen budou zveřejněny před ukončením alfy.'
                : 'Exact pricing details will be published before the alpha ends.'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-primary-500 py-8 mt-12 bg-primary-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-3 md:mb-0">
              <Image 
                src="/pokrok-logo.png" 
                alt={t('app.name') || 'Pokrok'} 
                width={100}
                height={33}
                className="h-5 md:h-6 w-auto"
              />
            </div>
            <div className="text-xs md:text-sm text-center md:text-left text-primary-900">
              © {new Date().getFullYear()} {t('app.name')}. {t('homepage.footer.rights') || 'Všechna práva vyhrazena.'}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
