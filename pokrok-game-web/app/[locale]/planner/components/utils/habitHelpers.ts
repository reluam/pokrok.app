// Helper functions for habit scheduling and calculations

import { getLocalDateString } from './dateHelpers'

/**
 * Check if a habit is scheduled for a specific day
 * Supports daily, weekly, monthly, and custom frequencies
 */
export function isHabitScheduledForDay(habit: any, day: Date): boolean {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[day.getDay()]
  const dayOfMonth = day.getDate()
  
  // Daily frequency
  if (habit.frequency === 'daily') return true
  
  // Weekly frequency - check if day of week is in selected_days
  if (habit.frequency === 'weekly') {
    if (habit.selected_days && Array.isArray(habit.selected_days)) {
      return habit.selected_days.includes(dayName)
    }
    return false
  }
  
  // Monthly frequency - check day of month or day of week in month
  if (habit.frequency === 'monthly') {
    if (!habit.selected_days || !Array.isArray(habit.selected_days)) {
      // Fallback: use created_at date if no selected_days
      if (habit.created_at) {
        const createdDate = new Date(habit.created_at)
        return day.getDate() === createdDate.getDate()
      }
      return false
    }
    
    // Check for day of month (1-31)
    // Handle auto-adjust for day 31 (if enabled, check both 30 and 31 for months with 30 days)
    let dayToCheck = dayOfMonth.toString()
    if (habit.selected_days.includes(dayToCheck)) {
      return true
    }
    
    // Auto-adjust: if day 31 is selected and current month has 30 days, check day 30
    if (dayOfMonth === 30 && habit.selected_days.includes('31')) {
      const daysInMonth = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate()
      if (daysInMonth === 30) {
        return true
      }
    }
    
    // Check for day of week in month (e.g., "first_monday", "last_friday")
    for (const selectedDay of habit.selected_days) {
      if (typeof selectedDay === 'string' && selectedDay.includes('_')) {
        const [week, dayOfWeek] = selectedDay.split('_')
        if (dayNames.includes(dayOfWeek) && dayName === dayOfWeek) {
          // Check if this is the correct occurrence in the month
          if (isDayOfWeekInMonth(day, week, dayOfWeek)) {
            return true
          }
        }
      }
    }
    
    return false
  }
  
  // Custom frequency - check if day of week is in selected_days
  if (habit.frequency === 'custom') {
    if (habit.selected_days && Array.isArray(habit.selected_days)) {
      return habit.selected_days.includes(dayName)
    }
    return false
  }
  
  return false
}

/**
 * Check if a day matches a specific occurrence of a day of week in a month
 * @param day - The date to check
 * @param week - 'first', 'second', 'third', 'fourth', or 'last'
 * @param dayOfWeek - Day name like 'monday', 'tuesday', etc.
 */
function isDayOfWeekInMonth(day: Date, week: string, dayOfWeek: string): boolean {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const targetDayIndex = dayNames.indexOf(dayOfWeek)
  if (targetDayIndex === -1) return false
  
  const year = day.getFullYear()
  const month = day.getMonth()
  
  // Get all occurrences of this day of week in the month
  const occurrences: Date[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Find first occurrence
  let currentDay = new Date(firstDay)
  while (currentDay.getDay() !== targetDayIndex) {
    currentDay.setDate(currentDay.getDate() + 1)
  }
  
  // Collect all occurrences
  while (currentDay <= lastDay) {
    occurrences.push(new Date(currentDay))
    currentDay.setDate(currentDay.getDate() + 7)
  }
  
  if (occurrences.length === 0) return false
  
  // Check if the day matches the requested occurrence
  const dayDateStr = getLocalDateString(day)
  
  if (week === 'last') {
    const lastOccurrence = occurrences[occurrences.length - 1]
    return getLocalDateString(lastOccurrence) === dayDateStr
  } else {
    const weekIndex = week === 'first' ? 0 : week === 'second' ? 1 : week === 'third' ? 2 : week === 'fourth' ? 3 : -1
    if (weekIndex === -1 || weekIndex >= occurrences.length) return false
    const targetOccurrence = occurrences[weekIndex]
    return getLocalDateString(targetOccurrence) === dayDateStr
  }
}

/**
 * Get the start date for habit statistics calculation
 * Uses start_date from database if available, otherwise created_at or the earliest completion date, whichever is earlier
 */
export function getHabitStartDate(habit: any): Date {
  // First check if habit has start_date set (from database)
  if (habit.start_date) {
    const startDate = new Date(habit.start_date)
    startDate.setHours(0, 0, 0, 0)
    return startDate
  }
  
  // Fallback to created_at or earliest completion date
  const createdDate = habit.created_at ? new Date(habit.created_at) : new Date()
  createdDate.setHours(0, 0, 0, 0)
  
  // Find earliest completion date
  let earliestCompletionDate: Date | null = null
  if (habit.habit_completions && typeof habit.habit_completions === 'object') {
    const completionDates = Object.keys(habit.habit_completions)
      .filter(date => habit.habit_completions[date] === true)
      .map(date => new Date(date))
      .filter(date => !isNaN(date.getTime()))
    
    if (completionDates.length > 0) {
      earliestCompletionDate = new Date(Math.min(...completionDates.map(d => d.getTime())))
      earliestCompletionDate.setHours(0, 0, 0, 0)
    }
  }
  
  // Return the earlier of the two dates
  if (earliestCompletionDate && earliestCompletionDate < createdDate) {
    return earliestCompletionDate
  }
  
  return createdDate
}

