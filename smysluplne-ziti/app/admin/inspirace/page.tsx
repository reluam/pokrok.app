'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Book, Video, FileText, Plus, Edit2, Trash2, X, ArrowLeft, Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { InspirationData, InspirationItem } from '@/lib/inspiration'

type Category = 'articles' | 'videos' | 'books'
type ItemType = 'article' | 'video' | 'book'

const getTypeLabel = (type: ItemType): string => {
  switch (type) {
    case 'article': return 'Článek'
    case 'video': return 'Video'
    case 'book': return 'Kniha'
    default: return type
  }
}

const getTypeIcon = (type: ItemType) => {
  switch (type) {
    case 'article': return FileText
    case 'video': return Video
    case 'book': return Book
    default: return FileText
  }
}

export default function AdminInspirationPage() {
  const [data, setData] = useState<InspirationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<{ item: InspirationItem; category: Category } | null>(null)
  const [formData, setFormData] = useState<Partial<InspirationItem & { category: Category }>>({})
  const [filterType, setFilterType] = useState<ItemType | 'all'>('all')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/login')
      const data = await res.json()
      setIsAuthenticated(data.authenticated)
      if (data.authenticated) {
        fetchData()
      } else {
        router.push('/admin')
      }
    } catch (error) {
      setIsAuthenticated(false)
      router.push('/admin')
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

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

  const getAllItems = (): Array<InspirationItem & { category: Category; type: ItemType }> => {
    if (!data) return []
    
    const items: Array<InspirationItem & { category: Category; type: ItemType }> = []
    
    data.articles.forEach(item => {
      items.push({ ...item, category: 'articles', type: 'article' })
    })
    data.videos.forEach(item => {
      items.push({ ...item, category: 'videos', type: 'video' })
    })
    data.books.forEach(item => {
      items.push({ ...item, category: 'books', type: 'book' })
    })
    
    return items.sort((a, b) => a.title.localeCompare(b.title))
  }

  const filteredItems = getAllItems().filter(item => 
    filterType === 'all' || item.type === filterType
  )

  const openAddModal = (type?: ItemType) => {
    setFormData({ 
      type: type || 'article',
      category: type === 'book' ? 'books' : type === 'video' ? 'videos' : 'articles'
    })
    setShowAddModal(true)
    setEditingItem(null)
  }

  const openEditModal = (item: InspirationItem, category: Category) => {
    const type = category === 'books' ? 'book' : category === 'videos' ? 'video' : 'article'
    setEditingItem({ item, category })
    setFormData({
      ...item,
      type,
      category
    })
    setShowAddModal(true)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingItem(null)
    setFormData({})
  }

  const handleSave = async () => {
    if (!formData.title || !formData.link || !formData.description) {
      alert('Vyplňte prosím všechny povinné pole')
      return
    }

    const category = formData.category || 'articles'
    const isEditing = editingItem !== null

    try {
      const url = '/api/inspiration'
      const method = isEditing ? 'PUT' : 'POST'
      const body = isEditing
        ? { category, id: editingItem.item.id, ...formData }
        : { category, ...formData, type: category.slice(0, -1) }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        await fetchData()
        closeModal()
      } else {
        alert('Chyba při ukládání')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Chyba při ukládání')
    }
  }

  const handleDelete = async (item: InspirationItem, category: Category) => {
    if (!confirm(`Opravdu chcete smazat "${item.title}"?`)) return

    try {
      const res = await fetch(`/api/inspiration?category=${category}&id=${item.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchData()
      } else {
        alert('Chyba při mazání')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Chyba při mazání')
    }
  }

  if (isAuthenticated === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-primary text-xl">Chyba při načítání dat</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="section-padding">
        <div className="max-w-7xl mx-auto container-padding">
          {/* Header */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Zpět na administraci</span>
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-text-primary mb-2">Správa inspirace</h1>
              <p className="text-text-secondary">Přehled a správa všech inspirací</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openAddModal('article')}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={18} />
                Přidat článek
              </button>
              <button
                onClick={() => openAddModal('video')}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={18} />
                Přidat video
              </button>
              <button
                onClick={() => openAddModal('book')}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={18} />
                Přidat knihu
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Vše
            </button>
            <button
              onClick={() => setFilterType('article')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'article'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Články
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'video'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Videa
            </button>
            <button
              onClick={() => setFilterType('book')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'book'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Knihy
            </button>
          </div>

          {/* Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-primary-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Typ</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Název</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Autor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Popis</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Odkaz</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                        Žádné položky nenalezeny
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const Icon = getTypeIcon(item.type)
                      return (
                        <tr key={item.id} className="hover:bg-primary-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Icon className="text-primary-600" size={20} />
                              <span className="text-sm text-text-primary">{getTypeLabel(item.type)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-text-primary">{item.title}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-text-secondary">{item.author || '-'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-text-secondary max-w-md truncate" title={item.description}>
                              {item.description}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                              <span className="truncate max-w-xs">{item.link}</span>
                              <ExternalLink size={14} />
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditModal(item, item.category)}
                                className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                                title="Upravit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(item, item.category)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Smazat"
                              >
                                <Trash2 size={18} />
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
          </div>

          {/* Stats */}
          <div className="mt-6 text-sm text-text-secondary">
            Celkem: {filteredItems.length} {filteredItems.length === 1 ? 'položka' : filteredItems.length < 5 ? 'položky' : 'položek'}
            {filterType === 'all' && (
              <span className="ml-4">
                (Články: {data.articles.length}, Videa: {data.videos.length}, Knihy: {data.books.length})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              aria-label="Zavřít"
            >
              <X size={24} className="text-text-secondary" />
            </button>

            <div className="p-8">
              <h2 className="text-3xl font-bold text-text-primary mb-6">
                {editingItem ? 'Upravit položku' : 'Přidat novou položku'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Typ *
                  </label>
                  <select
                    value={formData.type || 'article'}
                    onChange={(e) => {
                      const type = e.target.value as ItemType
                      setFormData({
                        ...formData,
                        type,
                        category: type === 'book' ? 'books' : type === 'video' ? 'videos' : 'articles'
                      })
                    }}
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    disabled={!!editingItem}
                  >
                    <option value="article">Článek</option>
                    <option value="video">Video</option>
                    <option value="book">Kniha</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Název *
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    placeholder="Název článku/videa/knihy"
                    required
                  />
                </div>

                {(formData.type === 'book' || editingItem?.category === 'books') && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Autor
                    </label>
                    <input
                      type="text"
                      value={formData.author || ''}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                      placeholder="Autor knihy"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Popis *
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    rows={4}
                    placeholder="Popis článku/videa/knihy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Odkaz (URL) *
                  </label>
                  <input
                    type="url"
                    value={formData.link || ''}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    placeholder="https://..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Zrušit
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition-colors"
                  >
                    {editingItem ? 'Uložit změny' : 'Přidat položku'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
