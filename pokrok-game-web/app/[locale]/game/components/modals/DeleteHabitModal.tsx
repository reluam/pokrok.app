'use client'

import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'

interface DeleteHabitModalProps {
  show: boolean
  habitName: string
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteHabitModal({
  show,
  habitName,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteHabitModalProps) {
  const t = useTranslations()

  if (!show || typeof window === 'undefined') return null

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/20" 
        onClick={onClose}
      />
      <div 
        className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-6"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          maxWidth: '90vw'
        }}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t('habits.deleteConfirm', { name: habitName }) || `Opravdu chcete smazat návyk "${habitName}"?`}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {t('habits.deleteConfirmDescription') || 'Tato akce je nevratná.'}
        </p>
        
        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.cancel') || 'Zrušit'}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('common.saving') || 'Mažu...'}
              </>
            ) : (
              t('common.delete') || 'Smazat'
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

