'use client'

import { useRef, useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { getLocalDateString } from '../utils/dateHelpers'
import { isHabitScheduledForDay, getHabitStartDate } from '../utils/habitHelpers'

interface HabitDetailPageProps {
  habit: any
  habitTimelineOffsets: Record<string, number>
  setHabitTimelineOffsets: (value: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void
  habitDetailVisibleDays: Record<string, number>
  habitDetailTimelineContainerRef: React.RefObject<HTMLDivElement>
  handleHabitCalendarToggle: (habitId: string, date: string, currentState: 'completed' | 'missed' | 'planned' | 'not-scheduled' | 'today', isScheduled: boolean) => Promise<void>
  setMainPanelSection: (section: string) => void
  loadingHabits: Set<string>
}

export function HabitDetailPage({
  habit,
  habitTimelineOffsets,
  setHabitTimelineOffsets,
  habitDetailVisibleDays,
  habitDetailTimelineContainerRef,
  handleHabitCalendarToggle,
  setMainPanelSection,
  loadingHabits
}: HabitDetailPageProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  const habitId = habit.id
  const timelineOffset = habitTimelineOffsets[habitId] || 0
  const visibleDays = habitDetailVisibleDays[habitId] || 20
  
  const setTimelineOffset = (value: number | ((prev: number) => number)) => {
    setHabitTimelineOffsets(prev => {
      const current = prev[habitId] || 0
      const newValue = typeof value === 'function' ? value(current) : value
      return { ...prev, [habitId]: newValue }
    })
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Calculate date range for timeline
  // timelineOffset determines how many days back from today the END date is
  // Negative offset = going back in time (left arrow)
  // Positive offset = going forward in time (right arrow)
  // When offset is 0, the rightmost date is today
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() - timelineOffset)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - visibleDays + 1)
  
  // Generate array of dates for timeline
  const timelineDates: Date[] = []
  for (let i = 0; i < visibleDays; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    timelineDates.push(date)
  }
  
  // Helper functions for habit scheduling and completion
  // Use helper function for habit scheduling check
  const checkHabitScheduled = (day: Date): boolean => {
    return isHabitScheduledForDay(habit, day)
  }
  
  const isHabitCompletedForDay = (day: Date): boolean => {
    const dateStr = getLocalDateString(day)
    return habit.habit_completions && habit.habit_completions[dateStr] === true
  }
  
  // Calculate statistics (without useMemo since this is inside a render function)
  const calculateStats = () => {
    let totalPlanned = 0
    let totalCompleted = 0
    let completedOutsidePlan = 0
    let currentStreak = 0
    let maxStreak = habit.max_streak || 0
    
    // Calculate from habit_completions
    if (habit.habit_completions) {
      const completionDates = Object.keys(habit.habit_completions)
        .filter(date => habit.habit_completions[date] === true)
        .map(date => new Date(date))
        .sort((a, b) => a.getTime() - b.getTime())
      
      // Count total planned and completed
      const allDates: Date[] = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Get start date (created_at or earliest completion, whichever is earlier)
      const startDate = getHabitStartDate(habit)
      
      // Go from start date to today
      const currentDate = new Date(startDate)
      while (currentDate <= today) {
        allDates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      allDates.forEach(date => {
        const isScheduled = checkHabitScheduled(date)
        const isCompleted = isHabitCompletedForDay(date)
        const dateStr = getLocalDateString(date)
        
        if (isScheduled) {
          totalPlanned++
          if (isCompleted) {
            totalCompleted++
          }
        } else if (isCompleted) {
          completedOutsidePlan++
        }
      })
      
      // Calculate current streak (backwards from today)
      // Streak continues if there's no scheduled missed day
      // Splnění v nenaplánovaný den se nepočítá do streak, ale do celkově splněných
      // Start from today and go backwards
      let streakDate = new Date(today)
      streakDate.setHours(0, 0, 0, 0)
      const startDateNormalized = new Date(startDate)
      startDateNormalized.setHours(0, 0, 0, 0)
      
      // Count backwards from today
      while (true) {
        // Check if we've gone past the start date
        if (streakDate.getTime() < startDateNormalized.getTime()) {
          break
        }
        
        const isScheduled = checkHabitScheduled(streakDate)
        const isCompleted = isHabitCompletedForDay(streakDate)
        
        if (isScheduled && isCompleted) {
          // This day counts towards the streak
          currentStreak++
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
      
      // Calculate max streak by going through all dates
      let tempStreak = 0
      maxStreak = 0
      const checkDate = new Date(startDate)
      while (checkDate <= today) {
        const isScheduled = checkHabitScheduled(checkDate)
        const isCompleted = isHabitCompletedForDay(checkDate)
        
        if (isScheduled && isCompleted) {
          tempStreak++
          maxStreak = Math.max(maxStreak, tempStreak)
        } else if (isScheduled && !isCompleted) {
          // Scheduled but not completed - reset streak
          tempStreak = 0
        }
        // Not scheduled - doesn't affect streak
        
        checkDate.setDate(checkDate.getDate() + 1)
      }
    }
    
    return {
      totalPlanned,
      totalCompleted,
      completedOutsidePlan,
      currentStreak: currentStreak, // Always use calculated streak, not from database
      maxStreak
    }
  }
  
  const stats = calculateStats()
  
  const handleTimelineShift = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      // Left arrow = go back in time (increase offset, which moves start date earlier)
      setTimelineOffset(prev => prev + visibleDays)
    } else {
      // Right arrow = go forward in time (decrease offset, which moves start date later)
      // Don't go past today (offset can't be negative)
      setTimelineOffset(prev => Math.max(0, prev - visibleDays))
    }
  }
  
  const handleHabitBoxClick = async (date: Date) => {
    const dateStr = getLocalDateString(date)
    const isScheduled = checkHabitScheduled(date)
    const isCompleted = isHabitCompletedForDay(date)
    
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
    <div className="w-full min-h-full flex flex-col bg-orange-50">
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 truncate">{habit.name}</h2>
          <button
            onClick={() => setMainPanelSection('overview')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={t('navigation.backToOverview')}
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
      
      {/* Habit detail content */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <div className="p-6">
          {/* Habit header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{habit.name}</h1>
            {habit.description && (
              <p className="text-gray-600 text-lg">{habit.description}</p>
            )}
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
                  disabled={timelineOffset === 0}
                  className={`p-2 rounded-lg transition-colors ${
                    timelineOffset === 0 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-100'
                  }`}
                  title={t('common.next') || 'Další'}
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
            
            {/* Timeline with month, dates, and boxes */}
            <div ref={habitDetailTimelineContainerRef} className="w-full">
              {/* Month row - positioned around middle of month */}
              <div className="flex mb-2 relative" style={{ height: '24px' }}>
                {(() => {
                  // Find the middle date of the visible range
                  const middleIndex = Math.floor(timelineDates.length / 2)
                  let targetDate = timelineDates[middleIndex]
                  
                  // Get the month of the middle date
                  const targetMonth = targetDate.getMonth()
                  const targetYear = targetDate.getFullYear()
                  
                  // Find the middle of the month (15th day)
                  const monthMiddle = new Date(targetYear, targetMonth, 15)
                  monthMiddle.setHours(0, 0, 0, 0)
                  
                  // Find the closest date to month middle in our visible range
                  let closestIndex = 0
                  let closestDistance = Math.abs(timelineDates[0].getTime() - monthMiddle.getTime())
                  
                  timelineDates.forEach((date, index) => {
                    const distance = Math.abs(date.getTime() - monthMiddle.getTime())
                    if (distance < closestDistance) {
                      closestDistance = distance
                      closestIndex = index
                    }
                  })
                  
                  // If the closest date is too close to the edges (first or last 2 days), adjust it
                  const edgeThreshold = 2
                  let adjustedIndex = closestIndex
                  if (closestIndex < edgeThreshold) {
                    // Too close to start, move it a bit right
                    adjustedIndex = Math.min(edgeThreshold, timelineDates.length - 1)
                  } else if (closestIndex > timelineDates.length - 1 - edgeThreshold) {
                    // Too close to end, move it a bit left
                    adjustedIndex = Math.max(timelineDates.length - 1 - edgeThreshold, 0)
                  }
                  
                  // Calculate position: each day is 36px (32px box + 4px gap)
                  // Position the month label at the center of the target day
                  const position = adjustedIndex * 36 + 16 // 16px = half of 32px box
                  
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
              
              {/* Dates row */}
              <div className="flex gap-1 mb-2 relative">
                {timelineDates.map((date, index) => {
                  const dateStr = getLocalDateString(date)
                  const isToday = dateStr === getLocalDateString(today)
                  
                  // Check if this is the first day of a month (month boundary)
                  const isMonthStart = index > 0 && date.getMonth() !== timelineDates[index - 1].getMonth()
                  
                  // Format date: day abbreviation + day number (e.g., "SA 29")
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
                    <div key={dateStr} className="relative">
                      {/* Month divider - vertical line before first day of month */}
                      {isMonthStart && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 -ml-0.5 z-10"
                          style={{ height: '100%' }}
                        />
                      )}
                      <div
                        className={`flex flex-col items-center w-[32px] flex-shrink-0 ${isToday ? 'bg-orange-100 rounded px-1 py-0.5' : ''}`}
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
              
              {/* Boxes row */}
              <div className="flex gap-1 relative">
                {timelineDates.map((date, index) => {
                  const dateStr = getLocalDateString(date)
                  // IMPORTANT: Check if scheduled FIRST, before checking completion
                  // This ensures we correctly identify if a day is scheduled or not
                  const isScheduled = checkHabitScheduled(date)
                  const isCompleted = isHabitCompletedForDay(date)
                  const isToday = dateStr === getLocalDateString(today)
                  const isFuture = date > today
                  // Check loading state for this specific habit-day combination
                  const isLoading = loadingHabits.has(`${habit.id}-${dateStr}`)
                  
                  // Check if this is the first day of a month (month boundary)
                  const isMonthStart = index > 0 && date.getMonth() !== timelineDates[index - 1].getMonth()
                  
                  // Determine the visual state based on completion and scheduling
                  // We need TWO different colors for completed habits:
                  // 1. Completed AND scheduled = dark orange (bg-orange-500)
                  // 2. Completed BUT NOT scheduled = light orange (bg-orange-100 with border)
                  const getButtonClassName = () => {
                    if (isCompleted) {
                      if (isScheduled) {
                        // Completed and scheduled - dark orange
                        return 'bg-orange-500 hover:bg-orange-600 cursor-pointer shadow-sm'
                      } else {
                        // Completed but NOT scheduled - light orange with border
                        return 'bg-orange-100 hover:bg-orange-200 cursor-pointer'
                      }
                    } else {
                      // Not completed
                      if (isScheduled) {
                        return `bg-gray-200 ${isFuture ? 'cursor-not-allowed' : 'hover:bg-orange-200 cursor-pointer'}`
                      } else {
                        return `bg-gray-100 ${isFuture ? 'cursor-not-allowed' : 'hover:bg-orange-200 cursor-pointer'}`
                      }
                    }
                  }
                  
                  return (
                    <div key={dateStr} className="relative">
                      {/* Month divider - vertical line before first day of month */}
                      {isMonthStart && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 -ml-0.5 z-10"
                          style={{ height: '100%' }}
                        />
                      )}
                      <button
                        onClick={() => !isFuture && !isLoading && handleHabitBoxClick(date)}
                        disabled={isFuture || isLoading}
                        className={`w-8 h-8 rounded flex items-center justify-center transition-all flex-shrink-0 ${getButtonClassName()}`}
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
          
          {/* Statistics section */}
          <div className="mb-8 bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('habits.statistics') || 'Statistiky'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">{t('habits.stats.totalPlanned') || 'Naplánováno'}</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalPlanned}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">{t('habits.stats.totalCompleted') || 'Splněno'}</div>
                <div className="text-2xl font-bold text-green-600">{stats.totalCompleted}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">{t('habits.stats.completedOutside') || 'Mimo plán'}</div>
                <div className="text-2xl font-bold text-blue-600">{stats.completedOutsidePlan}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">{t('habits.stats.currentStreak') || 'Aktuální streak'}</div>
                <div className="text-2xl font-bold text-orange-600">{stats.currentStreak}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">{t('habits.stats.maxStreak') || 'Nejdelší streak'}</div>
                <div className="text-2xl font-bold text-purple-600">{stats.maxStreak}</div>
              </div>
            </div>
          </div>
          
          {/* Settings section */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('habits.settings') || 'Nastavení'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('habits.frequencyLabel') || 'Frekvence'}
                </label>
                <div className="text-gray-900">
                  {habit.frequency === 'daily' ? t('habits.frequency.daily') || 'Denně' :
                   habit.frequency === 'weekly' ? t('habits.frequency.weekly') || 'Týdně' :
                   habit.frequency === 'custom' ? t('habits.frequency.weekly') || 'Týdně' :
                   habit.frequency}
                </div>
              </div>
              {(habit.frequency === 'custom' || habit.frequency === 'weekly') && habit.selected_days && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('habits.selectedDays') || 'Vybrané dny'}
                  </label>
                  <div className="text-gray-900">
                    {habit.selected_days.join(', ')}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('habits.category') || 'Kategorie'}
                </label>
                <div className="text-gray-900">
                  {habit.category || t('habits.noCategory') || 'Bez kategorie'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('habits.difficultyLabel') || 'Obtížnost'}
                </label>
                <div className="text-gray-900">
                  {habit.difficulty === 'easy' ? t('habits.difficulty.easy') || 'Snadná' :
                   habit.difficulty === 'medium' ? t('habits.difficulty.medium') || 'Střední' :
                   habit.difficulty === 'hard' ? t('habits.difficulty.hard') || 'Těžká' :
                   habit.difficulty || t('habits.noDifficulty') || 'Bez obtížnosti'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

