'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { getIconComponent, AVAILABLE_ICONS } from '@/lib/icon-utils'

interface AreaEditModalProps {
  show: boolean
  onClose: () => void
  editingArea: any | null
  areaModalName: string
  setAreaModalName: (name: string) => void
  areaModalDescription: string
  setAreaModalDescription: (description: string) => void
  areaModalColor: string
  setAreaModalColor: (color: string) => void
  areaModalIcon: string
  setAreaModalIcon: (icon: string) => void
  showAreaIconPicker: boolean
  setShowAreaIconPicker: (show: boolean) => void
  isSavingArea: boolean
  onSave: () => Promise<void>
}

export function AreaEditModal({
  show,
  onClose,
  editingArea,
  areaModalName,
  setAreaModalName,
  areaModalDescription,
  setAreaModalDescription,
  areaModalColor,
  setAreaModalColor,
  areaModalIcon,
  setAreaModalIcon,
  showAreaIconPicker,
  setShowAreaIconPicker,
  isSavingArea,
  onSave,
}: AreaEditModalProps) {
  const t = useTranslations()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!show || typeof window === 'undefined' || !mounted) return null

  const handleClose = () => {
    setAreaModalName('')
    setAreaModalDescription('')
    setAreaModalColor('#ea580c')
    setAreaModalIcon('LayoutDashboard')
    onClose()
  }

  // Ensure document.body exists before creating portal
  if (typeof document === 'undefined' || !document.body) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingArea ? (t('areas.edit') || 'Upravit oblast') : (t('areas.add') || 'Přidat oblast')}
            </h2>
            
            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('areas.name') || 'Název'} *
              </label>
              <input
                type="text"
                value={areaModalName}
                onChange={(e) => setAreaModalName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={t('areas.namePlaceholder') || 'Název oblasti'}
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('areas.description') || 'Popis'}
              </label>
              <textarea
                value={areaModalDescription}
                onChange={(e) => setAreaModalDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={3}
                placeholder={t('areas.descriptionPlaceholder') || 'Popis oblasti'}
              />
            </div>

            {/* Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('areas.color') || 'Barva'}
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: '#ea580c', name: 'Oranžová' }, // Primary
                  { value: '#3B82F6', name: 'Modrá' },
                  { value: '#10B981', name: 'Zelená' },
                  { value: '#8B5CF6', name: 'Fialová' },
                  { value: '#EC4899', name: 'Růžová' },
                  { value: '#EF4444', name: 'Červená' },
                  { value: '#F59E0B', name: 'Amber' },
                  { value: '#6366F1', name: 'Indigo' }
                ].map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setAreaModalColor(color.value)}
                    className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                      areaModalColor === color.value 
                        ? 'border-gray-800 ring-2 ring-offset-2 ring-orange-400' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Icon */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('areas.icon') || 'Ikona'}
              </label>
              <button
                onClick={() => setShowAreaIconPicker(!showAreaIconPicker)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const IconComp = getIconComponent(areaModalIcon)
                    return <IconComp className="w-5 h-5" style={{ color: areaModalColor }} />
                  })()}
                  <span>{AVAILABLE_ICONS.find(i => i.name === areaModalIcon)?.label || areaModalIcon}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAreaIconPicker ? 'rotate-180' : ''}`} />
              </button>
              {showAreaIconPicker && (
                <div className="mt-2 p-3 border border-gray-300 rounded-lg bg-white max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-6 gap-2">
                    {AVAILABLE_ICONS.map((icon) => {
                      const IconComp = getIconComponent(icon.name)
                      return (
                        <button
                          key={icon.name}
                          onClick={() => {
                            setAreaModalIcon(icon.name)
                            setShowAreaIconPicker(false)
                          }}
                          className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                            areaModalIcon === icon.name ? 'bg-orange-100 border-2 border-orange-500' : ''
                          }`}
                          title={icon.label}
                        >
                          <IconComp className="w-5 h-5 mx-auto" style={{ color: areaModalColor }} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSavingArea}
              >
                {t('common.cancel') || 'Zrušit'}
              </button>
              <button
                onClick={async () => {
                  await onSave()
                }}
                disabled={isSavingArea || !areaModalName.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingArea ? (t('common.saving') || 'Ukládám...') : (t('common.save') || 'Uložit')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

