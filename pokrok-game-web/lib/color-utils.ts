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
    value: '#FFB3BA',
    bg: '#FFF5F5',
    shades: {
      50: '#fff5f5',
      100: '#ffe5e5',
      200: '#ffd1d1',
      300: '#ffb3ba',
      400: '#ff9aa2',
      500: '#ffb3ba',
      600: '#ff8a95',
      700: '#ff6b7a',
      800: '#ff4d5f',
      900: '#ff2d44',
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
