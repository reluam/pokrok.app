'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface OnlyTheImportantSettingsProps {
  importantStepsCount: number
  onSave: (settings: { important_steps_count: number }) => void
  onCancel?: () => void
  isSaving?: boolean
}

export function OnlyTheImportantSettings({
  importantStepsCount,
  onSave,
  onCancel,
  isSaving = false
}: OnlyTheImportantSettingsProps) {
  const t = useTranslations()
  const [count, setCount] = useState(importantStepsCount)

  const handleSave = () => {
    onSave({ important_steps_count: count })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-black font-playful mb-1">
          {t('workflows.onlyTheImportant.settings.importantStepsCount')}
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value) || 3)}
          className="w-full p-2 border-2 border-primary-500 rounded-playful-md font-playful bg-white"
        />
        <p className="text-xs text-gray-600 mt-1 font-playful">
          {t('workflows.onlyTheImportant.settings.importantStepsCountDescription')}
        </p>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-playful-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? t('common.loading') : t('common.confirm')}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="btn-playful-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.cancel')}
          </button>
        )}
      </div>
    </div>
  )
}

