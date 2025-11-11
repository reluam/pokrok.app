'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useTranslations, useLocale } from 'next-intl'

// Force dynamic rendering - this page requires user authentication check
export const dynamic = 'force-dynamic'

export default function HomePage() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()
  const t = useTranslations()
  const locale = useLocale()

  const handleGuestContinue = () => {
    router.push(`/${locale}/game`)
  }

  // Redirect signed-in users to game
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push(`/${locale}/game`)
    }
  }, [isLoaded, isSignedIn, router, locale])

  // Don't render anything while checking auth or if redirecting
  if (!isLoaded || (isLoaded && isSignedIn)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-orange-600 mb-8">
            {t('app.name')}
          </h1>
          <p className="text-2xl text-gray-800 mb-4 font-semibold">
            {t('homepage.tagline')}
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('homepage.description')}
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center border border-orange-100 hover:border-orange-300 transition-all">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('homepage.features.overview.title')}</h3>
            <p className="text-gray-600">{t('homepage.features.overview.description')}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center border border-orange-100 hover:border-orange-300 transition-all">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('homepage.features.steps.title')}</h3>
            <p className="text-gray-600">{t('homepage.features.steps.description')}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center border border-orange-100 hover:border-orange-300 transition-all">
            <div className="text-4xl mb-4">💪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('homepage.features.motivation.title')}</h3>
            <p className="text-gray-600">{t('homepage.features.motivation.description')}</p>
          </div>
        </div>

        {/* Start Journey Section */}
        <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-lg border border-orange-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t('homepage.startJourney')}
          </h2>
          
          <div className="space-y-4">
            <Link href="/sign-up" className="block">
              <button className="w-full px-6 py-3 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 shadow-lg transition-all duration-300">
                {t('homepage.signUp')}
              </button>
            </Link>
            
            <Link href="/sign-in" className="block">
              <button className="w-full px-6 py-3 rounded-xl font-bold bg-white text-orange-600 border-2 border-orange-500 hover:bg-orange-50 shadow-lg transition-all duration-300">
                {t('homepage.signIn')}
              </button>
            </Link>
            
            <div className="text-center text-gray-500 text-sm">
              {t('homepage.or')}
            </div>
            
            <button 
              onClick={handleGuestContinue}
              className="w-full px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-all duration-300"
            >
              {t('homepage.continueAsGuest')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

