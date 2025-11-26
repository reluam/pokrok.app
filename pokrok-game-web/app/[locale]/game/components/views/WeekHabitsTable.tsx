'use client'

import { useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
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
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  const dayNamesShort = [
    t('calendar.daysShort.sunday'),
    t('calendar.daysShort.monday'),
    t('calendar.daysShort.tuesday'),
    t('calendar.daysShort.wednesday'),
    t('calendar.daysShort.thursday'),
    t('calendar.daysShort.friday'),
    t('calendar.daysShort.saturday')
  ]
  
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
    
    return habits.filter(habit => {
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
  }, [habits, weekDays])
  
  // Check if habit is scheduled for a specific day
  const isHabitScheduledForDay = (habit: any, day: Date): boolean => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[day.getDay()]
    
    if (habit.always_show) return true
    if (habit.frequency === 'daily') return true
    if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
    return false
  }
  
  // Check if habit is completed for a specific day
  const isHabitCompletedForDay = (habit: any, day: Date): boolean => {
    const dateStr = getLocalDateString(day)
    return habit.habit_completions && habit.habit_completions[dateStr] === true
  }
  
  if (weekHabits.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-sm">
        <h3 className="text-lg font-bold text-orange-800 mb-4">Návyky v týdnu</h3>
        <div className="text-center py-8 text-gray-500">
          <p>Žádné návyky na tento týden</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-sm overflow-x-auto">
      <h3 className="text-lg font-bold text-orange-800 mb-4">Návyky v týdnu</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-white z-10 min-w-[140px]">
                Návyk
              </th>
              {weekDays.map((day, index) => {
                const dateStr = getLocalDateString(day)
                const isSelected = selectedDayDate && getLocalDateString(selectedDayDate) === dateStr
                const dayName = dayNamesShort[day.getDay()]
                const dayNumber = day.getDate()
                
                return (
                  <th
                    key={dateStr}
                    className={`text-center py-2 px-1 border-b border-gray-200 text-[10px] font-semibold min-w-[40px] ${
                      isSelected ? 'bg-orange-100 text-orange-800' : 'text-gray-500'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="uppercase">{dayName}</span>
                      <span className={`text-xs ${isSelected ? 'font-bold' : ''}`}>{dayNumber}</span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {weekHabits.map((habit) => (
              <tr key={habit.id} className="hover:bg-gray-50 group">
                <td className="py-1.5 px-3 border-b border-gray-100 sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                  <button
                    onClick={() => onHabitClick?.(habit)}
                    className="text-left font-medium text-xs text-gray-700 hover:text-orange-600 transition-colors truncate max-w-[180px] block"
                    title={habit.name}
                  >
                    {habit.name}
                  </button>
                </td>
                {weekDays.map((day) => {
                  const dateStr = getLocalDateString(day)
                  const isScheduled = isHabitScheduledForDay(habit, day)
                  const isCompleted = isHabitCompletedForDay(habit, day)
                  const isSelected = selectedDayDate && getLocalDateString(selectedDayDate) === dateStr
                  
                  return (
                    <td
                      key={dateStr}
                      className={`text-center py-1.5 px-1 border-b border-gray-100 ${
                        isSelected ? 'bg-orange-50' : ''
                      }`}
                    >
                      {isScheduled ? (
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              if (onHabitToggle && !loadingHabits.has(habit.id)) {
                                onHabitToggle(habit.id, dateStr)
                              }
                            }}
                            disabled={loadingHabits.has(habit.id)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-orange-500 border-orange-600'
                                : 'bg-white border-gray-300 hover:border-orange-400'
                            } ${isSelected ? 'ring-1 ring-orange-300' : ''}`}
                          >
                            {loadingHabits.has(habit.id) ? (
                              <svg className="animate-spin h-2.5 w-2.5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : isCompleted ? (
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            ) : null}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-200 text-[10px]">•</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

