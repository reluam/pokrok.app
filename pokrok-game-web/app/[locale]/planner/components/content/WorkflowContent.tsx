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
  // Wrapper for handleHabitToggle to match expected signature
  const handleHabitToggleWrapper = async (habitId: string, date?: string): Promise<void> => {
    props.handleHabitToggle(habitId)
  }

  // Wrapper for handleStepToggle to match expected signature
  const handleStepToggleWrapper = async (stepId: string, completed: boolean): Promise<void> => {
    props.handleStepToggle(stepId, completed)
  }

  // Wrapper for onStepDateChange to match expected signature
  const onStepDateChangeWrapper = async (stepId: string, newDate: string): Promise<void> => {
    props.onStepDateChange(stepId, new Date(newDate))
  }

  // Wrapper for onStepTimeChange to match expected signature
  const onStepTimeChangeWrapper = async (stepId: string, minutes: number): Promise<void> => {
    props.onStepTimeChange(stepId, String(minutes))
  }

  // Wrapper for handleGoalProgressUpdate to match expected signature
  const handleGoalProgressUpdateWrapper = async (goalId: string, progress: number): Promise<void> => {
    props.handleGoalProgressUpdate(goalId, progress)
  }

  if (!props.pendingWorkflow || props.pendingWorkflow.type !== 'daily_review') {
    return (
      <UnifiedDayView
        player={props.player}
        goals={props.goals}
        habits={props.habits}
        dailySteps={props.dailySteps}
        handleItemClick={props.handleItemClick}
        handleHabitToggle={handleHabitToggleWrapper}
        handleStepToggle={handleStepToggleWrapper}
        loadingHabits={props.loadingHabits}
        loadingSteps={props.loadingSteps}
        onOpenStepModal={props.onOpenStepModal}
        onNavigateToHabits={props.onNavigateToHabits}
        onNavigateToSteps={props.onNavigateToSteps}
        onStepDateChange={onStepDateChangeWrapper}
        onStepTimeChange={onStepTimeChangeWrapper}
      />
    )
  }

  return (
    <DailyReviewWorkflow
      workflow={props.pendingWorkflow}
      player={props.player}
      onComplete={props.handleWorkflowComplete}
      onSkip={props.handleWorkflowSkip}
    />
  )
}

