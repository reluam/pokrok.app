'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { X, Trash2 } from 'lucide-react'
import { PlayfulButton } from '@/components/design-system/Button/PlayfulButton'
import { getUnitsByType, type MetricType, CURRENCIES, getDefaultCurrencyByLocale } from '@/lib/metric-units'

// Helper function to format number with thousands separator
function formatNumberWithSpaces(value: number | string): string {
  if (value === '' || value === null || value === undefined) return ''
  const numStr = typeof value === 'string' ? value.replace(/\s/g, '') : value.toString()
  if (numStr === '' || numStr === '-') return numStr
  const parts = numStr.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return parts.join('.')
}

// Helper function to parse formatted number
function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/\s/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

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
  editingMetricType: MetricType
  setEditingMetricType: (type: MetricType) => void
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
  userSettings?: {
    default_currency?: string
    weight_unit_preference?: 'kg' | 'lbs'
  }
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
  editingMetricType,
  setEditingMetricType,
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
  userSettings,
}: MetricModalProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // Track which fields have been focused to clear on first focus
  const [focusedFields, setFocusedFields] = useState<Set<string>>(new Set())
  
  // Helper to handle first focus - clear if value is 0
  const handleFirstFocus = (fieldName: string, currentValue: number, setter: (value: number) => void) => {
    if (!focusedFields.has(fieldName) && currentValue === 0) {
      setFocusedFields(prev => new Set(prev).add(fieldName))
      setter(0) // Clear the field
    }
  }

  // Get available units based on selected type
  const availableUnits = getUnitsByType(
    editingMetricType,
    userSettings?.weight_unit_preference || 'kg'
  )

  // Reset focused fields when modal opens/closes
  useEffect(() => {
    if (!show) {
      setFocusedFields(new Set())
    }
  }, [show])

  // When type changes, set default unit if current unit is not available for new type
  useEffect(() => {
    if (!show) return // Early return inside useEffect is OK
    
    if (editingMetricType === 'currency' && !editingMetricUnit) {
      const defaultCurrency = userSettings?.default_currency || getDefaultCurrencyByLocale(localeCode)
      setEditingMetricUnit(defaultCurrency)
    } else if (editingMetricType === 'weight' && !editingMetricUnit) {
      setEditingMetricUnit(userSettings?.weight_unit_preference || 'kg')
    } else if (editingMetricType === 'number') {
      // For number type, allow empty unit (none) - don't auto-set if empty
      // Only check if current unit exists in available units
      if (editingMetricUnit && availableUnits.length > 0) {
        const unitExists = availableUnits.some(u => u.value === editingMetricUnit)
        if (!unitExists) {
          // If current unit doesn't exist, set to empty (none)
          setEditingMetricUnit('')
        }
      }
    } else if (editingMetricType !== 'custom' && availableUnits.length > 0) {
      // Check if current unit is available for this type
      const unitExists = availableUnits.some(u => u.value === editingMetricUnit)
      if (!unitExists && availableUnits.length > 0) {
        // Set first available unit as default
        setEditingMetricUnit(availableUnits[0].value)
      }
    }
  }, [editingMetricType, availableUnits, editingMetricUnit, userSettings, localeCode, setEditingMetricUnit, show])

  if (!show || typeof window === 'undefined') return null

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
                    {t('common.metrics.type')} <span className="text-primary-600">*</span>
                  </label>
                  <select
                    value={editingMetricType}
                    onChange={(e) => setEditingMetricType(e.target.value as MetricType)}
                    className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                  >
                    <option value="number">{t('common.metrics.types.number') || 'Number'}</option>
                    <option value="currency">{t('common.metrics.types.currency') || 'Currency'}</option>
                    <option value="distance">{t('common.metrics.types.distance') || 'Distance'}</option>
                    <option value="weight">{t('common.metrics.types.weight') || 'Weight'}</option>
                    <option value="time">{t('common.metrics.types.time') || 'Time'}</option>
                    <option value="percentage">{t('common.metrics.types.percentage') || 'Percentage'}</option>
                    <option value="custom">{t('common.metrics.types.custom') || 'Custom'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 font-playful">
                    {t('common.metrics.unit')} <span className="text-primary-600">*</span>
                  </label>
                  {editingMetricType === 'custom' ? (
                    <input
                      type="text"
                      value={editingMetricUnit}
                      onChange={(e) => setEditingMetricUnit(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                      placeholder={t('common.metrics.unitPlaceholder')}
                    />
                  ) : (
                    <select
                      value={editingMetricUnit || ''}
                      onChange={(e) => setEditingMetricUnit(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                    >
                      {editingMetricType === 'number' ? (
                        <>
                          <option value="">(none)</option>
                          {availableUnits.filter(unit => unit.value !== '').map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </>
                      ) : (
                        <>
                          <option value="">{t('common.metrics.selectUnit') || 'Select unit...'}</option>
                          {availableUnits.filter(unit => unit.value !== '').map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 font-playful">
                    {t('common.metrics.initialValue')} <span className="text-primary-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={focusedFields.has('initialValue') && editingMetricInitialValue === 0 ? '' : formatNumberWithSpaces(editingMetricInitialValue)}
                      onFocus={() => handleFirstFocus('initialValue', editingMetricInitialValue, setEditingMetricInitialValue)}
                      onChange={(e) => {
                        const parsed = parseFormattedNumber(e.target.value)
                        setEditingMetricInitialValue(parsed)
                      }}
                      onBlur={(e) => {
                        const parsed = parseFormattedNumber(e.target.value)
                        setEditingMetricInitialValue(parsed)
                      }}
                      className="w-full px-4 py-2.5 pr-16 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                      placeholder="0"
                    />
                    {editingMetricUnit && editingMetricUnit !== '' && editingMetricUnit.trim() !== '' && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 font-playful pointer-events-none">
                        {editingMetricUnit}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 font-playful">
                    {t('common.metrics.targetValue')} <span className="text-primary-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={focusedFields.has('targetValue') && editingMetricTargetValue === 0 ? '' : formatNumberWithSpaces(editingMetricTargetValue)}
                      onFocus={() => handleFirstFocus('targetValue', editingMetricTargetValue, setEditingMetricTargetValue)}
                      onChange={(e) => {
                        const parsed = parseFormattedNumber(e.target.value)
                        setEditingMetricTargetValue(parsed)
                      }}
                      onBlur={(e) => {
                        const parsed = parseFormattedNumber(e.target.value)
                        setEditingMetricTargetValue(parsed)
                      }}
                      className="w-full px-4 py-2.5 pr-16 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                      placeholder="0"
                    />
                    {editingMetricUnit && editingMetricUnit !== '' && editingMetricUnit.trim() !== '' && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 font-playful pointer-events-none">
                        {editingMetricUnit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2 font-playful">
                  {t('common.metrics.currentValue')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={focusedFields.has('currentValue') && editingMetricCurrentValue === 0 ? '' : formatNumberWithSpaces(editingMetricCurrentValue)}
                    onFocus={() => handleFirstFocus('currentValue', editingMetricCurrentValue, setEditingMetricCurrentValue)}
                    onChange={(e) => {
                      const parsed = parseFormattedNumber(e.target.value)
                      setEditingMetricCurrentValue(parsed)
                    }}
                    onBlur={(e) => {
                      const parsed = parseFormattedNumber(e.target.value)
                      setEditingMetricCurrentValue(parsed)
                    }}
                    className="w-full px-4 py-2.5 pr-16 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                    placeholder="0"
                  />
                  {editingMetricUnit && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 font-playful pointer-events-none">
                      {editingMetricUnit}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t-2 border-primary-500 flex items-center justify-between">
            <div>
              {metricModalData.id && onDelete && (
                <button
                  onClick={onDelete}
                  disabled={isSaving}
                  className="btn-playful-outline flex items-center gap-2 text-red-600 border-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete')}
                </button>
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
                disabled={isSaving || !editingMetricName || (editingMetricType !== 'number' && !editingMetricUnit) || editingMetricTargetValue < 0}
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

