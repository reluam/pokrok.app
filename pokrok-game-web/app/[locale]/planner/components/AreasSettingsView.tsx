'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { getIconComponent, AVAILABLE_ICONS } from '@/lib/icon-utils'

interface AreasSettingsViewProps {
  player?: any
  areas: any[]
  dailySteps: any[]
  habits: any[]
  onNavigateToMain?: () => void
  onEditArea?: (area?: any) => void
  onDeleteArea?: (areaId: string) => void
  onDeleteAreaConfirm?: (areaId: string, deleteRelated: boolean) => Promise<void>
  isDeletingArea?: boolean
  onSaveArea?: (area: any) => Promise<void>
  onAreasUpdate?: (areas: any[]) => void
}

export function AreasSettingsView({
  player,
  areas,
  dailySteps,
  habits,
  onNavigateToMain,
  onEditArea,
  onDeleteArea,
  onDeleteAreaConfirm,
  isDeletingArea = false,
  onSaveArea,
  onAreasUpdate
}: AreasSettingsViewProps) {
  const t = useTranslations()
  
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [descriptionValue, setDescriptionValue] = useState('')
  const [colorValue, setColorValue] = useState('#ea580c')
  const [iconValue, setIconValue] = useState('LayoutDashboard')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteAreaModal, setShowDeleteAreaModal] = useState(false)
  const [areaToDelete, setAreaToDelete] = useState<string | null>(null)
  const [deleteAreaWithRelated, setDeleteAreaWithRelated] = useState(false)
  
  const nameInputRef = useRef<HTMLInputElement>(null)
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Select first area by default if available
  useEffect(() => {
    if (areas.length > 0 && !selectedArea) {
      setSelectedArea(areas[0].id)
    }
  }, [areas, selectedArea])

  const selectedAreaData = areas.find(a => a.id === selectedArea)

  // Reset values when selected area changes
  useEffect(() => {
    if (selectedArea && selectedAreaData) {
      setNameValue(selectedAreaData.name || '')
      setDescriptionValue(selectedAreaData.description || '')
      setColorValue(selectedAreaData.color || '#ea580c')
      setIconValue(selectedAreaData.icon || 'LayoutDashboard')
      setEditingName(false)
      setEditingDescription(false)
      setShowIconPicker(false)
      setShowColorPicker(false)
    }
  }, [selectedArea, selectedAreaData])

  // Focus input when editing starts
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [editingName])

  useEffect(() => {
    if (editingDescription && descriptionTextareaRef.current) {
      descriptionTextareaRef.current.focus()
    }
  }, [editingDescription])

  const handleMenuClick = (areaId: string | null) => {
    setSelectedArea(areaId)
    // Don't set isEditing here, let useEffect handle it
  }

  const handleAddArea = () => {
    if (onEditArea) {
      onEditArea()
    }
  }

  const handleDeleteArea = (areaId: string) => {
    setAreaToDelete(areaId)
    setDeleteAreaWithRelated(false) // Reset checkbox when opening modal
    setShowDeleteAreaModal(true)
  }

  const handleDeleteAreaConfirm = async () => {
    if (!areaToDelete) return

    if (onDeleteAreaConfirm) {
      await onDeleteAreaConfirm(areaToDelete, deleteAreaWithRelated)
    } else if (onDeleteArea) {
      // Fallback to old behavior if onDeleteAreaConfirm is not provided
      onDeleteArea(areaToDelete)
    }
    
    setShowDeleteAreaModal(false)
    setAreaToDelete(null)
    setDeleteAreaWithRelated(false)
    
    if (selectedArea === areaToDelete) {
      setSelectedArea(null)
    }
  }

  const handleNameSave = async () => {
    if (!selectedAreaData) return
    
    if (!nameValue.trim()) {
      alert(t('areas.nameRequired') || 'Název oblasti je povinný')
      setNameValue(selectedAreaData.name || '')
      setEditingName(false)
      return
    }

    if (nameValue.trim().length > 255) {
      const nameTooLongMsg = t('areas.nameTooLong') || 'Název oblasti je příliš dlouhý. Maximální délka je 255 znaků. Aktuální délka: {length} znaků.'
      alert(nameTooLongMsg.replace('{length}', String(nameValue.trim().length)))
      setNameValue(selectedAreaData.name || '')
      setEditingName(false)
      return
    }

    if (nameValue.trim() !== selectedAreaData.name) {
      setIsSaving(true)
      try {
        if (onSaveArea) {
          await onSaveArea({
            id: selectedAreaData.id,
            name: nameValue.trim(),
            description: descriptionValue,
            color: colorValue,
            icon: iconValue
          })
        }
      } catch (error) {
        console.error('Error saving area name:', error)
        alert(t('common.error') || 'Chyba při ukládání oblasti')
        setNameValue(selectedAreaData.name || '')
      } finally {
        setIsSaving(false)
      }
    }
    setEditingName(false)
  }

  const handleDescriptionSave = async () => {
    if (!selectedAreaData) return
    
    if (descriptionValue !== (selectedAreaData.description || '')) {
      setIsSaving(true)
      try {
        if (onSaveArea) {
          await onSaveArea({
            id: selectedAreaData.id,
            name: nameValue.trim(),
            description: descriptionValue || null,
            color: colorValue,
            icon: iconValue
          })
        }
      } catch (error) {
        console.error('Error saving area description:', error)
        alert(t('common.error') || 'Chyba při ukládání oblasti')
        setDescriptionValue(selectedAreaData.description || '')
      } finally {
        setIsSaving(false)
      }
    }
    setEditingDescription(false)
  }

  const handleColorChange = async (color: string) => {
    if (!selectedAreaData) return
    
    setColorValue(color)
    
    if (color !== selectedAreaData.color) {
      setIsSaving(true)
      try {
        if (onSaveArea) {
          await onSaveArea({
            id: selectedAreaData.id,
            name: nameValue.trim(),
            description: descriptionValue,
            color: color,
            icon: iconValue
          })
        }
      } catch (error) {
        console.error('Error saving area color:', error)
        alert(t('common.error') || 'Chyba při ukládání oblasti')
        setColorValue(selectedAreaData.color || '#ea580c')
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleIconChange = async (icon: string) => {
    if (!selectedAreaData) return
    
    setIconValue(icon)
    setShowIconPicker(false)
    
    if (icon !== selectedAreaData.icon) {
      setIsSaving(true)
      try {
        if (onSaveArea) {
          await onSaveArea({
            id: selectedAreaData.id,
            name: nameValue.trim(),
            description: descriptionValue,
            color: colorValue,
            icon: icon
          })
        }
      } catch (error) {
        console.error('Error saving area icon:', error)
        alert(t('common.error') || 'Chyba při ukládání oblasti')
        setIconValue(selectedAreaData.icon || 'LayoutDashboard')
      } finally {
        setIsSaving(false)
      }
    }
  }

  // Goals removed - no goals to filter
  const selectedAreaGoals: any[] = []
  const selectedAreaSteps = selectedAreaData ? dailySteps.filter(s => s.area_id === selectedAreaData.id) : []
  const selectedAreaHabits = selectedAreaData ? habits.filter(h => h.area_id === selectedAreaData.id) : []

  return (
    <div className="flex h-full bg-primary-50">
      {/* Left sidebar menu */}
      <div className="w-64 border-r-4 border-primary-500 bg-white flex-shrink-0">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            {onNavigateToMain && (
              <button
                onClick={onNavigateToMain}
                className="p-1.5 rounded-playful-sm hover:bg-primary-50 transition-colors border-2 border-primary-500 text-black hover:text-primary-600"
                title={t('common.back') || 'Zpět'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-lg font-bold text-black font-playful">{t('areas.title') || 'Oblasti'}</h2>
          </div>

          {/* Areas list */}
          <div className="pt-4 border-t-2 border-primary-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider font-playful px-2 py-1">
                {t('areas.title') || 'Oblasti'}
              </h3>
              <button
                onClick={handleAddArea}
                className="p-1.5 rounded-playful-sm hover:bg-primary-50 transition-colors border-2 border-primary-500 text-black hover:text-primary-600"
                title={t('areas.add') || 'Přidat oblast'}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {areas.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {t('areas.noAreas') || 'Zatím nemáte žádné oblasti'}
                </div>
              ) : (
                areas.map((area) => {
                  const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
                  const isActive = selectedArea === area.id
                  
                  return (
                    <div key={area.id} className="flex items-center gap-2">
                      <button
                        onClick={() => handleMenuClick(area.id)}
                        className={`btn-playful-nav flex-1 flex items-center gap-3 px-3 py-2 text-left ${
                          isActive ? 'active' : ''
                        }`}
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" style={{ color: area.color || '#ea580c' }} />
                        <span className="font-medium text-sm truncate">{area.name}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteArea(area.id)
                        }}
                        className="p-1.5 rounded-playful-sm hover:bg-red-50 transition-colors border-2 border-red-200 text-gray-500 hover:text-red-600"
                        title={t('common.delete') || 'Smazat'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {selectedAreaData ? (
            // Area detail
            <div>
              {/* Title row with icon, name, color indicator, and delete button */}
              <div className="flex items-center gap-3 mb-4">
                {/* Icon - clickable to open icon picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="p-2 rounded-playful-sm hover:bg-primary-50 transition-colors border-2 border-primary-300"
                    title={t('areas.icon') || 'Změnit ikonu'}
                  >
                    {(() => {
                      const IconComp = getIconComponent(iconValue)
                      return <IconComp className="w-6 h-6" style={{ color: colorValue }} />
                    })()}
                  </button>
                  
                  {/* Icon picker modal */}
                  {showIconPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowIconPicker(false)}
                      />
                      <div className="absolute top-full left-0 mt-2 p-3 border-2 border-primary-300 rounded-playful-sm bg-white shadow-lg z-20 max-h-64 overflow-y-auto">
                        <div className="grid grid-cols-6 gap-2">
                          {AVAILABLE_ICONS.map((icon) => {
                            const IconComp = getIconComponent(icon.name)
                            return (
                              <button
                                key={icon.name}
                                onClick={() => handleIconChange(icon.name)}
                                className={`p-2 rounded-playful-sm hover:bg-primary-50 transition-colors ${
                                  iconValue === icon.name ? 'bg-primary-100 border-2 border-primary-500' : ''
                                }`}
                                title={icon.label}
                              >
                                <IconComp className="w-5 h-5 mx-auto" style={{ color: colorValue }} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Name - inline editable */}
                {editingName ? (
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleNameSave()
                      } else if (e.key === 'Escape') {
                        setNameValue(selectedAreaData.name || '')
                        setEditingName(false)
                      }
                    }}
                    className="flex-1 text-2xl font-bold text-black font-playful bg-white border-2 border-primary-500 rounded-playful-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                ) : (
                  <h1
                    onClick={() => setEditingName(true)}
                    className="flex-1 text-2xl font-bold text-black font-playful cursor-pointer hover:text-primary-600 transition-colors"
                  >
                    {nameValue || selectedAreaData.name}
                  </h1>
                )}

                {/* Color indicator - clickable to change color */}
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-8 h-8 rounded-playful-sm border-2 border-primary-300 hover:border-primary-500 transition-colors"
                    style={{ backgroundColor: colorValue }}
                    title={t('areas.color') || 'Změnit barvu'}
                  />
                  
                  {/* Color picker */}
                  {showColorPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowColorPicker(false)}
                      />
                      <div className="absolute top-full right-0 mt-2 p-3 border-2 border-primary-300 rounded-playful-sm bg-white shadow-lg z-20">
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { value: '#ea580c', name: 'Oranžová' },
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
                              onClick={() => {
                                handleColorChange(color.value)
                                setShowColorPicker(false)
                              }}
                              className={`w-10 h-10 rounded-playful-sm border-2 transition-all hover:scale-110 ${
                                colorValue === color.value 
                                  ? 'border-gray-800 ring-2 ring-offset-2 ring-primary-400' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteArea(selectedAreaData.id)}
                  className="p-2 rounded-playful-sm hover:bg-red-50 transition-colors border-2 border-red-200 text-red-600 hover:text-red-700"
                  title={t('common.delete') || 'Smazat oblast'}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Description - inline editable, right under title */}
              {editingDescription ? (
                <textarea
                  ref={descriptionTextareaRef}
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  onBlur={handleDescriptionSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setDescriptionValue(selectedAreaData.description || '')
                      setEditingDescription(false)
                    }
                  }}
                  className="w-full text-black text-lg font-playful bg-white border-2 border-primary-500 rounded-playful-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-4"
                  rows={3}
                  autoFocus
                  placeholder={t('areas.descriptionPlaceholder') || 'Popis oblasti...'}
                />
              ) : descriptionValue || selectedAreaData.description ? (
                <p
                  onClick={() => setEditingDescription(true)}
                  className="text-gray-600 text-lg font-playful cursor-pointer hover:text-primary-600 transition-colors mb-4"
                >
                  {descriptionValue || selectedAreaData.description}
                </p>
              ) : (
                <p
                  onClick={() => setEditingDescription(true)}
                  className="text-gray-400 text-lg font-playful cursor-pointer hover:text-primary-600 transition-colors italic mb-4"
                >
                  {t('areas.descriptionPlaceholder') || 'Klikněte pro přidání popisu...'}
                </p>
              )}
              
              <div className="bg-white border-2 border-primary-500 rounded-playful-md p-6 space-y-4">
                {/* Statistics - smaller */}
                <div className="grid grid-cols-2 gap-3 pb-4 border-b-2 border-primary-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary-600">{selectedAreaSteps.length}</div>
                    <div className="text-xs text-gray-600">{t('navigation.steps') || 'Kroky'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary-600">{selectedAreaHabits.length}</div>
                    <div className="text-xs text-gray-600">{t('habits.title') || 'Návyky'}</div>
                  </div>
                </div>

                {/* Goals removed - milestones will be shown in area detail pages */}

                {/* Habits list */}
                {selectedAreaHabits.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-black uppercase tracking-wider font-playful">
                      {t('habits.title') || 'Návyky'}
                    </h4>
                    <div className="space-y-2">
                      {selectedAreaHabits.map((habit: any) => (
                        <div key={habit.id} className="border-2 border-primary-200 rounded-playful-sm p-3 bg-primary-50">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-black font-playful text-sm">{habit.name}</span>
                            {habit.description && (
                              <span className="text-xs text-gray-600">- {habit.description}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-bold font-playful mb-4">
                {t('areas.title') || 'Oblasti'}
              </h3>
              <div className="bg-white border-2 border-primary-500 rounded-playful-md p-6">
                <p className="text-gray-600">
                  {t('areas.noAreas') || 'Zatím nemáte žádné oblasti'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete area confirmation modal */}
      {showDeleteAreaModal && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-black/20" 
            onClick={() => {
              setShowDeleteAreaModal(false)
              setAreaToDelete(null)
              setDeleteAreaWithRelated(false)
            }}
          />
          <div 
            className="fixed z-[101] bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-6"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              maxWidth: '90vw'
            }}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {t('areas.deleteConfirm') || 'Opravdu chcete smazat tuto oblast?'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('areas.deleteConfirmDescription') || 'Cíle, kroky a návyky přiřazené k této oblasti budou odpojeny. Tato akce je nevratná.'}
            </p>
            
            {/* Checkbox for deleting related items */}
            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteAreaWithRelated}
                onChange={(e) => setDeleteAreaWithRelated(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
              />
              <span className="text-sm text-black font-playful">
                {t('areas.deleteWithRelated') || 'Odstranit i cíle, kroky a návyky přiřazené k této oblasti'}
              </span>
            </label>
            
            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteAreaModal(false)
                  setAreaToDelete(null)
                  setDeleteAreaWithRelated(false)
                }}
                disabled={isDeletingArea}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.cancel') || 'Zrušit'}
              </button>
              <button
                onClick={handleDeleteAreaConfirm}
                disabled={isDeletingArea}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeletingArea ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>{t('common.deleting') || 'Mažu...'}</span>
                  </>
                ) : (
                  <span>{t('common.delete') || 'Smazat'}</span>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

