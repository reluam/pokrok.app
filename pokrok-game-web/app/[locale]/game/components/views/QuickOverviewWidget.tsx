'use client'

import { useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { isHabitScheduledForDay } from '../utils/habitHelpers'
import { Flame, Target, CheckCircle } from 'lucide-react'

interface QuickOverviewWidgetProps {
  habits: any[]
  dailySteps: any[]
  selectedDayDate: Date
  player?: any
}

export function QuickOverviewWidget({
  habits,
  dailySteps,
  selectedDayDate,
  player
}: QuickOverviewWidgetProps) {
  const t = useTranslations()
  const locale = useLocale()
  
  const displayDate = new Date(selectedDayDate)
  displayDate.setHours(0, 0, 0, 0)
  const displayDateStr = getLocalDateString(displayDate)
  
  // Calculate daily progress
  const dayOfWeek = displayDate.getDay()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[dayOfWeek]
  
  // Filter habits for progress calculation - only habits actually scheduled for this day
  // Always_show habits are only counted if they are also scheduled for this day
  const habitsForProgress = habits.filter(habit => {
    // Check if scheduled for selected day using isHabitScheduledForDay for proper frequency handling
    // But exclude always_show habits that aren't actually scheduled
    const isScheduled = isHabitScheduledForDay(habit, displayDate)
    
    // If it's an always_show habit, verify it's also actually scheduled (not just always_show)
    if (habit.always_show || habit.alwaysShow) {
      // Check actual scheduling, not just always_show flag
      if (habit.frequency === 'daily') return true
      if (habit.frequency === 'weekly' && habit.selected_days && habit.selected_days.includes(dayName)) return true
      if (habit.frequency === 'monthly' && habit.selected_days) {
        const dayOfMonth = displayDate.getDate()
        if (habit.selected_days.includes(dayOfMonth.toString())) return true
        // For day of week in month (e.g., "first_monday"), use isHabitScheduledForDay result
        // but only if it's actually a scheduled pattern match
        if (isScheduled) {
          for (const selectedDay of habit.selected_days) {
            if (typeof selectedDay === 'string' && selectedDay.includes('_')) {
              return true
            }
          }
        }
      }
      if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
      // If only always_show without actual scheduling, don't count for progress
      return false
    }
    
    // For non-always_show habits, use the scheduled check result
    return isScheduled
  })
  
  // Filter steps for progress calculation
  const stepsForProgress = dailySteps.filter(step => {
    if (!step.date) return false
    const stepDate = normalizeDate(step.date)
    const stepDateObj = new Date(stepDate)
    stepDateObj.setHours(0, 0, 0, 0)
    return stepDateObj.getTime() === displayDate.getTime()
  })
  
  // Calculate completed tasks
  const completedHabits = habitsForProgress.filter(habit => {
    return habit.habit_completions && habit.habit_completions[displayDateStr] === true
  }).length
  
  const completedSteps = stepsForProgress.filter(step => {
    return step.completed === true
  }).length
  
  const totalTasks = habitsForProgress.length + stepsForProgress.length
  const completedTasks = completedHabits + completedSteps
  const progressPercentage = totalTasks > 0 ? Math.min(Math.round((completedTasks / totalTasks) * 100), 100) : 0
  
  // Calculate streak (days in a row with activity)
  const streak = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let streakCount = 0
    let checkDate = new Date(today)
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      // Check if there was activity (completed habit or step) on this date
      const hasActivity = habits.some(habit => habit.habit_completions?.[dateStr]) ||
                         dailySteps.some(step => {
                           const stepDate = step.date ? new Date(step.date).toISOString().split('T')[0] : null
                           return stepDate === dateStr && step.completed
                         })
      
      if (hasActivity) {
        streakCount++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streakCount
  }, [habits, dailySteps])
  
  return (
    <div className="py-1.5 px-2">
      <div className="grid grid-cols-3 gap-3">
        {/* Progress */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 w-full">
            <div className="text-lg font-bold text-primary-600 flex-shrink-0">{progressPercentage}%</div>
            <div className="flex-1 bg-primary-200 rounded-full h-2 min-w-[60px]">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] text-gray-600 font-medium mt-1">{t('progress.title')}</div>
        </div>
        
        {/* Streak */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-lg font-bold text-primary-600">
            <Flame className="w-4 h-4 text-primary-500" />
            <span>{streak}</span>
          </div>
          <div className="text-[10px] text-gray-600 font-medium mt-1">Streak</div>
        </div>
        
        {/* Completed Tasks */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-lg font-bold text-primary-600">
            <CheckCircle className="w-4 h-4 text-primary-500" />
            <span>{completedTasks}</span>
            <span className="text-xs text-gray-500 font-normal">/{totalTasks}</span>
          </div>
          <div className="text-[10px] text-gray-600 font-medium mt-1">{t('progress.completed')}</div>
        </div>
      </div>
    </div>
  )
}

