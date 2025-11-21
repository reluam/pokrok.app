'use client'

import { useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TimelineProps {
  selectedDate: Date
  viewMode: 'day' | 'week' | 'month' | 'year'
  onDateClick?: (date: Date) => void
  selectedDayDate?: Date | null // For week view - which day is selected for detail view
  habits?: any[]
  dailySteps?: any[]
  onPrevClick?: () => void
  onNextClick?: () => void
}

export function Timeline({
  selectedDate,
  viewMode,
  onDateClick,
  selectedDayDate = null,
  habits = [],
  dailySteps = [],
  onPrevClick,
  onNextClick
}: TimelineProps) {
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
  
  // Get dates to display based on view mode
  const datesToDisplay = useMemo(() => {
    const dates: Date[] = []
    
    if (viewMode === 'day') {
      // For day view, show just the selected date
      const date = new Date(selectedDate)
      date.setHours(0, 0, 0, 0)
      dates.push(date)
    } else if (viewMode === 'week') {
      // For week view, show all 7 days of the week
      const startOfWeek = new Date(selectedDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
      const weekStart = new Date(startOfWeek)
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0)
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + i)
        dates.push(date)
      }
    } else if (viewMode === 'month') {
      // For month view, show all days of the month
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i)
        date.setHours(0, 0, 0, 0)
        dates.push(date)
      }
    }
    
    return dates
  }, [selectedDate, viewMode])
  
  // Calculate stats for each date
  const dateStats = useMemo(() => {
    return datesToDisplay.map(date => {
      const dateStr = getLocalDateString(date)
      const dayOfWeek = date.getDay()
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[dayOfWeek]
      
      // Filter habits for this date
      const dayHabits = habits.filter(habit => {
        if (habit.frequency === 'daily') return true
        if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
        return false
      })
      
      // Filter steps for this date
      const daySteps = dailySteps.filter(step => {
        if (!step.date) return false
        const stepDate = normalizeDate(step.date)
        return stepDate === dateStr
      })
      
      // Calculate completion
      const completedHabits = dayHabits.filter(habit => {
        return habit.habit_completions && habit.habit_completions[dateStr] === true
      }).length
      
      const completedSteps = daySteps.filter(step => step.completed).length
      
      const totalTasks = dayHabits.length + daySteps.length
      const completedTasks = completedHabits + completedSteps
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      
      return {
        date,
        dateStr,
        totalTasks,
        completedTasks,
        completionPercentage
      }
    })
  }, [datesToDisplay, habits, dailySteps])
  
  const today = getLocalDateString()
  
  // For day view, show simple timeline with just a line and dot
  if (viewMode === 'day') {
    const date = dateStats[0]?.date
    const dateStr = dateStats[0]?.dateStr || ''
    const isToday = dateStr === today
    
    return (
      <div className="w-full py-6 px-8">
        <div className="relative h-1 w-full flex items-center">
          {/* Line */}
          <div className="absolute left-0 right-0 h-0.5 bg-gray-200 rounded-full"></div>
          
          {/* Dot */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all ${
              isToday ? 'bg-orange-500 ring-4 ring-orange-100' : 'bg-gray-400'
            }`} />
          </div>
        </div>
      </div>
    )
  }
  
  // For week/month view, show timeline with dots ON the line and dates BELOW
  return (
    <div className="w-full py-4 px-4">
      <div className="flex items-center gap-4">
        {/* Prev Arrow */}
        {onPrevClick && (
          <button 
            onClick={onPrevClick}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-orange-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div className="relative flex-1">
          {/* Horizontal line connecting all dots */}
          <div className="absolute top-2 left-4 right-4 h-0.5 bg-gray-200 rounded-full"></div>
          
          {/* Container for dots and labels */}
          <div className="relative flex items-start justify-between">
            {dateStats.map((stat, index) => {
              const date = stat.date
              const dateStr = stat.dateStr
              const isToday = dateStr === today
              const isSelected = selectedDayDate 
                ? getLocalDateString(selectedDayDate) === dateStr
                : false
              
              const dayNumber = date.getDate()
              const dayName = dayNamesShort[date.getDay()]
              
              return (
                <button
                  key={dateStr}
                  onClick={() => onDateClick?.(date)}
                  className="group flex flex-col items-center relative z-10 focus:outline-none min-w-[40px]"
                >
                  {/* Dot (circle) on the line */}
                  <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all duration-200 mb-3 ${
                    isSelected
                      ? 'bg-orange-600 scale-125 ring-4 ring-orange-100'
                      : isToday
                        ? 'bg-orange-500 ring-2 ring-orange-50'
                        : stat.completionPercentage === 100
                          ? 'bg-green-500'
                          : stat.completionPercentage > 0
                            ? 'bg-orange-200' // Jemnější oranžová pro částečný pokrok v minulosti
                            : 'bg-gray-300 group-hover:bg-gray-400'
                  }`} />
                  
                  {/* Date label below the line */}
                  <div className={`flex flex-col items-center transition-colors duration-200 ${
                    isSelected
                      ? 'text-orange-800'
                      : isToday
                        ? 'text-orange-600'
                        : 'text-gray-500 group-hover:text-gray-700'
                  }`}>
                    <span className="text-[10px] uppercase tracking-wider font-semibold mb-0.5">{dayName}</span>
                    <span className={`text-sm ${isSelected || isToday ? 'font-bold' : 'font-medium'}`}>{dayNumber}</span>
                  </div>
                  
                  {/* Optional: Progress dots below date if needed, or keep clean */}
                  {stat.totalTasks > 0 && (
                    <div className={`mt-1 text-[9px] font-medium ${
                       isSelected ? 'text-orange-600' : 'text-gray-400'
                    }`}>
                      {stat.completedTasks}/{stat.totalTasks}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Next Arrow */}
        {onNextClick && (
          <button 
            onClick={onNextClick}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-orange-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
