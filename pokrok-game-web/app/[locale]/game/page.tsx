'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
// Database operations moved to API routes
import { GameWorldView } from './components/GameWorldView'

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

          // Load user data - optimized single API call
          useEffect(() => {
            const loadUserData = async () => {
              if (!isLoaded || !isSignedIn || !user) {
                setIsLoading(false)
                return
              }

              try {
                // Try to load all game data in one request
                const gameDataResponse = await fetch('/api/game/init')
                
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
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          </div>
          <h1 className="text-2xl font-bold text-orange-600">{t('common.loading')}</h1>
        </div>
      </div>
    )
  }

  // Don't render if not signed in
  if (!isSignedIn) {
    return null
  }

  // Onboarding removed - users go directly to playing
  // No setup handlers needed anymore

  // Render the game world directly - no onboarding
  return (
    <div className="min-h-screen bg-white">
      <GameWorldView 
        player={player} 
        userId={userId}
        goals={goals} 
        habits={habits}
        onGoalsUpdate={setGoals}
        onHabitsUpdate={setHabits}
        onPlayerUpdate={setPlayer}
      />
    </div>
  )
}

