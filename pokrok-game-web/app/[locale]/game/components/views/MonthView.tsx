'use client'

import { CalendarProgram } from '../CalendarProgram'

interface MonthViewProps {
  player?: any
  goals?: any[]
  habits?: any[]
  dailySteps?: any[]
  onHabitsUpdate?: (habits: any[]) => void
  onDailyStepsUpdate?: (steps: any[]) => void
  setShowDatePickerModal: (show: boolean) => void
}

export function MonthView({
  player,
  goals = [],
  habits = [],
  dailySteps = [],
  onHabitsUpdate,
  onDailyStepsUpdate,
  setShowDatePickerModal
}: MonthViewProps) {
  return (
    <div 
      className="w-full h-full flex flex-col"
      style={{ 
        height: '100%', 
        maxHeight: '100%', 
        overflow: 'hidden'
      }}
    >
      {/* Calendar Month View - Full width with detail view below */}
      <div 
        className="flex-1 min-h-0"
        style={{ 
          overflow: 'hidden'
        }}
      >
        <CalendarProgram
          player={player}
          goals={goals}
          habits={habits}
          dailySteps={dailySteps}
          onHabitsUpdate={onHabitsUpdate}
          onDailyStepsUpdate={onDailyStepsUpdate}
          viewMode="month"
          onDateClick={() => setShowDatePickerModal(true)}
        />
      </div>
    </div>
  )
}

