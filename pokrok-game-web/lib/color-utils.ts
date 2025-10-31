// Color utility functions for dynamic theming

export interface ColorPalette {
  name: string
  value: string
  bg: string
  shades: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
  }
}


// Predefined color palettes with proper shade generation
export const colorPalettes: ColorPalette[] = [
  {
    name: 'Oranžová',
    value: '#E8871E',
    bg: '#FFFAF5',
    shades: {
      50: '#fef3e7',
      100: '#fde4c4',
      200: '#fbc98d',
      300: '#f9a855',
      400: '#f68b1d',
      500: '#E8871E',
      600: '#d16a0a',
      700: '#b04f08',
      800: '#8f3d0c',
      900: '#76320e',
    }
  },
  {
    name: 'Modrá',
    value: '#3B82F6',
    bg: '#EFF6FF',
    shades: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    }
  },
  {
    name: 'Zelená',
    value: '#10B981',
    bg: '#ECFDF5',
    shades: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    }
  },
  {
    name: 'Fialová',
    value: '#8B5CF6',
    bg: '#F5F3FF',
    shades: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    }
  },
  {
    name: 'Růžová',
    value: '#EC4899',
    bg: '#FDF2F8',
    shades: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
    }
  },
  {
    name: 'Červená',
    value: '#EF4444',
    bg: '#FEF2F2',
    shades: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    }
  },
  {
    name: 'Žlutá',
    value: '#F59E0B',
    bg: '#FFFBEB',
    shades: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    }
  },
  {
    name: 'Teal',
    value: '#14B8A6',
    bg: '#F0FDFA',
    shades: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    }
  }
]

// Apply color theme to CSS custom properties
export function applyColorTheme(colorValue: string) {
  const palette = colorPalettes.find(p => p.value === colorValue) || colorPalettes[0]
  
  const root = document.documentElement
  
  // Apply primary color shades
  Object.entries(palette.shades).forEach(([shade, color]) => {
    root.style.setProperty(`--color-primary-${shade}`, color)
  })
  
  // Apply background color
  root.style.setProperty('--color-background', palette.bg)
  
  // Store current theme
  localStorage.setItem('app-primary-color', colorValue)
}

// Get current theme from localStorage
export function getCurrentTheme(): string {
  if (typeof window === 'undefined') return '#E8871E'
  return localStorage.getItem('app-primary-color') || '#E8871E'
}

// Initialize theme on app load
export function initializeTheme() {
  if (typeof window === 'undefined') return
  
  const currentTheme = getCurrentTheme()
  applyColorTheme(currentTheme)
}
