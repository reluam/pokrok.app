'use client'

import { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'

interface SettingsViewProps {
  player: any
  onPlayerUpdate: (player: any) => void
  onBack?: () => void
}

type SettingsTab = 'user' | 'areas' | 'goals' | 'steps' | 'daily-plan' | 'statistics' | 'player' | 'workflows' | 'danger'

export function SettingsView({ player, onPlayerUpdate, onBack }: SettingsViewProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [activeTab, setActiveTab] = useState<SettingsTab>('user')
  const [isEditing, setIsEditing] = useState(false)
  const [playerName, setPlayerName] = useState(player?.name || '')
  const [hairColor, setHairColor] = useState(player?.appearance?.hairColor || '#8B4513')
  const [skinColor, setSkinColor] = useState(player?.appearance?.skinColor || '#FDBCB4')
  const [eyeColor, setEyeColor] = useState(player?.appearance?.eyeColor || '#4A90E2')
  const [isSaving, setIsSaving] = useState(false)
  
  // Areas management state
  const [areas, setAreas] = useState<any[]>([])
  const [editingArea, setEditingArea] = useState<any>(null)
  const [newArea, setNewArea] = useState({ name: '', description: '', color: '#3B82F6', icon: '👤' })
  const [showNewAreaForm, setShowNewAreaForm] = useState(false)
  const [isSavingArea, setIsSavingArea] = useState(false)
  const [isDeletingArea, setIsDeletingArea] = useState<string | null>(null)
  
  // Available icons for areas
  const availableIcons = [
    '👤', '💼', '💪', '📚', '❤️', '🎨', '🏠', '💰', '🌱', '🎯',
    '⚡', '🔥', '💡', '🌟', '🎪', '🏃', '🧘', '🍎', '📱', '🎵',
    '🎮', '📷', '✈️', '🌍', '🔬', '🎭', '🏆', '💎', '🌈', '🚀'
  ]
  
  // Goals settings state
  const [goalsSettings, setGoalsSettings] = useState({
    defaultStatus: 'active',
    autoComplete: false,
    reminderDays: 7,
    maxGoals: 10
  })
  
  // Steps settings state
  const [stepsSettings, setStepsSettings] = useState({
    defaultXpReward: 1,
    autoAddToDaily: false,
    maxStepsPerGoal: 20,
    estimatedTimeDefault: 30
  })
  
  // Daily plan settings state
  const [dailyPlanSettings, setDailyPlanSettings] = useState({
    maxDailySteps: 5,
    resetHour: 6,
    autoReset: true,
    showMotivation: true
  })
  
  // Statistics settings state
  const [statisticsSettings, setStatisticsSettings] = useState({
    showStreaks: true,
    showProgress: true,
    showAchievements: true,
    dataRetentionDays: 365
  })
  
  // Workflows state
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loadingWorkflows, setLoadingWorkflows] = useState(false)

  // Load areas on component mount
  useEffect(() => {
    const loadAreas = async () => {
      try {
        if (player?.user_id) {
          const response = await fetch(`/api/areas?userId=${player.user_id}`)
          if (response.ok) {
            const areasData = await response.json()
            setAreas(areasData)
          }
        }
      } catch (error) {
        console.error('Error loading areas:', error)
      }
    }
    loadAreas()
  }, [player])

  // Load workflows on component mount
  useEffect(() => {
    const loadWorkflows = async () => {
      if (!player?.user_id) return
      setLoadingWorkflows(true)
      try {
        const response = await fetch(`/api/workflows?userId=${player.user_id}`)
        if (response.ok) {
          const workflowsData = await response.json()
          setWorkflows(workflowsData)
        }
      } catch (error) {
        console.error('Error loading workflows:', error)
      } finally {
        setLoadingWorkflows(false)
      }
    }
    loadWorkflows()
  }, [player])

  // Workflows handlers
  const handleToggleWorkflow = async (workflowId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
      if (response.ok) {
        setWorkflows(prev => prev.map(w => 
          w.id === workflowId ? { ...w, enabled } : w
        ))
      }
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  const handleToggleBuiltInWorkflow = async (type: string) => {
    const existing = workflows.find(w => w.type === type)
    const enabled = existing ? !existing.enabled : true
    
    try {
      if (existing) {
        await handleToggleWorkflow(existing.id, enabled)
      } else {
        // Create new workflow
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: player?.user_id,
            type,
            name: type === 'daily_review' ? 'Pohled za dneškem' : 'Workflow',
            description: type === 'daily_review' 
              ? 'Reflexe nad uplynulým dnem'
              : 'Workflow description',
            trigger_time: '18:00',
            enabled
          })
        })
        if (response.ok) {
          const newWorkflow = await response.json()
          setWorkflows(prev => [...prev, newWorkflow])
        }
      }
    } catch (error) {
      console.error('Error toggling built-in workflow:', error)
    }
  }

  const handleWorkflowTimeChange = async (type: string, time: string) => {
    const workflow = workflows.find(w => w.type === type)
    if (!workflow) return
    
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger_time: time })
      })
      if (response.ok) {
        setWorkflows(prev => prev.map(w => 
          w.id === workflow.id ? { ...w, trigger_time: time } : w
        ))
      }
    } catch (error) {
      console.error('Error updating workflow time:', error)
    }
  }

  const handleConfigureWorkflow = (workflow: any) => {
    // TODO: Open configuration modal
    console.log('Configure workflow:', workflow)
  }

  const handleSaveChanges = async () => {
    if (!player?.id) return

    setIsSaving(true)
    try {
      const updatedPlayer = {
        ...player,
        name: playerName,
        appearance: {
          ...player.appearance,
          hairColor,
          skinColor,
          eyeColor
        }
      }

      const response = await fetch('/api/player', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: player.id,
          name: playerName,
          appearance: {
            hairColor,
            skinColor,
            eyeColor
          }
        })
      })

      if (response.ok) {
        onPlayerUpdate(updatedPlayer)
        setIsEditing(false)
      } else {
        console.error('Failed to update player')
      }
    } catch (error) {
      console.error('Error updating player:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    signOut()
  }

  // Areas management functions
  const handleCreateArea = async () => {
    if (!newArea.name.trim() || !player?.user_id) return

    setIsSavingArea(true)
    try {
      const response = await fetch('/api/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: player.user_id,
          name: newArea.name,
          description: newArea.description,
          color: newArea.color,
          icon: newArea.icon,
          order: areas.length
        })
      })

      if (response.ok) {
        const newAreaData = await response.json()
        setAreas(prev => [...prev, newAreaData])
        setNewArea({ name: '', description: '', color: '#3B82F6', icon: '👤' })
        setShowNewAreaForm(false)
      }
    } catch (error) {
      console.error('Error creating area:', error)
    } finally {
      setIsSavingArea(false)
    }
  }

  const handleUpdateArea = async (areaId: string, updates: any) => {
    setIsSavingArea(true)
    try {
      const response = await fetch('/api/areas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: areaId, ...updates })
      })

      if (response.ok) {
        setAreas(prev => prev.map(area => 
          area.id === areaId ? { ...area, ...updates } : area
        ))
        setEditingArea(null)
      }
    } catch (error) {
      console.error('Error updating area:', error)
    } finally {
      setIsSavingArea(false)
    }
  }

  const handleDeleteArea = async (areaId: string) => {
    setIsDeletingArea(areaId)
    try {
      const response = await fetch('/api/areas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: areaId })
      })

      if (response.ok) {
        setAreas(prev => prev.filter(area => area.id !== areaId))
      }
    } catch (error) {
      console.error('Error deleting area:', error)
    } finally {
      setIsDeletingArea(null)
    }
  }

  const tabs = [
    { id: 'user' as SettingsTab, label: 'Uživatel', icon: '👤' },
    { id: 'areas' as SettingsTab, label: 'Životní oblasti', icon: '🎯' },
    { id: 'goals' as SettingsTab, label: 'Cíle', icon: '🎯' },
    { id: 'steps' as SettingsTab, label: 'Kroky', icon: '📋' },
    { id: 'daily-plan' as SettingsTab, label: 'Denní plán', icon: '📅' },
    { id: 'statistics' as SettingsTab, label: 'Statistiky', icon: '📊' },
    { id: 'player' as SettingsTab, label: 'Postava', icon: '🎮' },
    { id: 'workflows' as SettingsTab, label: 'Workflows', icon: '🔄' },
    { id: 'danger' as SettingsTab, label: 'Nebezpečná zóna', icon: '⚠️' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'user':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">👤 INFORMACE O UŽIVATELI</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-4">📧 Kontaktní údaje</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">Email</label>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                        {user?.emailAddresses[0]?.emailAddress || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">Jméno</label>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                        {user?.firstName || ''} {user?.lastName || ''}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">Uživatelské ID</label>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded border font-mono">
                        {user?.id || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-4">📅 Účet</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">Registrován</label>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('cs-CZ') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">Poslední přihlášení</label>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                        {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString('cs-CZ') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">Stav účtu</label>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                        {user?.emailAddresses[0]?.verification?.status || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'areas':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">🎯 ŽIVOTNÍ OBLASTI</h3>
              <button
                onClick={() => setShowNewAreaForm(!showNewAreaForm)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {showNewAreaForm ? 'Zrušit' : '+ Přidat oblast'}
              </button>
            </div>

            {/* New Area Form */}
            {showNewAreaForm && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Nová životní oblast</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Název</label>
                    <input
                      type="text"
                      value={newArea.name}
                      onChange={(e) => setNewArea((prev: any) => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Např. Zdraví, Kariéra..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Ikona</label>
                    <div className="grid grid-cols-6 gap-2 p-3 border border-gray-300 rounded-lg bg-white max-h-32 overflow-y-auto">
                      {availableIcons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewArea((prev: any) => ({ ...prev, icon }))}
                          className={`w-8 h-8 text-lg rounded hover:bg-gray-100 transition-colors ${
                            newArea.icon === icon ? 'bg-orange-100 border-2 border-orange-500' : 'border border-gray-200'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Barva</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newArea.color}
                        onChange={(e) => setNewArea((prev: any) => ({ ...prev, color: e.target.value }))}
                        className="w-10 h-10 border border-gray-300 rounded-lg"
                      />
                      <span className="text-sm text-gray-600">{newArea.color}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Popis</label>
                    <input
                      type="text"
                      value={newArea.description}
                      onChange={(e) => setNewArea((prev: any) => ({ ...prev, description: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Krátký popis oblasti..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleCreateArea}
                    disabled={isSavingArea || !newArea.name.trim()}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {isSavingArea ? 'Ukládám...' : 'Vytvořit'}
                  </button>
                  <button
                    onClick={() => setShowNewAreaForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            )}

            {/* Areas List */}
            <div className="space-y-4">
              {areas.map((area) => (
                <div key={area.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  {editingArea?.id === area.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">Název</label>
                        <input
                          type="text"
                          value={editingArea.name}
                          onChange={(e) => setEditingArea((prev: any) => ({ ...prev, name: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">Ikona</label>
                        <div className="grid grid-cols-6 gap-2 p-3 border border-gray-300 rounded-lg bg-white max-h-32 overflow-y-auto">
                          {availableIcons.map((icon) => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => setEditingArea((prev: any) => ({ ...prev, icon }))}
                              className={`w-8 h-8 text-lg rounded hover:bg-gray-100 transition-colors ${
                                editingArea.icon === icon ? 'bg-orange-100 border-2 border-orange-500' : 'border border-gray-200'
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">Barva</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editingArea.color}
                            onChange={(e) => setEditingArea((prev: any) => ({ ...prev, color: e.target.value }))}
                            className="w-10 h-10 border border-gray-300 rounded-lg"
                          />
                          <span className="text-sm text-gray-600">{editingArea.color}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">Popis</label>
                        <input
                          type="text"
                          value={editingArea.description}
                          onChange={(e) => setEditingArea((prev: any) => ({ ...prev, description: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="col-span-2 flex gap-2">
                        <button
                          onClick={() => handleUpdateArea(area.id, editingArea)}
                          disabled={isSavingArea}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          {isSavingArea ? 'Ukládám...' : 'Uložit'}
                        </button>
                        <button
                          onClick={() => setEditingArea(null)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Zrušit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: area.color }}
                        >
                          {area.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{area.name}</h4>
                          <p className="text-sm text-gray-600">{area.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingArea(area)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          Upravit
                        </button>
                        <button
                          onClick={() => handleDeleteArea(area.id)}
                          disabled={isDeletingArea === area.id}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {isDeletingArea === area.id ? 'Mažu...' : 'Smazat'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case 'goals':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">🎯 NASTAVENÍ CÍLŮ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">📊 Základní nastavení</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Výchozí stav cíle</label>
                    <select 
                      value={goalsSettings.defaultStatus}
                      onChange={(e) => setGoalsSettings((prev: any) => ({ ...prev, defaultStatus: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="active">Aktivní</option>
                      <option value="completed">Splněný</option>
                      <option value="considering">Ke zvážení</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Maximální počet cílů</label>
                    <input
                      type="number"
                      value={goalsSettings.maxGoals}
                      onChange={(e) => setGoalsSettings((prev: any) => ({ ...prev, maxGoals: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min="1"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Dny před připomínkou</label>
                    <input
                      type="number"
                      value={goalsSettings.reminderDays}
                      onChange={(e) => setGoalsSettings((prev: any) => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min="1"
                      max="30"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">⚙️ Automatizace</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={goalsSettings.autoComplete}
                      onChange={(e) => setGoalsSettings((prev: any) => ({ ...prev, autoComplete: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Automaticky označit cíl jako splněný při dokončení všech kroků</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Posílat notifikace o blížících se deadlinách</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Zobrazovat progress bar v hlavním přehledu</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'steps':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">📋 NASTAVENÍ KROKŮ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">🎮 Herní nastavení</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Výchozí XP odměna</label>
                    <input
                      type="number"
                      value={stepsSettings.defaultXpReward}
                      onChange={(e) => setStepsSettings((prev: any) => ({ ...prev, defaultXpReward: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Maximální počet kroků na cíl</label>
                    <input
                      type="number"
                      value={stepsSettings.maxStepsPerGoal}
                      onChange={(e) => setStepsSettings((prev: any) => ({ ...prev, maxStepsPerGoal: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Výchozí odhadovaný čas (minuty)</label>
                    <input
                      type="number"
                      value={stepsSettings.estimatedTimeDefault}
                      onChange={(e) => setStepsSettings((prev: any) => ({ ...prev, estimatedTimeDefault: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min="5"
                      max="480"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">📅 Denní plán</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={stepsSettings.autoAddToDaily}
                      onChange={(e) => setStepsSettings((prev: any) => ({ ...prev, autoAddToDaily: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Automaticky přidávat nové kroky do denního plánu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Zobrazovat čas potřebný k dokončení kroku</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Umožnit drag & drop pro přeuspořádání kroků</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'daily-plan':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">📅 NASTAVENÍ DENNÍHO PLÁNU</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">📊 Limity a omezení</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Maximální počet denních kroků</label>
                    <input
                      type="number"
                      value={dailyPlanSettings.maxDailySteps}
                      onChange={(e) => setDailyPlanSettings((prev: any) => ({ ...prev, maxDailySteps: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min="1"
                      max="20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Hodina resetu (0-23)</label>
                    <input
                      type="number"
                      value={dailyPlanSettings.resetHour}
                      onChange={(e) => setDailyPlanSettings((prev: any) => ({ ...prev, resetHour: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min="0"
                      max="23"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">⚙️ Automatizace</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={dailyPlanSettings.autoReset}
                      onChange={(e) => setDailyPlanSettings((prev: any) => ({ ...prev, autoReset: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Automaticky resetovat denní plán každý den</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={dailyPlanSettings.showMotivation}
                      onChange={(e) => setDailyPlanSettings((prev: any) => ({ ...prev, showMotivation: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Zobrazovat motivační zprávy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Posílat připomínky o nedokončených krocích</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'statistics':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">📊 NASTAVENÍ STATISTIK</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">📈 Zobrazení</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={statisticsSettings.showStreaks}
                      onChange={(e) => setStatisticsSettings((prev: any) => ({ ...prev, showStreaks: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Zobrazovat streak statistiky</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={statisticsSettings.showProgress}
                      onChange={(e) => setStatisticsSettings((prev: any) => ({ ...prev, showProgress: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Zobrazovat progress grafy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={statisticsSettings.showAchievements}
                      onChange={(e) => setStatisticsSettings((prev: any) => ({ ...prev, showAchievements: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Zobrazovat achievementy</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">💾 Data</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Doba uchování dat (dny)</label>
                    <input
                      type="number"
                      value={statisticsSettings.dataRetentionDays}
                      onChange={(e) => setStatisticsSettings((prev: any) => ({ ...prev, dataRetentionDays: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min="30"
                      max="3650"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Exportovat data do CSV</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Zálohovat data automaticky</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'player':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">🎮 NASTAVENÍ POSTAVY</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Upravit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Ukládám...' : 'Uložit'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setPlayerName(player?.name || '')
                      setHairColor(player?.appearance?.hairColor || '#8B4513')
                      setSkinColor(player?.appearance?.skinColor || '#FDBCB4')
                      setEyeColor(player?.appearance?.eyeColor || '#4A90E2')
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Zrušit
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Character Preview */}
              <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-4">
                <div className="w-32 h-32 rounded-full border-4 border-gray-300 flex items-center justify-center bg-gray-200 mb-4">
                  <div className="w-20 h-20 rounded-full relative" style={{ backgroundColor: skinColor }}>
                    <div
                      className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-8 rounded-full"
                      style={{ backgroundColor: hairColor }}
                    />
                    <div
                      className="absolute top-5 left-4 w-3 h-3 rounded-full"
                      style={{ backgroundColor: eyeColor }}
                    />
                    <div
                      className="absolute top-5 right-4 w-3 h-3 rounded-full"
                      style={{ backgroundColor: eyeColor }}
                    />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-gray-700 rounded-sm" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900">{playerName || 'Hrdina'}</p>
              </div>

              {/* Character Settings */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">JMÉNO POSTAVY</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
                    placeholder="Zadej jméno"
                    maxLength={20}
                  />
                </div>

                {/* Hair Color */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">BARVA VLASŮ</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={hairColor}
                      onChange={(e) => setHairColor(e.target.value)}
                      disabled={!isEditing}
                      className="w-10 h-10 border-2 border-gray-300 rounded-lg cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-600">{hairColor}</span>
                  </div>
                </div>

                {/* Skin Color */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">BARVA PLETI</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={skinColor}
                      onChange={(e) => setSkinColor(e.target.value)}
                      disabled={!isEditing}
                      className="w-10 h-10 border-2 border-gray-300 rounded-lg cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-600">{skinColor}</span>
                  </div>
                </div>

                {/* Eye Color */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">BARVA OČÍ</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={eyeColor}
                      onChange={(e) => setEyeColor(e.target.value)}
                      disabled={!isEditing}
                      className="w-10 h-10 border-2 border-gray-300 rounded-lg cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-600">{eyeColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'workflows':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">🔄 WORKFLOWS</h3>
            <p className="text-gray-600 mb-6">
              Workflows jsou automatizované procesy, které vám pomohou s pravidelnou reflexí a plánováním.
              Nastavte si, kdy se mají zobrazovat, a nechte workflow vést vaše kroky.
            </p>
            
            <div className="space-y-4">
              {loadingWorkflows ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Načítání workflows...</div>
                </div>
              ) : workflows.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600 mb-4">Zatím nemáte žádné workflows.</p>
                </div>
              ) : (
                workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">{workflow.name}</h4>
                        <p className="text-gray-600 text-sm mb-4">{workflow.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>🕐 Čas: {workflow.trigger_time || 'Nenastaveno'}</span>
                          <span className={`px-2 py-1 rounded ${
                            workflow.enabled 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {workflow.enabled ? '✓ Aktivní' : '○ Neaktivní'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleWorkflow(workflow.id, !workflow.enabled)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            workflow.enabled
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {workflow.enabled ? 'Zastavit' : 'Zapnout'}
                        </button>
                        <button
                          onClick={() => handleConfigureWorkflow(workflow)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          Nastavit
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* Built-in Workflows */}
              <div className="mt-8">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Dostupné Workflows</h4>
                
                {/* Pohled za dneškem */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-orange-900 mb-2">🌅 Pohled za dneškem</h5>
                      <p className="text-gray-700 text-sm mb-4">
                        Každý večer vás workflow vyzve k reflexi nad uplynulým dnem. 
                        Odpovězte na otázky o tom, co se povedlo a co ne, a aktualizujte pokrok vašich cílů.
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-700">Čas spuštění:</label>
                          <input
                            type="time"
                            value={workflows.find(w => w.type === 'daily_review')?.trigger_time || '18:00'}
                            onChange={(e) => handleWorkflowTimeChange('daily_review', e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          +10 XP za dokončení
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleBuiltInWorkflow('daily_review')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        workflows.find(w => w.type === 'daily_review')?.enabled
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {workflows.find(w => w.type === 'daily_review')?.enabled ? 'Deaktivovat' : 'Aktivovat'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'danger':
        return (
          <div>
            <h3 className="text-xl font-bold text-red-600 mb-6">⚠️ NEBEZPEČNÁ ZÓNA</h3>
            <div className="bg-red-50 rounded-lg p-6">
              <div className="mb-6">
                <h4 className="text-lg font-bold text-red-800 mb-2">🚨 Varování</h4>
                <p className="text-sm text-gray-700 mb-4">
                  Tyto akce nelze vrátit zpět. Buďte opatrní při jejich používání!
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <h5 className="font-bold text-red-700 mb-2">🚪 Odhlásit se</h5>
                  <p className="text-sm text-gray-600 mb-3">
                    Odhlásí vás z aplikace. Budete muset se znovu přihlásit.
                  </p>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Odhlásit se
                  </button>
                </div>

                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <h5 className="font-bold text-red-700 mb-2">🗑️ Smazat účet</h5>
                  <p className="text-sm text-gray-600 mb-3">
                    Trvale smaže váš účet a všechna data. Tato akce je nevratná!
                  </p>
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                  >
                    Smazat účet (zatím nedostupné)
                  </button>
                </div>

                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <h5 className="font-bold text-red-700 mb-2">🔄 Resetovat všechna data</h5>
                  <p className="text-sm text-gray-600 mb-3">
                    Smaže všechny cíle, návyky, kroky a statistiky. Postava zůstane zachována.
                  </p>
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                  >
                    Resetovat data (zatím nedostupné)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">⚙️ NASTAVENÍ</h2>
              <p className="text-orange-100 mt-2">Spravujte své účet a herní preference</p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-colors"
              >
                ← Zpět
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex">
          {/* Sidebar with Tabs */}
          <div className="w-64 bg-gray-50 border-r border-gray-200">
            <nav className="p-4">
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}