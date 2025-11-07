'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
// Database operations moved to API routes
import { GameWorldView } from './components/GameWorldView'

export default function GamePage() {
  const { isSignedIn, isLoaded, user } = useUser()
  const router = useRouter()
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
                      const errorData = await createUserResponse.json().catch(() => ({}))
                      console.error('Failed to create user:', errorData)
                      router.push('/')
                      return
                    }
                    
                    const newUser = await createUserResponse.json()
                    setUserId(newUser.id)
                    setGoals([])
                    setHabits([])
                    setPlayer(null)
                    setIsLoading(false)
                  } else {
                    console.error('Error fetching game data')
                    router.push('/')
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
                setGoals([])
                setHabits([])
                setPlayer(null)
              } finally {
                setIsLoading(false)
              }
            }

            loadUserData()
          }, [isLoaded, isSignedIn, user, router])

  // Redirect to home if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  // Show loading while checking auth and loading data
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 pixel-art">Načítání...</h1>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
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