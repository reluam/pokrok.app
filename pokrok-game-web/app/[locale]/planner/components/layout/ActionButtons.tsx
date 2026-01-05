'use client'

import { useTranslations } from 'next-intl'

interface ActionButtonsProps {
  selectedItem: any
  selectedItemType: string | null
  currentProgram: string
  loadingSteps: Set<string>
  loadingHabits: Set<string>
  handleStepToggle: (stepId: string, completed: boolean) => void
  handleHabitToggle: (habitId: string) => void
  initializeEditingStep: (step: any) => void
  initializeEditingGoal: (goal: any) => void
  handleDeleteStep: (stepId: string) => Promise<void>
  handleCloseDetail: () => void
}

export function ActionButtons({
  selectedItem,
  selectedItemType,
  currentProgram,
  loadingSteps,
  loadingHabits,
  handleStepToggle,
  handleHabitToggle,
  initializeEditingStep,
  initializeEditingGoal,
  handleDeleteStep,
  handleCloseDetail
}: ActionButtonsProps) {
  const t = useTranslations()

  // If there's a selected item, show edit buttons
  if (selectedItem && selectedItemType) {
    switch (selectedItemType) {
      case 'step':
        return (
          <>
            <button
              onClick={() => handleStepToggle(selectedItem.id, !selectedItem.completed)}
              disabled={loadingSteps.has(selectedItem.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                loadingSteps.has(selectedItem.id)
                  ? 'bg-gray-400 text-white cursor-wait'
                  : selectedItem.completed 
                    ? 'bg-gray-500 text-white hover:bg-gray-600' 
                    : 'bg-orange-600 text-white hover:bg-orange-600'
              }`}
            >
              {loadingSteps.has(selectedItem.id) ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Načítání...</span>
                </>
              ) : (
                selectedItem.completed ? t('details.step.markIncomplete') : t('details.step.markCompleted')
              )}
            </button>
            <button
              onClick={() => {
                initializeEditingStep(selectedItem)
                handleCloseDetail()
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300"
            >
              {t('details.step.edit')}
            </button>
            <button
              onClick={async () => {
                await handleDeleteStep(selectedItem.id)
                // Close detail after deletion (handleDeleteStep already handles the deletion and updates)
                handleCloseDetail()
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all duration-300"
            >
              {t('common.delete')}
            </button>
            <button
              onClick={handleCloseDetail}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300"
            >
              {t('common.back')}
            </button>
          </>
        )
      case 'habit':
        return (
          <>
            <button
              onClick={() => handleHabitToggle(selectedItem.id)}
              disabled={loadingHabits.has(selectedItem.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                loadingHabits.has(selectedItem.id)
                  ? 'bg-gray-400 text-white cursor-wait'
                  : selectedItem.completed_today 
                    ? 'bg-gray-500 text-white hover:bg-gray-600' 
                    : 'bg-orange-600 text-white hover:bg-orange-600'
              }`}
            >
              {loadingHabits.has(selectedItem.id) ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Načítání...</span>
                </>
              ) : (
                selectedItem.completed_today ? 'Označit jako nesplněný' : 'Splnit návyk'
              )}
            </button>
            <button
              onClick={handleCloseDetail}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300"
            >
              {t('common.back')}
            </button>
          </>
        )
      case 'goal':
        return (
          <>
            <button
              onClick={() => {
                initializeEditingGoal(selectedItem)
                handleCloseDetail()
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300"
            >
              {t('details.step.edit')}
            </button>
            <button
              onClick={handleCloseDetail}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300"
            >
              {t('common.back')}
            </button>
          </>
        )
      case 'stat':
        return (
          <>
            <button
              onClick={handleCloseDetail}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300"
            >
              {t('common.back')}
            </button>
          </>
        )
      default:
        return null
    }
  }

  // Show program-specific buttons
  switch (currentProgram) {
    case 'day':
    case 'week':
    case 'month':
      return null // No additional buttons for these programs
    default:
      return null
  }
}

