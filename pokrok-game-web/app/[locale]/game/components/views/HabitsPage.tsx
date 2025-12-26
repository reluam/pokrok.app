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
  
  // Set visible days to 5 for mobile, calculate for desktop
  useEffect(() => {
    const calculateVisibleDays = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        // Mobile: always show 5 days
        setHabitsPageVisibleDays(5)
      } else {
        // Desktop: calculate based on container width
        if (habitsPageTimelineContainerRef.current) {
          const containerWidth = habitsPageTimelineContainerRef.current.offsetWidth
          // Each day is 32px wide + 4px gap (gap-1) = 36px total per day
          // Subtract space for habit name column (190px)
          const availableWidth = containerWidth - 190
          const daysThatFit = Math.floor(availableWidth / 36)
          const newVisibleDays = Math.max(7, daysThatFit) // Minimum 7 days
          setHabitsPageVisibleDays(newVisibleDays)
        }
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
    <div className="w-full min-h-full flex flex-col bg-primary-50 p-4 md:p-6">
      {/* Statistics section */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="box-playful-highlight bg-primary-50 p-3 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary-600" />
            <div>
              <div className="text-xs text-gray-600 mb-0.5 font-playful">{t('habits.stats.totalPlanned') || 'Naplánováno'}</div>
              <div className="text-xl font-bold text-black font-playful">{stats.totalPlanned}</div>
            </div>
          </div>
          <div className="box-playful-highlight bg-primary-50 p-3 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-primary-600" />
            <div>
              <div className="text-xs text-gray-600 mb-0.5 font-playful">{t('habits.stats.totalCompleted') || 'Splněno'}</div>
              <div className="text-xl font-bold text-black font-playful">{stats.totalCompleted}</div>
            </div>
          </div>
          <div className="box-playful-highlight bg-primary-50 p-3 flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary-600" />
            <div>
              <div className="text-xs text-gray-600 mb-0.5 font-playful">{t('habits.stats.completedOutside') || 'Mimo plán'}</div>
              <div className="text-xl font-bold text-black font-playful">{stats.completedOutsidePlan}</div>
            </div>
          </div>
          <div className="box-playful-highlight bg-primary-50 p-3 flex items-center gap-3">
            <Flame className="w-5 h-5 text-primary-600" />
            <div>
              <div className="text-xs text-gray-600 mb-0.5 font-playful">{t('habits.stats.currentStreak') || 'Aktuální streak'}</div>
              <div className="text-xl font-bold text-black font-playful">{stats.currentStreak}</div>
            </div>
          </div>
          <div className="box-playful-highlight bg-primary-50 p-3 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-primary-600" />
            <div>
              <div className="text-xs text-gray-600 mb-0.5 font-playful">{t('habits.stats.maxStreak') || 'Nejdelší streak'}</div>
              <div className="text-xl font-bold text-black font-playful">{stats.maxStreak}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline section */}
      <div className="box-playful-highlight bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black font-playful">{t('habits.timeline') || 'Timeline'}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTimelineShift('left')}
              className="btn-playful-base p-2"
              title={t('common.previous') || 'Předchozí'}
            >
              <ChevronLeft className="w-5 h-5 text-black" />
            </button>
            <button
              onClick={() => handleTimelineShift('right')}
              disabled={habitsPageTimelineOffset === 0}
              className={`btn-playful-base p-2 ${
                habitsPageTimelineOffset === 0 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              title={t('common.next') || 'Další'}
            >
              <ChevronRight className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>
        
        {/* Timeline with month, dates, and boxes for all habits */}
        <div ref={habitsPageTimelineContainerRef} className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4">
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
              
              // Position month label accounting for habit name column - responsive width
              // Mobile: 140px, Desktop: 190px
              const positionMobile = 140 + adjustedIndex * 36 + 16
              const positionDesktop = 190 + adjustedIndex * 36 + 16
              
              const monthNames = localeCode === 'cs-CZ' 
                ? ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
              
              const monthName = monthNames[targetMonth]
              
              return (
                <>
                  <div 
                    className="text-sm font-medium text-gray-700 absolute md:hidden"
                    style={{ 
                      left: `${positionMobile}px`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    {monthName}
                  </div>
                  <div 
                    className="hidden md:block text-sm font-medium text-gray-700 absolute"
                    style={{ 
                      left: `${positionDesktop}px`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    {monthName}
                  </div>
                </>
              )
            })()}
          </div>
          
          {/* Dates row - aligned with boxes (after habit name column) */}
          <div className="flex gap-1 mb-2 relative min-w-max">
            {/* Spacer for habit name column - responsive width */}
            <div className="w-[140px] md:w-[190px] flex-shrink-0"></div>
            
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
                      className={`flex flex-col items-center w-full ${isToday ? 'bg-primary-100 rounded-playful-sm px-1 py-0.5' : ''}`}
                    >
                      <div className={`text-[10px] text-center leading-tight font-playful ${isToday ? 'font-semibold text-primary-700' : 'text-gray-600'}`}>
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
                <div key={habit.id} className="flex flex-col md:flex-row items-start md:items-center gap-1 min-w-max w-full">
                  {/* Habit name container - responsive width to match dates spacer */}
                  <div className="w-[140px] md:w-[190px] flex items-center gap-2 flex-shrink-0">
                    <div className="text-left text-sm font-medium text-gray-700 truncate flex-1 min-w-0" title={habit.name}>
                      {habit.name}
                    </div>
                  </div>
                  
                  {/* Boxes row */}
                  <div className="flex gap-1 relative flex-1 min-w-0">
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
                            className={`w-8 h-8 rounded-playful-sm flex items-center justify-center transition-all border-2 ${
                              isCompleted
                                ? 'box-playful-highlight bg-primary-100 border-primary-500 hover:bg-primary-200 cursor-pointer'
                                : isScheduled
                                  ? `bg-white border-primary-500 ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:bg-primary-50 cursor-pointer box-playful-highlight'}`
                                  : `bg-white border-gray-400 ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 cursor-pointer box-playful-pressed-gray'}`
                            }`}
                            title={`${dateStr}${isScheduled ? ' - Naplánováno' : ' - Nenaplánováno'}${isCompleted ? ' - Splněno' : ' - Nesplněno'}`}
                          >
                            {isLoading ? (
                              <svg className="animate-spin h-3 w-3 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : isCompleted ? (
                              <Check className="w-4 h-4 text-primary-600" strokeWidth={3} />
                            ) : null}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Settings icon button - positioned to the right */}
                  <button
                    onClick={() => handleOpenHabitModal(habit)}
                    className="btn-playful-base p-1.5 flex-shrink-0 ml-auto"
                    title={t('habits.settings') || 'Nastavení'}
                  >
                    <Settings className="w-4 h-4 text-black" />
                  </button>
                </div>
              )
            })}
          </div>
          
          {/* Legend/Explanations */}
          <div className="mt-4 pt-4 border-t-2 border-primary-500">
            <div className="flex flex-wrap gap-4 text-xs text-black font-playful">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-playful-sm bg-white border-2 border-primary-500 flex items-center justify-center flex-shrink-0 box-playful-highlight"></div>
                <span>{t('habits.legend.planned') || 'Naplánováno'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-playful-sm bg-white border-2 border-gray-400 flex items-center justify-center flex-shrink-0 box-playful-pressed-gray"></div>
                <span>{t('habits.legend.notPlanned') || 'Nenaplánováno'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-playful-sm bg-primary-100 border-2 border-primary-500 flex items-center justify-center flex-shrink-0 box-playful-highlight">
                  <Check className="w-4 h-4 text-primary-600" strokeWidth={3} />
                </div>
                <span>{t('habits.legend.completed') || 'Splněno'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

