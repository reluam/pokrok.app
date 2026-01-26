'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Calendar, Plus, Edit2, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface Milestone {
  id: string
  area_id: string
  title: string
  description?: string
  completed_date?: string | Date
  created_at: string | Date
  updated_at: string | Date
}

interface MilestonesTimelineViewProps {
  areaId: string
  userId: string
  onMilestoneUpdate?: () => void
}

export function MilestonesTimelineView({ areaId, userId, onMilestoneUpdate }: MilestonesTimelineViewProps) {
  const t = useTranslations()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCompletedDate, setEditCompletedDate] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCompletedDate, setNewCompletedDate] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    loadMilestones()
  }, [areaId])

  const loadMilestones = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/milestones?areaId=${areaId}`)
      if (response.ok) {
        const data = await response.json()
        setMilestones(data)
      }
    } catch (error) {
      console.error('Error loading milestones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return

    try {
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaId,
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          completedDate: newCompletedDate || null
        })
      })

      if (response.ok) {
        setNewTitle('')
        setNewDescription('')
        setNewCompletedDate('')
        setShowAddForm(false)
        loadMilestones()
        onMilestoneUpdate?.()
      }
    } catch (error) {
      console.error('Error creating milestone:', error)
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          completedDate: editCompletedDate || null
        })
      })

      if (response.ok) {
        setEditingId(null)
        loadMilestones()
        onMilestoneUpdate?.()
      }
    } catch (error) {
      console.error('Error updating milestone:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tento milník?')) return

    try {
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadMilestones()
        onMilestoneUpdate?.()
      }
    } catch (error) {
      console.error('Error deleting milestone:', error)
    }
  }

  const startEdit = (milestone: Milestone) => {
    setEditingId(milestone.id)
    setEditTitle(milestone.title)
    setEditDescription(milestone.description || '')
    setEditCompletedDate(milestone.completed_date ? new Date(milestone.completed_date).toISOString().split('T')[0] : '')
  }

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return null
    const d = new Date(date)
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Sort milestones: completed dates first (ascending), then nulls
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (!a.completed_date && !b.completed_date) return 0
    if (!a.completed_date) return 1
    if (!b.completed_date) return -1
    return new Date(a.completed_date).getTime() - new Date(b.completed_date).getTime()
  })

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
            title={isCollapsed ? 'Rozbalit milníky' : 'Zabalit milníky'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            )}
            <h2 className="text-xl font-bold text-black font-playful">Milníky</h2>
          </button>
        </div>
        {!showAddForm && !isCollapsed && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Přidat milník
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && !isCollapsed && (
        <div className="mb-4 p-4 bg-white rounded-lg border-2 border-primary-500">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Název milníku"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
            <textarea
              placeholder="Popis (volitelné)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={2}
            />
            <input
              type="date"
              placeholder="Datum dokončení"
              value={newCompletedDate}
              onChange={(e) => setNewCompletedDate(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Vytvořit
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewTitle('')
                  setNewDescription('')
                  setNewCompletedDate('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {!isCollapsed && (
        <>
          {sortedMilestones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Žádné milníky</p>
            </div>
          ) : (
        <div className="relative pl-8">
          {/* Timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-primary-200"></div>

          {sortedMilestones.map((milestone, index) => (
            <div key={milestone.id} className="relative mb-6">
              {/* Timeline dot */}
              <div className="absolute left-0 top-2 w-6 h-6 bg-primary-500 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>

              {/* Milestone card */}
              <div className="ml-8 bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-primary-300 transition-colors">
                {editingId === milestone.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500 font-semibold"
                      autoFocus
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                      rows={2}
                    />
                    <input
                      type="date"
                      value={editCompletedDate}
                      onChange={(e) => setEditCompletedDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdate(milestone.id)}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium"
                      >
                        Uložit
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                      >
                        Zrušit
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{milestone.title}</h3>
                        {milestone.description && (
                          <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                        )}
                        {milestone.completed_date && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(milestone.completed_date)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(milestone)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Upravit"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(milestone.id)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Smazat"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
          )}
        </>
      )}
    </div>
  )
}
