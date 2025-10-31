// Admin data types for managing website content

export interface CoachingPackage {
  id: string
  title: string
  subtitle: string
  description: string
  price: string
  duration: string
  features: string[]
  color: string
  textColor: string
  borderColor: string
  headerTextColor?: string
  enabled: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface OfferSection {
  id: string
  title: string
  description: string
  icon: 'Lightbulb' | 'Flag' | 'MessageCircle' | 'Target' | 'Users' | 'Star' | 'Heart' | 'Zap'
  href: string
  enabled: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface VideoContent {
  id: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl?: string
  embedCode?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface Workshop {
  id: string
  title: string
  subtitle: string
  description: string
  price: string
  duration: string
  features: string[]
  color: string
  textColor: string
  borderColor: string
  headerTextColor?: string
  enabled: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface AdminSettings {
  id: string
  key: string
  value: string
  type: 'text' | 'textarea' | 'boolean' | 'number' | 'url'
  description: string
  updatedAt: string
}

