'use client'

import { ItemDetailRenderer } from '../details/ItemDetailRenderer'
import { UnifiedDayView } from '../views/UnifiedDayView'
import { getLocalDateString } from '../utils/dateHelpers'

interface DisplayContentProps {
  selectedItem: any
  selectedItemType: 'step' | 'habit' | 'goal' | 'stat' | null
  editingStepTitle: boolean
  setEditingStepTitle: (value: boolean) => void
  stepTitle: string
  setStepTitle: (value: string) => void
  stepDescription: string
  setStepDescription: (value: string) => void
  showTimeEditor: boolean
  setShowTimeEditor: (value: boolean) => void
  stepEstimatedTime: number
  setStepEstimatedTime: (value: number) => void
  showDatePicker: boolean
  setShowDatePicker: (value: boolean) => void
  selectedDate: Date | null
  setSelectedDate: (value: Date | null) => void
  stepIsImportant: boolean
  setStepIsImportant: (value: boolean) => void
  stepIsUrgent: boolean
  setStepIsUrgent: (value: boolean) => void
  showStepGoalPicker: boolean
  setShowStepGoalPicker: (value: boolean) => void
  stepGoalId: string | null
  setStepGoalId: (value: string | null) => void
  habitDetailTab: string
  setHabitDetailTab: (value: string) => void
  currentMonth: Date
  setCurrentMonth: (value: Date) => void
  editingHabitName: string
  setEditingHabitName: (value: string) => void
  editingHabitDescription: string
  setEditingHabitDescription: (value: string) => void
  editingHabitFrequency: string
  setEditingHabitFrequency: (value: string) => void
  editingHabitSelectedDays: string[]
  setEditingHabitSelectedDays: (value: string[]) => void
  editingHabitAlwaysShow: boolean
  setEditingHabitAlwaysShow: (value: boolean) => void
  editingHabitXpReward: number
  setEditingHabitXpReward: (value: number) => void
  editingHabitCategory: string
  setEditingHabitCategory: (value: string) => void
  editingHabitDifficulty: string
  setEditingHabitDifficulty: (value: string) => void
  editingHabitReminderTime: string
  setEditingHabitReminderTime: (value: string) => void
  handleCloseDetail: () => void
  handleToggleStepCompleted: (stepId: string, completed: boolean) => void
  handleSaveStep: () => void
  handleRescheduleStep: (stepId: string, newDate: Date) => void
  handleHabitCalendarToggle: (habitId: string, date: string) => void
  handleUpdateGoalForDetail: (goalId: string, updates: any) => void
  handleDeleteGoalForDetail: (goalId: string) => void
  goals: any[]
  habits: any[]
  player: any
  userId: string | null
  setSelectedItem: (item: any) => void
  onHabitsUpdate: (habits: any[]) => void
  stepsCacheRef: React.RefObject<any>
  setStepsCacheVersion: (value: number) => void
  completedSteps: number
  activeHabits: number
  completedGoals: number
  progressPercentage: number
  dailySteps: any[]
  handleItemClick: (item: any, type: string) => void
  handleHabitToggle: (habitId: string) => void
  handleStepToggle: (stepId: string, completed: boolean) => void
  loadingHabits: Set<string>
  loadingSteps: Set<string>
  animatingSteps: Set<string>
  onOpenStepModal: () => void
  onNavigateToHabits: () => void
  onNavigateToSteps: () => void
  onStepDateChange: (stepId: string, date: Date) => void
  onStepTimeChange: (stepId: string, time: string) => void
}

