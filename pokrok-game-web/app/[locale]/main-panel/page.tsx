'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { GameWorldView } from '../planner/components/GameWorldView'
import { applyColorTheme } from '@/lib/color-utils'

export const dynamic = 'force-dynamic'

export default function MainPanelPage() {
  const { isSignedIn, isLoaded, user } = useUser()
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const [player, setPlayer] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [habits, setHabits] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)
  const [userCreated, setUserCreated] = useState(false) // Track if user was just created

  useEffect(() => {
    const loadUserData = async () => {
      if (!isLoaded || !isSignedIn || !user) {
        setIsLoading(false)
        return
      }

      // If user was just created, don't reload data - we already have the state set
      if (userCreated && userId) {
        console.log('[MainPanel] User was just created, skipping data reload to preserve onboarding state')
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
          const status = gameDataResponse.status
          const errorData = await gameDataResponse.json().catch(() => ({}))
          
          if (status === 404) {
            // 404 is expected for new users - create user silently
            console.log('[MainPanel] User not found in DB (new user), creating user...')
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
            console.log('[MainPanel] User created, setting onboarding state to false')
            setUserId(newUser.id)
            setHabits([])
            setPlayer(null)
            // New users haven't completed onboarding yet - set explicitly to false
            setHasCompletedOnboarding(false)
            setUserCreated(true) // Mark that user was just created
            // Remove from localStorage to ensure onboarding shows
            if (typeof window !== 'undefined') {
              localStorage.removeItem('has_completed_onboarding')
            }
            setIsLoading(false)
            return // Important: return early to prevent further error handling
          }
          
          // Only log as error if it's not a 404 (expected for new users)
          // This should only happen for actual server errors (500, 503, etc.)
          console.error('Error fetching game data:', {
            status: status,
            statusText: gameDataResponse.statusText,
            error: errorData
          })
          console.error('Server error details:', errorData)
          router.push(`/`)
          return
        } else {
          const gameData = await gameDataResponse.json()
          // Only update state if user was not just created (to preserve onboarding state)
          if (!userCreated) {
            setUserId(gameData.user.id)
            setPlayer(gameData.player || null)
            setHabits(gameData.habits || [])
            const completed = gameData.user.has_completed_onboarding ?? false
            setHasCompletedOnboarding(completed)
            
            if (!completed) {
              if (typeof window !== 'undefined') {
                localStorage.setItem('journeyGame_mainPanelSection', 'focus-upcoming')
                localStorage.removeItem('has_completed_onboarding')
              }
            }
          } else {
            console.log('[MainPanel] User was just created, preserving onboarding state (false)')
            // Even if userCreated, we should still load goals and habits to show onboarding steps
            setHabits(gameData.habits || [])
            setPlayer(gameData.player || null)
            // But keep hasCompletedOnboarding as false
            setHasCompletedOnboarding(false)
          }
        }
      } catch (error) {
        console.error('Error loading game data:', error)
        if (error instanceof Error) {
          console.error('Error message:', error.message)
          console.error('Error stack:', error.stack)
        }
        if (!userCreated) {
          setHabits([])
          setPlayer(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [isLoaded, isSignedIn, user?.id, router, locale])

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
      <GameWorldView 
        player={player} 
        userId={userId}
        habits={habits}
        onHabitsUpdate={setHabits}
        onPlayerUpdate={setPlayer}
        hasCompletedOnboarding={hasCompletedOnboarding}
        onOnboardingComplete={() => setHasCompletedOnboarding(true)}
      />
    </div>
  )
}

