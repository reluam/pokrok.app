'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { normalizeDate } from '../utils/dateHelpers'

interface YearViewProps {
  goals: any[]
  habits: any[]
  dailySteps: any[]
  selectedYear: number
  setSelectedYear: (year: number) => void
  handleItemClick: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  player?: any
  areas?: any[]
  visibleSections?: Record<string, boolean>
}

export function YearView({
  goals,
  habits,
  dailySteps,
  selectedYear,
  setSelectedYear,
  handleItemClick,
  player,
  areas = []
}: YearViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() // 0-11
  const displayYear = selectedYear || currentYear
  
  // Responsive state - detect if we should show quarters instead of months
  const [showQuarters, setShowQuarters] = useState(false)
  
  useEffect(() => {
    const checkWidth = () => {
      // Check if container is too narrow for 12 months
      // Assuming each month needs ~60px, we need at least 720px for 12 months
      // Plus 200px for goal titles = 920px minimum
      const minWidthForMonths = 920
      const availableWidth = window.innerWidth - 400 // Account for sidebars and padding
      setShowQuarters(availableWidth < minWidthForMonths)
    }
    
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])
  
  // Month names
  const monthNames = localeCode === 'cs-CZ' 
    ? ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  
  const monthNamesShort = localeCode === 'cs-CZ'
    ? ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  // Quarter names - seasons
  const quarterNames = localeCode === 'cs-CZ'
    ? ['Jaro', 'Léto', 'Podzim', 'Zima']
    : ['Spring', 'Summer', 'Fall', 'Winter']
  
  // Quarter names short - fallback if seasons don't fit
  const quarterNamesShort = ['Q1', 'Q2', 'Q3', 'Q4']
  
  // Calculate goals for each month - active goals that have target_date in this month or are active during this month
  const monthlyGoalsData = useMemo(() => {
    const yearStart = new Date(displayYear, 0, 1)
    const yearEnd = new Date(displayYear, 11, 31, 23, 59, 59)
    
    return monthNames.map((_, monthIndex) => {
      const monthStart = new Date(displayYear, monthIndex, 1)
      const monthEnd = new Date(displayYear, monthIndex + 1, 0, 23, 59, 59)
      
      // Get active goals for this month
      const monthGoals = goals.filter(goal => {
        if (goal.status !== 'active') return false
        
        // Goals without target_date are active all year
        if (!goal.target_date) return true
        
    const targetDate = new Date(goal.target_date)
        const goalStart = goal.start_date ? new Date(goal.start_date) : (goal.created_at ? new Date(goal.created_at) : yearStart)
        
        // Goal is active if:
        // 1. Goal starts before or during this month AND
        // 2. Goal ends during or after this month
        return goalStart <= monthEnd && targetDate >= monthStart
      })
      
      // Calculate average progress for these goals
      let totalProgress = 0
      let goalsWithProgress = 0
      
      monthGoals.forEach(goal => {
        if (goal.progress_percentage !== undefined && goal.progress_percentage !== null) {
          totalProgress += goal.progress_percentage
          goalsWithProgress++
        }
      })
      
      const avgProgress = goalsWithProgress > 0 ? totalProgress / goalsWithProgress : 0
      
      return {
        monthIndex,
        monthName: monthNamesShort[monthIndex],
        fullMonthName: monthNames[monthIndex],
        goalsCount: monthGoals.length,
        avgProgress: Math.round(avgProgress)
      }
    })
  }, [goals, displayYear, monthNames, monthNamesShort])
  
  // Calculate steps ending in this year - only steps ending this year count for progress
  const stepsEndingThisYear = useMemo(() => {
    const yearStart = new Date(displayYear, 0, 1)
    const yearEnd = new Date(displayYear, 11, 31, 23, 59, 59)
    
    // Filter steps that end this year (date is within this year)
    return dailySteps.filter(step => {
    if (!step.date) return false
    const stepDate = normalizeDate(step.date)
    const stepDateObj = new Date(stepDate)
      return stepDateObj >= yearStart && stepDateObj <= yearEnd
    })
  }, [dailySteps, displayYear])
  
  // Calculate progress for steps ending this year
  const stepsProgressThisYear = useMemo(() => {
    if (stepsEndingThisYear.length === 0) return 0
    const completed = stepsEndingThisYear.filter(step => step.completed).length
    return Math.round((completed / stepsEndingThisYear.length) * 100)
  }, [stepsEndingThisYear])
  
  // Calculate goals ending in future years (proportional)
  const goalsEndingFutureYears = useMemo(() => {
    const yearStart = new Date(displayYear, 0, 1)
    const yearEnd = new Date(displayYear, 11, 31, 23, 59, 59)
    
    return goals.filter(goal => {
      if (goal.status !== 'active' || !goal.target_date) return false
      const targetDate = new Date(goal.target_date)
      
      // Goal ends after this year
      if (targetDate > yearEnd) {
        // Check if goal starts before or during this year
        const goalStart = goal.start_date ? new Date(goal.start_date) : (goal.created_at ? new Date(goal.created_at) : yearStart)
        return goalStart <= yearEnd
      }
      
      return false
    }).map(goal => {
      const targetDate = new Date(goal.target_date)
      const goalStart = goal.start_date ? new Date(goal.start_date) : (goal.created_at ? new Date(goal.created_at) : yearStart)
      const totalDuration = targetDate.getTime() - goalStart.getTime()
      const yearDuration = yearEnd.getTime() - Math.max(goalStart.getTime(), yearStart.getTime())
      const proportion = totalDuration > 0 ? yearDuration / totalDuration : 0
      
      return {
        ...goal,
        proportion: Math.max(0, Math.min(1, proportion))
      }
    })
  }, [goals, displayYear])
  
  // Use steps progress instead of goals progress
  const avgProgressThisYear = stepsProgressThisYear
  
  // Calculate average progress for goals ending in future years (weighted by proportion)
  const avgProgressFutureYears = useMemo(() => {
    if (goalsEndingFutureYears.length === 0) return 0
    const total = goalsEndingFutureYears.reduce((sum, goal) => {
      const progress = goal.progress_percentage || 0
      return sum + (progress * goal.proportion)
    }, 0)
    const totalProportion = goalsEndingFutureYears.reduce((sum, goal) => sum + goal.proportion, 0)
    return totalProportion > 0 ? Math.round((total / totalProportion)) : 0
  }, [goalsEndingFutureYears])
  
  // Calculate statistics and insights
  const stats = useMemo(() => {
    const yearStart = new Date(displayYear, 0, 1)
    const yearEnd = new Date(displayYear, 11, 31, 23, 59, 59)
    
    // Completed habits
    let completedHabits = 0
    const habitCompletionsByHabit: Record<string, number> = {}
    
  habits.forEach(habit => {
      habitCompletionsByHabit[habit.id] = 0
    if (habit.habit_completions) {
      Object.keys(habit.habit_completions).forEach(dateStr => {
        if (habit.habit_completions[dateStr] === true) {
          const habitDate = new Date(dateStr)
            if (habitDate >= yearStart && habitDate <= yearEnd) {
              completedHabits++
              habitCompletionsByHabit[habit.id] = (habitCompletionsByHabit[habit.id] || 0) + 1
            }
        }
      })
    }
  })
  
    // Find most and least completed habits
    const habitStats = Object.entries(habitCompletionsByHabit)
      .map(([habitId, count]) => {
        const habit = habits.find(h => h.id === habitId)
        return { habit, count }
      })
      .filter(h => h.habit)
      .sort((a, b) => b.count - a.count)
    
    const mostCompletedHabit = habitStats.length > 0 && habitStats[0].count > 0 ? habitStats[0] : null
    const leastCompletedHabit = habitStats.length > 0 && habitStats[habitStats.length - 1].count > 0 
      ? habitStats[habitStats.length - 1] 
      : null
    
    // Steps by area
    const stepsByArea: Record<string, { total: number; completed: number }> = {}
    let totalSteps = 0
    let totalCompletedSteps = 0
    
  dailySteps.forEach(step => {
      if (step.date) {
      const stepDate = normalizeDate(step.date)
      const stepDateObj = new Date(stepDate)
        if (stepDateObj >= yearStart && stepDateObj <= yearEnd) {
          totalSteps++
          const areaId = step.area_id || 'no-area'
          if (!stepsByArea[areaId]) {
            stepsByArea[areaId] = { total: 0, completed: 0 }
          }
          stepsByArea[areaId].total++
          if (step.completed) {
            totalCompletedSteps++
            stepsByArea[areaId].completed++
          }
        }
      }
    })
    
    // Find area with highest completion rate
    const areaStats = Object.entries(stepsByArea)
      .map(([areaId, stats]) => {
        const area = areas.find(a => a.id === areaId)
        const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
        return { area, areaId, completionRate, ...stats }
      })
      .filter(a => a.total > 0)
      .sort((a, b) => b.completionRate - a.completionRate)
    
    const topArea = areaStats.length > 0 ? areaStats[0] : null
    
    // Goals with no progress
    const goalsWithNoProgress = goals.filter(goal => {
      if (goal.status !== 'active') return false
      if (!goal.target_date) return false
      const targetDate = new Date(goal.target_date)
      return targetDate >= yearStart && targetDate <= yearEnd && (goal.progress_percentage || 0) === 0
    })
    
    // Areas with no activity
    const areasWithNoActivity = areas.filter(area => {
      const areaGoals = goals.filter(g => g.area_id === area.id && g.status === 'active')
      const areaSteps = dailySteps.filter(s => {
        if (!s.date) return false
        const stepDate = normalizeDate(s.date)
        const stepDateObj = new Date(stepDate)
        return stepDateObj >= yearStart && stepDateObj <= yearEnd && s.area_id === area.id
      })
      return areaGoals.length === 0 && areaSteps.length === 0
    })
    
    // Goals completed in target and after target
    let goalsCompletedInTarget = 0
    let goalsCompletedAfterTarget = 0
    
    goals.forEach(goal => {
      if (goal.status === 'completed' && goal.target_date) {
        const targetDate = new Date(goal.target_date)
        const completedAt = goal.completed_at ? new Date(goal.completed_at) : null
        
        if (completedAt && completedAt >= yearStart && completedAt <= yearEnd) {
          if (completedAt <= targetDate) {
            goalsCompletedInTarget++
          } else {
            goalsCompletedAfterTarget++
          }
        }
      }
    })
    
    // Steps completed in target and after target
    let stepsCompletedInTarget = 0
    let stepsCompletedAfterTarget = 0
    
    dailySteps.forEach(step => {
      if (step.completed && step.completed_at && step.date) {
        const stepDate = normalizeDate(step.date)
        const stepDateObj = new Date(stepDate)
        stepDateObj.setHours(0, 0, 0, 0)
        const completedAt = new Date(step.completed_at)
        completedAt.setHours(0, 0, 0, 0)
        
        if (completedAt >= yearStart && completedAt <= yearEnd) {
          if (completedAt <= stepDateObj) {
            stepsCompletedInTarget++
          } else {
            stepsCompletedAfterTarget++
          }
        }
      }
    })
    
    return {
      completedHabits,
      goalsCompletedInTarget,
      goalsCompletedAfterTarget,
      stepsCompletedInTarget,
      stepsCompletedAfterTarget,
      mostCompletedHabit,
      leastCompletedHabit,
      topArea,
      totalSteps,
      totalCompletedSteps,
      goalsWithNoProgress,
      areasWithNoActivity
    }
  }, [habits, goals, dailySteps, displayYear, areas])
  
  return (
    <div className="w-full h-full flex flex-col bg-primary-50 overflow-y-auto">
      {/* Roadmap Timeline */}
      <div className="px-6 pt-6 pb-1 bg-primary-50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
          <button
              onClick={() => setSelectedYear(displayYear - 1)}
              className="p-2 rounded-playful-sm bg-white border-2 border-primary-300 hover:bg-primary-50 hover:border-primary-500 transition-colors"
              title={t('common.previousYear') || 'Předchozí rok'}
            >
              <ChevronLeft className="w-5 h-5 text-primary-600" />
          </button>
            <h2 className="text-3xl font-bold text-black font-playful min-w-[120px] text-center">
              {displayYear}
            </h2>
            <button
              onClick={() => setSelectedYear(displayYear + 1)}
              className="p-2 rounded-playful-sm bg-white border-2 border-primary-300 hover:bg-primary-50 hover:border-primary-500 transition-colors"
              title={t('common.nextYear') || 'Následující rok'}
            >
              <ChevronRight className="w-5 h-5 text-primary-600" />
            </button>
          </div>
          {displayYear !== currentYear && (
              <button
              onClick={() => setSelectedYear(currentYear)}
              className="px-4 py-2 bg-primary-500 text-white rounded-playful-sm hover:bg-primary-600 transition-colors font-playful text-sm"
              >
              {t('common.backToCurrent') || 'Zpět na aktuální rok'}
              </button>
            )}
          </div>
          
      </div>
      
      {/* Statistics */}
      <div className="px-6 pt-3 pb-6 bg-primary-50 border-b-2 border-primary-500">
        <h3 className="text-xl font-bold text-black font-playful mb-4">
          {t('common.statistics') || 'Statistiky'}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Completed Habits */}
          <div className="box-playful-highlight p-4 bg-white">
            <div className="text-sm text-gray-600 font-playful mb-1">
              {t('habits.completed') || 'Splněné návyky'}
            </div>
            <div className="text-2xl font-bold text-primary-600 font-playful">
              {stats.completedHabits}
              </div>
            </div>
            
          {/* Goals completed in target */}
          <div className="box-playful-highlight p-4 bg-white">
            <div className="text-sm text-gray-600 font-playful mb-1">
              {t('goals.completedInTarget') || 'Cíle splněné v targetu'}
                </div>
            <div className="text-2xl font-bold text-green-600 font-playful">
              {stats.goalsCompletedInTarget}
                </div>
                </div>
          
          {/* Goals completed after target */}
          <div className="box-playful-highlight p-4 bg-white">
            <div className="text-sm text-gray-600 font-playful mb-1">
              {t('goals.completedAfterTarget') || 'Cíle splněné po targetu'}
                  </div>
            <div className="text-2xl font-bold text-orange-600 font-playful">
              {stats.goalsCompletedAfterTarget}
              </div>
            </div>
            
          {/* Steps completed in target */}
          <div className="box-playful-highlight p-4 bg-white">
            <div className="text-sm text-gray-600 font-playful mb-1">
              {t('steps.completedInTarget') || 'Kroky splněné v targetu'}
            </div>
            <div className="text-2xl font-bold text-green-600 font-playful">
              {stats.stepsCompletedInTarget}
                  </div>
                </div>
          
          {/* Steps completed after target */}
          <div className="box-playful-highlight p-4 bg-white">
            <div className="text-sm text-gray-600 font-playful mb-1">
              {t('steps.completedAfterTarget') || 'Kroky splněné po targetu'}
            </div>
            <div className="text-2xl font-bold text-orange-600 font-playful">
              {stats.stepsCompletedAfterTarget}
              </div>
          </div>
        </div>
      </div>
      
      {/* Goals Roadmap */}
      <div className="p-6 bg-primary-50 border-b-2 border-primary-500 -mt-4">
        <h3 className="text-xl font-bold text-black font-playful mb-6">
          {t('goals.title') || 'Cíle'}
        </h3>
        <div className="space-y-8">
          {(() => {
            // Group goals by area
            // Filter: only show goals that end in this year or later (not goals that ended in previous years)
            const yearStart = new Date(displayYear, 0, 1)
            const yearEnd = new Date(displayYear, 11, 31, 23, 59, 59)
            
            const activeGoals = goals.filter(goal => {
              if (goal.status !== 'active') return false
              
              // Check if goal has start_date in the future - don't show it before its start date
              if (goal.start_date) {
                const startDate = new Date(goal.start_date)
                // If start date is after the end of this year, don't show it
                if (startDate > yearEnd) return false
              }
              
              // Goals without target_date are shown in all years (ongoing goals)
              if (!goal.target_date) return true
              
              // Goal must end in this year or later (not in previous years)
              const targetDate = new Date(goal.target_date)
              return targetDate >= yearStart
            })
            
            const goalsByArea = activeGoals.reduce((acc, goal) => {
              const areaId = goal.area_id || 'no-area'
              const areaName = goal.area_id 
                ? (areas.find(area => area.id === goal.area_id)?.name || t('goals.unknownArea') || 'Neznámá oblast')
                : (t('goals.noArea') || 'Bez oblasti')
              
              if (!acc[areaId]) {
                acc[areaId] = {
                  areaId,
                  areaName,
                  areaColor: goal.area_id 
                    ? (areas.find(area => area.id === goal.area_id)?.color || '#ea580c')
                    : '#ea580c',
                  goals: []
                }
              }
              acc[areaId].goals.push(goal)
              return acc
            }, {} as Record<string, { areaId: string; areaName: string; areaColor: string; goals: any[] }>)
            
            // Sort areas: areas with goals first, then "no area"
            const sortedAreas = (Object.values(goalsByArea) as Array<{ areaId: string; areaName: string; areaColor: string; goals: any[] }>).sort((a, b) => {
              if (a.areaId === 'no-area') return 1
              if (b.areaId === 'no-area') return -1
              return a.areaName.localeCompare(b.areaName)
            })
            
            return sortedAreas.map((areaGroup) => (
              <div key={areaGroup.areaId} className="card-playful-base bg-white">
                <div className="space-y-4">
                  {/* Area header */}
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: areaGroup.areaColor }}
                    />
                    <h4 className="text-lg font-semibold text-gray-700 font-playful">
                      {areaGroup.areaName}
                    </h4>
                    <span className="text-sm text-gray-500 font-playful">
                      ({areaGroup.goals.length} {areaGroup.goals.length === 1 ? (t('goals.goal') || 'cíl') : (t('goals.goals') || 'cílů')})
                    </span>
                  </div>
                  
                  {/* Goals in this area */}
                  <div className="space-y-4 pl-7">
                    {/* Quarter/Month labels for this area */}
                    <div className="relative mb-2">
                      <div className="flex items-center gap-4">
                        {/* Spacer matching goal title width */}
                        <div className="flex-shrink-0 min-w-[200px]"></div>
                        {/* Labels container - same width as progress bars */}
                        <div className="flex-1 relative">
                          {showQuarters ? (
                            /* Quarter labels */
                            <div className="flex relative">
                              {quarterNames.map((quarterName, index) => {
                                const quarterStartMonth = index * 3
                                const isCurrentQuarter = displayYear === currentYear && 
                                  currentMonth >= quarterStartMonth && currentMonth < quarterStartMonth + 3
                                return (
                                  <div
                                    key={index}
                                    className="flex-1 relative"
                                  >
                                    <div className={`text-center text-xs font-playful ${
                                      isCurrentQuarter ? 'font-bold text-primary-600' : 'text-gray-500'
                                    }`}>
                                      <span className="hidden sm:inline">{quarterName}</span>
                                      <span className="sm:hidden">{quarterNamesShort[index]}</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            /* Month labels */
                            <div className="flex relative">
                              {monthNamesShort.map((monthName, index) => {
                                const isCurrentMonth = displayYear === currentYear && index === currentMonth
                                return (
                                  <div
                                    key={index}
                                    className="flex-1 relative"
                                  >
                                    <div className={`text-center text-xs font-playful ${
                                      isCurrentMonth ? 'font-bold text-primary-600' : 'text-gray-500'
                                    }`}>
                                      {monthName}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                  {areaGroup.goals.map((goal: any) => {
                    const yearStart = new Date(displayYear, 0, 1)
                    const yearEnd = new Date(displayYear, 11, 31, 23, 59, 59)
                    
                    // Calculate start and end dates - FIX: always use target_date if it exists
                    const goalStart = goal.start_date 
                      ? new Date(goal.start_date) 
                      : (goal.created_at ? new Date(goal.created_at) : yearStart)
                    const goalEnd = goal.target_date 
                      ? new Date(goal.target_date) 
                      : yearEnd
            
                    // Clamp to year bounds
                    const barStart = goalStart < yearStart ? yearStart : goalStart
                    const barEnd = goalEnd > yearEnd ? yearEnd : goalEnd
                    
                    // Calculate position - either by months or quarters
                    const calculatePosition = (date: Date) => {
                      if (showQuarters) {
                        // Calculate position in quarters (0-4 quarters = 0-100%)
                        const month = date.getMonth()
                        const day = date.getDate()
                        const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate()
                        const monthProgress = (day - 1) / daysInMonth // 0-1, where 0 is start of month
                        const quarter = Math.floor(month / 3)
                        const monthInQuarter = month % 3
                        const quarterProgress = (monthInQuarter + monthProgress) / 3 // 0-1 within quarter
                        return quarter + quarterProgress
                      } else {
                        // Calculate position in months (0-12 months = 0-100%)
                        const month = date.getMonth()
                        const day = date.getDate()
                        const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate()
                        const monthProgress = (day - 1) / daysInMonth // 0-1, where 0 is start of month
                        return month + monthProgress
                      }
                    }
                    
                    const startPos = calculatePosition(barStart)
                    const endPos = calculatePosition(barEnd)
                    
                    // Convert to percentage (0-4 quarters or 0-12 months = 0-100%)
                    const divisor = showQuarters ? 4 : 12
                    const startPercent = (startPos / divisor) * 100
                    const endPercent = (endPos / divisor) * 100
                    const barWidth = endPercent - startPercent
                    
                    const progress = goal.progress_percentage || 0
                    
                    // Get goal color from area group
                    const goalColor = areaGroup.areaColor
              
              return (
                      <div key={goal.id} className="relative">
                <div className="flex items-center gap-4">
                  <span 
                    className="text-sm font-semibold text-gray-800 font-playful flex-shrink-0 min-w-[200px] max-w-[200px] cursor-pointer hover:text-primary-600 transition-colors truncate"
                    onClick={() => handleItemClick(goal, 'goal')}
                    title={goal.title}
                  >
                    {goal.title}
                      </span>
                  <div className="flex-1 relative h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                    {/* Month/Quarter boundary lines - aligned with labels */}
                    {showQuarters ? (
                      // Quarter boundary lines
                      quarterNames.map((_, index: number) => {
                        if (index === 0) return null // Skip first line (left edge)
                        return (
                          <div
                            key={index}
                            className="absolute top-0 bottom-0 w-px bg-gray-300"
                            style={{ left: `${(index / 4) * 100}%` }}
                          />
                        )
                      })
                    ) : (
                      // Month boundary lines
                      monthNamesShort.map((_, index: number) => {
                        if (index === 0) return null // Skip first line (left edge)
                        return (
                          <div
                            key={index}
                            className="absolute top-0 bottom-0 w-px bg-gray-300"
                            style={{ left: `${(index / 12) * 100}%` }}
                          />
                        )
                      })
                    )}
                    
                    {/* Goal progress bar background */}
                    <div
                      className="absolute h-full rounded-lg transition-all duration-300 opacity-60"
                      style={{ 
                        left: `${startPercent}%`,
                        width: `${barWidth}%`,
                        backgroundColor: goalColor
                      }}
                    />
                    
                    {/* Goal progress fill */}
                    <div
                      className="absolute h-full rounded-lg transition-all duration-300"
                      style={{ 
                        left: `${startPercent}%`,
                        width: `${(barWidth * progress) / 100}%`,
                        backgroundColor: goalColor
                      }}
                    />
                    
                    {/* Progress percentage text */}
                    {barWidth > 8 && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                          left: `${startPercent}%`,
                          width: `${barWidth}%`
                        }}
                      >
                        <span className="text-xs font-bold text-white font-playful drop-shadow-md">
                          {progress}%
                                </span>
                              </div>
                    )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            ))
          })()}
          {goals.filter(goal => goal.status === 'active').length === 0 && (
            <div className="text-center text-gray-400 py-8 font-playful">
              {t('goals.noGoals') || 'Žádné aktivní cíle'}
                        </div>
                      )}
                    </div>
                </div>
      
      {/* Insights Section */}
      <div className="p-6 bg-primary-50 border-b-2 border-primary-500">
        <h3 className="text-xl font-bold text-black font-playful mb-4">
          {t('yearView.insights') || 'Poznatky z roku'}
        </h3>
        
        <div className="space-y-4">
          {/* Top area by completion rate */}
          {stats.topArea && stats.topArea.total > 0 && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700 font-playful">
                <span className="font-bold text-green-700">
                  {Math.round(stats.topArea.completionRate)}%
                </span>{' '}
                {t('yearView.stepsFromArea') || 'splněných kroků bylo z oblasti'}{' '}
                <span className="font-semibold text-green-800">
                  {stats.topArea.area?.name || t('goals.noArea') || 'Bez oblasti'}
                </span>
                {stats.topArea.total > 0 && (
                  <> ({stats.topArea.completed} / {stats.topArea.total})</>
                )}
              </p>
              </div>
          )}
          
          {/* Most completed habit */}
          {stats.mostCompletedHabit && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 font-playful">
                <span className="font-semibold text-blue-800">
                  {stats.mostCompletedHabit.habit?.name || t('habits.habit')}
                </span>{' '}
                {t('yearView.mostCompletedHabit') || 'byl nejvíce dodržovaný návyk'} ({stats.mostCompletedHabit.count} {t('yearView.completions') || 'splnění'})
              </p>
            </div>
          )}
          
          {/* Least completed habit */}
          {stats.leastCompletedHabit && stats.leastCompletedHabit.habit?.id !== stats.mostCompletedHabit?.habit?.id && (
            <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <p className="text-sm text-gray-700 font-playful">
                <span className="font-semibold text-orange-800">
                  {stats.leastCompletedHabit.habit?.name || t('habits.habit')}
                </span>{' '}
                {t('yearView.leastCompletedHabit') || 'byl nejméně dodržovaný návyk'} ({stats.leastCompletedHabit.count} {t('yearView.completions') || 'splnění'})
              </p>
                  </div>
                )}
          
          {/* Goals with no progress */}
          {stats.goalsWithNoProgress.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-700 font-playful">
                <span className="font-semibold text-yellow-800">
                  {stats.goalsWithNoProgress.length}
                </span>{' '}
                {stats.goalsWithNoProgress.length === 1 
                  ? (t('yearView.goalNoProgress') || 'cíl ještě nemá žádný pokrok')
                  : (t('yearView.goalsNoProgress') || 'cílů ještě nemá žádný pokrok')
                }
              </p>
            </div>
          )}
          
          {/* Areas with no activity */}
          {stats.areasWithNoActivity.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
              <p className="text-sm text-gray-700 font-playful">
                <span className="font-semibold text-red-800">
                  {stats.areasWithNoActivity.length}
                </span>{' '}
                {stats.areasWithNoActivity.length === 1
                  ? (t('yearView.areaNoActivity') || 'oblast nemá žádnou aktivitu')
                  : (t('yearView.areasNoActivity') || 'oblastí nemá žádnou aktivitu')
                }
                {': '}
                {stats.areasWithNoActivity.map(a => a.name).join(', ')}
              </p>
            </div>
          )}
          
          {/* Empty state */}
          {!stats.topArea && !stats.mostCompletedHabit && stats.goalsWithNoProgress.length === 0 && stats.areasWithNoActivity.length === 0 && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 font-playful text-center">
                {t('yearView.noInsights') || 'Zatím nemáme dostatek dat pro poznatky. Pokračujte v práci na svých cílech!'}
              </p>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
