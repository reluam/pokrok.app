'use client'

import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { X, Trash2 } from 'lucide-react'
import { PlayfulButton } from '@/components/design-system/Button/PlayfulButton'

interface MetricModalProps {
  show: boolean
  metricModalData: any
  onClose: () => void
  onSave: () => Promise<void>
  onDelete?: () => Promise<void>
  isSaving: boolean
  // Editing state
  editingMetricName: string
  setEditingMetricName: (name: string) => void
  editingMetricCurrentValue: number
  setEditingMetricCurrentValue: (value: number) => void
  editingMetricTargetValue: number
  setEditingMetricTargetValue: (value: number) => void
  editingMetricInitialValue: number
  setEditingMetricInitialValue: (value: number) => void
  editingMetricIncrementalValue: number
  setEditingMetricIncrementalValue: (value: number) => void
  editingMetricUnit: string
  setEditingMetricUnit: (unit: string) => void
}

export function MetricModal({
  show,
  metricModalData,
  onClose,
  onSave,
  onDelete,
  isSaving,
  editingMetricName,
  setEditingMetricName,
  editingMetricCurrentValue,
  setEditingMetricCurrentValue,
  editingMetricTargetValue,
  setEditingMetricTargetValue,
  editingMetricInitialValue,
  setEditingMetricInitialValue,
  editingMetricIncrementalValue,
  setEditingMetricIncrementalValue,
  editingMetricUnit,
  setEditingMetricUnit,
}: MetricModalProps) {
  const t = useTranslations()

  if (!show || typeof window === 'undefined') return null

  const defaultMetricData = {
    id: null,
    name: '',
    targetValue: 0,
    incrementalValue: 1,
    unit: '',
  }

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="box-playful-highlight bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b-2 border-primary-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-black font-playful">
                {metricModalData.id ? t('common.metrics.edit') : t('common.metrics.create')}
              </h2>
              <button
                onClick={onClose}
                className="btn-playful-base p-1.5 w-8 h-8 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-2 font-playful">
                  {t('common.metrics.name')} <span className="text-primary-600">*</span>
                </label>
                <input
                  type="text"
                  value={editingMetricName}
                  onChange={(e) => setEditingMetricName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                  placeholder={t('common.metrics.namePlaceholder')}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 font-playful">
                    {t('common.metrics.initialValue')} <span className="text-primary-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingMetricInitialValue}
                    onChange={(e) => setEditingMetricInitialValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 font-playful">
                    {t('common.metrics.targetValue')} <span className="text-primary-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingMetricTargetValue}
                    onChange={(e) => setEditingMetricTargetValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 font-playful">
                    {t('common.metrics.incrementalValue')} <span className="text-primary-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingMetricIncrementalValue}
                    onChange={(e) => setEditingMetricIncrementalValue(parseFloat(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 font-playful">
                    {t('common.metrics.currentValue')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingMetricCurrentValue}
                    onChange={(e) => setEditingMetricCurrentValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2 font-playful">
                  {t('common.metrics.unit')} <span className="text-primary-600">*</span>
                </label>
                <input
                  type="text"
                  value={editingMetricUnit}
                  onChange={(e) => setEditingMetricUnit(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                  placeholder={t('common.metrics.unitPlaceholder')}
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t-2 border-primary-500 flex items-center justify-between">
            <div>
              {metricModalData.id && onDelete && (
                <PlayfulButton
                  variant="danger"
                  onClick={onDelete}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete')}
                </PlayfulButton>
              )}
            </div>
            <div className="flex items-center gap-3">
              <PlayfulButton
                variant="secondary"
                onClick={onClose}
                disabled={isSaving}
              >
                {t('common.cancel')}
              </PlayfulButton>
              <PlayfulButton
                variant="primary"
                onClick={onSave}
                disabled={isSaving || !editingMetricName || !editingMetricUnit || editingMetricTargetValue < 0}
              >
                {isSaving ? t('common.saving') : t('common.save')}
              </PlayfulButton>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

