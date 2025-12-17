'use client'

import { useEffect, useState } from 'react'
import { Book, Video, FileText, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import type { InspirationData, InspirationItem } from '@/lib/inspiration'

type Category = 'articles' | 'videos' | 'books'

export default function AdminInspirationPage() {
  const [data, setData] = useState<InspirationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showAddForm, setShowAddForm] = useState<Category | null>(null)
  const [formData, setFormData] = useState<Partial<InspirationItem>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/inspiration')
      const data = await res.json()
      setData(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const handleAdd = async (category: Category) => {
    try {
      const res = await fetch('/api/inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          ...formData,
          type: category.slice(0, -1), // Remove 's' from end
        }),
      })

      if (res.ok) {
        await fetchData()
        setShowAddForm(null)
        setFormData({})
      }
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Chyba při přidávání položky')
    }
  }

  const handleUpdate = async (category: Category, id: string) => {
    try {
      const res = await fetch('/api/inspiration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          id,
          ...formData,
        }),
      })

      if (res.ok) {
        await fetchData()
        setEditingId(null)
        setEditingCategory(null)
        setFormData({})
      }
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Chyba při aktualizaci položky')
    }
  }

  const handleDelete = async (category: Category, id: string) => {
    if (!confirm('Opravdu chcete smazat tuto položku?')) return

    try {
      const res = await fetch(`/api/inspiration?category=${category}&id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Chyba při mazání položky')
    }
  }

  const startEdit = (item: InspirationItem, category: Category) => {
    setEditingId(item.id)
    setEditingCategory(category)
    setFormData({
      title: item.title,
      description: item.description,
      link: item.link,
      author: item.author,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingCategory(null)
    setFormData({})
  }

  const renderSection = (title: string, items: InspirationItem[], category: Category, icon: typeof FileText) => {
    const Icon = icon
    const isEditing = editingCategory === category
    const isAdding = showAddForm === category

    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary flex items-center">
            <Icon className="mr-3 text-primary-600" size={28} />
            {title}
          </h2>
          <button
            onClick={() => {
              setShowAddForm(isAdding ? null : category)
              setFormData({})
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            Přidat
          </button>
        </div>

        {isAdding && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-primary-200">
            <h3 className="text-lg font-semibold mb-4">Přidat novou položku</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Název"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {category === 'books' && (
                <input
                  type="text"
                  placeholder="Autor"
                  value={formData.author || ''}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              )}
              <textarea
                placeholder="Popis"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
              <input
                type="url"
                placeholder="Odkaz (URL)"
                value={formData.link || ''}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleAdd(category)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Save size={18} />
                  Uložit
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(null)
                    setFormData({})
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <X size={18} />
                  Zrušit
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {items.map((item) => {
            const isEditing = editingId === item.id && editingCategory === category

            return (
              <div
                key={item.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-primary-100"
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-semibold text-lg"
                    />
                    {category === 'books' && (
                      <input
                        type="text"
                        value={formData.author || ''}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Autor"
                      />
                    )}
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={3}
                    />
                    <input
                      type="url"
                      value={formData.link || ''}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(category, item.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Save size={18} />
                        Uložit
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <X size={18} />
                        Zrušit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-text-primary">{item.title}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(item, category)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(category, item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    {item.author && (
                      <p className="text-sm text-primary-600 mb-2 font-semibold">{item.author}</p>
                    )}
                    <p className="text-text-secondary mb-2">{item.description}</p>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      {item.link}
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-primary text-xl">Načítání...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-primary text-xl">Chyba při načítání dat</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="section-padding">
        <div className="max-w-6xl mx-auto container-padding">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Správa inspirace</h1>
            <p className="text-text-secondary">Spravujte články, videa a knihy v sekci inspirace</p>
          </div>

          {renderSection('Články', data.articles, 'articles', FileText)}
          {renderSection('Videa', data.videos, 'videos', Video)}
          {renderSection('Knihy', data.books, 'books', Book)}
        </div>
      </div>
    </div>
  )
}
