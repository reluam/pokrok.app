'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { JourneyGameView } from '../planner/components/JourneyGameView'
import { applyColorTheme } from '@/lib/color-utils'

export const dynamic = 'force-dynamic'

export default function HelpPage() {
  const { isSignedIn, isLoaded, user } = useUser()
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const [player, setPlayer] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [habits, setHabits] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      if (!isLoaded || !isSignedIn || !user) {
        setIsLoading(false)
        return
      }

      try {
        try {
          const settingsResponse = await fetch('/api/cesta/user-settings')
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json()
            const primaryColor = settingsData.settings?.primary_color || '#E8871E'
            applyColorTheme(primaryColor)
          }
        } catch (error) {
          console.error('Error loading primary color:', error)
          applyColorTheme('#E8871E')
        }
        
        const gameDataResponse = await fetch('/api/game/init')
        
        if (!gameDataResponse.ok) {
          const errorData = await gameDataResponse.json().catch(() => ({}))
          console.error('Error fetching game data:', {
            status: gameDataResponse.status,
            statusText: gameDataResponse.statusText,
            error: errorData
          })
          
          if (gameDataResponse.status === 404) {
            const createUserResponse = await fetch('/api/user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress || '',
                firstName: user.firstName || '',
                lastName: user.lastName || ''
              })
            })

            if (!createUserResponse.ok) {
              const createErrorData = await createUserResponse.json().catch(() => ({}))
              console.error('Failed to create user:', createErrorData)
              router.push(`/`)
              return
            }

            const newUser = await createUserResponse.json()
            setUserId(newUser.id)
            setHabits([])
            setPlayer(null)
            setIsLoading(false)
          } else {
            console.error('Server error details:', errorData)
            router.push(`/${locale}`)
            return
          }
        } else {
          const gameData = await gameDataResponse.json()
          setUserId(gameData.user.id)
          setPlayer(gameData.player || null)
          setHabits(gameData.habits || [])
          setHasCompletedOnboarding(gameData.user.has_completed_onboarding ?? false)
        }
      } catch (error) {
        console.error('Error loading game data:', error)
        if (error instanceof Error) {
          console.error('Error message:', error.message)
          console.error('Error stack:', error.stack)
        }
        setHabits([])
        setPlayer(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [isLoaded, isSignedIn, user, router, locale])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(`/${locale}`)
    }
  }, [isLoaded, isSignedIn, router, locale])

  const isDataLoaded = habits !== undefined && !isLoading
  
  if (!isLoaded || !isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          </div>
          <h1 className="text-2xl font-bold text-primary-600">
            {t('common.loadingData')}
          </h1>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <JourneyGameView 
        player={player} 
        userId={userId}
        habits={habits}
        onHabitsUpdate={setHabits}
        hasCompletedOnboarding={hasCompletedOnboarding}
        onOnboardingComplete={() => setHasCompletedOnboarding(true)}
      />
    </div>
  )
}

