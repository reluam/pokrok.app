'use client'

import { CalendarProgram } from '../CalendarProgram'

interface CalendarContentProps {
  player: any
  goals: any[]
  habits: any[]
  dailySteps: any[]
  onHabitsUpdate: (habits: any[]) => void
  onDailyStepsUpdate: (steps: any[]) => void
}

export function CalendarContent(props: CalendarContentProps) {
  return (
    <CalendarProgram
      player={props.player}
      goals={props.goals}
      habits={props.habits}
      dailySteps={props.dailySteps}
      onHabitsUpdate={props.onHabitsUpdate}
      onDailyStepsUpdate={props.onDailyStepsUpdate}
    />
  )
}

