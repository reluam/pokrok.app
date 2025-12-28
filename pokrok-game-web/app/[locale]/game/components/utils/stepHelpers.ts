// Helper functions for step scheduling and calculations

import { getLocalDateString } from './dateHelpers'

/**
 * Check if a step is scheduled for a specific day
 * Supports daily, weekly, monthly frequencies (same as habits)
 */
export function isStepScheduledForDay(step: any, day: Date): boolean {
  // If step has a specific date and it matches, show it
  if (step.date) {
    const stepDateStr = getLocalDateString(new Date(step.date))
    const dayStr = getLocalDateString(day)
    if (stepDateStr === dayStr) {
      return true
    }
  }
  
  // If step doesn't have frequency, it's not a repeating step
  if (!step.frequency || step.frequency === null) {
    return false
  }
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[day.getDay()]
  const dayOfMonth = day.getDate()
  
  // Daily frequency
  if (step.frequency === 'daily') return true
  
  // Weekly frequency - check if day of week is in selected_days
  if (step.frequency === 'weekly') {
    if (step.selected_days && Array.isArray(step.selected_days)) {
      return step.selected_days.includes(dayName)
    }
    return false
  }
  
  // Monthly frequency - check day of month
  if (step.frequency === 'monthly') {
    if (!step.selected_days || !Array.isArray(step.selected_days)) {
      return false
    }
    
    // Check for day of month (1-31)
    const dayToCheck = dayOfMonth.toString()
    if (step.selected_days.includes(dayToCheck)) {
      return true
    }
    
    // Auto-adjust: if day 31 is selected and current month has 30 days, check day 30
    if (dayOfMonth === 30 && step.selected_days.includes('31')) {
      const daysInMonth = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate()
      if (daysInMonth === 30) {
        return true
      }
    }
    
    return false
  }
  
  return false
}

/**
 * Check if a repeating step is completed for a specific date
 * For repeating steps, we need to check step completions by date
 */
export function isRepeatingStepCompletedForDate(step: any, date: Date): boolean {
  if (!step.frequency || step.frequency === null) {
    return false
  }
  
  // Check if step has completions stored (similar to habits)
  // This would need to be implemented in the database/API
  // For now, we'll assume steps don't have date-based completions
  // and we'll need to track them differently
  
  // TODO: Implement step completions tracking by date for repeating steps
  return false
}

/**
 * Get the next occurrence date for a repeating step
 * Returns the first date from startDate onwards where the step is scheduled and not completed
 */
export function getNextOccurrenceDate(step: any, startDate: Date, completedDates: Set<string> = new Set()): Date | null {
  if (!step.frequency || step.frequency === null) {
    return null
  }
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  let currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0)
  
  // Search up to 365 days ahead
  for (let i = 0; i < 365; i++) {
    const dateStr = getLocalDateString(currentDate)
    
    // Check if step is scheduled for this day
    if (isStepScheduledForDay(step, currentDate)) {
      // Check if not completed for this date
      if (!completedDates.has(dateStr)) {
        return currentDate
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return null
}

/**
 * Get all upcoming occurrences of a repeating step
 * Returns array of dates where the step is scheduled, up to maxOccurrences
 */
export function getUpcomingOccurrences(step: any, startDate: Date, maxOccurrences: number = 5, completedDates: Set<string> = new Set()): Date[] {
  if (!step.frequency || step.frequency === null) {
    return []
  }
  
  const occurrences: Date[] = []
  let currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0)
  
  // Search up to 365 days ahead
  for (let i = 0; i < 365 && occurrences.length < maxOccurrences; i++) {
    const dateStr = getLocalDateString(currentDate)
    
    // Check if step is scheduled for this day
    if (isStepScheduledForDay(step, currentDate)) {
      // Check if not completed for this date
      if (!completedDates.has(dateStr)) {
        occurrences.push(new Date(currentDate))
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return occurrences
}

