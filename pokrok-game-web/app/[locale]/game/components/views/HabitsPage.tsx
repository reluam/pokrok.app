'use client'

import { useRef, useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Calendar, CheckCircle, Zap, Flame, Trophy, Plus, ChevronLeft, ChevronRight, Settings, Check } from 'lucide-react'
import { getLocalDateString } from '../utils/dateHelpers'
import { isHabitScheduledForDay, getHabitStartDate } from '../utils/habitHelpers'

interface HabitsPageProps {
  habits: any[]
  selectedHabitId: string | null
  habitsPageTimelineOffset: number
  setHabitsPageTimelineOffset: (value: number | ((prev: number) => number)) => void
  habitsPageVisibleDays: number
  setHabitsPageVisibleDays: (value: number | ((prev: number) => number)) => void
  handleHabitCalendarToggle: (habitId: string, date: string, currentState: 'completed' | 'missed' | 'planned' | 'not-scheduled' | 'today', isScheduled: boolean) => Promise<void>
  handleOpenHabitModal: (habit: any) => void
  loadingHabits: Set<string>
}

export function HabitsPage({
  habits,
  selectedHabitId,
  habitsPageTimelineOffset,
  setHabitsPageTimelineOffset,
  habitsPageVisibleDays,
  setHabitsPageVisibleDays,
  handleHabitCalendarToggle,
  handleOpenHabitModal,
  loadingHabits
}: HabitsPageProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  const habitsPageTimelineContainerRef = useRef<HTMLDivElement>(null)
  
  // Calculate visible days based on container width
  useEffect(() => {
    const calculateVisibleDays = () => {
      if (habitsPageTimelineContainerRef.current) {
        const containerWidth = habitsPageTimelineContainerRef.current.offsetWidth
        // Each day is 32px wide + 4px gap (gap-1) = 36px total per day
        // Subtract space for habit name column (150px) + settings icon (32px) + gap (8px) = 190px
        const availableWidth = containerWidth - 190
        const daysThatFit = Math.floor(availableWidth / 36)
        const newVisibleDays = Math.max(7, daysThatFit) // Minimum 7 days
        setHabitsPageVisibleDays(newVisibleDays)
      }
    }
    
    // Use requestAnimationFrame to ensure DOM is rendered
    const timeoutId = setTimeout(() => {
      calculateVisibleDays()
    }, 0)
    
    window.addEventListener('resize', calculateVisibleDays)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', calculateVisibleDays)
    }
  }, [setHabitsPageVisibleDays])

  const selectedHabit = selectedHabitId ? habits.find(h => h.id === selectedHabitId) : null
  
  // Calculate statistics for all habits or selected habit
  const calculateAllHabitsStats = () => {
    const habitsToCalculate = selectedHabit ? [selectedHabit] : habits
    
    let totalPlanned = 0
    let totalCompleted = 0
    let completedOutsidePlan = 0
    let currentStreak = 0
    let maxStreak = 0
    
    habitsToCalculate.forEach(habit => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Use helper function for habit scheduling check
      const checkHabitScheduled = (day: Date): boolean => {
        return isHabitScheduledForDay(habit, day)
      }
      
      const isHabitCompletedForDay = (day: Date): boolean => {
        const dateStr = getLocalDateString(day)
        return habit.habit_completions && habit.habit_completions[dateStr] === true
      }
      
      // Get start date (created_at or earliest completion, whichever is earlier)
      const startDate = getHabitStartDate(habit)
      
      // Go from start date to today
      const currentDate = new Date(startDate)
      while (currentDate <= today) {
        const date = new Date(currentDate)
        const isScheduled = checkHabitScheduled(date)
        const isCompleted = isHabitCompletedForDay(date)
        
        if (isScheduled) {
          totalPlanned++
          if (isCompleted) {
            totalCompleted++
          }
        } else if (isCompleted) {
          completedOutsidePlan++
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // Calculate current streak (backwards from today)
      // Streak continues if there's no scheduled missed day
      // Splnění v nenaplánovaný den se nepočítá do streak, ale do celkově splněných
      const habitStartDate = getHabitStartDate(habit)
      let streakDate = new Date(today)
      streakDate.setHours(0, 0, 0, 0)
      const habitStartDateNormalized = new Date(habitStartDate)
      habitStartDateNormalized.setHours(0, 0, 0, 0)
      let habitStreak = 0
      
      // Count backwards from today
      while (true) {
        // Check if we've gone past the start date
        if (streakDate.getTime() < habitStartDateNormalized.getTime()) {
          break
        }
        
        const isScheduled = checkHabitScheduled(streakDate)
        const isCompleted = isHabitCompletedForDay(streakDate)
        
        if (isScheduled && isCompleted) {
          // This day counts towards the streak
          habitStreak++
          // Move to previous day
          streakDate.setDate(streakDate.getDate() - 1)
          streakDate.setHours(0, 0, 0, 0)
        } else if (isScheduled && !isCompleted) {
          // Scheduled but not completed - streak broken
          break
        } else {
          // Not scheduled - skip (doesn't break streak, but doesn't add to it either)
          streakDate.setDate(streakDate.getDate() - 1)
          streakDate.setHours(0, 0, 0, 0)
        }
      }
      
      currentStreak = Math.max(currentStreak, habitStreak)
      
      // Calculate max streak by going through all dates
      let tempStreak = 0
      let habitMaxStreak = 0
      const checkDate = new Date(habitStartDate)
      while (checkDate <= today) {
        const isScheduled = checkHabitScheduled(checkDate)
        const isCompleted = isHabitCompletedForDay(checkDate)
        
        if (isScheduled && isCompleted) {
          tempStreak++
          habitMaxStreak = Math.max(habitMaxStreak, tempStreak)
        } else if (isScheduled && !isCompleted) {
          // Scheduled but not completed - reset streak
          tempStreak = 0
        }
        // Not scheduled - doesn't affect streak
        
        checkDate.setDate(checkDate.getDate() + 1)
      }
      
      maxStreak = Math.max(maxStreak, habitMaxStreak, habit.max_streak || 0)
    })
    
    return {
      totalPlanned,
      totalCompleted,
      completedOutsidePlan,
      currentStreak,
      maxStreak
    }
  }
  
  const stats = calculateAllHabitsStats()
  
  // Timeline setup
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() - habitsPageTimelineOffset)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - habitsPageVisibleDays + 1)
  
  const timelineDates: Date[] = []
  for (let i = 0; i < habitsPageVisibleDays; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    timelineDates.push(date)
  }
  
  const handleTimelineShift = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setHabitsPageTimelineOffset(prev => prev + habitsPageVisibleDays)
    } else {
      setHabitsPageTimelineOffset(prev => Math.max(0, prev - habitsPageVisibleDays))
    }
  }
  
  const handleHabitBoxClick = async (habit: any, date: Date) => {
    const dateStr = getLocalDateString(date)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[date.getDay()]
    
    const isScheduled = habit.always_show || 
                      habit.frequency === 'daily' || 
                      ((habit.frequency === 'custom' || habit.frequency === 'weekly') && habit.selected_days && habit.selected_days.includes(dayName))
    const isCompleted = habit.habit_completions && habit.habit_completions[dateStr] === true
    
    let currentState: 'completed' | 'missed' | 'planned' | 'not-scheduled' | 'today' = 'not-scheduled'
    if (isCompleted) {
      currentState = 'completed'
    } else if (isScheduled) {
      currentState = 'planned'
    }
    
    if (dateStr === getLocalDateString(today)) {
      currentState = 'today'
    }
    
    await handleHabitCalendarToggle(habit.id, dateStr, currentState, isScheduled)
  }
  
  return (
    <div className="w-full min-h-full flex flex-col bg-orange-50 p-6">
      {/* Header with title and Add Habit button */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('navigation.habits') || 'Návyky'}</h1>
        <button
          onClick={() => handleOpenHabitModal(null)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('habits.add') || 'Přidat návyk'}
        </button>
      </div>
      
      {/* Statistics section - without white box */}
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Calendar className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">{t('habits.stats.totalPlanned') || 'Naplánováno'}</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalPlanned}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">{t('habits.stats.totalCompleted') || 'Splněno'}</div>
              <div className="text-2xl font-bold text-green-600">{stats.totalCompleted}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">{t('habits.stats.completedOutside') || 'Mimo plán'}</div>
              <div className="text-2xl font-bold text-blue-600">{stats.completedOutsidePlan}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Flame className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">{t('habits.stats.currentStreak') || 'Aktuální streak'}</div>
              <div className="text-2xl font-bold text-orange-600">{stats.currentStreak}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">{t('habits.stats.maxStreak') || 'Nejdelší streak'}</div>
              <div className="text-2xl font-bold text-purple-600">{stats.maxStreak}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline section */}
      <div className="mb-8 bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('habits.timeline') || 'Timeline'}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTimelineShift('left')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={t('common.previous') || 'Předchozí'}
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => handleTimelineShift('right')}
              disabled={habitsPageTimelineOffset === 0}
              className={`p-2 rounded-lg transition-colors ${
                habitsPageTimelineOffset === 0 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-100'
              }`}
              title={t('common.next') || 'Další'}
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
        
        {/* Timeline with month, dates, and boxes for all habits */}
        <div ref={habitsPageTimelineContainerRef} className="w-full">
          {/* Month row - positioned around middle of month */}
          <div className="flex mb-2 relative" style={{ height: '24px' }}>
            {(() => {
              if (!timelineDates || timelineDates.length === 0) {
                return null
              }
              
              const middleIndex = Math.floor(timelineDates.length / 2)
              let targetDate = timelineDates[middleIndex]
              
              if (!targetDate) {
                return null
              }
              
              const targetMonth = targetDate.getMonth()
              const targetYear = targetDate.getFullYear()
              const monthMiddle = new Date(targetYear, targetMonth, 15)
              monthMiddle.setHours(0, 0, 0, 0)
              
              if (!timelineDates[0]) {
                return null
              }
              
              let closestIndex = 0
              let closestDistance = Math.abs(timelineDates[0].getTime() - monthMiddle.getTime())
              
              timelineDates.forEach((date, index) => {
                if (!date) return
                const distance = Math.abs(date.getTime() - monthMiddle.getTime())
                if (distance < closestDistance) {
                  closestDistance = distance
                  closestIndex = index
                }
              })
              
              const edgeThreshold = 2
              let adjustedIndex = closestIndex
              if (closestIndex < edgeThreshold) {
                adjustedIndex = Math.min(edgeThreshold, timelineDates.length - 1)
              } else if (closestIndex > timelineDates.length - 1 - edgeThreshold) {
                adjustedIndex = Math.max(timelineDates.length - 1 - edgeThreshold, 0)
              }
              
              // Position month label accounting for habit name column (150px) + settings icon (32px) + gap (8px) = 190px
              const position = 190 + adjustedIndex * 36 + 16
              
              const monthNames = localeCode === 'cs-CZ' 
                ? ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
              
              const monthName = monthNames[targetMonth]
              
              return (
                <div 
                  className="text-sm font-medium text-gray-700 absolute"
                  style={{ 
                    left: `${position}px`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {monthName}
                </div>
              )
            })()}
          </div>
          
          {/* Dates row - aligned with boxes (after habit name column + settings icon) */}
          <div className="flex gap-2 mb-2 relative">
            {/* Spacer for habit name column (150px) + settings icon (32px) + gap (8px) = 190px */}
            <div className="w-[190px] flex-shrink-0"></div>
            
            {/* Dates aligned with boxes */}
            <div className="flex gap-1">
              {timelineDates.map((date, index) => {
                const dateStr = getLocalDateString(date)
                const isToday = dateStr === getLocalDateString(today)
                const isMonthStart = index > 0 && date.getMonth() !== timelineDates[index - 1].getMonth()
                
                const dayNamesShort = [
                  t('calendar.daysShort.sunday'),
                  t('calendar.daysShort.monday'),
                  t('calendar.daysShort.tuesday'),
                  t('calendar.daysShort.wednesday'),
                  t('calendar.daysShort.thursday'),
                  t('calendar.daysShort.friday'),
                  t('calendar.daysShort.saturday')
                ]
                
                const day = date.getDate()
                const dayOfWeek = date.getDay()
                const dayAbbr = dayNamesShort[dayOfWeek].substring(0, 2).toUpperCase()
                
                return (
                  <div key={dateStr} className="relative w-[32px] flex-shrink-0">
                    {isMonthStart && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 -ml-0.5 z-10"
                        style={{ height: '100%' }}
                      />
                    )}
                    <div
                      className={`flex flex-col items-center w-full ${isToday ? 'bg-orange-100 rounded px-1 py-0.5' : ''}`}
                    >
                      <div className={`text-[10px] text-center leading-tight ${isToday ? 'font-semibold text-orange-700' : 'text-gray-600'}`}>
                        <div>{dayAbbr}</div>
                        <div>{day}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Habits with boxes */}
          <div className="space-y-2">
            {[...habits].sort((a: any, b: any) => {
              const aTime = a.reminder_time || ''
              const bTime = b.reminder_time || ''
              
              // If both have times, sort by time
              if (aTime && bTime) {
                return aTime.localeCompare(bTime)
              }
              // If only one has time, it comes first
              if (aTime && !bTime) return -1
              if (!aTime && bTime) return 1
              
              // If neither has time, keep original order
              return 0
            }).map((habit) => {
              const isSelected = selectedHabitId === habit.id
              return (
                <div key={habit.id} className="flex items-center gap-2">
                  {/* Habit name and settings icon container - fixed width to match dates spacer */}
                  <div className="w-[190px] flex items-center gap-2 flex-shrink-0">
                    <div className="text-left text-sm font-medium text-gray-700 truncate flex-1 min-w-0" title={habit.name}>
                      {habit.name}
                    </div>
                    {/* Settings icon button */}
                    <button
                      onClick={() => handleOpenHabitModal(habit)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                      title={t('habits.settings') || 'Nastavení'}
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Boxes row */}
                  <div className="flex gap-1 relative">
                    {timelineDates.map((date, index) => {
                      const dateStr = getLocalDateString(date)
                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                      const dayName = dayNames[date.getDay()]
                      
                      // Use helper function for habit scheduling check
                      const isScheduled = isHabitScheduledForDay(habit, date)
                      const isCompleted = habit.habit_completions && habit.habit_completions[dateStr] === true
                      const isToday = dateStr === getLocalDateString(today)
                      const isFuture = date > today
                      // Check loading state for this specific habit-day combination
                      const isLoading = loadingHabits.has(`${habit.id}-${dateStr}`)
                      const isMonthStart = index > 0 && date.getMonth() !== timelineDates[index - 1].getMonth()
                      
                      return (
                        <div key={dateStr} className="relative w-[32px] flex-shrink-0">
                          {isMonthStart && (
                            <div 
                              className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 -ml-0.5 z-10"
                              style={{ height: '100%' }}
                            />
                          )}
                          <button
                            onClick={() => !isFuture && !isLoading && handleHabitBoxClick(habit, date)}
                            disabled={isFuture || isLoading}
                            className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                              isCompleted
                                ? isScheduled
                                  ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer shadow-sm'
                                  : 'bg-orange-100 hover:bg-orange-200 cursor-pointer'
                                : isScheduled
                                  ? `bg-gray-200 ${isFuture ? 'cursor-not-allowed' : 'hover:bg-orange-200 cursor-pointer'}`
                                  : `bg-gray-100 ${isFuture ? 'cursor-not-allowed' : 'hover:bg-orange-200 cursor-pointer'}`
                            }`}
                            title={`${dateStr}${isScheduled ? ' - Naplánováno' : ' - Nenaplánováno'}${isCompleted ? ' - Splněno' : ' - Nesplněno'}`}
                          >
                            {isLoading ? (
                              <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : isCompleted ? (
                              <Check className={`w-4 h-4 ${isScheduled ? 'text-white' : 'text-orange-600'}`} strokeWidth={3} />
                            ) : null}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Legend/Explanations */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gray-200 border-2 border-gray-300 flex items-center justify-center flex-shrink-0"></div>
                <span>{t('habits.legend.planned') || 'Naplánováno'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0"></div>
                <span>{t('habits.legend.notPlanned') || 'Nenaplánováno'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <span>{t('habits.legend.completedPlanned') || 'Dokončeno naplánované'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-orange-600" strokeWidth={3} />
                </div>
                <span>{t('habits.legend.completedNotPlanned') || 'Dokončeno nenaplánované'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

