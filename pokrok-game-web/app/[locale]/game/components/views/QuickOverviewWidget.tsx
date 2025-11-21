'use client'

import { useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
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
  
  // Filter habits for progress calculation
  const habitsForProgress = habits.filter(habit => {
    if (habit.frequency === 'daily') return true
    if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
    return false
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
  
  const completedSteps = dailySteps.filter(step => {
    const stepDate = normalizeDate(step.date)
    return stepDate === displayDateStr && step.completed
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
            <div className="text-lg font-bold text-orange-600 flex-shrink-0">{progressPercentage}%</div>
            <div className="flex-1 bg-orange-200 rounded-full h-2 min-w-[60px]">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] text-gray-600 font-medium mt-1">Pokrok</div>
        </div>
        
        {/* Streak */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-lg font-bold text-orange-600">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>{streak}</span>
          </div>
          <div className="text-[10px] text-gray-600 font-medium mt-1">Streak</div>
        </div>
        
        {/* Completed Tasks */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-lg font-bold text-orange-600">
            <CheckCircle className="w-4 h-4 text-orange-500" />
            <span>{completedTasks}</span>
            <span className="text-xs text-gray-500 font-normal">/{totalTasks}</span>
          </div>
          <div className="text-[10px] text-gray-600 font-medium mt-1">Dokončeno</div>
        </div>
      </div>
    </div>
  )
}

