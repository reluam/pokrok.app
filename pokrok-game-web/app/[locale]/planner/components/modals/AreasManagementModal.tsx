'use client'

import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { X, Edit, Trash2, Plus } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'

interface AreasManagementModalProps {
  show: boolean
  onClose: () => void
  areas: any[]
  goals: any[]
  dailySteps: any[]
  habits: any[]
  onEditArea: (area?: any) => void
  onDeleteArea: (areaId: string) => void
}

export function AreasManagementModal({
  show,
  onClose,
  areas,
  goals,
  dailySteps,
  habits,
  onEditArea,
  onDeleteArea,
}: AreasManagementModalProps) {
  const t = useTranslations()
  const locale = useLocale()

  if (!show || typeof window === 'undefined') return null

  return createPortal(
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{t('areas.title') || 'Oblasti'}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Areas list */}
            {areas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-2 text-lg font-medium">{t('areas.noAreas') || 'Zatím nemáte žádné oblasti'}</p>
                <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                  {t('areas.noAreasDescription') || 'Oblasti slouží k rozdělení cílů, návyků a kroků na jednotlivé oblasti tak, jak chcete - například Zdraví, Práce, Projekt, atd.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {areas.map((area) => {
                  const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
                  const areaGoals = goals.filter(g => g.area_id === area.id)
                  const areaSteps = dailySteps.filter(s => s.area_id === area.id)
                  const areaHabits = habits.filter(h => h.area_id === area.id)
                  
                  return (
                    <div
                      key={area.id}
                      className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-6 h-6" style={{ color: area.color || '#ea580c' }} />
                          <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditArea(area)}
                            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
                            title={t('common.edit') || 'Upravit'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteArea(area.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-gray-500 hover:text-red-600"
                            title={t('common.delete') || 'Smazat'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {area.description && (
                        <p className="text-sm text-gray-600 mb-3">{area.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{areaGoals.length} {t('goals.title') || 'GOALS'}</span>
                        <span>{areaSteps.length} {locale === 'cs' ? 'KROKY' : 'STEPS'}</span>
                        <span>{areaHabits.length} {t('habits.title') || 'HABITS'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add Area Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEditArea()
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>{t('areas.add') || 'Přidat oblast'}</span>
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

