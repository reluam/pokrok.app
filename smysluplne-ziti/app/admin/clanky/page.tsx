'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Edit2, Trash2, X, ArrowLeft, Loader2, Eye, EyeOff, Save } from 'lucide-react'
import Link from 'next/link'
import type { Article } from '@/lib/articles'

export default function AdminClankyPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    published: false,
  })
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/login')
      const data = await res.json()
      setIsAuthenticated(data.authenticated)
      if (data.authenticated) {
        fetchArticles()
      } else {
        router.push('/admin')
      }
    } catch (error) {
      setIsAuthenticated(false)
      router.push('/admin')
    }
  }

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles')
      const data = await res.json()
      setArticles(data.articles || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching articles:', error)
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingArticle(null)
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      published: false,
    })
    setShowModal(true)
  }

  const openEditModal = (article: Article) => {
    setEditingArticle(article)
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      published: article.published,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingArticle(null)
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      published: false,
    })
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Vyplňte prosím název a obsah článku')
      return
    }

    try {
      const url = '/api/articles'
      const method = editingArticle ? 'PUT' : 'POST'
      const body = editingArticle
        ? { id: editingArticle.id, ...formData }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        await fetchArticles()
        closeModal()
      } else {
        const error = await res.json()
        alert(error.error || 'Chyba při ukládání')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Chyba při ukládání')
    }
  }

  const handleDelete = async (article: Article) => {
    if (!confirm(`Opravdu chcete smazat článek "${article.title}"?`)) return

    try {
      const res = await fetch(`/api/articles?id=${article.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchArticles()
      } else {
        alert('Chyba při mazání')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Chyba při mazání')
    }
  }

  const togglePublished = async (article: Article) => {
    try {
      const res = await fetch('/api/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: article.id,
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          published: !article.published,
        }),
      })

      if (res.ok) {
        await fetchArticles()
      }
    } catch (error) {
      console.error('Error toggling published:', error)
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
              <h1 className="text-4xl font-bold text-text-primary mb-2">Správa článků</h1>
              <p className="text-text-secondary">Vytvářejte a spravujte vlastní články</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              Přidat článek
            </button>
          </div>

          {/* Articles list */}
          {articles.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 border border-primary-100 text-center">
              <FileText className="mx-auto text-primary-200 mb-4" size={64} />
              <h3 className="text-2xl font-bold text-text-primary mb-2">Zatím žádné články</h3>
              <p className="text-text-secondary mb-6">Začněte vytvořením prvního článku</p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition-colors"
              >
                <Plus size={20} />
                Vytvořit první článek
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-primary-100 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-text-primary">{article.title}</h3>
                        {article.published ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Eye size={12} />
                            Publikováno
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold flex items-center gap-1">
                            <EyeOff size={12} />
                            Návrh
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm mb-2">{article.excerpt}</p>
                      <div className="flex items-center gap-4 text-xs text-text-light">
                        <span>Vytvořeno: {new Date(article.createdAt).toLocaleDateString('cs-CZ')}</span>
                        <span>Upraveno: {new Date(article.updatedAt).toLocaleDateString('cs-CZ')}</span>
                        {article.published && (
                          <Link
                            href={`/clanky/${article.slug}`}
                            target="_blank"
                            className="text-primary-600 hover:text-primary-700"
                          >
                            Zobrazit článek →
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => togglePublished(article)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title={article.published ? 'Zrušit publikaci' : 'Publikovat'}
                      >
                        {article.published ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        onClick={() => openEditModal(article)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Upravit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(article)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Smazat"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              aria-label="Zavřít"
            >
              <X size={24} className="text-text-secondary" />
            </button>

            <div className="p-8 flex-1 overflow-y-auto">
              <h2 className="text-3xl font-bold text-text-primary mb-6">
                {editingArticle ? 'Upravit článek' : 'Nový článek'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Název článku *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-lg font-semibold"
                    placeholder="Název článku"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Úvodní text (excerpt)
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    rows={3}
                    placeholder="Krátký úvodní text, který se zobrazí v seznamu článků"
                  />
                  <p className="text-xs text-text-light mt-1">
                    Pokud nevyplníte, použije se automaticky první část obsahu.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Obsah článku *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white font-mono text-sm"
                    rows={15}
                    placeholder="Obsah článku (podporuje Markdown nebo HTML)"
                    required
                  />
                  <p className="text-xs text-text-light mt-1">
                    Můžete použít Markdown syntaxi nebo HTML.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-5 h-5 text-primary-600 border-2 border-primary-200 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="published" className="text-sm font-medium text-text-primary cursor-pointer">
                    Publikovat článek (bude viditelný na webu)
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-primary-100 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
              >
                Zrušit
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingArticle ? 'Uložit změny' : 'Vytvořit článek'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

