'use client'

import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'

interface DeleteStepModalProps {
  show: boolean
  stepTitle: string
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteStepModal({
  show,
  stepTitle,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteStepModalProps) {
  const t = useTranslations()

  if (!show || typeof window === 'undefined') return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-sm w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {t('steps.deleteConfirmTitle') || 'Smazat krok'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isDeleting}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-700 mb-6">
              {t('steps.deleteConfirmText', { stepTitle }) || `Opravdu chcete smazat krok "${stepTitle}"? Tato akce je nevratná.`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isDeleting}
              >
                {t('common.cancel') || 'Zrušit'}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${
                  isDeleting
                    ? 'bg-red-300 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={isDeleting}
              >
                {isDeleting ? (t('common.deleting') || 'Mažu...') : (t('common.delete') || 'Smazat')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

