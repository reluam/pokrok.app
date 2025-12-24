'use client'

import { useDroppable, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface DailyStep {
  id: string
  title: string
  description?: string
  date: string
  completed: boolean
  goal_id?: string
  planning_id?: string
  order_index?: number
}

interface ImportantStepColumnProps {
  id: string
  title: string
  steps: DailyStep[]
  category: 'important' | 'other' | 'backlog'
  maxCount?: number
  onDeleteStep: (stepId: string) => void
  allStepIds: string[]
  availableSteps?: DailyStep[]
  onAddStep?: () => void
}

function DraggableStepItem({ 
  step, 
  category, 
  onDelete 
}: { 
  step: DailyStep
  category: 'important' | 'other' | 'backlog'
  onDelete: (stepId: string) => void
}) {
  const t = useTranslations()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: step.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 bg-white rounded-playful-md border-2 cursor-move transition-all shadow-sm ${
        category === 'important'
          ? 'border-primary-400 bg-primary-50/50 hover:border-primary-500 hover:bg-primary-50 hover:shadow-md'
          : category === 'other'
          ? 'border-primary-300 bg-white hover:border-primary-400 hover:bg-primary-50/50 hover:shadow-md'
          : 'border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-black font-playful text-sm mb-1 truncate">
            {step.title}
          </h4>
          {step.description && (
            <p className="text-xs text-gray-600 font-playful line-clamp-2">
              {step.description}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(step.id)
          }}
          className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-playful-sm transition-colors"
          title={t('common.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function ImportantStepColumn({
  id,
  title,
  steps,
  category,
  maxCount,
  onDeleteStep,
  allStepIds,
  availableSteps = [],
  onAddStep
}: ImportantStepColumnProps) {
  const t = useTranslations()
  
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  const stepIds = steps.map(s => s.id)
  const allIdsInColumn = [...stepIds, ...(availableSteps || []).map(s => s.id)]

  return (
    <div className={`h-full flex flex-col box-playful-highlight border-2 rounded-playful-md overflow-hidden ${
        category === 'important'
          ? 'border-primary-500 bg-white'
          : category === 'other'
          ? 'border-primary-400 bg-white'
          : 'border-gray-400 bg-white'
      }`}>
      {/* Header */}
      <div className={`p-4 border-b-2 flex items-center justify-between flex-shrink-0 ${
        category === 'important'
          ? 'bg-primary-500 border-primary-500'
          : category === 'other'
          ? 'bg-primary-400 border-primary-400'
          : 'bg-gray-500 border-gray-500'
      }`}>
        <h3 className="font-bold text-white font-playful text-base">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {maxCount && (
            <span className="text-sm font-bold text-white font-playful bg-white/25 px-3 py-1 rounded-playful-sm">
              {steps.length}/{maxCount}
            </span>
          )}
          {onAddStep && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddStep()
              }}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-playful-sm transition-colors"
              title={t('workflows.onlyTheImportant.planning.addNewStep')}
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-4 space-y-3 ${
          isOver
            ? category === 'important'
              ? 'bg-primary-50'
              : category === 'other'
              ? 'bg-primary-50'
              : 'bg-gray-50'
            : 'bg-white'
        } transition-colors`}
      >
        {steps.map((step) => (
          <DraggableStepItem
            key={step.id}
            step={step}
            category={category}
            onDelete={onDeleteStep}
          />
        ))}

        {/* Show available steps in backlog */}
        {category === 'backlog' && availableSteps.length > 0 && (
          <div className="mt-6 pt-6 border-t-2 border-gray-300">
            <p className="text-sm font-bold text-gray-700 font-playful mb-3">
              {t('workflows.onlyTheImportant.planning.availableSteps')}
            </p>
            <div className="space-y-2">
              {availableSteps.map((step) => (
                <DraggableStepItem
                  key={step.id}
                  step={step}
                  category="backlog"
                  onDelete={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {steps.length === 0 && category !== 'backlog' && (
          <div className="text-center py-12 text-gray-400 font-playful text-sm">
            <p>{t('workflows.onlyTheImportant.planning.emptyColumn')}</p>
          </div>
        )}

        {maxCount && steps.length >= maxCount && (
          <div className="text-sm font-bold text-red-600 font-playful mt-3 text-center bg-red-50 border-2 border-red-300 rounded-playful-sm p-2.5">
            {t('workflows.onlyTheImportant.planning.maxSteps', { count: maxCount })}
          </div>
        )}
      </div>
    </div>
  )
}

