export function getBaseUrl(): string {
  // In production, use the environment variable
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  
  // Fallback for production when NEXT_PUBLIC_SITE_URL is not set
  // This should not happen in production, but provides a fallback
  return 'https://pokrok.vercel.app'
}

// Get Clerk URLs based on environment
export function getClerkUrls() {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const baseUrl = getBaseUrl()
  
  if (isDevelopment) {
    return {
      signInUrl: `${baseUrl}/muj/sign-in`,
      signUpUrl: `${baseUrl}/muj/sign-up`,
      fallbackRedirectUrl: `${baseUrl}/muj`,
      afterSignOutUrl: `${baseUrl}/muj/sign-in`
    }
  }
  
  return {
    signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || 'https://accounts.pokrok.app/sign-in',
    signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || 'https://accounts.pokrok.app/sign-up',
    fallbackRedirectUrl: process.env.NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL || 'https://muj.pokrok.app',
    afterSignOutUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL || 'https://muj.pokrok.app/sign-in'
  }
}

// Date utility functions for consistent timezone handling
export function getToday(): Date {
  const today = new Date()
  // Create a new date with local timezone at midnight
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return localToday
}

export function getTodayString(): string {
  const today = getToday()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isToday(date: Date): boolean {
  const today = getToday()
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)
  return compareDate.getTime() === today.getTime()
}

export function isFuture(date: Date): boolean {
  const today = getToday()
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)
  return compareDate > today
}

export function getDaysUntil(date: Date): number {
  const today = getToday()
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)
  return Math.ceil((compareDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateFromInput(dateString: string): Date {
  // Parse date string and create local date at midnight
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}
