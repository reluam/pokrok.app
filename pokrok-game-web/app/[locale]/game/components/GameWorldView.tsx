'use client'

import { useState, useEffect } from 'react'
import { JourneyGameView } from './JourneyGameView'
import { DailyPlanningView } from './DailyPlanningView'
import { GoalsManagementView } from './GoalsManagementView'
import { HabitsManagementView } from './HabitsManagementView'
import { StatisticsView } from './StatisticsView'
import { AchievementsView } from './AchievementsView'
import { SettingsView } from './SettingsView'

interface GameWorldViewProps {
  player?: any
  userId?: string | null
  goals: any[]
  habits: any[]
  onGoalsUpdate: (goals: any[]) => void
  onHabitsUpdate: (habits: any[]) => void
  onPlayerUpdate?: (player: any) => void
}

type GameView = 'character' | 'daily-plan' | 'goals' | 'steps' | 'notes' | 'map' | 'habits' | 'statistics' | 'achievements' | 'settings'

export function GameWorldView({ player, userId, goals, habits, onGoalsUpdate, onHabitsUpdate, onPlayerUpdate }: GameWorldViewProps) {
  const [currentView, setCurrentView] = useState<GameView>('character')
  const [dailySteps, setDailySteps] = useState<any[]>([])
  
  // Default function if onPlayerUpdate is not provided
  const handlePlayerUpdate = onPlayerUpdate || (() => {})

  // Load daily steps - optimized: load only recent and upcoming steps (last 7 days + next 14 days)
  useEffect(() => {
    const loadDailySteps = async () => {
      // Use userId prop if available, otherwise fallback to player?.user_id
      const currentUserId = userId || player?.user_id
      if (!currentUserId) {
        return
      }

      try {
        // Calculate date range: 7 days ago to 14 days ahead
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 7)
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 14)
        
        // Load steps for date range
        const response = await fetch(
          `/api/daily-steps?userId=${currentUserId}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
        )
        if (response.ok) {
          const steps = await response.json()
          setDailySteps(steps)
        } else {
          console.error('Failed to load daily steps, status:', response.status)
        }
      } catch (error) {
        console.error('Error loading daily steps:', error)
      }
    }

    loadDailySteps()
  }, [userId, player?.user_id])

  const handleNavigateToDailyPlan = () => {
    setCurrentView('daily-plan')
  }

  const handleNavigateToGoals = () => {
    setCurrentView('goals')
  }

  const handleNavigateToSteps = () => {
    setCurrentView('steps')
  }

  const handleNavigateToNotes = () => {
    setCurrentView('notes')
  }

  const handleNavigateToMap = () => {
    setCurrentView('map')
  }

  const handleNavigateToHabits = () => {
    setCurrentView('habits')
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
    setDailySteps(steps)
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'character':
        return (
          <JourneyGameView
            player={player}
            userId={userId}
            goals={goals}
            habits={habits}
            dailySteps={dailySteps}
            onNavigateToGoals={handleNavigateToGoals}
            onNavigateToHabits={handleNavigateToHabits}
            onNavigateToSteps={handleNavigateToSteps}
            onNavigateToDailyPlan={handleNavigateToDailyPlan}
            onNavigateToStatistics={handleNavigateToStatistics}
            onNavigateToAchievements={handleNavigateToAchievements}
            onNavigateToSettings={handleNavigateToSettings}
            onHabitsUpdate={onHabitsUpdate}
            onGoalsUpdate={onGoalsUpdate}
            onDailyStepsUpdate={handleDailyStepsUpdate}
          />
        )
      case 'daily-plan':
        return (
          <DailyPlanningView
            player={player}
            goals={goals}
            habits={habits}
            onGoalsUpdate={onGoalsUpdate}
            onHabitsUpdate={onHabitsUpdate}
            onPlayerUpdate={handlePlayerUpdate}
            onBack={handleBackToCharacter}
            onDailyStepsUpdate={handleDailyStepsUpdate}
          />
        )
      case 'goals':
        return (
          <GoalsManagementView
            player={player}
            goals={goals}
            onGoalsUpdate={onGoalsUpdate}
            onBack={handleBackToCharacter}
          />
        )
      case 'habits':
        return (
          <HabitsManagementView
            player={player}
            habits={habits}
            onHabitsUpdate={onHabitsUpdate}
            onBack={handleBackToCharacter}
          />
        )
      case 'statistics':
  return (
          <StatisticsView
            player={player}
            goals={goals}
            habits={habits}
            onBack={handleBackToCharacter}
          />
        )
      case 'achievements':
        return (
          <AchievementsView
            player={player}
            goals={goals}
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
      case 'steps':
      case 'notes':
      case 'map':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-4 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {currentView === 'steps' && '👣 KROKY'}
                {currentView === 'notes' && '📝 POZNÁMKY'}
                {currentView === 'map' && '🗺️ MAPA'}
              </h1>
              <p className="text-gray-600 mb-6">
                {currentView === 'steps' && 'Tato sekce bude brzy dostupná'}
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
            goals={goals}
            habits={habits}
            dailySteps={dailySteps}
            onNavigateToGoals={handleNavigateToGoals}
            onNavigateToHabits={handleNavigateToHabits}
            onNavigateToSteps={handleNavigateToSteps}
            onNavigateToDailyPlan={handleNavigateToDailyPlan}
            onNavigateToStatistics={handleNavigateToStatistics}
            onNavigateToAchievements={handleNavigateToAchievements}
            onNavigateToSettings={handleNavigateToSettings}
            onHabitsUpdate={onHabitsUpdate}
            onGoalsUpdate={onGoalsUpdate}
            onDailyStepsUpdate={handleDailyStepsUpdate}
          />
        )
    }
  }

  return renderCurrentView()
}
