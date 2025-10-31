'use client'

import { Goal, Value, DailyStep, Event, DailyPlanning } from '@/lib/cesta-db'
import DailyPlanningTab from './game-tabs/DailyPlanningTab'
import { memo, useState, useEffect } from 'react'
import { getToday } from '@/lib/utils'

interface GameCenterProps {
  goals: Goal[]
  values: Value[]
  dailySteps: DailyStep[]
  events: Event[]
  selectedStep?: DailyStep | null
  selectedEvent?: Event | null
  plannedStepIds?: string[]
  onValueUpdate?: (value: Value) => void
  onGoalUpdate?: (goal: Goal) => void
  onStepUpdate?: (stepId: string, updates: Partial<DailyStep>) => Promise<void>
  onStepDelete?: (stepId: string) => void
  onStepComplete?: (stepId: string) => void
  onStepRemoveFromPlan?: (stepId: string) => void
  onEventComplete?: (eventId: string) => void
  onEventPostpone?: (eventId: string) => void
  onPlannedStepsChange?: (stepIds: string[]) => void
  onStepAdd?: (stepData: Partial<DailyStep>) => Promise<DailyStep>
}

export const GameCenter = memo(function GameCenter({ 
  goals, 
  values, 
  dailySteps, 
  events, 
  selectedStep,
  selectedEvent,
  plannedStepIds,
  onValueUpdate,
  onGoalUpdate,
  onStepUpdate,
  onStepDelete,
  onStepComplete,
  onStepRemoveFromPlan,
  onEventComplete,
  onEventPostpone,
  onPlannedStepsChange,
  onStepAdd
}: GameCenterProps) {
  const [dailyPlanning, setDailyPlanning] = useState<DailyPlanning | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const today = getToday()

  // Load daily planning data
  useEffect(() => {
    const loadDailyPlanning = async () => {
      try {
        const response = await fetch(`/api/cesta/daily-planning?date=${today.toISOString().split('T')[0]}`)
        if (response.ok) {
          const data = await response.json()
          setDailyPlanning(data.planning)
        }
      } catch (error) {
        console.error('Error loading daily planning:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDailyPlanning()
  }, [today])

  const handlePlannedStepsChange = (stepIds: string[]) => {
    onPlannedStepsChange?.(stepIds)
  }

  return (
    <div className="h-full overflow-y-auto">
      <DailyPlanningTab 
        dailySteps={dailySteps}
        events={events}
        goals={goals}
        values={values}
        dailyPlanning={dailyPlanning}
        plannedStepIds={plannedStepIds || dailyPlanning?.planned_steps || []}
        onPlannedStepsChange={handlePlannedStepsChange}
        onStepAdd={onStepAdd}
        onStepUpdate={onStepUpdate}
        onStepDelete={onStepDelete}
        onStepComplete={onStepComplete}
        onStepRemoveFromPlan={onStepRemoveFromPlan}
      />
    </div>
  )
})