import { Goal, Value, DailyStep, Event } from '../types'

// Date utilities
export const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('cs-CZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateShort = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('cs-CZ', {
    month: 'short',
    day: 'numeric',
  })
}

export const isToday = (date: Date | string): boolean => {
  const today = new Date()
  const targetDate = new Date(date)
  return today.toDateString() === targetDate.toDateString()
}

export const isPast = (date: Date | string): boolean => {
  const today = new Date()
  const targetDate = new Date(date)
  return targetDate < today
}

export const isFuture = (date: Date | string): boolean => {
  const today = new Date()
  const targetDate = new Date(date)
  return targetDate > today
}

// Goal utilities
export const getGoalProgressColor = (progress: number): string => {
  if (progress >= 80) return '#10B981' // green
  if (progress >= 60) return '#F59E0B' // yellow
  if (progress >= 40) return '#F97316' // orange
  return '#EF4444' // red
}

export const getGoalStatusText = (status: Goal['status']): string => {
  const statusMap = {
    active: 'Aktivní',
    completed: 'Dokončeno',
    paused: 'Pozastaveno',
    cancelled: 'Zrušeno',
  }
  return statusMap[status] || status
}

export const getGoalPriorityText = (priority: Goal['priority']): string => {
  const priorityMap = {
    meaningful: 'Smysluplné',
    'nice-to-have': 'Příjemné mít',
  }
  return priorityMap[priority] || priority
}

export const getGoalCategoryText = (category: Goal['category']): string => {
  const categoryMap = {
    'short-term': 'Krátkodobé',
    'medium-term': 'Střednědobé',
    'long-term': 'Dlouhodobé',
  }
  return categoryMap[category] || category
}

// Value utilities
export const getValueLevelText = (level: number): string => {
  const levelMap = {
    1: 'Začátečník',
    2: 'Pokročilý',
    3: 'Zkušený',
    4: 'Expert',
    5: 'Mistr',
  }
  return levelMap[level as keyof typeof levelMap] || `Úroveň ${level}`
}

export const getValueExperienceToNextLevel = (experience: number): number => {
  const thresholds = [0, 250, 500, 750, 1000]
  const currentLevel = Math.floor(experience / 250) + 1
  const nextThreshold = thresholds[Math.min(currentLevel, 4)]
  return Math.max(0, nextThreshold - experience)
}

// Step utilities
export const getStepPriorityColor = (isImportant: boolean, isUrgent: boolean): string => {
  if (isImportant && isUrgent) return '#EF4444' // red
  if (isImportant) return '#F59E0B' // yellow
  if (isUrgent) return '#F97316' // orange
  return '#6B7280' // gray
}

export const getStepPriorityText = (isImportant: boolean, isUrgent: boolean): string => {
  if (isImportant && isUrgent) return 'Důležité a naléhavé'
  if (isImportant) return 'Důležité'
  if (isUrgent) return 'Naléhavé'
  return 'Normální'
}

// Event utilities
export const getEventTypeText = (eventType: Event['event_type']): string => {
  const typeMap = {
    metric_update: 'Aktualizace metriky',
    step_reminder: 'Připomínka kroku',
  }
  return typeMap[eventType] || eventType
}

// Progress calculation utilities
export const calculateGoalProgress = (goal: Goal, steps: DailyStep[]): number => {
  if (goal.progress_type === 'steps') {
    const goalSteps = steps.filter(step => step.goal_id === goal.id)
    if (goalSteps.length === 0) return 0
    
    const completedSteps = goalSteps.filter(step => step.completed).length
    return Math.round((completedSteps / goalSteps.length) * 100)
  }
  
  if (goal.progress_type === 'count' && goal.progress_target) {
    return Math.round(((goal.progress_current || 0) / goal.progress_target) * 100)
  }
  
  if (goal.progress_type === 'amount' && goal.progress_target) {
    return Math.round(((goal.progress_current || 0) / goal.progress_target) * 100)
  }
  
  return goal.progress_percentage
}

// Validation utilities
export const validateGoalData = (goalData: Partial<Goal>): string[] => {
  const errors: string[] = []
  
  if (!goalData.title?.trim()) {
    errors.push('Název cíle je povinný')
  }
  
  if (goalData.title && goalData.title.length > 255) {
    errors.push('Název cíle je příliš dlouhý (max 255 znaků)')
  }
  
  if (goalData.description && goalData.description.length > 1000) {
    errors.push('Popis cíle je příliš dlouhý (max 1000 znaků)')
  }
  
  if (goalData.target_date) {
    const targetDate = new Date(goalData.target_date)
    if (isNaN(targetDate.getTime())) {
      errors.push('Neplatné datum cíle')
    }
  }
  
  if (goalData.progress_target !== undefined && goalData.progress_target < 0) {
    errors.push('Cílová hodnota nemůže být záporná')
  }
  
  if (goalData.progress_current !== undefined && goalData.progress_current < 0) {
    errors.push('Aktuální hodnota nemůže být záporná')
  }
  
  return errors
}

export const validateStepData = (stepData: Partial<DailyStep>): string[] => {
  const errors: string[] = []
  
  if (!stepData.title?.trim()) {
    errors.push('Název kroku je povinný')
  }
  
  if (stepData.title && stepData.title.length > 255) {
    errors.push('Název kroku je příliš dlouhý (max 255 znaků)')
  }
  
  if (stepData.description && stepData.description.length > 1000) {
    errors.push('Popis kroku je příliš dlouhý (max 1000 znaků)')
  }
  
  if (!stepData.date) {
    errors.push('Datum kroku je povinné')
  }
  
  return errors
}

export const validateValueData = (valueData: Partial<Value>): string[] => {
  const errors: string[] = []
  
  if (!valueData.name?.trim()) {
    errors.push('Název hodnoty je povinný')
  }
  
  if (valueData.name && valueData.name.length > 255) {
    errors.push('Název hodnoty je příliš dlouhý (max 255 znaků)')
  }
  
  if (valueData.description && valueData.description.length > 1000) {
    errors.push('Popis hodnoty je příliš dlouhý (max 1000 znaků)')
  }
  
  if (!valueData.color || !/^#[0-9A-F]{6}$/i.test(valueData.color)) {
    errors.push('Neplatná barva (musí být ve formátu #RRGGBB)')
  }
  
  if (!valueData.icon?.trim()) {
    errors.push('Ikona je povinná')
  }
  
  return errors
}

// Icon utilities
export const getIconComponent = (iconName: string) => {
  // This would be implemented based on your icon library
  // For now, return a placeholder
  return iconName
}

export const getIconEmoji = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    compass: '🧭',
    heart: '❤️',
    palette: '🎨',
    'trending-up': '📈',
    'heart-pulse': '💓',
    briefcase: '💼',
    map: '🗺️',
    moon: '🌙',
    star: '⭐',
    target: '🎯',
    users: '👥',
    'message-circle': '💬',
    lightbulb: '💡',
    flag: '🚩',
    zap: '⚡',
  }
  return iconMap[iconName] || '⭐'
}