export function DisplayContent(props: DisplayContentProps) {
  // If there's a selected item, show its detail for editing
  if (props.selectedItem && props.selectedItemType) {
    return (
      <ItemDetailRenderer
        item={props.selectedItem}
        type={props.selectedItemType}
        editingStepTitle={props.editingStepTitle}
        setEditingStepTitle={props.setEditingStepTitle}
        stepTitle={props.stepTitle}
        setStepTitle={props.setStepTitle}
        stepDescription={props.stepDescription}
        setStepDescription={props.setStepDescription}
        showTimeEditor={props.showTimeEditor}
        setShowTimeEditor={props.setShowTimeEditor}
        stepEstimatedTime={props.stepEstimatedTime}
        setStepEstimatedTime={props.setStepEstimatedTime}
        showDatePicker={props.showDatePicker}
        setShowDatePicker={props.setShowDatePicker}
        selectedDate={props.selectedDate ? getLocalDateString(props.selectedDate) : ''}
        setSelectedDate={(value: string) => props.setSelectedDate(value ? new Date(value) : null)}
        stepIsImportant={props.stepIsImportant}
        setStepIsImportant={props.setStepIsImportant}
        stepIsUrgent={props.stepIsUrgent}
        setStepIsUrgent={props.setStepIsUrgent}
        showStepGoalPicker={props.showStepGoalPicker}
        setShowStepGoalPicker={props.setShowStepGoalPicker}
        stepGoalId={props.stepGoalId}
        setStepGoalId={props.setStepGoalId}
        habitDetailTab={props.habitDetailTab}
        setHabitDetailTab={props.setHabitDetailTab}
        currentMonth={props.currentMonth}
        setCurrentMonth={props.setCurrentMonth}
        editingHabitName={props.editingHabitName}
        setEditingHabitName={props.setEditingHabitName}
        editingHabitDescription={props.editingHabitDescription}
        setEditingHabitDescription={props.setEditingHabitDescription}
        editingHabitFrequency={props.editingHabitFrequency}
        setEditingHabitFrequency={props.setEditingHabitFrequency}
        editingHabitSelectedDays={props.editingHabitSelectedDays}
        setEditingHabitSelectedDays={props.setEditingHabitSelectedDays}
        editingHabitAlwaysShow={props.editingHabitAlwaysShow}
        setEditingHabitAlwaysShow={props.setEditingHabitAlwaysShow}
        editingHabitXpReward={props.editingHabitXpReward}
        setEditingHabitXpReward={props.setEditingHabitXpReward}
        editingHabitCategory={props.editingHabitCategory}
        setEditingHabitCategory={props.setEditingHabitCategory}
        editingHabitDifficulty={props.editingHabitDifficulty}
        setEditingHabitDifficulty={props.setEditingHabitDifficulty}
        editingHabitReminderTime={props.editingHabitReminderTime}
        setEditingHabitReminderTime={props.setEditingHabitReminderTime}
        handleCloseDetail={props.handleCloseDetail}
        handleToggleStepCompleted={props.handleToggleStepCompleted}
        handleSaveStep={props.handleSaveStep}
        handleRescheduleStep={props.handleRescheduleStep}
        handleHabitCalendarToggle={props.handleHabitCalendarToggle}
        handleUpdateGoalForDetail={props.handleUpdateGoalForDetail}
        handleDeleteGoalForDetail={props.handleDeleteGoalForDetail}
        goals={props.goals}
        habits={props.habits}
        player={props.player}
        userId={props.userId}
        selectedItem={props.selectedItem}
        setSelectedItem={props.setSelectedItem}
        onHabitsUpdate={props.onHabitsUpdate}
        stepsCacheRef={props.stepsCacheRef}
        setStepsCacheVersion={props.setStepsCacheVersion}
        completedSteps={props.completedSteps}
        activeHabits={props.activeHabits}
        completedGoals={props.completedGoals}
        progressPercentage={props.progressPercentage}
      />
    )
  }

  // Show unified day view
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
      animatingSteps={props.animatingSteps}
      onOpenStepModal={props.onOpenStepModal}
      onNavigateToHabits={props.onNavigateToHabits}
      onNavigateToSteps={props.onNavigateToSteps}
      onStepDateChange={props.onStepDateChange}
      onStepTimeChange={props.onStepTimeChange}
    />
  )
}

