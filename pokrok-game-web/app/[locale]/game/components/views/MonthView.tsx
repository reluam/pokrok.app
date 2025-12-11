'use client'

import { useTranslations } from 'next-intl'
import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Check, X, Target, Footprints, CheckSquare, TrendingUp, Calendar } from 'lucide-react'

interface MonthViewProps {
  goals?: any[]
  habits?: any[]
  dailySteps?: any[]
  selectedDayDate?: Date
  setSelectedDayDate?: (date: Date) => void
  setMainPanelSection?: (section: string) => void
  player?: any
}

export function MonthView({
  goals = [],
  habits = [],
  dailySteps = [],
  selectedDayDate,
  setSelectedDayDate,
  setMainPanelSection,
  player
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
  
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  
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
    const dateStr = date.toISOString().split('T')[0]
    
    // Get steps for this day
    const daySteps = dailySteps.filter((step: any) => {
      const stepDate = step.date ? new Date(step.date).toISOString().split('T')[0] : null
      return stepDate === dateStr
    })
    
    const completedSteps = daySteps.filter((step: any) => step.completed).length
    const totalSteps = daySteps.length
    
    // Get habits for this day - check if they're scheduled
    const dayOfWeek = date.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
    const scheduledHabits = habits.filter((habit: any) => {
      if (habit.frequency === 'daily') return true
      if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
      if (habit.always_show) return true
      return false
    })
    
    const completedHabits = scheduledHabits.filter((habit: any) => {
      return habit.habit_completions && habit.habit_completions[dateStr] === true
    }).length
    const totalHabits = scheduledHabits.length
    
    return {
      steps: { completed: completedSteps, total: totalSteps },
      habits: { completed: completedHabits, total: totalHabits },
      totalCompleted: completedSteps + completedHabits,
      totalItems: totalSteps + totalHabits,
      completionRate: totalSteps + totalHabits > 0 
        ? Math.round(((completedSteps + completedHabits) / (totalSteps + totalHabits)) * 100)
        : 0
    }
  }, [dailySteps, habits])
  
  // Calculate month statistics
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
  }, [currentMonth, dailySteps, habits, today])
  
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
    
    const dateStr = selectedDay.toISOString().split('T')[0]
    
    // Get steps for this day
    const daySteps = dailySteps.filter((step: any) => {
      const stepDate = step.date ? new Date(step.date).toISOString().split('T')[0] : null
      return stepDate === dateStr
    })
    
    // Get habits for this day - check if they're scheduled and completed
    const dayOfWeek = selectedDay.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
    const dayHabits = habits.filter((habit: any) => {
      // Check if habit is scheduled for this day
      if (habit.frequency === 'daily') return true
      if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
      if (habit.always_show) return true
      return false
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
  
  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-orange-50 overflow-y-auto">
      {/* Header with month navigation */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
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
        
        {/* Compact month summary */}
        <div className="bg-white border-4 border-primary-500 rounded-playful-lg p-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Overall completion */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-semibold text-gray-600">{t('monthView.overall') || 'Celkově'}</span>
              </div>
              <div className="text-2xl font-bold text-black">
                {monthStats.completionRate}%
              </div>
              <div className="text-xs text-gray-500">
                {monthStats.totalCompleted}/{monthStats.totalItems}
              </div>
            </div>
            
            {/* Perfect days */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-gray-600">{t('monthView.perfect') || 'Perfektní'}</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {monthStats.perfectDays}
              </div>
              <div className="text-xs text-gray-500">
                {t('monthView.days') || 'dní'}
              </div>
            </div>
            
            {/* Partial days */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-semibold text-gray-600">{t('monthView.partial') || 'Částečné'}</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {monthStats.partialDays}
              </div>
              <div className="text-xs text-gray-500">
                {t('monthView.days') || 'dní'}
              </div>
            </div>
            
            {/* Failed days */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <X className="w-4 h-4 text-red-600" />
                <span className="text-xs font-semibold text-gray-600">{t('monthView.failed') || 'Neúspěšné'}</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {monthStats.failedDays}
              </div>
              <div className="text-xs text-gray-500">
                {t('monthView.days') || 'dní'}
              </div>
            </div>
          </div>
          
          {/* Breakdown by type */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t-2 border-gray-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Footprints className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-semibold text-gray-600">{t('navigation.steps') || 'Kroky'}</span>
              </div>
              <div className="text-lg font-bold text-black">
                {monthStats.completedSteps}/{monthStats.totalSteps}
              </div>
              {monthStats.totalSteps > 0 && (
                <div className="text-xs text-gray-500">
                  {Math.round((monthStats.completedSteps / monthStats.totalSteps) * 100)}%
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-semibold text-gray-600">{t('navigation.habits') || 'Návyky'}</span>
              </div>
              <div className="text-lg font-bold text-black">
                {monthStats.completedHabits}/{monthStats.totalHabits}
              </div>
              {monthStats.totalHabits > 0 && (
                <div className="text-xs text-gray-500">
                  {Math.round((monthStats.completedHabits / monthStats.totalHabits) * 100)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Compact calendar grid */}
      <div className="bg-white border-4 border-primary-500 rounded-playful-lg p-3 sm:p-4">
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
            
            switch (status) {
              case 'perfect':
                dayClasses = 'bg-green-500 border-2 border-green-700'
                indicatorColor = 'bg-green-700'
                break
              case 'partial':
                dayClasses = 'bg-orange-200 border-2 border-orange-500'
                indicatorColor = 'bg-orange-500'
                break
              case 'failed':
                dayClasses = 'bg-red-100 border-2 border-red-500'
                indicatorColor = 'bg-red-500'
                break
              case 'no-activity':
                dayClasses = 'bg-gray-100 border-2 border-gray-300'
                indicatorColor = 'bg-gray-400'
                break
              case 'today':
                dayClasses = 'bg-primary-200 border-4 border-primary-500'
                indicatorColor = 'bg-primary-500'
                break
              case 'future':
                dayClasses = 'bg-gray-50 border-2 border-gray-200'
                indicatorColor = 'bg-gray-300'
                break
            }
            
            return (
              <button
                key={date.toISOString()}
                onClick={() => !isFuture && handleDayClick(date)}
                className={`aspect-square ${dayClasses} rounded-playful-sm p-1.5 flex flex-col items-center justify-center transition-all hover:scale-105 ${isFuture ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${selectedDay && date.toISOString() === selectedDay.toISOString() ? 'ring-4 ring-primary-400 ring-offset-2' : ''}`}
                disabled={isFuture}
                title={isFuture ? '' : `${date.getDate()}. ${date.getMonth() + 1}. - ${stats.totalItems > 0 ? `${stats.steps.completed + stats.habits.completed}/${stats.totalItems} dokončeno` : 'Bez aktivity'}`}
              >
                {/* Day number */}
                <div className={`text-sm font-bold ${status === 'perfect' ? 'text-white' : status === 'today' ? 'text-black' : 'text-gray-700'} mb-0.5`}>
                  {date.getDate()}
                </div>
                
                {/* Compact indicator */}
                {!isFuture && stats.totalItems > 0 && (
                  <div className="flex items-center gap-0.5">
                    {status === 'perfect' ? (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    ) : status === 'failed' ? (
                      <X className="w-3 h-3 text-red-600" strokeWidth={3} />
                    ) : (
                      <div className={`w-2 h-2 rounded-full ${indicatorColor}`} />
                    )}
                  </div>
                )}
                
                {/* Small completion rate for partial days */}
                {status === 'partial' && (
                  <div className="text-[8px] font-bold text-gray-700 mt-0.5">
                    {stats.completionRate}%
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Selected day detail */}
      {selectedDayData && (
        <div className="mt-4 bg-white border-4 border-primary-500 rounded-playful-lg p-4 sm:p-6">
          {/* Day header */}
          <div className="mb-4 pb-4 border-b-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-black font-playful mb-1">
                  {selectedDayData.date.toLocaleDateString('cs-CZ', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h3>
                <div className="text-sm text-gray-600">
                  {selectedDayData.stats.completionRate}% {t('common.completed') || 'dokončeno'} • {selectedDayData.stats.totalCompleted}/{selectedDayData.stats.totalItems}
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 rounded-playful-sm hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Day statistics */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-primary-50 border-2 border-primary-300 rounded-playful-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <Footprints className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-semibold text-gray-700">{t('navigation.steps') || 'Kroky'}</span>
              </div>
              <div className="text-lg font-bold text-black">
                {selectedDayData.stats.steps.completed}/{selectedDayData.stats.steps.total}
              </div>
              {selectedDayData.stats.steps.total > 0 && (
                <div className="text-xs text-gray-600">
                  {Math.round((selectedDayData.stats.steps.completed / selectedDayData.stats.steps.total) * 100)}%
                </div>
              )}
            </div>
            
            <div className="bg-primary-50 border-2 border-primary-300 rounded-playful-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-semibold text-gray-700">{t('navigation.habits') || 'Návyky'}</span>
              </div>
              <div className="text-lg font-bold text-black">
                {selectedDayData.stats.habits.completed}/{selectedDayData.stats.habits.total}
              </div>
              {selectedDayData.stats.habits.total > 0 && (
                <div className="text-xs text-gray-600">
                  {Math.round((selectedDayData.stats.habits.completed / selectedDayData.stats.habits.total) * 100)}%
                </div>
              )}
            </div>
          </div>
          
          {/* Steps list */}
          {selectedDayData.steps.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-black mb-3 flex items-center gap-2">
                <Footprints className="w-4 h-4" />
                {t('navigation.steps') || 'Kroky'} ({selectedDayData.steps.length})
              </h4>
              <div className="space-y-2">
                {selectedDayData.steps.map((step: any) => {
                  const goal = goals.find((g: any) => g.id === step.goal_id)
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 p-3 rounded-playful-sm border-2 ${
                        step.completed
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <div className="mt-0.5">
                        {step.completed ? (
                          <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-400 rounded-sm" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-black">
                          {step.title || step.name || t('common.unnamed') || 'Bez názvu'}
                        </div>
                        {goal && (
                          <div className="text-xs text-gray-600 mt-0.5">
                            {t('common.goal') || 'Cíl'}: {goal.title || goal.name}
                          </div>
                        )}
                        {step.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {step.description}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Habits list */}
          {selectedDayData.habits.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-black mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                {t('navigation.habits') || 'Návyky'} ({selectedDayData.habits.length})
              </h4>
              <div className="space-y-2">
                {selectedDayData.habits.map((habit: any) => (
                  <div
                    key={habit.id}
                    className={`flex items-start gap-3 p-3 rounded-playful-sm border-2 ${
                      habit.isCompleted
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="mt-0.5">
                      {habit.isCompleted ? (
                        <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-400 rounded-sm" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-black">
                        {habit.title || habit.name || t('common.unnamed') || 'Bez názvu'}
                      </div>
                      {habit.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {habit.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Empty state */}
          {selectedDayData.steps.length === 0 && selectedDayData.habits.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('monthView.noActivity') || 'Bez aktivity'}</p>
            </div>
          )}
          
          {/* Navigate to day view button */}
          <div className="mt-6 pt-4 border-t-2 border-gray-200">
            <button
              onClick={() => {
                if (setSelectedDayDate) {
                  setSelectedDayDate(selectedDayData.date)
                }
                if (setMainPanelSection) {
                  setMainPanelSection('focus-day')
                }
              }}
              className="w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-playful-md transition-colors"
            >
              {t('monthView.viewDay') || 'Zobrazit denní přehled'}
            </button>
          </div>
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
            <div className="w-4 h-4 bg-orange-200 border-2 border-orange-500 rounded-playful-sm" />
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
