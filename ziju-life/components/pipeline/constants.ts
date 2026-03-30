export const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  psychology: { label: 'Psychologie', emoji: '🧠', color: '#a78bfa' },
  neuroscience: { label: 'Neurověda', emoji: '⚡', color: '#f59e0b' },
  health: { label: 'Zdraví', emoji: '💪', color: '#10b981' },
  productivity: { label: 'Produktivita', emoji: '⏰', color: '#f97316' },
  mindfulness: { label: 'Mindfulness', emoji: '🧘', color: '#3b82f6' },
  relationships: { label: 'Vztahy', emoji: '🤝', color: '#ec4899' },
}

export const PIPELINE_STATUSES = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'saved', label: 'Uložené' },
  { value: 'in_progress', label: 'Rozpracované' },
  { value: 'drafted', label: 'Draft' },
  { value: 'published', label: 'Publikované' },
  { value: 'archived', label: 'Archivované' },
] as const

export function relevanceBadgeClass(score: number): string {
  if (score >= 9) return 'bg-emerald-100 text-emerald-700'
  if (score >= 7) return 'bg-blue-100 text-blue-700'
  if (score >= 5) return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-500'
}
