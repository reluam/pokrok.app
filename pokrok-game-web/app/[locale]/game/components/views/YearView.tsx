'use client'

import { useLocale } from 'next-intl'
import { normalizeDate } from '../utils/dateHelpers'

interface YearViewProps {
  goals: any[]
  habits: any[]
  dailySteps: any[]
  areas: any[]
  selectedYear: number
  setSelectedYear: (year: number) => void
  setShowDatePickerModal: (show: boolean) => void
  handleItemClick: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  expandedAreas: Set<string | null>
  setExpandedAreas: (setter: (prev: Set<string | null>) => Set<string | null>) => void
  player?: any
}

export function YearView({
  goals,
  habits,
  dailySteps,
  areas,
  selectedYear,
  setSelectedYear,
  setShowDatePickerModal,
  handleItemClick,
  expandedAreas,
  setExpandedAreas,
  player
}: YearViewProps) {
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  const displayYear = selectedYear
  const currentYear = new Date().getFullYear()
  const isCurrentYear = displayYear === currentYear
  const yearStart = new Date(displayYear, 0, 1) // January 1st
  const yearEnd = new Date(displayYear, 11, 31) // December 31st
  
  // Filter goals for selected year
  const yearGoals = goals.filter(goal => {
    if (!goal.target_date) return goal.status === 'active'
    const targetDate = new Date(goal.target_date)
    return targetDate >= yearStart && targetDate <= yearEnd
  })
  
  // Calculate statistics for the selected year
  const statsYearStart = new Date(displayYear, 0, 1)
  const statsYearEnd = new Date(displayYear, 11, 31)
  
  // Navigation functions
  const goToPreviousYear = () => {
    setSelectedYear(displayYear - 1)
  }
  
  const goToNextYear = () => {
    setSelectedYear(displayYear + 1)
  }
  
  const goToCurrentYear = () => {
    setSelectedYear(currentYear)
  }
  
  // Calculate completed steps in selected year
  const completedStepsInYear = dailySteps.filter(step => {
    if (!step.completed || !step.date) return false
    const stepDate = normalizeDate(step.date)
    const stepDateObj = new Date(stepDate)
    return stepDateObj >= statsYearStart && stepDateObj <= statsYearEnd
  }).length
  
  // Calculate total steps in selected year
  const totalStepsInYear = dailySteps.filter(step => {
    if (!step.date) return false
    const stepDate = normalizeDate(step.date)
    const stepDateObj = new Date(stepDate)
    return stepDateObj >= statsYearStart && stepDateObj <= statsYearEnd
  }).length
  
  // Calculate completed habits in selected year
  let completedHabitsInYear = 0
  habits.forEach(habit => {
    if (habit.habit_completions) {
      Object.keys(habit.habit_completions).forEach(dateStr => {
        if (habit.habit_completions[dateStr] === true) {
          const habitDate = new Date(dateStr)
          if (habitDate >= statsYearStart && habitDate <= statsYearEnd) {
            completedHabitsInYear++
          }
        }
      })
    }
  })
  
  // Calculate completed goals for selected year
  const completedGoals = yearGoals.filter(goal => goal.status === 'completed' || goal.completed).length
  const activeGoals = yearGoals.filter(goal => goal.status === 'active').length
  
  // Calculate total XP earned in selected year
  let totalXpInYear = 0
  dailySteps.forEach(step => {
    if (step.completed && step.xp_reward && step.date) {
      const stepDate = normalizeDate(step.date)
      const stepDateObj = new Date(stepDate)
      if (stepDateObj >= statsYearStart && stepDateObj <= statsYearEnd) {
        totalXpInYear += step.xp_reward || 0
      }
    }
  })
  habits.forEach(habit => {
    if (habit.habit_completions && habit.xp_reward) {
      Object.keys(habit.habit_completions).forEach(dateStr => {
        if (habit.habit_completions[dateStr] === true) {
          const habitDate = new Date(dateStr)
          if (habitDate >= statsYearStart && habitDate <= statsYearEnd) {
            totalXpInYear += habit.xp_reward || 0
          }
        }
      })
    }
  })
  
  // Group goals by area
  const goalsByArea = areas.map(area => {
    const areaGoals = yearGoals.filter(goal => goal.area_id === area.id)
    return { area, goals: areaGoals }
  }).filter(item => item.goals.length > 0)
  
  // Add goals without area
  const goalsWithoutArea = yearGoals.filter(goal => !goal.area_id || !areas.find(a => a.id === goal.area_id))
  if (goalsWithoutArea.length > 0) {
    goalsByArea.push({ 
      area: { id: null, name: 'Ostatní', color: '#9CA3AF', icon: '📌' }, 
      goals: goalsWithoutArea 
    })
  }
  
  return (
    <div className="w-full h-full flex flex-col p-6 overflow-y-auto">
      {/* Header with navigation */}
      <div className="mb-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPreviousYear}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            title="Předchozí rok"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3 flex-1 justify-center">
            <button
              onClick={() => setShowDatePickerModal(true)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <h2 className="text-3xl font-bold text-gray-900">Roční přehled {displayYear}</h2>
            </button>
            {!isCurrentYear && (
              <button
                onClick={goToCurrentYear}
                className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                title="Přejít na aktuální rok"
              >
                {currentYear}
              </button>
            )}
          </div>
          
          <button
            onClick={goToNextYear}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            title="Následující rok"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600 text-center">Přehled cílů a statistik za rok {displayYear}</p>
      </div>
      
      {/* Two Column Layout - Goals and Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Left Column - Goals */}
        <div className="flex flex-col bg-white rounded-xl p-6 border border-orange-200 shadow-sm">
          <h3 className="text-xl font-bold text-orange-800 mb-4">CÍLE</h3>
          <div className="space-y-4 overflow-y-auto flex-1">
            {goalsByArea.map(({ area, goals: areaGoals }) => {
              const areaKey = area.id || 'other'
              const isExpanded = expandedAreas.has(areaKey)
              
              // Sort goals by target date
              const sortedGoals = [...areaGoals].sort((a, b) => {
                const dateA = a.target_date ? new Date(a.target_date).getTime() : Infinity
                const dateB = b.target_date ? new Date(b.target_date).getTime() : Infinity
                if (dateA === Infinity && dateB === Infinity) return 0
                if (dateA === Infinity) return 1
                if (dateB === Infinity) return -1
                return dateA - dateB
              })
              
              const goalsToShow = isExpanded ? sortedGoals : sortedGoals.slice(0, 3)
              
              const toggleArea = () => {
                setExpandedAreas(prev => {
                  const newSet = new Set(prev)
                  if (newSet.has(areaKey)) {
                    newSet.delete(areaKey)
                  } else {
                    newSet.add(areaKey)
                  }
                  return newSet
                })
              }
              
              return (
                <div key={areaKey} className="bg-gray-100 rounded-lg border border-gray-200">
                  <div 
                    className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-150 transition-colors"
                    onClick={toggleArea}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                        style={{ backgroundColor: area.color }}
                      >
                        <span className="text-white text-xs">{area.icon}</span>
                      </span>
                      <span className="text-base font-bold text-gray-800">{area.name}</span>
                      <span className="text-sm text-gray-500">({areaGoals.length})</span>
                    </div>
                    {isExpanded ? (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                  
                  {goalsToShow.length > 0 && (
                    <div className="p-3 space-y-2">
                      {goalsToShow.map((goal) => {
                        const goalProgress = goal.steps ? (goal.steps.filter((step: any) => step.completed).length / Math.max(goal.steps.length, 1)) * 100 : 0
                        const goalArea = areas.find(a => a.id === goal.area_id)
                        const areaIcon = goalArea?.icon || '🎯'
                        
                        return (
                          <div 
                            key={goal.id} 
                            className="bg-white rounded-lg p-3 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleItemClick(goal, 'goal')}
                          >
                            <div className="flex gap-3">
                              <div className="flex-shrink-0">
                                <span 
                                  className="w-10 h-10 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: '#FB923C' }}
                                >
                                  <span className="text-white text-lg">{areaIcon}</span>
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-800">{goal.title}</span>
                                  {goal.target_date && (
                                    <span className="text-xs text-orange-600 ml-2 whitespace-nowrap">
                                      {new Date(goal.target_date).toLocaleDateString(localeCode, { day: 'numeric', month: 'short' })}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${goalProgress}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-500 whitespace-nowrap">{Math.round(goalProgress)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {!isExpanded && sortedGoals.length > 3 && (
                        <div className="text-xs text-gray-500 text-center pt-1">
                          +{sortedGoals.length - 3} dalších
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {goalsByArea.length === 0 && (
              <div className="text-gray-400 text-center py-8">
                Žádné cíle pro tento rok
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Statistics */}
        <div className="flex flex-col bg-white rounded-xl p-6 border border-orange-200 shadow-sm">
          <h3 className="text-xl font-bold text-orange-800 mb-4">STATISTIKY ZA ROK {displayYear}</h3>
          <div className="space-y-6 flex-1">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{completedStepsInYear}</div>
                <div className="text-sm text-gray-600 mt-1">Dokončené kroky</div>
                {totalStepsInYear > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    z {totalStepsInYear} celkem ({Math.round((completedStepsInYear / totalStepsInYear) * 100)}%)
                  </div>
                )}
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{completedHabitsInYear}</div>
                <div className="text-sm text-gray-600 mt-1">Dokončené návyky</div>
              </div>
            </div>
            
            {/* Goals Stats */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-3">CÍLE</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Celkem cílů:</span>
                  <span className="font-bold text-gray-900">{yearGoals.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dokončené:</span>
                  <span className="font-bold text-green-600">{completedGoals}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Aktivní:</span>
                  <span className="font-bold text-blue-600">{activeGoals}</span>
                </div>
                {yearGoals.length > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Úspěšnost:</span>
                    <span className="font-bold text-purple-600">
                      {Math.round((completedGoals / yearGoals.length) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* XP Stats */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <h4 className="text-sm font-bold text-orange-800 mb-2">XP ZÍSKÁNO</h4>
              <div className="text-3xl font-bold text-orange-600">{totalXpInYear.toLocaleString(localeCode)}</div>
              <div className="text-xs text-gray-600 mt-1">Celkem za rok {displayYear}</div>
            </div>
            
            {/* Player Stats */}
            {player && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 mb-3">TVAŘ HRÁČE</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Level:</span>
                    <span className="font-bold text-gray-900">{player.level || 1}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">XP:</span>
                    <span className="font-bold text-gray-900">{(player.experience || 0).toLocaleString(localeCode)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

