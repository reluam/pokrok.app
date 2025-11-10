'use client'

import { CalendarProgram } from '../CalendarProgram'

interface WeekViewProps {
  player?: any
  goals?: any[]
  habits?: any[]
  dailySteps?: any[]
  onHabitsUpdate?: (habits: any[]) => void
  onDailyStepsUpdate?: (steps: any[]) => void
  setShowDatePickerModal: (show: boolean) => void
}

export function WeekView({
  player,
  goals = [],
  habits = [],
  dailySteps = [],
  onHabitsUpdate,
  onDailyStepsUpdate,
  setShowDatePickerModal
}: WeekViewProps) {
  return (
    <div className="w-full h-full flex flex-col" style={{ height: '100%', minHeight: 0 }}>
      {/* Calendar Week View - Full width */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <CalendarProgram
          player={player}
          goals={goals}
          habits={habits}
          dailySteps={dailySteps}
          onHabitsUpdate={onHabitsUpdate}
          onDailyStepsUpdate={onDailyStepsUpdate}
          viewMode="week"
          onDateClick={() => setShowDatePickerModal(true)}
        />
      </div>
    </div>
  )
}

