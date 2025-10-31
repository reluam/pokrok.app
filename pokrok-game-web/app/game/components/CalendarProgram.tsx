'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Target, Footprints } from 'lucide-react'

// --- DATUM UTIL ---
function normalizeDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  if (typeof date === 'string') {
    if (date.length >= 10 && date[4] === '-' && date[7] === '-') return date.slice(0, 10);
    date = new Date(date);
  }
  if (date instanceof Date && !isNaN(date.getTime())) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

interface CalendarProgramProps {
  player: any
  goals: any[]
  habits: any[]
  dailySteps: any[]
  onHabitsUpdate?: (habits: any[]) => void
  onDailyStepsUpdate?: (steps: any[]) => void
}

export function CalendarProgram({
  player,
  goals,
  habits,
  dailySteps,
  onHabitsUpdate,
  onDailyStepsUpdate
}: CalendarProgramProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [workflowResponses, setWorkflowResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  // Color helper for compact numbers
  const getStatusColor = (completed: number, total: number) => {
    if (total === 0) return 'text-orange-500'
    if (completed === 0) return 'text-red-500'
    if (completed < total) return 'text-orange-500'
    return 'text-green-600'
  }

  // Helper: is habit scheduled for a specific date
  const isHabitScheduledForDate = (habit: any, date: Date, dateStr: string) => {
    // Always show flag wins
    if (habit.always_show) return true

    // If completed on that date, show regardless of schedule
    try {
      const completions = typeof habit.habit_completions === 'string'
        ? JSON.parse(habit.habit_completions)
        : habit.habit_completions
      if (completions && (completions[dateStr] === true || completions[dateStr] === 'true')) return true
    } catch {}

    // Daily frequency
    if (habit.frequency === 'daily') return true

    // Weekly / selected days handling (accept many formats)
    const jsDay = date.getDay() // 0=Sun..6=Sat
    const enDays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const csDays = ['neděle','pondělí','úterý','středa','čtvrtek','pátek','sobota']
    const csShort = ['ne','po','út','st','čt','pá','so']
    const dayTokens = [
      String(jsDay),                    // '0'..'6'
      String(jsDay === 0 ? 7 : jsDay), // '1'..'7' (Mon=1)
      enDays[jsDay],
      csDays[jsDay],
      csShort[jsDay]
    ].map(s => (typeof s === 'string' ? s.toLowerCase() : s))

    let selectedDays: any = habit.selected_days
    if (typeof selectedDays === 'string') {
      // Try JSON parse first; if fails, split by comma
      try {
        const parsed = JSON.parse(selectedDays)
        selectedDays = parsed
      } catch {
        selectedDays = selectedDays.split(',').map((s: string) => s.trim())
      }
    }
    if (Array.isArray(selectedDays)) {
      const normalized = selectedDays.map(v => (typeof v === 'string' ? v.toLowerCase() : String(v)))
      if (dayTokens.some(t => normalized.includes(t))) return true
    }

    // Specific date lists (selected_dates, dates)
    const specificDates = habit.selected_dates || habit.dates
    if (specificDates) {
      const list = Array.isArray(specificDates) ? specificDates : []
      if (list.includes(dateStr)) return true
    }

    return false
  }

  // Get month/year for display
  const monthYear = currentMonth.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday, adjust to Monday = 0
  const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1

  // Load workflow responses for the month
  useEffect(() => {
    const loadWorkflowResponses = async () => {
      if (!player?.user_id) return
      
      setLoading(true)
      try {
        const startDate = normalizeDate(firstDayOfMonth)
        const endDate = normalizeDate(lastDayOfMonth)
        
        const response = await fetch(`/api/workflows/responses?userId=${player.user_id}&startDate=${startDate}&endDate=${endDate}`)
        if (response.ok) {
          const responses = await response.json()
          const responsesByDate: Record<string, any> = {}
          responses.forEach((r: any) => {
            responsesByDate[r.date] = r
          })
          setWorkflowResponses(responsesByDate)
        }
      } catch (error) {
        console.error('Error loading workflow responses:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadWorkflowResponses()
  }, [player, currentMonth, firstDayOfMonth, lastDayOfMonth])

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
    setSelectedDate(null)
  }

  // Get day stats
  const getDayStats = (date: Date) => {
    const dateStr = normalizeDate(date)
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)
    // Get habits for this day (scheduled or completed that day)
    const dayHabits = habits.filter(h => isHabitScheduledForDate(h, dateObj, dateStr))
    const completedHabits = dayHabits.filter(h => {
      // Handle different formats of habit_completions
      if (!h.habit_completions) return false
      // If it's a string, try to parse it
      if (typeof h.habit_completions === 'string') {
        try {
          const parsed = JSON.parse(h.habit_completions)
          return parsed[dateStr] === true
        } catch {
          return false
        }
      }
      // If it's an object, check directly
      if (typeof h.habit_completions === 'object') {
        return h.habit_completions[dateStr] === true || h.habit_completions[dateStr] === 'true'
      }
      return false
    }).length
    
    // Get steps for this day - show steps that were completed on this date OR are scheduled for this date
    const daySteps = dailySteps.filter(s => {
      const stepDate = normalizeDate(s.date)
      const completedDate = s.completed_at ? normalizeDate(s.completed_at) : null
      // Show if scheduled for this date OR completed on this date
      return stepDate === dateStr || (s.completed && completedDate === dateStr)
    })
    const completedSteps = daySteps.filter(s => {
      // Count as completed if completed and either scheduled for this day or completed on this day
      if (!s.completed) return false
      const completedDate = s.completed_at ? normalizeDate(s.completed_at) : null
      return completedDate === dateStr
    }).length
    
    return {
      totalHabits: dayHabits.length,
      completedHabits,
      totalSteps: daySteps.length,
      completedSteps,
      hasWorkflow: !!workflowResponses[dateStr]
    }
  }

  // Toggle habit completion
  const toggleHabit = async (habitId: string, date: string) => {
    try {
      const response = await fetch('/api/habits/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId,
          date,
          completed: (() => {
            const habit = habits.find(h => h.id === habitId)
            if (!habit?.habit_completions) return false
            const completions = typeof habit.habit_completions === 'string' 
              ? JSON.parse(habit.habit_completions) 
              : habit.habit_completions
            return completions[date] === true || completions[date] === 'true'
          })()
        })
      })
      
      if (response.ok) {
        const updatedHabit = await response.json()
        if (onHabitsUpdate && updatedHabit) {
          // Update the habit with the full updated data including habit_completions
          const updatedHabits = habits.map(h => 
            h.id === habitId ? { ...h, ...updatedHabit, habit_completions: updatedHabit.habit_completions || h.habit_completions } : h
          )
          onHabitsUpdate(updatedHabits)
        }
      }
    } catch (error) {
      console.error('Error toggling habit:', error)
    }
  }

  // Toggle step completion
  const toggleStep = async (stepId: string) => {
    try {
      const step = dailySteps.find(s => s.id === stepId)
      if (!step) return
      
      const newCompletedStatus = !step.completed
      const completedAtValue = newCompletedStatus ? new Date().toISOString() : null
      
      const response = await fetch(`/api/daily-steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          completed: newCompletedStatus,
          completedAt: completedAtValue
        })
      })
      
      if (response.ok) {
        const updatedStep = await response.json()
        if (onDailyStepsUpdate) {
          // Ensure completed_at is properly set
          const stepWithDate = {
            ...updatedStep,
            completed_at: newCompletedStatus ? (updatedStep.completed_at || completedAtValue) : null
          }
          const updatedSteps = dailySteps.map(s => s.id === stepId ? stepWithDate : s)
          onDailyStepsUpdate(updatedSteps)
        }
      }
    } catch (error) {
      console.error('Error toggling step:', error)
    }
  }

  // Get selected day data
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null
    // Vytvoř datum v lokální časové zóně z komponent (vyhne se UTC posunu u 'YYYY-MM-DD')
    const [y, m, d] = selectedDate.split('-').map(n => parseInt(n, 10))
    const date = new Date(y, (m || 1) - 1, d || 1)
    const dateStr = selectedDate
    const dayName = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'][date.getDay()]
    // Get habits (scheduled or completed on this day)
    const dayHabits = habits.filter(h => isHabitScheduledForDate(h, date, dateStr))
    // Get steps - show steps that were completed on this date OR are scheduled for this date
    const daySteps = dailySteps.filter(s => {
      const stepDate = normalizeDate(s.date)
      const completedDate = s.completed_at ? normalizeDate(s.completed_at) : null
      // Show if scheduled for this date OR completed on this date
      return stepDate === dateStr || (s.completed && completedDate === dateStr)
    })
    // Get workflow response
    const workflowResponse = workflowResponses[dateStr]
    return {
      date,
      dateStr,
      dayName,
      habits: dayHabits,
      steps: daySteps,
      workflowResponse
    }
  }, [selectedDate, habits, dailySteps, workflowResponses])

  // Render calendar day
  const renderCalendarDay = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateStr = normalizeDate(date)
    const today = normalizeDate(new Date())
    const isToday = dateStr === today
    const isSelected = selectedDate === dateStr
    const stats = getDayStats(date)
    const isPast = date < new Date() && !isToday
    return (
      <div
        key={day}
        onClick={() => setSelectedDate(dateStr)}
        className={`min-h-[56px] p-1.5 border border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-start select-none ${
          isSelected ? 'ring-2 ring-orange-500 bg-orange-50' : 'bg-white'
        } ${isToday ? 'border-orange-400 border-2' : ''} ${isPast ? 'opacity-90' : ''}`}
      >
        {/* Číslo dne */}
        <div className="flex flex-col items-center">
          <span className={`leading-none ${isToday ? 'text-orange-600' : 'text-gray-800'} font-semibold text-base mb-1`}>{day}</span>
        </div>
        {/* Statistiky kompaktne pod sebou, centrovaně */}
        <div className="flex flex-col items-center space-y-0.5 w-full mt-1">
          <div className="flex items-center gap-1 text-[11px]">
            <CheckCircle className={`w-3.5 h-3.5 ${stats.completedHabits === stats.totalHabits && stats.totalHabits > 0 ? 'text-green-500' : 'text-gray-300'}`} />
            <span className={`${getStatusColor(stats.completedHabits, stats.totalHabits)} font-semibold`}>
              {stats.completedHabits}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <Footprints className={`w-3.5 h-3.5 ${stats.completedSteps === stats.totalSteps && stats.totalSteps > 0 ? 'text-green-500' : 'text-gray-300'}`} />
            <span className={`${getStatusColor(stats.completedSteps, stats.totalSteps)} font-semibold`}>
              {stats.completedSteps}
            </span>
          </div>
          {stats.hasWorkflow && (
            <div className="flex items-center gap-1 text-[10px] text-blue-600 pt-0.5">🌅</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-orange-800">📅 Kalendář</h2>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
          >
            Dnes
          </button>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-semibold text-gray-800 capitalize">{monthYear}</h3>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Responsive layout: 1 column on small screens, 2 columns on xl+ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-6 items-start">
        {/* Calendar Grid */}
        <div>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1.5">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month start */}
            {Array.from({ length: adjustedStartingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[56px]"></div>
            ))}
            
            {/* Days of month */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => renderCalendarDay(day))}
          </div>
        </div>

        {/* Selected Day Detail (sticky on xl+, stacked under on smaller) */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 xl:sticky xl:top-4 xl:max-h-[65vh] overflow-y-auto">
          {selectedDayData ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {selectedDayData.date.toLocaleDateString('cs-CZ', { weekday: 'long' })} {selectedDayData.date.getDate()}. {selectedDayData.date.getMonth() + 1}. {selectedDayData.date.getFullYear()}
                </h3>
              </div>

              {/* Habits */}
              {selectedDayData.habits.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1.5">Návyky</h4>
                  <div className="space-y-1.5">
                    {selectedDayData.habits.map(habit => {
                      // Handle different formats of habit_completions
                      let isCompleted = false
                      if (habit.habit_completions) {
                        if (typeof habit.habit_completions === 'string') {
                          try {
                            const parsed = JSON.parse(habit.habit_completions)
                            isCompleted = parsed[selectedDayData.dateStr] === true
                          } catch {
                            isCompleted = false
                          }
                        } else if (typeof habit.habit_completions === 'object') {
                          isCompleted = habit.habit_completions[selectedDayData.dateStr] === true || 
                                       habit.habit_completions[selectedDayData.dateStr] === 'true'
                        }
                      }
                      return (
                        <div
                          key={habit.id}
                          className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200"
                        >
                          <button
                            onClick={() => toggleHabit(habit.id, selectedDayData.dateStr)}
                            className="flex-shrink-0"
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300" />
                            )}
                          </button>
                          <span className={`flex-1 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {habit.name}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Steps */}
              {selectedDayData.steps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1.5">Kroky</h4>
                  <div className="space-y-1.5">
                    {selectedDayData.steps.map(step => (
                      <div
                        key={step.id}
                        className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200"
                      >
                        <button
                          onClick={() => toggleStep(step.id)}
                          className="flex-shrink-0"
                        >
                          {step.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300" />
                          )}
                        </button>
                        <span className={`flex-1 ${step.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {step.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workflow Response */}
              {selectedDayData.workflowResponse && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1.5">🌅 Pohled za dnem</h4>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2.5">
                    {selectedDayData.workflowResponse.responses?.whatWentWell && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Co se povedlo:</p>
                        <p className="text-sm text-gray-600">{selectedDayData.workflowResponse.responses.whatWentWell}</p>
                      </div>
                    )}
                    {selectedDayData.workflowResponse.responses?.whatWentWrong && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Co se nepovedlo:</p>
                        <p className="text-sm text-gray-600">{selectedDayData.workflowResponse.responses.whatWentWrong}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedDayData.habits.length === 0 && selectedDayData.steps.length === 0 && !selectedDayData.workflowResponse && (
                <div className="text-center text-gray-500 py-8">
                  Pro tento den nejsou žádná data
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Klikněte na den v kalendáři pro zobrazení detailu
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

