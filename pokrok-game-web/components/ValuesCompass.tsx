'use client'

import { useState, memo } from 'react'
import { Value } from '@/lib/cesta-db'
import { Edit2, Trash2, Save, X } from 'lucide-react'

interface ValuesCompassProps {
  values: Value[]
  onValueUpdate?: (value: Value) => void
  onValueDelete?: (valueId: string) => void
}

export const ValuesCompass = memo(function ValuesCompass({ values, onValueUpdate, onValueDelete }: ValuesCompassProps) {
  const [editingValue, setEditingValue] = useState<Value | null>(null)
  const [editedValue, setEditedValue] = useState<Partial<Value>>({})
  const [showAddValue, setShowAddValue] = useState(false)
  const [newValue, setNewValue] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'heart'
  })
  const userValues = values.filter(v => v.user_id !== 'system')
  const systemValues = values.filter(v => v.user_id === 'system')

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
    '#06B6D4', '#84CC16', '#6B7280', '#EC4899', '#6366F1'
  ]

  const handleValueClick = (value: Value) => {
    setEditingValue(value)
    setEditedValue({
      name: value.name,
      description: value.description || '',
      color: value.color,
      icon: value.icon
    })
  }

  const handleSaveValue = async () => {
    if (!editingValue || !onValueUpdate) return
    
    try {
      const response = await fetch(`/api/cesta/values/${editingValue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedValue)
      })
      
      if (response.ok) {
        const data = await response.json()
        onValueUpdate(data.value)
        setEditingValue(null)
        setEditedValue({})
      }
    } catch (error) {
      console.error('Error updating value:', error)
    }
  }

  const handleDeleteValue = async () => {
    if (!editingValue || !onValueDelete) return
    
    try {
      const response = await fetch(`/api/cesta/values/${editingValue.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        onValueDelete(editingValue.id)
        setEditingValue(null)
        setEditedValue({})
      }
    } catch (error) {
      console.error('Error deleting value:', error)
    }
  }

  const handleCreateValue = async () => {
    if (!newValue.name.trim()) return
    
    try {
      const response = await fetch('/api/cesta/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newValue)
      })
      
      if (response.ok) {
        const data = await response.json()
        if (onValueUpdate) {
          onValueUpdate(data.value)
        }
        setNewValue({ name: '', description: '', color: '#3B82F6', icon: 'heart' })
        setShowAddValue(false)
      }
    } catch (error) {
      console.error('Error creating value:', error)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Váš kompas hodnot</h2>
          <p className="text-gray-600">Hodnoty, které vás vedou na vaší cestě</p>
        </div>
        <button
          onClick={() => setShowAddValue(true)}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <span className="text-lg">+</span>
          <span>Přidat hodnotu</span>
        </button>
      </div>

      {/* Values Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {values.map((value) => (
          <div
            key={value.id}
            onClick={() => handleValueClick(value)}
            className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${
              value.is_custom 
                ? 'border-primary-300 bg-primary-50' 
                : 'border-primary-200 bg-primary-25'
            }`}
          >
            {/* Custom Value Indicator */}
            {value.is_custom && (
              <div className="absolute -top-2 -right-2">
                <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">★</span>
                </div>
              </div>
            )}

            <div className="text-center">
              {/* Value Icon */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl mx-auto mb-3"
                style={{ backgroundColor: value.color }}
              >
                {value.icon}
              </div>

              {/* Value Name */}
              <h3 className="font-semibold text-gray-900 mb-1">{value.name}</h3>
              
              {/* Value Description */}
              {value.description && (
                <p className="text-xs text-gray-600 leading-tight">{value.description}</p>
              )}

              {/* Value Type */}
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  value.is_custom 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-primary-50 text-primary-600'
                }`}>
                  {value.is_custom ? 'Vlastní' : 'Přednastavená'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Values Summary */}
      <div className="mt-8 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Celkem hodnot</h3>
            <p className="text-sm text-gray-600">
              {values.length} hodnot ({userValues.length} vlastních, {systemValues.length} přednastavených)
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">{values.length}</div>
            <div className="text-xs text-gray-500">aktivních</div>
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="mt-6 text-center">
        <blockquote className="text-gray-600 italic">
          "Vaše hodnoty jsou jako kompas - vždy vás nasměrují správným směrem, i když se cesta zdá nejasná."
        </blockquote>
      </div>

      {/* Value Edit Modal */}
      {editingValue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upravit hodnotu</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Název</label>
                <input
                  type="text"
                  value={editedValue.name || ''}
                  onChange={(e) => setEditedValue({...editedValue, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
                <textarea
                  value={editedValue.description || ''}
                  onChange={(e) => setEditedValue({...editedValue, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barva</label>
                <div className="flex space-x-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditedValue({...editedValue, color})}
                      className={`w-8 h-8 rounded-full border-2 ${
                        editedValue.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ikona</label>
                <input
                  type="text"
                  value={editedValue.icon || ''}
                  onChange={(e) => setEditedValue({...editedValue, icon: e.target.value})}
                  placeholder="např. heart, star, compass"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveValue}
                className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Uložit
              </button>
              <button
                onClick={handleDeleteValue}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Smazat
              </button>
              <button
                onClick={() => {
                  setEditingValue(null)
                  setEditedValue({})
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Value Modal */}
      {showAddValue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nová hodnota</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Název</label>
                <input
                  type="text"
                  value={newValue.name}
                  onChange={(e) => setNewValue({...newValue, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Zadejte název hodnoty"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
                <textarea
                  value={newValue.description}
                  onChange={(e) => setNewValue({...newValue, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Popište svou hodnotu"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barva</label>
                <div className="flex space-x-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewValue({...newValue, color})}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newValue.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ikona</label>
                <div className="grid grid-cols-6 gap-2">
                  {['❤️', '⭐', '🧭', '📈', '🎨', '💼', '🗺️', '🌙', '☀️', '🛡️', '⚡', '🎯'].map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewValue({...newValue, icon})}
                      className={`w-8 h-8 rounded border text-lg ${
                        newValue.icon === icon ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateValue}
                className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Vytvořit hodnotu
              </button>
              <button
                onClick={() => {
                  setShowAddValue(false)
                  setNewValue({ name: '', description: '', color: '#3B82F6', icon: 'heart' })
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})