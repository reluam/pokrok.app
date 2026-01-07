'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Plus, Edit, Trash2, Save, X, Check, XCircle, Loader2 } from 'lucide-react'

interface Condition {
  operator: '==' | '!=' | '<' | '>' | '<=' | '>=' | 'startsWith' | 'contains'
  value: any
}

interface AssistantTip {
  id: string
  title: Record<string, string>
  description: Record<string, string>
  category: 'motivation' | 'organization' | 'productivity' | 'feature' | 'onboarding' | 'inspiration'
  priority: number
  context_page?: string | null
  context_section?: string | null
  is_active: boolean
  conditions?: Record<string, Condition> | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export function AdminTipsView() {
  const t = useTranslations()
  const locale = useLocale()
  const [tips, setTips] = useState<AssistantTip[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [editingTip, setEditingTip] = useState<AssistantTip | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterContextPage, setFilterContextPage] = useState<string>('all')
  const [filterIsActive, setFilterIsActive] = useState<string>('all')

  // Check admin status and load tips
  useEffect(() => {
    const checkAdminAndLoadTips = async () => {
      try {
        const response = await fetch('/api/admin/tips')
        if (response.status === 403) {
          setIsAdmin(false)
          setLoading(false)
          return
        }
        if (!response.ok) {
          throw new Error('Failed to load tips')
        }
        const data = await response.json()
        setIsAdmin(true)
        setTips(data)
      } catch (error) {
        console.error('Error loading tips:', error)
        setError('Failed to load tips')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAndLoadTips()
  }, [])

  const handleCreate = async (tipData: Omit<AssistantTip, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tipData)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create tip')
      }
      const newTip = await response.json()
      setTips([...tips, newTip].sort((a, b) => b.priority - a.priority || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      setShowCreateForm(false)
    } catch (error: any) {
      setError(error.message || 'Failed to create tip')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: string, tipData: Partial<AssistantTip>) => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/tips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tipData)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update tip')
      }
      const updatedTip = await response.json()
      setTips(tips.map(t => t.id === id ? updatedTip : t).sort((a, b) => b.priority - a.priority || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      setEditingTip(null)
    } catch (error: any) {
      setError(error.message || 'Failed to update tip')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tip?')) return
    
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/tips/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete tip')
      }
      setTips(tips.filter(t => t.id !== id))
    } catch (error: any) {
      setError(error.message || 'Failed to delete tip')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (tip: AssistantTip) => {
    await handleUpdate(tip.id, { is_active: !tip.is_active })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-primary-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-black font-playful">Admin - Tips Management</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-playful-base flex items-center gap-2 px-4 py-2 bg-primary-500 text-white hover:bg-primary-600"
          >
            <Plus className="w-5 h-5" />
            Create New Tip
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 rounded-playful-md text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white rounded-playful-md border-2 border-primary-500 p-4">
          <h3 className="text-lg font-bold text-black mb-3">Filters</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All</option>
                <option value="motivation">Motivation</option>
                <option value="organization">Organization</option>
                <option value="productivity">Productivity</option>
                <option value="feature">Feature</option>
                <option value="onboarding">Onboarding</option>
                <option value="inspiration">Inspiration</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All</option>
                <option value="high">High (5+)</option>
                <option value="medium">Medium (0-4)</option>
                <option value="low">Low (&lt;0)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Context Page</label>
              <select
                value={filterContextPage}
                onChange={(e) => setFilterContextPage(e.target.value)}
                className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All</option>
                <option value="main">Main</option>
                <option value="goals">Goals</option>
                <option value="habits">Habits</option>
                <option value="steps">Steps</option>
                <option value="null">No Context</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Active Status</label>
              <select
                value={filterIsActive}
                onChange={(e) => setFilterIsActive(e.target.value)}
                className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {showCreateForm && (
          <TipForm
            onSave={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            saving={saving}
            locale={locale}
          />
        )}

        {editingTip && (
          <TipForm
            tip={editingTip}
            onSave={(data) => handleUpdate(editingTip.id, data)}
            onCancel={() => setEditingTip(null)}
            saving={saving}
            locale={locale}
          />
        )}

        <div className="bg-white rounded-playful-md border-2 border-primary-500 overflow-hidden">
          <table className="w-full">
            <thead className="bg-primary-500">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-black">Title</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-black">Category</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-black">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-black">Context</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-black">Conditions</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-black">Active</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tips
                .filter((tip) => {
                  if (filterCategory !== 'all' && tip.category !== filterCategory) return false
                  if (filterPriority !== 'all') {
                    if (filterPriority === 'high' && tip.priority < 5) return false
                    if (filterPriority === 'medium' && (tip.priority < 0 || tip.priority >= 5)) return false
                    if (filterPriority === 'low' && tip.priority >= 0) return false
                  }
                  if (filterContextPage !== 'all') {
                    if (filterContextPage === 'null' && tip.context_page !== null) return false
                    if (filterContextPage !== 'null' && tip.context_page !== filterContextPage) return false
                  }
                  if (filterIsActive !== 'all') {
                    if (filterIsActive === 'active' && !tip.is_active) return false
                    if (filterIsActive === 'inactive' && tip.is_active) return false
                  }
                  return true
                })
                .map((tip) => (
                <tr key={tip.id} className="border-b border-primary-200 hover:bg-primary-50">
                  <td className="px-4 py-3 text-sm">
                    {tip.title[locale] || tip.title.cs || tip.title.en || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 rounded-playful-sm bg-primary-100 text-primary-700 text-xs font-semibold">
                      {tip.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{tip.priority}</td>
                  <td className="px-4 py-3 text-sm">
                    {tip.context_page ? `${tip.context_page}${tip.context_section ? ` / ${tip.context_section}` : ''}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {tip.conditions ? (
                      <div className="space-y-1">
                        {Object.entries(tip.conditions).map(([key, condition]) => (
                          <div key={key} className="text-xs">
                            <span className="font-semibold">{key}:</span> {condition.operator} {String(condition.value)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(tip)}
                      className={`px-3 py-1 rounded-playful-sm text-xs font-semibold ${
                        tip.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {tip.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingTip(tip)}
                        className="p-2 hover:bg-primary-100 rounded-playful-sm transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-primary-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(tip.id)}
                        className="p-2 hover:bg-red-100 rounded-playful-sm transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tips.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No tips found. Create your first tip!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface TipFormProps {
  tip?: AssistantTip
  onSave: (data: Omit<AssistantTip, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void
  onCancel: () => void
  saving: boolean
  locale: string
}

function TipForm({ tip, onSave, onCancel, saving, locale }: TipFormProps) {
  const [title, setTitle] = useState<Record<string, string>>(tip?.title || { cs: '', en: '' })
  const [description, setDescription] = useState<Record<string, string>>(tip?.description || { cs: '', en: '' })
  const [category, setCategory] = useState<AssistantTip['category']>(tip?.category || 'motivation')
  const [priority, setPriority] = useState(tip?.priority || 0)
  const [contextPage, setContextPage] = useState(tip?.context_page || '')
  const [contextSection, setContextSection] = useState(tip?.context_section || '')
  const [isActive, setIsActive] = useState(tip?.is_active ?? true)
  const [conditions, setConditions] = useState<Record<string, Condition>>(tip?.conditions || {})

  const availableConditionFields = [
    { key: 'totalAreas', label: 'Total Areas', description: 'Total number of areas the user has created', type: 'number' },
    { key: 'totalGoals', label: 'Total Goals', description: 'Total number of goals the user has created', type: 'number' },
    { key: 'activeGoals', label: 'Active Goals', description: 'Number of currently active goals', type: 'number' },
    { key: 'totalSteps', label: 'Total Steps', description: 'Total number of steps the user has created', type: 'number' },
    { key: 'completedSteps', label: 'Completed Steps', description: 'Number of completed steps', type: 'number' },
    { key: 'totalHabits', label: 'Total Habits', description: 'Total number of habits the user has created', type: 'number' },
    { key: 'completedStepsRatio', label: 'Completed Steps Ratio', description: 'Ratio of completed steps to total steps (0-1)', type: 'number' },
    { key: 'hasCompletedOnboarding', label: 'Has Completed Onboarding', description: 'Whether user has completed onboarding', type: 'boolean' },
    { key: 'context_page', label: 'Context Page', description: 'Current page context (main, goals, habits, steps)', type: 'string' },
    { key: 'context_section', label: 'Context Section', description: 'Current section context (e.g., goal-123, area-456)', type: 'string' }
  ]

  const addCondition = () => {
    setConditions({ ...conditions, '': { operator: '==', value: '' } })
  }

  const removeCondition = (key: string) => {
    const newConditions = { ...conditions }
    delete newConditions[key]
    setConditions(newConditions)
  }

  const updateCondition = (oldKey: string, newKey: string, operator: Condition['operator'], value: any) => {
    const newConditions = { ...conditions }
    if (oldKey !== newKey) {
      delete newConditions[oldKey]
    }
    newConditions[newKey] = { operator, value }
    setConditions(newConditions)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Clean up empty conditions
    const cleanedConditions = Object.fromEntries(
      Object.entries(conditions).filter(([key, condition]) => key && condition.value !== '')
    )
    onSave({
      title,
      description,
      category,
      priority,
      context_page: contextPage || null,
      context_section: contextSection || null,
      is_active: isActive,
      conditions: Object.keys(cleanedConditions).length > 0 ? cleanedConditions : null
    })
  }

  return (
    <div className="mb-6 bg-white rounded-playful-md border-2 border-primary-500 p-6">
      <h2 className="text-xl font-bold text-black mb-4">
        {tip ? 'Edit Tip' : 'Create New Tip'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Title (Czech)</label>
            <input
              type="text"
              value={title.cs || ''}
              onChange={(e) => setTitle({ ...title, cs: e.target.value })}
              className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Title (English)</label>
            <input
              type="text"
              value={title.en || ''}
              onChange={(e) => setTitle({ ...title, en: e.target.value })}
              className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Description (Czech)</label>
            <textarea
              value={description.cs || ''}
              onChange={(e) => setDescription({ ...description, cs: e.target.value })}
              className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 min-h-[100px]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Description (English)</label>
            <textarea
              value={description.en || ''}
              onChange={(e) => setDescription({ ...description, en: e.target.value })}
              className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 min-h-[100px]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AssistantTip['category'])}
              className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="motivation">Motivation</option>
              <option value="organization">Organization</option>
              <option value="productivity">Productivity</option>
              <option value="feature">Feature</option>
              <option value="onboarding">Onboarding</option>
              <option value="inspiration">Inspiration</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Priority</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Active</label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-primary-500 rounded-playful-sm"
              />
              <span className="text-sm">{isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Context Page (optional)</label>
            <input
              type="text"
              value={contextPage}
              onChange={(e) => setContextPage(e.target.value)}
              className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., main, goals, habits"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Context Section (optional)</label>
            <input
              type="text"
              value={contextSection}
              onChange={(e) => setContextSection(e.target.value)}
              className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., upcoming, focus-month"
            />
          </div>
        </div>

        {/* Conditions Section */}
        <div className="border-t-2 border-primary-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="block text-sm font-semibold text-black mb-1">Conditions (optional)</label>
              <p className="text-xs text-gray-600">Set conditions for when this tip should be shown. All conditions must be met (AND logic).</p>
            </div>
            <button
              type="button"
              onClick={addCondition}
              className="btn-playful-base flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-100 text-primary-700 hover:bg-primary-200"
            >
              <Plus className="w-4 h-4" />
              Add Condition
            </button>
          </div>

          {Object.entries(conditions).length === 0 ? (
            <p className="text-sm text-gray-500 italic">No conditions set. Tip will be shown based on context page/section only.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(conditions).map(([key, condition], index) => {
                const fieldInfo = availableConditionFields.find(f => f.key === key) || availableConditionFields[0]
                return (
                  <div key={index} className="flex items-start gap-2 p-3 bg-primary-50 rounded-playful-sm border border-primary-200">
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-black mb-1">Field</label>
                        <select
                          value={key}
                          onChange={(e) => {
                            const newKey = e.target.value
                            updateCondition(key, newKey, condition.operator, condition.value)
                          }}
                          className="w-full px-2 py-1.5 text-sm border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
                        >
                          {availableConditionFields.map(field => (
                            <option key={field.key} value={field.key}>{field.label}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">{fieldInfo.description}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-black mb-1">Operator</label>
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(key, key, e.target.value as Condition['operator'], condition.value)}
                          className="w-full px-2 py-1.5 text-sm border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
                        >
                          {fieldInfo.type === 'string' ? (
                            <>
                              <option value="==">equals</option>
                              <option value="!=">not equals</option>
                              <option value="startsWith">starts with</option>
                              <option value="contains">contains</option>
                            </>
                          ) : fieldInfo.type === 'boolean' ? (
                            <>
                              <option value="==">equals</option>
                              <option value="!=">not equals</option>
                            </>
                          ) : (
                            <>
                              <option value="==">equals</option>
                              <option value="!=">not equals</option>
                              <option value="<">less than</option>
                              <option value=">">greater than</option>
                              <option value="<=">less or equal</option>
                              <option value=">=">greater or equal</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-black mb-1">Value</label>
                        {fieldInfo.type === 'boolean' ? (
                          <select
                            value={String(condition.value)}
                            onChange={(e) => updateCondition(key, key, condition.operator, e.target.value === 'true')}
                            className="w-full px-2 py-1.5 text-sm border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : (
                          <input
                            type={fieldInfo.type === 'number' ? 'number' : 'text'}
                            step={fieldInfo.type === 'number' ? '0.01' : undefined}
                            value={condition.value}
                            onChange={(e) => {
                              const newValue = fieldInfo.type === 'number' 
                                ? (e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
                                : e.target.value
                              updateCondition(key, key, condition.operator, newValue)
                            }}
                            className="w-full px-2 py-1.5 text-sm border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500"
                            placeholder={fieldInfo.type === 'number' ? '0' : 'value'}
                          />
                        )}
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeCondition(key)}
                          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-playful-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-playful-base flex items-center gap-2 px-4 py-2 bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="btn-playful-base flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

