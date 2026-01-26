'use client'

import { useState, useEffect, useRef } from 'react'
import { JourneyGameView } from './JourneyGameView'
import { DailyPlanningView } from './DailyPlanningView'
import { StatisticsView } from './StatisticsView'
import { AchievementsView } from './AchievementsView'
import { SettingsView } from './SettingsView'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { useTranslations } from 'next-intl'

interface GameWorldViewProps {
  player?: any
  userId?: string | null
  habits: any[]
  onHabitsUpdate: (habits: any[]) => void
  onPlayerUpdate?: (player: any) => void
  hasCompletedOnboarding?: boolean | null
  onOnboardingComplete?: () => void
}

type GameView = 'character' | 'daily-plan' | 'notes' | 'map' | 'habits' | 'statistics' | 'achievements' | 'settings'

export function GameWorldView({ player, userId, habits, onHabitsUpdate, onPlayerUpdate, hasCompletedOnboarding, onOnboardingComplete }: GameWorldViewProps) {
  const [currentView, setCurrentView] = useState<GameView>('character')
  const [dailySteps, setDailySteps] = useState<any[]>([])
  const dailyStepsRef = useRef<any[]>([])
  const [isLoadingSteps, setIsLoadingSteps] = useState(true)
  // Default function if onPlayerUpdate is not provided
  const handlePlayerUpdate = onPlayerUpdate || (() => {})
  
  // Keep ref in sync with state
  useEffect(() => {
    dailyStepsRef.current = dailySteps
  }, [dailySteps])

  // Load daily steps - load all overdue steps (no limit) + upcoming steps (next 30 days)
  // Only load if dailySteps is empty (initial load), to avoid overwriting updates from child components
  useEffect(() => {
    const loadDailySteps = async () => {
      console.log('[GameWorldView] useEffect triggered', {
        hasUserId: !!userId,
        hasPlayerUserId: !!player?.user_id,
        dailyStepsLength: dailySteps.length
      })
      
      // Use userId prop if available, otherwise fallback to player?.user_id
      const currentUserId = userId || player?.user_id
      if (!currentUserId) {
        console.log('[GameWorldView] No userId, skipping load')
        setIsLoadingSteps(false)
        return
      }

      // Only load if dailySteps is empty (initial load)
      // This prevents overwriting updates from child components when steps are created/updated
      if (dailySteps.length > 0) {
        console.log('[GameWorldView] dailySteps already loaded, skipping fetch')
        setIsLoadingSteps(false)
        return
      }
      
      console.log('[GameWorldView] Starting to load daily steps for userId:', currentUserId)

      setIsLoadingSteps(true)
      
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Load overdue steps (90 days back) + upcoming steps (next 30 days)
        // Limit to 90 days to avoid loading excessive historical data
        const veryOldDate = new Date(today)
        veryOldDate.setDate(veryOldDate.getDate() - 90)
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 30)
        
        // Load steps for date range
        const response = await fetch(
          `/api/daily-steps?userId=${currentUserId}&startDate=${veryOldDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
        )
        
        if (response.ok) {
          const steps = await response.json()
          setDailySteps(Array.isArray(steps) ? steps : [])
          dailyStepsRef.current = Array.isArray(steps) ? steps : []
        } else {
          console.error('Failed to load daily steps, status:', response.status)
        }
      } catch (error) {
        console.error('[GameWorldView] Error loading daily steps:', error)
      } finally {
        setIsLoadingSteps(false)
      }
    }

    loadDailySteps()
  }, [userId, player?.user_id]) // Only reload if userId changes, not on every render

  const handleNavigateToDailyPlan = () => {
    setCurrentView('daily-plan')
  }

  // Goals removed - no navigation to goals

  const handleNavigateToSteps = () => {
    // Navigate to main panel with steps section
    setCurrentView('character')
    // Set the section in localStorage so JourneyGameView will load it
    if (typeof window !== 'undefined') {
      localStorage.setItem('journeyGame_mainPanelSection', 'steps')
      // Dispatch custom event for same-window updates
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key: 'journeyGame_mainPanelSection', newValue: 'steps' }
      }))
    }
  }

  const handleNavigateToNotes = () => {
    setCurrentView('notes')
  }

  const handleNavigateToMap = () => {
    setCurrentView('map')
  }

  const handleNavigateToHabits = () => {
    // Navigate to main panel with habits section
    setCurrentView('character')
    // Set the section in localStorage so JourneyGameView will load it
    if (typeof window !== 'undefined') {
      localStorage.setItem('journeyGame_mainPanelSection', 'habits')
      // Dispatch custom event for same-window updates
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key: 'journeyGame_mainPanelSection', newValue: 'habits' }
      }))
    }
  }

  const handleNavigateToStatistics = () => {
    setCurrentView('statistics')
  }

  const handleNavigateToAchievements = () => {
    setCurrentView('achievements')
  }

  const handleNavigateToSettings = () => {
    setCurrentView('settings')
  }

  const handleBackToCharacter = () => {
    setCurrentView('character')
  }

  const handleDailyStepsUpdate = (steps: any[]) => {
    // Update both ref and state immediately to ensure consistency across all views
    // Update ref first (synchronous, immediate)
    dailyStepsRef.current = steps
    
    // Update state (triggers re-render)
    setDailySteps(steps)
    
    // Also dispatch custom event as backup mechanism for cross-component synchronization
    // This ensures all views get updated even if prop chain is broken
    window.dispatchEvent(new CustomEvent('dailyStepsUpdated', { 
      detail: { steps, source: 'GameWorldView' } 
    }))
  }
  
  // Listen for custom events as backup mechanism
  useEffect(() => {
    const handleDailyStepsUpdated = (event: any) => {
      const { steps, source } = event.detail || {}
      if (steps && Array.isArray(steps) && source !== 'GameWorldView') {
        // Only update if event didn't come from this component (avoid infinite loop)
        dailyStepsRef.current = steps
        setDailySteps(steps)
      }
    }
    
    window.addEventListener('dailyStepsUpdated', handleDailyStepsUpdated)
    return () => {
      window.removeEventListener('dailyStepsUpdated', handleDailyStepsUpdated)
    }
  }, [])

  const renderCurrentView = () => {
    switch (currentView) {
      case 'character':
        return (
          <JourneyGameView
            player={player}
            userId={userId}
            habits={habits}
            dailySteps={dailySteps}
            isLoadingSteps={isLoadingSteps}
            onNavigateToHabits={handleNavigateToHabits}
            onNavigateToSteps={handleNavigateToSteps}
            onNavigateToDailyPlan={handleNavigateToDailyPlan}
            onNavigateToStatistics={handleNavigateToStatistics}
            onNavigateToAchievements={handleNavigateToAchievements}
            onNavigateToSettings={handleNavigateToSettings}
            onHabitsUpdate={onHabitsUpdate}
            onDailyStepsUpdate={handleDailyStepsUpdate}
            hasCompletedOnboarding={hasCompletedOnboarding}
            onOnboardingComplete={onOnboardingComplete}
          />
        )
      case 'daily-plan':
        return (
          <DailyPlanningView
            player={player}
            habits={habits}
            onHabitsUpdate={onHabitsUpdate}
            onPlayerUpdate={handlePlayerUpdate}
            onBack={handleBackToCharacter}
            onDailyStepsUpdate={handleDailyStepsUpdate}
          />
        )
      // Goals removed - no goals view
      case 'statistics':
  return (
          <StatisticsView
            player={player}
            habits={habits}
            dailySteps={dailySteps}
            onBack={handleBackToCharacter}
          />
        )
      case 'achievements':
        return (
          <AchievementsView
            player={player}
            habits={habits}
            level={player?.level || 1}
            experience={player?.experience || 0}
            completedTasks={dailySteps.filter(s => s.completed).length}
            onBack={handleBackToCharacter}
          />
        )
      case 'settings':
        return (
          <SettingsView
            player={player}
            onPlayerUpdate={handlePlayerUpdate}
            onBack={handleBackToCharacter}
          />
        )
      case 'notes':
      case 'map':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-4 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {currentView === 'notes' && '📝 POZNÁMKY'}
                {currentView === 'map' && '🗺️ MAPA'}
              </h1>
              <p className="text-gray-600 mb-6">
                {currentView === 'notes' && 'Tato sekce bude brzy dostupná'}
                {currentView === 'map' && 'Tato sekce bude brzy dostupná'}
              </p>
              <button
                onClick={handleBackToCharacter}
                className="px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                ← Zpět k postavě
              </button>
            </div>
          </div>
        )
      default:
        return (
          <JourneyGameView
            player={player}
            userId={userId}
            habits={habits}
            dailySteps={dailySteps}
            onNavigateToHabits={handleNavigateToHabits}
            onNavigateToSteps={handleNavigateToSteps}
            onNavigateToDailyPlan={handleNavigateToDailyPlan}
            onNavigateToStatistics={handleNavigateToStatistics}
            onNavigateToAchievements={handleNavigateToAchievements}
            onNavigateToSettings={handleNavigateToSettings}
            onHabitsUpdate={onHabitsUpdate}
            onDailyStepsUpdate={handleDailyStepsUpdate}
            hasCompletedOnboarding={hasCompletedOnboarding}
            onOnboardingComplete={onOnboardingComplete}
          />
        )
    }
  }

  return (
    <>
      {renderCurrentView()}
    </>
  )
}
