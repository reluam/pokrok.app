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
  const [goals, setGoals] = useState<any[]>([])
  const [habits, setHabits] = useState<any[]>([])
  
  // Debug log for habits updates
  useEffect(() => {
    console.log('Debug - habits updated in GamePage:', habits)
    const studenaSprcha = habits.find(h => h.name === 'Studená sprcha')
    if (studenaSprcha) {
      console.log('Debug - Studená sprcha in GamePage:', studenaSprcha)
      console.log('Debug - Studená sprcha habit_completions in GamePage:', studenaSprcha.habit_completions)
    }
  }, [habits])
  const [isLoading, setIsLoading] = useState(true)

          // Load user data
          useEffect(() => {
            const loadUserData = async () => {
              if (!isLoaded || !isSignedIn || !user) {
                setIsLoading(false)
                return
              }

              try {
                // Get user from database via API
                const userResponse = await fetch(`/api/user?clerkId=${user.id}`)
                if (!userResponse.ok) {
                  if (userResponse.status === 404) {
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
                    // Load goals and habits (empty arrays for new users)
                    setGoals([])
                    setHabits([])
                    // Skip onboarding, data is already loaded, component will render GameWorldView
                    setIsLoading(false)
                  } else {
                    console.error('Error fetching user')
                    router.push('/')
                    return
                  }
                } else {
                  const dbUser = await userResponse.json()

                  // Load existing data via API (skip onboarding check)
                  const [playerResponse, goalsResponse, habitsResponse] = await Promise.all([
                    fetch(`/api/player?userId=${dbUser.id}`),
                    fetch(`/api/goals?userId=${dbUser.id}`),
                    fetch(`/api/habits`)
                  ])

                  if (playerResponse.ok) {
                    const playerData = await playerResponse.json()
                    setPlayer(playerData)
                  } else {
                    // Player doesn't exist, but that's okay - we don't require character creation
                    // Just continue without a player object
                    console.log('Player not found, continuing without player')
                    setPlayer(null)
                  }
                  
                  if (goalsResponse.ok) {
                    const goalsData = await goalsResponse.json()
                    setGoals(goalsData)
                  } else {
                    // If goals don't exist, start with empty array
                    setGoals([])
                  }
                  
                  if (habitsResponse.ok) {
                    const habitsData = await habitsResponse.json()
                    setHabits(habitsData)
                  } else {
                    // If habits don't exist, start with empty array
                    console.error('Failed to load habits:', habitsResponse.status)
                    setHabits([])
                  }
                  
                  // Data loaded, component will render GameWorldView - no onboarding
                }
              } catch (error) {
                console.error('Error loading user data:', error)
                // If there's an error, start with empty arrays
                setGoals([])
                setHabits([])
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
        goals={goals} 
        habits={habits}
        onGoalsUpdate={setGoals}
        onHabitsUpdate={setHabits}
        onPlayerUpdate={setPlayer}
      />
    </div>
  )
}