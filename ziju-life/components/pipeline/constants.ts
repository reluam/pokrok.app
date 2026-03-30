export const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  psychology: { label: 'Psychologie', emoji: '🧠', color: '#a78bfa' },
  neuroscience: { label: 'Neurověda', emoji: '⚡', color: '#fbbf24' },
  health: { label: 'Zdraví', emoji: '💪', color: '#34d399' },
  productivity: { label: 'Produktivita', emoji: '⏰', color: '#f97316' },
  mindfulness: { label: 'Mindfulness', emoji: '🧘', color: '#38bdf8' },
  relationships: { label: 'Vztahy', emoji: '🤝', color: '#fb7185' },
}

export const PIPELINE_STATUSES = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'saved', label: 'Uložené' },
  { value: 'in_progress', label: 'Rozpracované' },
  { value: 'drafted', label: 'Draft' },
  { value: 'published', label: 'Publikované' },
  { value: 'archived', label: 'Archivované' },
] as const

export function relevanceBadgeStyle(score: number) {
  if (score >= 9) return { background: 'rgba(16,185,129,0.15)', color: '#34d399' }
  if (score >= 7) return { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }
  if (score >= 5) return { background: 'rgba(234,179,8,0.15)', color: '#fbbf24' }
  return { background: 'rgba(107,114,128,0.15)', color: '#9ca3af' }
}

export const cardStyle = {
  background: '#1a1a1a',
  borderColor: '#2a2a2a',
}

export const inputStyle = {
  background: '#141414',
  borderColor: '#2a2a2a',
  color: '#e5e5e5',
}
