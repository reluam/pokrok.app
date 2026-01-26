'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { normalizeDate } from '../utils/dateHelpers'
import { ContributionGraph } from '../statistics/ContributionGraph'

interface YearViewProps {
  habits: any[]
  dailySteps: any[]
  selectedYear: number
  setSelectedYear: (year: number) => void
  handleItemClick: (item: any, type: 'step' | 'habit' | 'stat') => void
  player?: any
  areas?: any[]
  visibleSections?: Record<string, boolean>
}

export function YearView({
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
  
  // Statistics data for contribution graph
  const [statisticsData, setStatisticsData] = useState<any>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  
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
  
  // Load statistics data for contribution graph
  useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true)
      try {
        // Calculate date range for selected year
        const yearStart = new Date(displayYear, 0, 1)
        const yearEnd = new Date(displayYear, 11, 31, 23, 59, 59)
        const startDate = yearStart.toISOString().split('T')[0]
        const endDate = yearEnd.toISOString().split('T')[0]
        
        const response = await fetch(`/api/statistics?startDate=${startDate}&endDate=${endDate}`)
        if (response.ok) {
          const data = await response.json()
          setStatisticsData(data)
        }
      } catch (error) {
        console.error('Error loading statistics:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }
    
    loadStats()
  }, [displayYear])
  
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
      
      // Goals removed - no goals to calculate
      return {
        monthIndex,
        monthName: monthNamesShort[monthIndex],
        fullMonthName: monthNames[monthIndex],
        goalsCount: 0,
        avgProgress: 0
      }
    })
  }, [displayYear, monthNames, monthNamesShort])
  
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
  
  // Goals removed - no goals ending in future years
  const goalsEndingFutureYears: any[] = []
  
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
    // Goals removed - no goals with no progress
    const goalsWithNoProgress: any[] = []
    
    // Areas with no activity
    const areasWithNoActivity = areas.filter(area => {
      // Goals removed - check only steps
      const areaSteps = dailySteps.filter(s => {
        if (!s.date) return false
        const stepDate = normalizeDate(s.date)
        const stepDateObj = new Date(stepDate)
        return stepDateObj >= yearStart && stepDateObj <= yearEnd && s.area_id === area.id
      })
      return areaSteps.length === 0
    })
    
    // Goals removed - no goals completed
    let goalsCompletedInTarget = 0
    let goalsCompletedAfterTarget = 0
    
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
  }, [habits, dailySteps, displayYear, areas])
  
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
        {/* Contribution Graph */}
        {isLoadingStats ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600">{t('common.loading') || 'Načítání...'}</p>
            </div>
              </div>
        ) : statisticsData?.dailyData ? (
          <div className="mb-6">
            <ContributionGraph dailyData={statisticsData.dailyData} selectedYear={displayYear} />
          </div>
        ) : null}
        
      </div>
      
      {/* Goals Roadmap - removed */}
      
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
                  {stats.topArea.area?.name || t('areas.noArea') || 'Bez oblasti'}
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
          
          {/* Goals removed - no goals with no progress */}
          
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
          {!stats.topArea && !stats.mostCompletedHabit && stats.areasWithNoActivity.length === 0 && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 font-playful text-center">
                {t('yearView.noInsights') || 'Zatím nemáme dostatek dat pro poznatky. Pokračujte v práci na svých krocích!'}
              </p>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
