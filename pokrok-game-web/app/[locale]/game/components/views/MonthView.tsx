'use client'

import { useTranslations } from 'next-intl'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, X, Target, Footprints, CheckSquare, TrendingUp } from 'lucide-react'
import { isHabitScheduledForDay } from '../utils/habitHelpers'
import { getLocalDateString } from '../utils/dateHelpers'
import { TodayFocusSection } from './TodayFocusSection'
import { getIconComponent } from '@/lib/icon-utils'

interface MonthViewProps {
  goals?: any[]
  habits?: any[]
  dailySteps?: any[]
  selectedDayDate?: Date
  setSelectedDayDate?: (date: Date) => void
  setMainPanelSection?: (section: string) => void
  player?: any
  handleHabitToggle?: (habitId: string, date?: string) => Promise<void>
  handleStepToggle?: (stepId: string, completed: boolean) => Promise<void>
  handleItemClick?: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  loadingHabits?: Set<string>
  loadingSteps?: Set<string>
  animatingSteps?: Set<string>
}

export function MonthView({
  goals = [],
  habits = [],
  dailySteps = [],
  selectedDayDate,
  setSelectedDayDate,
  setMainPanelSection,
  player,
  handleHabitToggle,
  handleStepToggle,
  handleItemClick,
  loadingHabits = new Set(),
  loadingSteps = new Set(),
  animatingSteps = new Set()
}: MonthViewProps) {
  const t = useTranslations()
  
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])
  
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const date = new Date()
    date.setDate(1)
    date.setHours(0, 0, 0, 0)
    return date
  })
  
  // Filter state: 'all' | 'steps' | 'habits'
  const [viewFilter, setViewFilter] = useState<'all' | 'steps' | 'habits'>('all')
  
  // Use selectedDayDate from props if available, otherwise use local state
  const [localSelectedDay, setLocalSelectedDay] = useState<Date | null>(null)
  
  // Always prefer prop over local state, but keep local state as fallback
  const selectedDay = selectedDayDate !== undefined ? selectedDayDate : localSelectedDay
  
  const setSelectedDay = (date: Date | null) => {
    if (setSelectedDayDate) {
      // Use prop setter if available
      setSelectedDayDate(date as Date)
    } else {
      // Use local state as fallback
      setLocalSelectedDay(date)
    }
  }
  
  // Sync local state with prop when prop changes (for persistence across re-mounts)
  useEffect(() => {
    if (selectedDayDate) {
      setLocalSelectedDay(selectedDayDate)
    }
  }, [selectedDayDate])
  
  // Get all days in the month
  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    // Get first day of week (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay()
    // Adjust to Monday = 0
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
    
    const days: (Date | null)[] = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      date.setHours(0, 0, 0, 0)
      days.push(date)
    }
    
    return days
  }, [currentMonth])
  
  // Get day stats
  const getDayStats = useCallback((date: Date) => {
    const dateStr = getLocalDateString(date)
    
    // Get steps for this day
    const daySteps = dailySteps.filter((step: any) => {
      if (!step.date) return false
      const stepDate = getLocalDateString(new Date(step.date))
      return stepDate === dateStr
    })
    
    const completedSteps = daySteps.filter((step: any) => step.completed).length
    const totalSteps = daySteps.length
    
    // Get habits for this day - use the same helper function as WeekView and DayView
    const scheduledHabits = habits.filter((habit: any) => {
      return isHabitScheduledForDay(habit, date)
    })
    
    const completedHabits = scheduledHabits.filter((habit: any) => {
      return habit.habit_completions && habit.habit_completions[dateStr] === true
    }).length
    const totalHabits = scheduledHabits.length
    
    // Apply filter
    let filteredCompleted = 0
    let filteredTotal = 0
    
    if (viewFilter === 'steps') {
      filteredCompleted = completedSteps
      filteredTotal = totalSteps
    } else if (viewFilter === 'habits') {
      filteredCompleted = completedHabits
      filteredTotal = totalHabits
    } else {
      // 'all'
      filteredCompleted = completedSteps + completedHabits
      filteredTotal = totalSteps + totalHabits
    }
    
    return {
      steps: { completed: completedSteps, total: totalSteps },
      habits: { completed: completedHabits, total: totalHabits },
      totalCompleted: filteredCompleted,
      totalItems: filteredTotal,
      completionRate: filteredTotal > 0 
        ? Math.round((filteredCompleted / filteredTotal) * 100)
        : 0
    }
  }, [dailySteps, habits, viewFilter])
  
  // Calculate month statistics - force recalculation when habits or dailySteps change
  const monthStats = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    let totalSteps = 0
    let completedSteps = 0
    let totalHabits = 0
    let completedHabits = 0
    let daysWithActivity = 0
    let perfectDays = 0
    let failedDays = 0
    let partialDays = 0
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day)
      date.setHours(0, 0, 0, 0)
      
      if (date > today) break // Don't count future days
      
      const stats = getDayStats(date)
      
      if (stats.totalItems > 0) {
        daysWithActivity++
        totalSteps += stats.steps.total
        completedSteps += stats.steps.completed
        totalHabits += stats.habits.total
        completedHabits += stats.habits.completed
        
        if (stats.completionRate === 100) {
          perfectDays++
        } else if (stats.completionRate === 0) {
          failedDays++
        } else {
          partialDays++
        }
      }
    }
    
    const totalDays = Math.min(lastDay.getDate(), today.getDate())
    const activeDays = daysWithActivity
    
    return {
      totalSteps,
      completedSteps,
      totalHabits,
      completedHabits,
      daysWithActivity,
      perfectDays,
      failedDays,
      partialDays,
      totalItems: totalSteps + totalHabits,
      totalCompleted: completedSteps + completedHabits,
      completionRate: totalSteps + totalHabits > 0
        ? Math.round(((completedSteps + completedHabits) / (totalSteps + totalHabits)) * 100)
        : 0,
      activeDays,
      totalDays
    }
  }, [currentMonth, dailySteps, habits, today, getDayStats])
  
  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    setCurrentMonth(newMonth)
  }
  
  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    setCurrentMonth(newMonth)
  }
  
  const handleDayClick = (date: Date) => {
    const dateStr = date.toISOString()
    const selectedDateStr = selectedDay?.toISOString()
    
    // If clicking the same day, deselect it
    if (dateStr === selectedDateStr) {
      setSelectedDay(null)
    } else {
      setSelectedDay(date)
    }
  }
  
  // Get detailed data for selected day
  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null
    
    const dateStr = getLocalDateString(selectedDay)
    
    // Get steps for this day
    const daySteps = dailySteps.filter((step: any) => {
      if (!step.date) return false
      const stepDate = getLocalDateString(new Date(step.date))
      return stepDate === dateStr
    })
    
    // Get habits for this day - use the same helper function as WeekView and DayView
    const dayHabits = habits.filter((habit: any) => {
      return isHabitScheduledForDay(habit, selectedDay)
    }).map((habit: any) => {
      const isCompleted = habit.habit_completions && habit.habit_completions[dateStr] === true
      return {
        ...habit,
        isCompleted
      }
    })
    
    const stats = getDayStats(selectedDay)
    
    return {
      date: selectedDay,
      dateStr,
      steps: daySteps,
      habits: dayHabits,
      stats
    }
  }, [selectedDay, dailySteps, habits, getDayStats])
  
  const monthName = currentMonth.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
  const dayNames = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
  
  // Get day status for visual indicator
  const getDayStatus = (date: Date, stats: ReturnType<typeof getDayStats>) => {
    const isToday = date.toDateString() === today.toDateString()
    const isPast = date < today
    const isFuture = date > today
    
    if (isFuture) return 'future'
    if (isToday) return 'today'
    if (stats.totalItems === 0) return 'no-activity'
    if (stats.completionRate === 100) return 'perfect'
    if (stats.completionRate === 0) return 'failed'
    return 'partial'
  }
  
  // Get stats for display (month or selected day)
  const displayStats = useMemo(() => {
    if (selectedDayData) {
      return {
        completionRate: selectedDayData.stats.completionRate,
        totalCompleted: selectedDayData.stats.totalCompleted,
        totalItems: selectedDayData.stats.totalItems,
        completedSteps: selectedDayData.stats.steps.completed,
        totalSteps: selectedDayData.stats.steps.total,
        completedHabits: selectedDayData.stats.habits.completed,
        totalHabits: selectedDayData.stats.habits.total,
        perfectDays: selectedDayData.stats.completionRate === 100 ? 1 : 0,
        partialDays: selectedDayData.stats.completionRate > 0 && selectedDayData.stats.completionRate < 100 ? 1 : 0,
        failedDays: selectedDayData.stats.completionRate === 0 && selectedDayData.stats.totalItems > 0 ? 1 : 0
      }
    }
    return monthStats
  }, [selectedDayData, monthStats])

  // Filter steps for selected day (only today's steps, no future or delayed)
  const filteredStepsForDay = useMemo(() => {
    if (!selectedDayData) return []
    const dateStr = selectedDayData.dateStr
    return dailySteps.filter((step: any) => {
      if (!step.date) return false
      const stepDate = step.date ? new Date(step.date).toISOString().split('T')[0] : null
      return stepDate === dateStr
    })
  }, [selectedDayData, dailySteps])
  
  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-primary-50 overflow-y-auto">
      {/* Header with month navigation */}
      <div className="mb-4">
        {/* Top row: Month name and navigation buttons */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-black font-playful">
            {monthName}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="w-9 h-9 flex items-center justify-center border-2 border-primary-500 rounded-playful-md bg-white hover:bg-primary-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-black" />
            </button>
            <button
              onClick={handleNextMonth}
              className="w-9 h-9 flex items-center justify-center border-2 border-primary-500 rounded-playful-md bg-white hover:bg-primary-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
        {/* Filter toggle - below on small screens, centered on larger screens */}
        <div className="flex justify-center md:absolute md:left-1/2 md:transform md:-translate-x-1/2 md:top-0">
          <div className="flex items-center gap-1 bg-white border-2 border-primary-500 rounded-playful-md p-1">
            <button
              onClick={() => setViewFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-playful-sm transition-colors ${
                viewFilter === 'all'
                  ? 'bg-primary-500 text-black'
                  : 'bg-transparent text-gray-700 hover:bg-primary-50'
              }`}
            >
              {t('monthView.filter.all') || 'Vše'}
            </button>
            <button
              onClick={() => setViewFilter('steps')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-playful-sm transition-colors ${
                viewFilter === 'steps'
                  ? 'bg-primary-500 text-black'
                  : 'bg-transparent text-gray-700 hover:bg-primary-50'
              }`}
            >
              {t('monthView.filter.steps') || 'Kroky'}
            </button>
            <button
              onClick={() => setViewFilter('habits')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-playful-sm transition-colors ${
                viewFilter === 'habits'
                  ? 'bg-primary-500 text-black'
                  : 'bg-transparent text-gray-700 hover:bg-primary-50'
              }`}
            >
              {t('monthView.filter.habits') || 'Návyky'}
            </button>
          </div>
          </div>
        </div>
        
      {/* Layout: Stats on left, Calendar on right */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Statistics box - left side */}
        <div className="bg-white border-4 border-primary-500 rounded-playful-lg p-2 sm:p-4 flex-shrink-0">
          <div className="flex flex-wrap lg:flex-col gap-2 sm:gap-3">
            {/* Overall completion */}
            <div className="text-center flex-1 min-w-[60px]">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600" />
                <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600">{selectedDayData ? t('common.completed') || 'Dokončeno' : t('monthView.overall') || 'Celkově'}</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-black">
                {displayStats.completionRate}%
              </div>
            </div>
            
            {/* Steps */}
            <div className="text-center flex-1 min-w-[60px]">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                <Footprints className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600" />
                <span className="text-[10px] sm:text-xs font-semibold text-gray-600">{t('navigation.steps') || 'Kroky'}</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-black">
                {displayStats.completedSteps}/{displayStats.totalSteps}
              </div>
            </div>
            
            {/* Habits */}
            <div className="text-center flex-1 min-w-[60px] lg:pb-2 lg:border-b lg:border-gray-200">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600" />
                <span className="text-[10px] sm:text-xs font-semibold text-gray-600">{t('navigation.habits') || 'Návyky'}</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-black">
                {displayStats.completedHabits}/{displayStats.totalHabits}
          </div>
            </div>
            
            {/* Perfect days */}
            <div className="text-center flex-1 min-w-[60px] lg:pt-2">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600">{t('monthView.perfect') || 'Perfektní'}</span>
            </div>
              <div className="text-lg sm:text-xl font-bold text-green-600">
                {displayStats.perfectDays}
              </div>
              <div className="text-[9px] sm:text-[10px] text-gray-500">
                {selectedDayData ? '' : t('monthView.days') || 'dní'}
          </div>
            </div>
            
            {/* Partial days */}
            <div className="text-center flex-1 min-w-[60px]">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600" />
                <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600">{t('monthView.partial') || 'Částečné'}</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-primary-600">
                {displayStats.partialDays}
              </div>
              <div className="text-[9px] sm:text-[10px] text-gray-500">
                {selectedDayData ? '' : t('monthView.days') || 'dní'}
            </div>
            </div>
            
            {/* Failed days */}
            <div className="text-center flex-1 min-w-[60px]">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600">{t('monthView.failed') || 'Neúspěšné'}</span>
          </div>
              <div className="text-lg sm:text-xl font-bold text-red-600">
                {displayStats.failedDays}
            </div>
              <div className="text-[9px] sm:text-[10px] text-gray-500">
                {selectedDayData ? '' : t('monthView.days') || 'dní'}
            </div>
          </div>
        </div>
      </div>
      
        {/* Compact calendar grid - right side */}
        <div className="bg-white border-4 border-primary-500 rounded-playful-lg p-3 sm:p-4 flex-1">
        {/* Day names header */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {dayNames.map((dayName) => (
            <div
              key={dayName}
              className="text-center text-xs font-bold text-gray-700 uppercase"
            >
              {dayName}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1.5">
          {monthDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }
            
            const stats = getDayStats(date)
            const status = getDayStatus(date, stats)
            const isToday = date.toDateString() === today.toDateString()
            const isPast = date < today
            const isFuture = date > today
            
            // Determine day appearance based on status
            let dayClasses = ''
            let indicatorColor = ''
            let textColor = 'text-gray-700'
            
            switch (status) {
              case 'perfect':
                dayClasses = 'bg-white border-2 border-primary-500'
                indicatorColor = 'bg-primary-500'
                textColor = 'text-primary-600'
                break
              case 'partial':
                dayClasses = 'bg-primary-200 border-2 border-primary-500'
                indicatorColor = 'bg-primary-500'
                textColor = 'text-gray-700'
                break
              case 'failed':
                dayClasses = 'bg-red-100 border-2 border-red-500'
                indicatorColor = 'bg-red-500'
                textColor = 'text-gray-700'
                break
              case 'no-activity':
                dayClasses = 'bg-gray-100 border-2 border-gray-300'
                indicatorColor = 'bg-gray-400'
                textColor = 'text-gray-700'
                break
              case 'today':
                dayClasses = 'bg-primary-200 border-4 border-primary-500'
                indicatorColor = 'bg-primary-500'
                textColor = 'text-black'
                break
              case 'future':
                dayClasses = 'bg-gray-50 border-2 border-gray-200'
                indicatorColor = 'bg-gray-300'
                textColor = 'text-gray-500'
                break
            }
            
            return (
              <button
                key={date.toISOString()}
                onClick={() => !isFuture && handleDayClick(date)}
                className={`h-12 sm:h-14 md:h-16 ${dayClasses} rounded-playful-sm p-1.5 flex flex-col sm:flex-row items-center justify-center sm:justify-between transition-all hover:scale-105 ${isFuture ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${selectedDay && date.toISOString() === selectedDay.toISOString() ? 'ring-4 ring-primary-400 ring-offset-2' : ''}`}
                disabled={isFuture}
                title={isFuture ? '' : `${date.getDate()}. ${date.getMonth() + 1}. - ${stats.totalItems > 0 ? `${stats.totalCompleted}/${stats.totalItems} dokončeno` : 'Bez aktivity'}`}
              >
                {/* Day number - top on small screens, left on larger screens */}
                <div className={`text-sm sm:text-base md:text-lg font-bold ${textColor} ${stats.totalItems > 0 ? 'sm:mb-0' : ''}`}>
                  {date.getDate()}
                </div>
                
                {/* Compact indicator or count - bottom on small screens, right on larger screens */}
                {!isFuture && stats.totalItems > 0 && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {status === 'perfect' ? (
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary-600" strokeWidth={3} />
                    ) : status === 'failed' ? (
                      <X className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-600" strokeWidth={3} />
                    ) : (
                      <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-700 whitespace-nowrap">
                        {stats.totalCompleted}/{stats.totalItems}
                      </div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
      </div>
      
      {/* Selected day detail - display habits and steps without box */}
      {selectedDayData && (
        <div className="mt-4">
          {/* Close button */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setSelectedDay(null)}
              className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 rounded-playful-sm hover:bg-gray-100 transition-colors bg-white"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* Habits in a row - only icon, name and checkbox */}
          {selectedDayData.habits && selectedDayData.habits.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedDayData.habits.map((habit: any) => {
                const dateStr = getLocalDateString(selectedDayData.date)
                const isCompleted = habit.habit_completions && habit.habit_completions[dateStr] === true
                const isLoading = loadingHabits.has(`${habit.id}-${dateStr}`)
                const IconComponent = getIconComponent(habit.icon || 'Target')
                
                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-playful-md border-2 transition-all bg-white cursor-pointer hover:border-primary-300"
                    style={{
                      borderColor: isCompleted ? 'var(--color-primary-500)' : '#d1d5db',
                      boxShadow: isCompleted 
                        ? '0 2px 8px rgba(249, 115, 22, 0.2) !important'
                        : '0 2px 8px rgba(249, 115, 22, 0.15) !important'
                    }}
                    onClick={() => handleItemClick && handleItemClick(habit, 'habit')}
                  >
                    <IconComponent className={`w-4 h-4 flex-shrink-0 ${isCompleted ? 'text-primary-600' : 'text-gray-600'}`} />
                    <span className={`text-xs font-medium whitespace-nowrap ${
                      isCompleted ? 'text-primary-800 line-through' : 'text-black'
                    }`}>
                      {habit.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (handleHabitToggle && !isLoading) {
                          handleHabitToggle(habit.id, dateStr)
                        }
                      }}
                      disabled={isLoading}
                      className={`flex-shrink-0 w-6 h-6 rounded-playful-sm flex items-center justify-center transition-all border-2 ${
                        isCompleted
                          ? 'bg-primary-100 border-primary-500 hover:bg-primary-200 cursor-pointer'
                          : 'bg-white border-primary-500 hover:bg-primary-50 cursor-pointer'
                      }`}
                      title={isCompleted ? t('common.completed') || 'Splněno' : t('focus.clickToComplete') || 'Klikni pro splnění'}
                    >
                      {isLoading ? (
                        <svg className="animate-spin h-3 w-3 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : isCompleted ? (
                        <Check className="w-3 h-3 text-primary-600" strokeWidth={3} />
                      ) : null}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Use TodayFocusSection for consistent display - only today's steps */}
          <TodayFocusSection
            goals={goals}
            dailySteps={filteredStepsForDay}
            habits={habits}
            selectedDayDate={selectedDayData.date}
            handleStepToggle={handleStepToggle || (async () => {})}
            handleHabitToggle={handleHabitToggle}
            handleItemClick={handleItemClick || (() => {})}
            loadingSteps={loadingSteps}
            animatingSteps={animatingSteps}
            loadingHabits={loadingHabits}
            player={player}
            todaySteps={filteredStepsForDay}
            isWeekView={false}
          />
        </div>
      )}
      
      {/* Compact legend */}
      <div className="mt-4 bg-white border-2 border-primary-500 rounded-playful-md p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 border-2 border-green-700 rounded-playful-sm flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
            <span className="text-gray-700">{t('monthView.allCompleted') || 'Vše dokončeno'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary-200 border-2 border-primary-500 rounded-playful-sm" />
            <span className="text-gray-700">{t('monthView.partial') || 'Částečně'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded-playful-sm flex items-center justify-center">
              <X className="w-2.5 h-2.5 text-red-600" strokeWidth={3} />
            </div>
            <span className="text-gray-700">{t('monthView.nothingCompleted') || 'Nic nedokončeno'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded-playful-sm" />
            <span className="text-gray-700">{t('monthView.noActivity') || 'Bez aktivity'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
