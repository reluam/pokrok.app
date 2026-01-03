'use client'

import { useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString } from '../../../main/components/utils/dateHelpers'
import { isHabitScheduledForDay } from '../utils/habitHelpers'
import { Check } from 'lucide-react'

interface WeekHabitsTableProps {
  habits: any[]
  weekStartDate: Date
  selectedDayDate: Date | null
  onHabitToggle?: (habitId: string, date: string) => Promise<void>
  onHabitClick?: (habit: any) => void
  loadingHabits?: Set<string>
}

export function WeekHabitsTable({
  habits,
  weekStartDate,
  selectedDayDate,
  onHabitToggle,
  onHabitClick,
  loadingHabits = new Set()
}: WeekHabitsTableProps) {
  const t = useTranslations()
  const locale = useLocale()
  
  const dayNamesShort = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']
  
  // Get all days of the week
  const weekDays = useMemo(() => {
    const days: Date[] = []
    const start = new Date(weekStartDate)
    start.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      days.push(date)
    }
    return days
  }, [weekStartDate])
  
  // Get all habits that are scheduled for at least one day in the week
  const weekHabits = useMemo(() => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    
    const filtered = habits.filter(habit => {
      // Always show habits
      if (habit.always_show) return true
      
      // Daily habits
      if (habit.frequency === 'daily') return true
      
      // Custom habits - check if scheduled for any day in the week
      if (habit.frequency === 'custom' && habit.selected_days) {
        return weekDays.some(day => {
          const dayName = dayNames[day.getDay()]
          return habit.selected_days?.includes(dayName)
        })
      }
      
      return false
    })
    
    // Sort by order (if exists) or created_at to maintain fixed order
    // Use id as final tiebreaker for absolute stability
    return filtered.sort((a: any, b: any) => {
      // Primary: order (if exists) or created_at timestamp
      const aOrder = a.order !== undefined ? a.order : (a.created_at ? new Date(a.created_at).getTime() : 0)
      const bOrder = b.order !== undefined ? b.order : (b.created_at ? new Date(b.created_at).getTime() : 0)
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      
      // Tiebreaker: use id for absolute stability (id never changes)
      return a.id.localeCompare(b.id)
    })
  }, [habits, weekDays])
  
  // Use helper function for habit scheduling check
  
  // Check if habit is completed for a specific day
  const isHabitCompletedForDay = (habit: any, day: Date): boolean => {
    const dateStr = getLocalDateString(day)
    return habit.habit_completions && habit.habit_completions[dateStr] === true
  }

  // Check if day is today
  const isToday = (day: Date): boolean => {
    const today = new Date()
    return day.toDateString() === today.toDateString()
  }
  
  if (weekHabits.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
        <h3 className="text-sm font-bold text-orange-800 mb-3">Návyky v týdnu</h3>
        <div className="text-center py-4 text-gray-500 text-sm">
          <p>Žádné návyky na tento týden</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
      <h3 className="text-sm font-bold text-orange-800 mb-3">Návyky v týdnu</h3>
      
      {/* Desktop: Header with day names */}
      <div className="hidden md:flex items-center gap-2 mb-3 pl-[140px]">
        {weekDays.map((day) => {
          const dateStr = getLocalDateString(day)
          const isSelected = selectedDayDate && getLocalDateString(selectedDayDate) === dateStr
          const dayName = dayNamesShort[day.getDay()]
          const isTodayDate = isToday(day)
          
          return (
            <div
              key={dateStr}
              className={`w-8 h-8 flex flex-col items-center justify-center text-[10px] rounded-lg ${
                isSelected 
                  ? 'bg-orange-500 text-white font-bold' 
                  : isTodayDate 
                    ? 'bg-orange-100 text-orange-700 font-semibold'
                    : 'text-gray-500'
              }`}
            >
              <span>{dayName}</span>
              <span className="text-[9px]">{day.getDate()}</span>
            </div>
          )
        })}
      </div>
      
      {/* Desktop: Habits list with completion squares */}
      <div className="hidden md:block space-y-2">
        {weekHabits.map((habit) => {
          // Check if habit has started (check if any day in week is after or equal to start_date)
          const habitStartDateStr = (habit as any).start_date || habit.created_at
          let isHabitStarted = true
          if (habitStartDateStr) {
            const habitStartDate = new Date(habitStartDateStr)
            habitStartDate.setHours(0, 0, 0, 0)
            // Check if any day in the week is after or equal to start_date
            const weekEndDate = weekDays[weekDays.length - 1]
            isHabitStarted = weekEndDate >= habitStartDate
          }
          
          return (
          <div key={habit.id} className="flex items-center gap-2">
            {/* Habit name */}
            <button
              onClick={() => onHabitClick?.(habit)}
              className={`w-[132px] text-left text-sm font-medium truncate flex-shrink-0 transition-colors ${
                isHabitStarted 
                  ? 'text-gray-700 hover:text-orange-600' 
                  : 'text-gray-400 opacity-60'
              }`}
              title={habit.name}
            >
              {habit.name}
            </button>
            
            {/* Day completion squares */}
            <div className="flex gap-1">
              {weekDays.map((day) => {
                const dateStr = getLocalDateString(day)
                const dayDate = new Date(day)
                dayDate.setHours(0, 0, 0, 0)
                
                // Check if habit has started (date is after or equal to start_date)
                const habitStartDateStr = (habit as any).start_date || habit.created_at
                let isAfterHabitStart = true
                if (habitStartDateStr) {
                  const habitStartDate = new Date(habitStartDateStr)
                  habitStartDate.setHours(0, 0, 0, 0)
                  isAfterHabitStart = dayDate >= habitStartDate
                }
                
                const isScheduled = isHabitScheduledForDay(habit, day)
                const isCompleted = isHabitCompletedForDay(habit, day)
                const isSelected = selectedDayDate && getLocalDateString(selectedDayDate) === dateStr
                const isLoading = loadingHabits.has(habit.id)
                
                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      if (isScheduled && onHabitToggle && !isLoading) {
                        onHabitToggle(habit.id, dateStr)
                      }
                    }}
                    disabled={!isScheduled || isLoading}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      !isAfterHabitStart
                        ? !isScheduled
                          ? 'bg-gray-50 opacity-60 cursor-default'
                          : isCompleted
                            ? 'bg-orange-100 hover:bg-orange-200 cursor-pointer opacity-70'
                            : 'bg-gray-100 hover:bg-gray-200 cursor-pointer opacity-70'
                        : !isScheduled 
                        ? isCompleted
                          ? 'bg-orange-100 hover:bg-orange-200 cursor-pointer'
                          : 'bg-gray-100 cursor-default'
                        : isCompleted
                          ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer shadow-sm'
                          : 'bg-gray-200 hover:bg-orange-200 cursor-pointer'
                    } ${isSelected ? 'ring-2 ring-orange-400 ring-offset-1' : ''}`}
                    title={!isAfterHabitStart && isScheduled ? 'Klikni pro splnění (posune start_date)' : isScheduled ? (isCompleted ? 'Splněno - klikni pro zrušení' : 'Klikni pro splnění') : 'Nenaplánováno'}
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
                )
              })}
            </div>
          </div>
          )
        })}
      </div>
      
      {/* Mobile: Habits as titles with checkboxes below */}
      <div className="md:hidden space-y-2.5">
        {weekHabits.map((habit) => {
          // Check if habit has started (check if any day in week is after or equal to start_date)
          const habitStartDateStr = (habit as any).start_date || habit.created_at
          let isHabitStarted = true
          if (habitStartDateStr) {
            const habitStartDate = new Date(habitStartDateStr)
            habitStartDate.setHours(0, 0, 0, 0)
            // Check if any day in the week is after or equal to start_date
            const weekEndDate = weekDays[weekDays.length - 1]
            isHabitStarted = weekEndDate >= habitStartDate
          }
          
          return (
          <div key={habit.id} className="flex flex-col gap-1.5">
            {/* Habit name as title */}
            <button
              onClick={() => onHabitClick?.(habit)}
              className={`text-xs font-semibold text-left leading-tight transition-colors ${
                isHabitStarted 
                  ? 'text-gray-800 hover:text-orange-600' 
                  : 'text-gray-400 opacity-60'
              }`}
              title={habit.name}
            >
              {habit.name}
            </button>
            
            {/* Day completion squares below title */}
            <div className="flex gap-1 justify-between">
              {weekDays.map((day) => {
                const dateStr = getLocalDateString(day)
                const dayDate = new Date(day)
                dayDate.setHours(0, 0, 0, 0)
                
                // Check if habit has started (date is after or equal to start_date)
                const habitStartDateStr = (habit as any).start_date || habit.created_at
                let isAfterHabitStart = true
                if (habitStartDateStr) {
                  const habitStartDate = new Date(habitStartDateStr)
                  habitStartDate.setHours(0, 0, 0, 0)
                  isAfterHabitStart = dayDate >= habitStartDate
                }
                
                const isScheduled = isHabitScheduledForDay(habit, day)
                const isCompleted = isHabitCompletedForDay(habit, day)
                const isSelected = selectedDayDate && getLocalDateString(selectedDayDate) === dateStr
                const isLoading = loadingHabits.has(habit.id)
                const dayName = dayNamesShort[day.getDay()]
                const isTodayDate = isToday(day)
                
                return (
                  <div key={dateStr} className="flex flex-col items-center gap-0.5 flex-1">
                    {/* Day label */}
                    <div className={`text-[8px] font-medium leading-none ${
                      isSelected 
                        ? 'text-orange-600' 
                        : isTodayDate 
                          ? 'text-orange-500'
                          : 'text-gray-500'
                    }`}>
                      {dayName}
                    </div>
                    
                    {/* Checkbox */}
                    <button
                      onClick={() => {
                        if (isScheduled && onHabitToggle && !isLoading) {
                          onHabitToggle(habit.id, dateStr)
                        }
                      }}
                      disabled={!isScheduled || isLoading}
                      className={`w-7 h-7 rounded-md flex items-center justify-center transition-all touch-manipulation ${
                        !isAfterHabitStart
                          ? !isScheduled
                            ? 'bg-gray-50 opacity-60 cursor-default'
                            : isCompleted
                              ? 'bg-orange-100 hover:bg-orange-200 active:bg-orange-300 cursor-pointer opacity-70'
                              : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 cursor-pointer opacity-70'
                          : !isScheduled 
                          ? isCompleted
                            ? 'bg-orange-100 hover:bg-orange-200 active:bg-orange-300 cursor-pointer'
                            : 'bg-gray-100 cursor-default'
                          : isCompleted
                            ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 cursor-pointer shadow-sm'
                            : 'bg-gray-200 hover:bg-orange-200 active:bg-orange-300 cursor-pointer'
                      } ${isSelected ? 'ring-1 ring-orange-400' : ''}`}
                      title={!isAfterHabitStart && isScheduled ? 'Klikni pro splnění (posune start_date)' : isScheduled ? (isCompleted ? 'Splněno - klikni pro zrušení' : 'Klikni pro splnění') : 'Nenaplánováno'}
                    >
                      {isLoading ? (
                        <svg className="animate-spin h-2.5 w-2.5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : isCompleted ? (
                        <Check className={`w-3.5 h-3.5 ${isScheduled ? 'text-white' : 'text-orange-600'}`} strokeWidth={3} />
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
    </div>
  )
}
