'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface GoalsSetupViewProps {
  onGoalsCreated: (goalsData: any[]) => void
}

export function GoalsSetupView({ onGoalsCreated }: GoalsSetupViewProps) {
  const { user } = useUser()
  const [goals, setGoals] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')
  const [selectedAreaId, setSelectedAreaId] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Load areas when component mounts
  useEffect(() => {
    const loadAreas = async () => {
      if (!user) return

      try {
        const userResponse = await fetch(`/api/user?clerkId=${user.id}`)
        if (userResponse.ok) {
          const dbUser = await userResponse.json()
          const areasResponse = await fetch(`/api/areas?userId=${dbUser.id}`)
          if (areasResponse.ok) {
            const areasData = await areasResponse.json()
            setAreas(areasData)
          } else {
            // Create default areas if none exist
            await createDefaultAreas(dbUser.id)
          }
        }
      } catch (error) {
        console.error('Error loading areas:', error)
      }
    }

    loadAreas()
  }, [user])

  const createDefaultAreas = async (userId: string) => {
    const defaultAreas = [
      { name: 'Osobní', description: 'Osobní rozvoj a růst', color: '#3B82F6', icon: '👤' },
      { name: 'Kariéra', description: 'Profesní cíle a rozvoj', color: '#10B981', icon: '💼' },
      { name: 'Zdraví', description: 'Fyzické a duševní zdraví', color: '#F59E0B', icon: '💪' },
      { name: 'Vzdělání', description: 'Učení a vzdělávání', color: '#8B5CF6', icon: '📚' },
      { name: 'Vztahy', description: 'Rodina, přátelé a vztahy', color: '#EF4444', icon: '❤️' },
      { name: 'Koníčky', description: 'Volný čas a zábava', color: '#06B6D4', icon: '🎨' }
    ]

    try {
      for (let i = 0; i < defaultAreas.length; i++) {
        const area = defaultAreas[i]
        await fetch('/api/areas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name: area.name,
            description: area.description,
            color: area.color,
            icon: area.icon,
            order: i
          })
        })
      }
      
      // Reload areas
      const areasResponse = await fetch(`/api/areas?userId=${userId}`)
      if (areasResponse.ok) {
        const areasData = await areasResponse.json()
        setAreas(areasData)
      }
    } catch (error) {
      console.error('Error creating default areas:', error)
    }
  }

  const handleAddGoal = async () => {
    if (!goalTitle.trim() || !user) return

    setIsCreating(true)
    try {
      // Get user from database via API
      const userResponse = await fetch(`/api/user?clerkId=${user.id}`)
      if (!userResponse.ok) {
        console.error('User not found in database')
        return
      }

      const dbUser = await userResponse.json()

      const goalData = {
        userId: dbUser.id,
        title: goalTitle.trim(),
        description: goalDescription.trim() || undefined,
        targetDate: goalDeadline || undefined,
        status: 'active',
        priority: 'meaningful',
        areaId: selectedAreaId || null,
        goalType: 'outcome',
        progressPercentage: 0,
        progressType: 'percentage'
      }

      console.log('Creating goal:', goalData)
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      })
      
      if (response.ok) {
        const createdGoal = await response.json()
        console.log('Goal created successfully:', createdGoal)
        setGoals(prev => [...prev, createdGoal])
        
        // Reset form
        setGoalTitle('')
        setGoalDescription('')
        setGoalDeadline('')
        setSelectedAreaId('')
      } else {
        console.error('Failed to create goal')
      }
    } catch (error) {
      console.error('Error creating goal:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleContinue = () => {
    console.log('Goals created:', goals)
    onGoalsCreated(goals)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full" style={{
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '14px'
      }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4" style={{
            textShadow: '2px 2px 0px #000000',
            color: '#2d5016'
          }}>TVOJE CÍLE</h1>
          <p className="text-gray-600">Jaké cíle chceš dosáhnout?</p>
        </div>

                {/* Current Goals */}
                {goals.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">PŘIDANÉ CÍLE ({goals.length})</h2>
                    <div className="space-y-2">
                      {goals.map((goal) => (
                        <div key={goal.id} className="p-3 bg-gray-50 rounded-lg border">
                          <h3 className="font-bold text-gray-900">{goal.title}</h3>
                          {goal.description && <p className="text-sm text-gray-600">{goal.description}</p>}
                          <div className="text-xs text-gray-500 mt-1">
                            Oblast: {areas.find(a => a.id === goal.area_id)?.name || 'Nespecifikováno'} • Deadline: {goal.target_date ? new Date(goal.target_date).toLocaleDateString('cs-CZ') : 'Bez deadlinu'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

        {/* Add New Goal */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">PŘIDAT NOVÝ CÍL</h2>
          
          <div className="space-y-4">
            {/* Goal Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">NÁZEV CÍLE</label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="Např. Naučit se programovat"
                maxLength={100}
              />
            </div>

            {/* Goal Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">POPIS (volitelné)</label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                rows={3}
                placeholder="Podrobnější popis cíle..."
                maxLength={500}
              />
            </div>

                    {/* Goal Area */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">OBLAST</label>
                      <select
                        value={selectedAreaId}
                        onChange={(e) => setSelectedAreaId(e.target.value)}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      >
                        <option value="">Vyberte oblast</option>
                        {areas.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.icon} {area.name}
                          </option>
                        ))}
                      </select>
                    </div>

            {/* Goal Deadline */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">DEADLINE (volitelné)</label>
              <input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Add Goal Button */}
                    <button
                      onClick={handleAddGoal}
                      disabled={!goalTitle.trim() || isCreating}
                      className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? 'VYTVÁŘÍM...' : 'PŘIDAT CÍL'}
                    </button>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all duration-300"
          >
            POKRAČOVAT NA NÁVYKY
          </button>
        </div>
      </div>
    </div>
  )
}

