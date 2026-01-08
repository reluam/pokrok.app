'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useTranslations, useLocale } from 'next-intl'
import { Target, Check, ArrowRight, Menu, X, Zap, TrendingUp, LayoutDashboard } from 'lucide-react'
import Image from 'next/image'
import { DevVersionTooltip } from './components/DevVersionTooltip'
import { locales, type Locale } from '@/i18n/config'

// Force dynamic rendering - this page requires user authentication check
export const dynamic = 'force-dynamic'

export default function HomePage() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()
  const t = useTranslations()
  const locale = useLocale()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
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
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border-2 border-primary-500 hover:bg-primary-50 transition-colors text-primary-900 font-medium text-sm"
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 lg:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side - Content */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-primary-900 mb-6">
                {locale === 'cs' 
                  ? 'Životní plánovač pro lidi, kteří chtějí žít podle sebe'
                  : 'Life planner for people who want to live on their own terms'}
          </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-8">
                {locale === 'cs'
                  ? 'Rozdělte velké cíle na malé kroky, budujte návyky a sledujte svůj pokrok.'
                  : 'Break down big goals into small steps, build habits, and track your progress.'}
              </p>
              <div className="flex flex-col gap-2 mb-4">
                <Link href={`/sign-up`} className="inline-flex">
                  <button className="w-full px-6 py-3 bg-white border-2 border-primary-500 rounded-playful-lg font-medium transition-all flex items-center justify-center gap-2 text-primary-600 hover:bg-primary-50 box-playful-highlight">
                    <span className="text-base font-semibold">{locale === 'cs' ? 'Začít zdarma' : 'Start for Free'}</span>
                    <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
              </div>
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                <span className="text-primary-600">🎁</span>
                <span>
                  {locale === 'cs'
                    ? (
                      <>
                        Po dobu trvání <Link href={`/pricing`} className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">alfa verze aplikace</Link> jsou zdarma i Premium funkce
                      </>
                    )
                    : (
                      <>
                        During the <Link href={`/pricing`} className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">alpha version</Link>, Premium features are also free
                      </>
                    )}
                </span>
              </p>
            </div>
            
            {/* Right side - App Screenshot */}
            <div className="flex justify-start lg:justify-start">
              <div className="relative w-full max-w-2xl h-[600px] overflow-hidden cursor-pointer border-t-2 border-l-2 border-b-2 border-primary-500" style={{ borderTopLeftRadius: '0.75rem', borderBottomLeftRadius: '0.75rem' }} onClick={() => setIsImageModalOpen(true)}>
                <div className="absolute inset-0 overflow-hidden">
                  <img 
                    src="/app-screenshot.png" 
                    alt={locale === 'cs' ? 'Screenshot aplikace Pokrok' : 'Pokrok app screenshot'}
                    className="h-full object-cover"
                    style={{ 
                      objectPosition: 'left center',
                      width: '180%',
                      height: '100%',
                      maxWidth: 'none'
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent via-transparent to-primary-50 pointer-events-none" style={{
                  background: 'linear-gradient(to right, transparent 0%, transparent 40%, rgba(254, 243, 231, 0.3) 60%, rgba(254, 243, 231, 0.7) 80%, rgba(254, 243, 231, 1) 100%)'
                }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white transition-colors z-10 border-2 border-primary-500"
              aria-label={locale === 'cs' ? 'Zavřít' : 'Close'}
            >
              <X size={24} className="text-primary-900" />
            </button>

            {/* Image in full size */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src="/app-screenshot.png"
                alt={locale === 'cs' ? 'Screenshot aplikace Pokrok - plné rozlišení' : 'Pokrok app screenshot - full resolution'}
                className="object-contain max-w-full max-h-full rounded-playful-lg border-2 border-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
              </div>
          </div>
        </div>
      )}

      {/* Co můžete získat */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="card-playful-white p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-primary-900">
              {locale === 'cs' ? 'Co můžete získat' : 'What you can get'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jasnou mysl */}
              <div className="card-playful-white p-4">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-playful-lg flex items-center justify-center box-playful-highlight">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-center mb-2 text-primary-900">
                  {locale === 'cs' ? 'Jasnou mysl' : 'Clear mind'}
                </h3>
                <p className="text-sm text-gray-700 text-center">
                  {locale === 'cs'
                    ? 'Získejte jasnou představu o tom čeho chcete docílit a jak toho dosáhnout.'
                    : 'Get a clear idea of what you want to achieve and how to achieve it.'}
              </p>
            </div>

              {/* Motivaci */}
              <div className="card-playful-white p-4">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-playful-lg flex items-center justify-center box-playful-highlight">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-center mb-2 text-primary-900">
                  {locale === 'cs' ? 'Motivaci' : 'Motivation'}
                </h3>
                <p className="text-sm text-gray-700 text-center">
                  {locale === 'cs'
                    ? 'Zůstaňte motivování díky sledování svého pokroku a oslavováním úspěchů.'
                    : 'Stay motivated by tracking your progress and celebrating successes.'}
                </p>
              </div>

              {/* Organizace */}
              <div className="card-playful-white p-4">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-playful-lg flex items-center justify-center box-playful-highlight">
                    <LayoutDashboard className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-center mb-2 text-primary-900">
                  {locale === 'cs' ? 'Organizace' : 'Organization'}
                  </h3>
                <p className="text-sm text-gray-700 text-center">
                  {locale === 'cs'
                    ? 'Mějte přehled o všech svých cílech, krocích a návycích na jednom místě.'
                    : 'Keep track of all your goals, steps, and habits in one place.'}
                </p>
              </div>

              {/* Pokrok */}
              <div className="card-playful-white p-4">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-playful-lg flex items-center justify-center box-playful-highlight">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-center mb-2 text-primary-900">
                  {locale === 'cs' ? 'Pokrok' : 'Progress'}
                </h3>
                <p className="text-sm text-gray-700 text-center">
                  {locale === 'cs'
                    ? 'Dosáhněte svých cílů systematicky a efektivně díky jasnému plánování.'
                    : 'Achieve your goals systematically and effectively through clear planning.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Co Pokrok není */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary-900">
              {locale === 'cs' ? 'Co Pokrok není' : 'What Pokrok is not'}
            </h2>
            <p className="text-base text-gray-700 max-w-3xl mx-auto">
              {locale === 'cs'
                ? 'Pokrok je skvělý nástroj, který vám pomůže dosáhnout vašich cílů, ale není to magická pilulka. Aplikace vám poskytne strukturu, organizaci a nástroje pro plánování, ale konečný úspěch závisí na vás. Pokrok vám pomůže na cestě, ale kroky musíte udělat sami.'
                : 'Pokrok is a great tool that will help you achieve your goals, but it is not a magic pill. The application will provide you with structure, organization, and tools for planning, but ultimate success depends on you. Pokrok will help you on your way, but you must take the steps yourself.'}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="card-playful-white p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary-900">
              {locale === 'cs' ? 'Začněte svou cestu k úspěchu' : 'Start your journey to success'}
            </h2>
            <p className="text-base text-gray-700 mb-6">
              {locale === 'cs'
                ? 'Připojte se k lidem, kteří používají Pokrok k dosahování svých cílů. Začněte zdarma ještě dnes.'
                : 'Join people who use Pokrok to achieve their goals. Start for free today.'}
            </p>
            <Link href={`/sign-up`} className="inline-block">
              <button className="px-6 py-3 bg-white border-2 border-primary-500 rounded-playful-lg font-medium transition-all flex items-center gap-2 mx-auto text-primary-600 hover:bg-primary-50 box-playful-highlight">
                {t('homepage.startFree') || 'Začít zdarma'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <p className="text-sm text-gray-600 mt-4 flex items-center justify-center gap-1.5">
              <span className="text-primary-600">🎁</span>
              <span>
                {locale === 'cs'
                  ? (
                    <>
                      Po dobu trvání <Link href={`/pricing`} className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">alfa verze aplikace</Link> jsou zdarma i Premium funkce
                    </>
                  )
                  : (
                    <>
                      During the <Link href={`/pricing`} className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">alpha version</Link>, Premium features are also free
                    </>
                  )}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-primary-500 py-8 bg-primary-50">
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
