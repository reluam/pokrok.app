'use client'

import { useState } from 'react'
import { X, Send, Loader2 } from 'lucide-react'

interface ShareModalProps {
  briefId: number
  title: string
  summary: string
  onClose: () => void
  onShared: () => void
}

export default function ShareModal({ briefId, title, summary, onClose, onShared }: ShareModalProps) {
  const [curatorNote, setCuratorNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleShare() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/curated-posts/quick-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId, curatorNote: curatorNote.trim() || undefined }),
      })
      if (res.ok) {
        onShared()
      }
    } catch (e) {
      console.error('Share failed:', e)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl border-2 border-black/10 shadow-xl w-full max-w-lg mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Sdílet do feedu</h3>
          <button onClick={onClose} className="text-foreground/30 hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Article preview */}
        <div className="bg-black/[0.02] rounded-xl p-4 mb-4">
          <p className="font-semibold text-sm text-foreground">{title}</p>
          <p className="text-xs text-foreground/60 mt-1 leading-relaxed">{summary}</p>
        </div>

        {/* Curator note */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-foreground/60 mb-2">
            Tvoje poznámka (volitelné)
          </label>
          <textarea
            value={curatorNote}
            onChange={(e) => setCuratorNote(e.target.value)}
            placeholder="Proč tě to zaujalo? Osobní komentář..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl text-sm border-2 border-black/10 bg-white focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-foreground/50 hover:text-foreground transition-colors"
          >
            Zrušit
          </button>
          <button
            onClick={handleShare}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Publikovat do feedu
          </button>
        </div>
      </div>
    </div>
  )
}
