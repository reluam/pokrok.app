'use client'

import { UnifiedDayView } from '../views/UnifiedDayView'
import { DailyReviewWorkflow } from '../DailyReviewWorkflow'

interface WorkflowContentProps {
  pendingWorkflow: any
  player: any
  goals: any[]
  habits: any[]
  dailySteps: any[]
  handleItemClick: (item: any, type: string) => void
  handleHabitToggle: (habitId: string) => void
  handleStepToggle: (stepId: string, completed: boolean) => void
  loadingHabits: Set<string>
  loadingSteps: Set<string>
  onOpenStepModal: () => void
  onNavigateToHabits: () => void
  onNavigateToSteps: () => void
  onStepDateChange: (stepId: string, date: Date) => void
  onStepTimeChange: (stepId: string, time: string) => void
  handleWorkflowComplete: () => void
  handleWorkflowSkip: () => void
  handleGoalProgressUpdate: (goalId: string, progress: number) => void
}

export function WorkflowContent(props: WorkflowContentProps) {
  if (!props.pendingWorkflow || props.pendingWorkflow.type !== 'daily_review') {
    return (
      <UnifiedDayView
        player={props.player}
        goals={props.goals}
        habits={props.habits}
        dailySteps={props.dailySteps}
        handleItemClick={props.handleItemClick}
        handleHabitToggle={props.handleHabitToggle}
        handleStepToggle={props.handleStepToggle}
        loadingHabits={props.loadingHabits}
        loadingSteps={props.loadingSteps}
        onOpenStepModal={props.onOpenStepModal}
        onNavigateToHabits={props.onNavigateToHabits}
        onNavigateToSteps={props.onNavigateToSteps}
        onStepDateChange={props.onStepDateChange}
        onStepTimeChange={props.onStepTimeChange}
      />
    )
  }

  return (
    <DailyReviewWorkflow
      workflow={props.pendingWorkflow}
      goals={props.goals}
      player={props.player}
      onComplete={props.handleWorkflowComplete}
      onSkip={props.handleWorkflowSkip}
      onGoalProgressUpdate={props.handleGoalProgressUpdate}
    />
  )
}

