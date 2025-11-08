'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
import { useTranslations, useLocale } from 'next-intl'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-8 pixel-art" style={{
            textShadow: '4px 4px 0px #000000',
            color: '#2d5016'
          }}>
            {t('app.name')}
          </h1>
          <p className="text-2xl text-gray-700 mb-4 pixel-art">
            {t('homepage.tagline')}
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto pixel-art">
            {t('homepage.description')}
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 pixel-art">{t('homepage.features.goals.title')}</h3>
            <p className="text-gray-600 pixel-art">{t('homepage.features.goals.description')}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 pixel-art">{t('homepage.features.habits.title')}</h3>
            <p className="text-gray-600 pixel-art">{t('homepage.features.habits.description')}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 pixel-art">{t('homepage.features.achievements.title')}</h3>
            <p className="text-gray-600 pixel-art">{t('homepage.features.achievements.description')}</p>
          </div>
        </div>

        {/* Start Game Section */}
        <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center pixel-art">
            {t('homepage.startJourney')}
          </h2>
          
          <div className="space-y-4">
            <SignUpButton mode="modal">
              <button className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg transition-all duration-300 pixel-art">
                {t('homepage.signUp')}
              </button>
            </SignUpButton>
            
            <SignInButton mode="modal">
              <button className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all duration-300 pixel-art">
                {t('homepage.signIn')}
              </button>
            </SignInButton>
            
            <div className="text-center text-gray-500 text-sm pixel-art">
              {t('homepage.or')}
            </div>
            
            <button 
              onClick={handleGuestContinue}
              className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-lg transition-all duration-300 pixel-art"
            >
              {t('homepage.continueAsGuest')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

