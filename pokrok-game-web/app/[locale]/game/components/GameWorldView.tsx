'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { JourneyGameView } from './JourneyGameView'
import { DailyPlanningView } from '../../main/components/DailyPlanningView'
import { GoalsManagementView } from './views/GoalsManagementView'
import { StatisticsView } from '../../main/components/StatisticsView'
import { AchievementsView } from '../../main/components/AchievementsView'
import { SettingsView } from './SettingsView'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { HeaderNavigation } from './layout/HeaderNavigation'
import { useTranslations } from 'next-intl'
import { Target, CheckSquare, Footprints } from 'lucide-react'

interface GameWorldViewProps {
  player?: any
  userId?: string | null
  goals: any[]
  habits: any[]
  onGoalsUpdate: (goals: any[]) => void
  onHabitsUpdate: (habits: any[]) => void
  onPlayerUpdate?: (player: any) => void
  hasCompletedOnboarding?: boolean | null
  onOnboardingComplete?: () => void
}

type GameView = 'character' | 'daily-plan' | 'goals' | 'notes' | 'map' | 'habits' | 'statistics' | 'achievements' | 'settings'

export function GameWorldView({ player, userId, goals, habits, onGoalsUpdate, onHabitsUpdate, onPlayerUpdate, hasCompletedOnboarding, onOnboardingComplete }: GameWorldViewProps) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations()
  const [currentView, setCurrentView] = useState<GameView>('character')
  const [dailySteps, setDailySteps] = useState<any[]>([])
  const [isLoadingSteps, setIsLoadingSteps] = useState(true)
  const [mobileTopMenuOpen, setMobileTopMenuOpen] = useState(false)
  // Default function if onPlayerUpdate is not provided
  const handlePlayerUpdate = onPlayerUpdate || (() => {})

  // Calculate completed steps and habits
  const completedSteps = useMemo(() => {
    return dailySteps.filter(step => step.completed).length
  }, [dailySteps])

  const completedHabits = useMemo(() => {
    let count = 0
    habits.forEach(habit => {
      if (habit.habit_completions) {
        Object.values(habit.habit_completions).forEach(completed => {
          if (completed) {
            count++
          }
        })
      }
    })
    return count
  }, [habits])

  // Calculate login streak
  const loginStreak = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let streak = 0
    let checkDate = new Date(today)
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      // Check if there was activity (completed habit or step) on this date
      const hasActivity = habits.some(habit => habit.habit_completions?.[dateStr]) ||
                         dailySteps.some(step => {
                           const stepDate = step.date ? new Date(step.date).toISOString().split('T')[0] : null
                           return stepDate === dateStr && step.completed
                         })
      
      if (hasActivity) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }, [habits, dailySteps])

  // Top menu items
  const topMenuItems = [
    { id: 'goals' as const, label: t('navigation.goals'), icon: Target },
    { id: 'habits' as const, label: t('navigation.habits'), icon: CheckSquare },
    { id: 'steps' as const, label: t('navigation.steps'), icon: Footprints },
  ]

  // Navigation function
  const setCurrentPage = (page: 'main' | 'goals' | 'habits' | 'steps' | 'statistics' | 'achievements' | 'settings' | 'workflows' | 'help' | 'areas') => {
    const pageMap: Record<string, string> = {
      'main': 'main-panel',
      'goals': 'goals',
      'habits': 'habits',
      'steps': 'steps',
      'statistics': 'statistics',
      'achievements': 'achievements',
      'settings': 'settings',
      'workflows': 'workflows',
      'help': 'help',
      'areas': 'areas'
    }
    
    const route = pageMap[page] || 'main-panel'
    const localePrefix = locale === 'en' ? '' : `/${locale}`
    router.push(`${localePrefix}/${route}`)
  }

  // Get current page from view
  const getCurrentPage = (): 'main' | 'goals' | 'habits' | 'steps' | 'statistics' | 'achievements' | 'settings' | 'workflows' | 'help' | 'areas' => {
    switch (currentView) {
      case 'goals': return 'goals'
      case 'statistics': return 'statistics'
      case 'achievements': return 'achievements'
      case 'settings': return 'settings'
      default: return 'main'
    }
  }

  // Set initial view based on pathname
  useEffect(() => {
    if (pathname?.includes('/statistics')) {
      setCurrentView('statistics')
    } else if (pathname?.includes('/goals')) {
      setCurrentView('goals')
    } else if (pathname?.includes('/habits')) {
      setCurrentView('character') // Habits are shown in main panel
    } else if (pathname?.includes('/steps')) {
      setCurrentView('character') // Steps are shown in main panel
    } else if (pathname?.includes('/achievements')) {
      setCurrentView('achievements')
    } else if (pathname?.includes('/settings')) {
      setCurrentView('settings')
    } else {
      setCurrentView('character')
    }
  }, [pathname])

  // Load daily steps - load all overdue steps (no limit) + upcoming steps (next 30 days)
  useEffect(() => {
    const loadDailySteps = async () => {
      // Use userId prop if available, otherwise fallback to player?.user_id
      const currentUserId = userId || player?.user_id
      if (!currentUserId) {
        setIsLoadingSteps(false)
        return
      }

      setIsLoadingSteps(true)
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Load all overdue steps (no startDate limit) + upcoming steps (next 30 days)
        // Use a very old startDate (10 years ago) to get all overdue steps
        const veryOldDate = new Date(today)
        veryOldDate.setFullYear(veryOldDate.getFullYear() - 10)
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 30)
        
        // Load steps for date range
        const response = await fetch(
          `/api/daily-steps?userId=${currentUserId}&startDate=${veryOldDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
        )
        if (response.ok) {
          const steps = await response.json()
          setDailySteps(Array.isArray(steps) ? steps : [])
        } else {
          console.error('Failed to load daily steps, status:', response.status)
        }
      } catch (error) {
        console.error('Error loading daily steps:', error)
      } finally {
        setIsLoadingSteps(false)
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
            hasCompletedOnboarding={hasCompletedOnboarding}
            onOnboardingComplete={onOnboardingComplete}
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
          />
        )
      case 'statistics':
  return (
          <StatisticsView
            player={player}
            goals={goals}
            habits={habits}
            dailySteps={dailySteps}
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
            hasCompletedOnboarding={hasCompletedOnboarding}
            onOnboardingComplete={onOnboardingComplete}
          />
        )
    }
  }

  // Only show HeaderNavigation for views that don't have it built-in (i.e., not 'character')
  const showHeaderNavigation = currentView !== 'character'

  return (
    <>
      {showHeaderNavigation && (
        <HeaderNavigation
          currentPage={getCurrentPage()}
          setCurrentPage={setCurrentPage}
          mainPanelSection={null}
          setMainPanelSection={() => {}}
          topMenuItems={topMenuItems}
          completedSteps={completedSteps}
          completedHabits={completedHabits}
          loginStreak={loginStreak}
          mobileTopMenuOpen={mobileTopMenuOpen}
          setMobileTopMenuOpen={setMobileTopMenuOpen}
        />
      )}
      {renderCurrentView()}
    </>
  )
}
