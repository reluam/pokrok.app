'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Plus, X, Edit, Trash2, Target, Calendar } from 'lucide-react'

interface AutomationManagementViewProps {
  goals: any[]
  userId?: string | null
  player?: any
}

export function AutomationManagementView({
  goals = [],
  userId,
  player
}: AutomationManagementViewProps) {
  const t = useTranslations()
  
  const [automations, setAutomations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<any | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string>('')
  
  // Form data for new/edit automation
  const [selectedAutomationType, setSelectedAutomationType] = useState<'goal' | 'step' | 'habit' | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'goal' as 'goal' | 'step' | 'habit',
    target_id: '',
    target_value: null as number | null,
    current_value: 0,
    update_value: null as number | null,
    update_frequency: null as 'daily' | 'weekly' | 'monthly' | null,
    update_day_of_week: null as number | null,
    update_day_of_month: null as number | null,
    is_active: true
  })

  // Load automations
  const loadAutomations = async () => {
    const currentUserId = userId || player?.user_id
    if (!currentUserId) return

    try {
      setLoading(true)
      const response = await fetch('/api/automations')
      if (response.ok) {
        const data = await response.json()
        setAutomations(data.automations || [])
      }
    } catch (error) {
      console.error('Error loading automations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAutomations()
  }, [userId, player?.user_id])

  const handleCreateAutomation = async () => {
    if (!formData.target_id) {
      alert('Vyberte cíl, krok nebo návyk')
      return
    }

    if (!selectedGoalId) {
      alert('Vyberte cíl')
      return
    }

    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          frequency_type: 'recurring'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', errorData)
        alert(`Chyba při vytváření automatizace: ${errorData.error || 'Neznámá chyba'}`)
        return
      }

      if (response.ok) {
        await loadAutomations()
        // Reset form
        setFormData({
          name: '',
          description: '',
          type: 'goal',
          target_id: '',
          target_value: null,
          current_value: 0,
          update_value: null,
          update_frequency: null,
          update_day_of_week: null,
          update_day_of_month: null,
          is_active: true
        })
        setSelectedGoalId('')
        setEditingAutomation(null)
        setShowModal(false)
        setSelectedAutomationType(null)
      }
    } catch (error) {
      console.error('Error creating automation:', error)
    }
  }

  const handleUpdateAutomation = async () => {
    if (!editingAutomation || !formData.target_id) {
      alert('Vyberte cíl, krok nebo návyk')
      return
    }

    try {
      const response = await fetch('/api/automations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automationId: editingAutomation.id,
          ...formData
        })
      })

      if (response.ok) {
        await loadAutomations()
        setEditingAutomation(null)
        setShowModal(false)
        setSelectedAutomationType(null)
        setFormData({
          name: '',
          description: '',
          type: 'goal',
          target_id: '',
          target_value: null,
          current_value: 0,
          update_value: null,
          update_frequency: null,
          update_day_of_week: null,
          update_day_of_month: null,
          is_active: true
        })
        setSelectedGoalId('')
      }
    } catch (error) {
      console.error('Error updating automation:', error)
    }
  }

  const handleDeleteAutomation = async (automationId: string) => {
    if (!confirm('Opravdu chcete smazat tuto automatizaci?')) return

    try {
      const response = await fetch(`/api/automations?automationId=${automationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadAutomations()
      }
    } catch (error) {
      console.error('Error deleting automation:', error)
    }
  }

  const handleEditAutomation = (automation: any) => {
    // Skip milestone automations
    if (automation.type === 'milestone') {
      return
    }
    
    setEditingAutomation(automation)
    setShowModal(true)
    setSelectedAutomationType(automation.type || 'goal')

    setFormData({
      name: automation.name || '',
      description: automation.description || '',
      type: automation.type || 'goal',
      target_id: automation.target_id || '',
      target_value: automation.target_value || null,
      current_value: automation.current_value || 0,
      update_value: automation.update_value || null,
      update_frequency: automation.update_frequency || null,
      update_day_of_week: automation.update_day_of_week || null,
      update_day_of_month: automation.update_day_of_month || null,
      is_active: automation.is_active !== undefined ? automation.is_active : true
    })
  }

  const handleAddNew = () => {
    setEditingAutomation(null)
    setShowModal(true)
    setSelectedAutomationType(null)
    setFormData({
      name: '',
      description: '',
      type: 'goal',
      target_id: '',
      target_value: null,
      current_value: 0,
      update_value: null,
      update_frequency: null,
      update_day_of_week: null,
      update_day_of_month: null,
      is_active: true
    })
    setSelectedGoalId('')
  }

  const filteredAutomations = automations.filter(a => a.type !== 'milestone')

  return (
    <div className="w-full h-full flex flex-col p-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-4 px-4 py-2">
        <h2 className="text-xl font-bold text-gray-900">Automatizace</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Přidat automatizaci
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto m-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cíl</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Typ</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Frekvence</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stav</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Akce</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Načítání...
                </td>
              </tr>
            ) : filteredAutomations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Žádné automatizace
                </td>
              </tr>
            ) : (
              filteredAutomations.map((automation) => {
                return (
                  <tr
                    key={automation.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleEditAutomation(automation)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">{automation.name || 'Neznámá automatizace'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{automation.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {automation.update_frequency === 'daily' ? 'Denně' :
                       automation.update_frequency === 'weekly' ? 'Týdně' :
                       automation.update_frequency === 'monthly' ? 'Měsíčně' :
                       'Bez opakování'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        automation.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {automation.is_active ? 'Aktivní' : 'Neaktivní'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditAutomation(automation)
                          }}
                          className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteAutomation(automation.id)
                          }}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => {
          setEditingAutomation(null)
          setShowModal(false)
          setSelectedAutomationType(null)
          setFormData({
            name: '',
            description: '',
            type: 'goal',
            target_id: '',
            target_value: null,
            current_value: 0,
            update_value: null,
            update_frequency: null,
            update_day_of_week: null,
            update_day_of_month: null,
            is_active: true
          })
          setSelectedGoalId('')
        }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingAutomation ? 'Upravit automatizaci' : 'Vytvořit automatizaci'}
                </h3>
                <button
                  onClick={() => {
                    setEditingAutomation(null)
                    setShowModal(false)
                    setSelectedAutomationType(null)
                    setFormData({
                      name: '',
                      description: '',
                      type: 'goal',
                      target_id: '',
                      target_value: null,
                      current_value: 0,
                      update_value: null,
                      update_frequency: null,
                      update_day_of_week: null,
                      update_day_of_month: null,
                      is_active: true
                    })
                    setSelectedGoalId('')
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Automation Type Selection - only show if creating new */}
              {!editingAutomation && !selectedAutomationType && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Vyberte typ automatizace</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setSelectedAutomationType('goal')
                        setFormData({ ...formData, type: 'goal' })
                      }}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled
                    >
                      <div className="font-semibold text-gray-900 mb-1">Cíl</div>
                      <div className="text-xs text-gray-500">Brzy k dispozici</div>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAutomationType('step')
                        setFormData({ ...formData, type: 'step' })
                      }}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled
                    >
                      <div className="font-semibold text-gray-900 mb-1">Krok</div>
                      <div className="text-xs text-gray-500">Brzy k dispozici</div>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAutomationType('habit')
                        setFormData({ ...formData, type: 'habit' })
                      }}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled
                    >
                      <div className="font-semibold text-gray-900 mb-1">Návyk</div>
                      <div className="text-xs text-gray-500">Brzy k dispozici</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Show form only if type is selected or editing */}
              {(selectedAutomationType || editingAutomation) && (
                <>
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Popis</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                      rows={2}
                      placeholder="Popis (volitelné)"
                    />
                  </div>


                      {/* Recurring Event Fields */}
                      <div className="pt-4 border-t border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Opakující se event (např. šetření, splácení)
                        </label>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Cílová hodnota</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.target_value || ''}
                              onChange={(e) => setFormData({ ...formData, target_value: e.target.value ? parseFloat(e.target.value) : null })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="100000"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Aktuální hodnota</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.current_value || 0}
                              onChange={(e) => setFormData({ ...formData, current_value: e.target.value ? parseFloat(e.target.value) : 0 })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        
                        {formData.target_value && formData.current_value !== undefined && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Pokrok</span>
                              <span className="font-semibold text-orange-600">
                                {formData.target_value > 0 
                                  ? Math.round((formData.current_value / formData.target_value) * 100) 
                                  : 0}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${formData.target_value > 0 
                                    ? Math.min((formData.current_value / formData.target_value) * 100, 100) 
                                    : 0}%` 
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Hodnota updatu</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.update_value || ''}
                              onChange={(e) => setFormData({ ...formData, update_value: e.target.value ? parseFloat(e.target.value) : null })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="2000"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Frekvence</label>
                            <select
                              value={formData.update_frequency || ''}
                              onChange={(e) => {
                                setFormData({ 
                                  ...formData, 
                                  update_frequency: (e.target.value === 'daily' || e.target.value === 'weekly' || e.target.value === 'monthly') ? e.target.value : null,
                                  update_day_of_week: e.target.value !== 'weekly' ? null : formData.update_day_of_week, 
                                  update_day_of_month: e.target.value !== 'monthly' ? null : formData.update_day_of_month
                                })
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="">Bez opakování</option>
                              <option value="daily">Denně</option>
                              <option value="weekly">Týdně</option>
                              <option value="monthly">Měsíčně</option>
                            </select>
                          </div>
                        </div>
                        
                        {formData.update_frequency === 'weekly' && (
                          <div className="mb-3">
                            <label className="block text-xs text-gray-600 mb-1">Den v týdnu</label>
                            <select
                              value={formData.update_day_of_week !== null && formData.update_day_of_week !== undefined ? formData.update_day_of_week : ''}
                              onChange={(e) => setFormData({ ...formData, update_day_of_week: e.target.value ? parseInt(e.target.value) : null })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="">Vyberte den</option>
                              <option value="1">Pondělí</option>
                              <option value="2">Úterý</option>
                              <option value="3">Středa</option>
                              <option value="4">Čtvrtek</option>
                              <option value="5">Pátek</option>
                              <option value="6">Sobota</option>
                              <option value="0">Neděle</option>
                            </select>
                          </div>
                        )}
                        
                        {formData.update_frequency === 'monthly' && (
                          <div className="mb-3">
                            <label className="block text-xs text-gray-600 mb-1">Den v měsíci</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={formData.update_day_of_month || ''}
                              onChange={(e) => setFormData({ ...formData, update_day_of_month: e.target.value ? parseInt(e.target.value) : null })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="15"
                            />
                          </div>
                        )}
                      </div>

                  {/* Goal-specific fields - placeholder for future */}
                  {formData.type === 'goal' && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Nastavení pro cíle bude brzy k dispozici.</p>
                    </div>
                  )}

                  {/* Step-specific fields - placeholder for future */}
                  {formData.type === 'step' && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Nastavení pro kroky bude brzy k dispozici.</p>
                    </div>
                  )}

                  {/* Habit-specific fields - placeholder for future */}
                  {formData.type === 'habit' && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Nastavení pro návyky bude brzy k dispozici.</p>
                    </div>
                  )}

                  {/* Active Toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700">Aktivní</label>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setEditingAutomation(null)
                  setShowModal(false)
                  setSelectedAutomationType(null)
                  setFormData({
                    name: '',
                    description: '',
                    type: 'goal',
                    target_id: '',
                    target_value: null,
                    current_value: 0,
                    update_value: null,
                    update_frequency: null,
                    update_day_of_week: null,
                    update_day_of_month: null,
                    is_active: true
                  })
                  setSelectedGoalId('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Zrušit
              </button>
              <button
                onClick={editingAutomation ? handleUpdateAutomation : handleCreateAutomation}
                disabled={!editingAutomation && !selectedAutomationType}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {editingAutomation ? 'Uložit' : 'Vytvořit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

