'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
// Database operations moved to API routes
import { GameWorldView } from './components/GameWorldView'
import { applyColorTheme } from '@/lib/color-utils'

// Force dynamic rendering - this page requires user authentication
export const dynamic = 'force-dynamic'

export default function GamePage() {
  const { isSignedIn, isLoaded, user } = useUser()
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const [player, setPlayer] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [habits, setHabits] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)

          // Load user data - optimized single API call
          useEffect(() => {
            const loadUserData = async () => {
              if (!isLoaded || !isSignedIn || !user) {
                setIsLoading(false)
                return
              }

              try {
                // Check localStorage first for onboarding status and set it immediately
                // This prevents onboarding from showing on refresh if it was already completed
                const cachedOnboardingStatus = typeof window !== 'undefined' 
                  ? localStorage.getItem('has_completed_onboarding')
                  : null
                
                // If cached as completed, set state immediately to prevent onboarding from showing
                if (cachedOnboardingStatus === 'true') {
                  setHasCompletedOnboarding(true)
                }
                
                // Load primary color from user settings first
                try {
                  const settingsResponse = await fetch('/api/cesta/user-settings')
                  if (settingsResponse.ok) {
                    const settingsData = await settingsResponse.json()
                    const primaryColor = settingsData.settings?.primary_color || '#E8871E'
                    // applyColorTheme already saves to localStorage, but we ensure sync
                    applyColorTheme(primaryColor)
                  }
                } catch (error) {
                  console.error('Error loading primary color:', error)
                  // Fallback to default - applyColorTheme will save to localStorage
                  applyColorTheme('#E8871E')
                }
                
                // Try to load all game data in one request with cache-busting
                const gameDataResponse = await fetch(`/api/game/init?t=${Date.now()}`, {
                  cache: 'no-store',
                  headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                  }
                })
                
                if (!gameDataResponse.ok) {
                  const errorData = await gameDataResponse.json().catch(() => ({}))
                  console.error('Error fetching game data:', {
                    status: gameDataResponse.status,
                    statusText: gameDataResponse.statusText,
                    error: errorData
                  })
                  
                  if (gameDataResponse.status === 404) {
                    // User not found, create them
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
                      router.push(`/${locale}`)
                      return
                    }

                    const newUser = await createUserResponse.json()
                    setUserId(newUser.id)
                    setGoals([])
                    setHabits([])
                    setPlayer(null)
                    setIsLoading(false)
                  } else {
                    // For 500 errors, show more details
                    console.error('Server error details:', errorData)
                    router.push(`/${locale}`)
                    return
                  }
                } else {
                  // All data loaded in one request
                  const gameData = await gameDataResponse.json()
                  setUserId(gameData.user.id)
                  setPlayer(gameData.player || null)
                  setGoals(gameData.goals || [])
                  setHabits(gameData.habits || [])
                  const completed = gameData.user.has_completed_onboarding ?? false
                  
                  // Only update onboarding status if:
                  // 1. It's completed in DB (always trust DB when it says completed)
                  // 2. OR if localStorage says it's not completed and DB also says it's not completed
                  // This prevents overwriting localStorage=true with DB=false (which could be a cache issue)
                  if (completed || cachedOnboardingStatus !== 'true') {
                    setHasCompletedOnboarding(completed)
                    
                    // Store onboarding status in localStorage to prevent re-checking
                    if (typeof window !== 'undefined') {
                      if (completed) {
                        localStorage.setItem('has_completed_onboarding', 'true')
                      } else {
                        localStorage.removeItem('has_completed_onboarding')
                      }
                    }
                  }
                  // If localStorage says completed but DB says not completed, keep localStorage value
                  // This handles edge cases where DB might have stale data
                  
                  // If onboarding not completed, ensure we're on focus-upcoming
                  const finalCompletedStatus = completed || cachedOnboardingStatus === 'true'
                  if (!finalCompletedStatus) {
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('journeyGame_mainPanelSection', 'focus-upcoming')
                    }
                  }
                }
              } catch (error) {
                console.error('Error loading game data:', error)
                if (error instanceof Error) {
                  console.error('Error message:', error.message)
                  console.error('Error stack:', error.stack)
                }
                setGoals([])
                setHabits([])
                setPlayer(null)
              } finally {
                setIsLoading(false)
              }
            }

            loadUserData()
          }, [isLoaded, isSignedIn, user, router, locale])

  // Redirect to home if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(`/${locale}`)
    }
  }, [isLoaded, isSignedIn, router, locale])

  // Show loading while checking auth and loading data
  // Check if data is loaded (goals, habits should be arrays, not undefined)
  const isDataLoaded = goals !== undefined && habits !== undefined && !isLoading
  
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

  // Don't render if not signed in
  if (!isSignedIn) {
    return null
  }

  // Render the game world with onboarding support
  return (
    <div className="min-h-screen bg-primary-50">
      <GameWorldView 
        player={player} 
        userId={userId}
        goals={goals} 
        habits={habits}
        onGoalsUpdate={setGoals}
        onHabitsUpdate={setHabits}
        onPlayerUpdate={setPlayer}
        hasCompletedOnboarding={hasCompletedOnboarding}
        onOnboardingComplete={async () => {
          setHasCompletedOnboarding(true)
          // Store in localStorage to prevent re-checking after refresh
          if (typeof window !== 'undefined') {
            localStorage.setItem('has_completed_onboarding', 'true')
          }
          // Refresh user data to ensure state is up to date, including goals and areas
          try {
            const refreshResponse = await fetch(`/api/game/init?t=${Date.now()}`, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            })
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              const completed = refreshData.user?.has_completed_onboarding ?? true
              setHasCompletedOnboarding(completed)
              // Update goals and habits to show newly created onboarding goal
              if (refreshData.goals) {
                setGoals(refreshData.goals)
                console.log('[GamePage] Updated goals after onboarding:', refreshData.goals.length)
              }
              if (refreshData.habits) {
                setHabits(refreshData.habits)
              }
              if (refreshData.player) {
                setPlayer(refreshData.player)
              }
            }
          } catch (refreshError) {
            console.error('[GamePage] Error refreshing user data after onboarding:', refreshError)
          }
        }}
      />
    </div>
  )
}

