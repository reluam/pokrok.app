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
    name: 'Oranžová sytá',
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
    name: 'Oranžová světlá',
    value: '#FFB366',
    bg: '#FFF8F0',
    shades: {
      50: '#fff8f0',
      100: '#ffeed6',
      200: '#ffdcb3',
      300: '#ffc880',
      400: '#ffb366',
      500: '#ffb366',
      600: '#ff9f33',
      700: '#ff8b00',
      800: '#cc6f00',
      900: '#995300',
    }
  },
  {
    name: 'Fialová sytá',
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
    name: 'Fialová světlá',
    value: '#C4A5F5',
    bg: '#F9F5FF',
    shades: {
      50: '#f9f5ff',
      100: '#f3edff',
      200: '#e9d9ff',
      300: '#d9bfff',
      400: '#c4a5f5',
      500: '#c4a5f5',
      600: '#b08ae8',
      700: '#9c6fd9',
      800: '#8855c7',
      900: '#743cb5',
    }
  },
  {
    name: 'Růžová sytá',
    value: '#FF6B9D',
    bg: '#FFF0F5',
    shades: {
      50: '#fff0f5',
      100: '#ffe0eb',
      200: '#ffc7d9',
      300: '#ffa3c2',
      400: '#ff6b9d',
      500: '#ff6b9d',
      600: '#ff4d7a',
      700: '#ff2e57',
      800: '#cc1f45',
      900: '#991033',
    }
  },
  {
    name: 'Růžová světlá',
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
    name: 'Teal sytá',
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
  },
  {
    name: 'Teal světlá',
    value: '#7DD3C0',
    bg: '#F0FDFA',
    shades: {
      50: '#f0fdfa',
      100: '#e0faf6',
      200: '#c8f5ed',
      300: '#a8ede0',
      400: '#7dd3c0',
      500: '#7dd3c0',
      600: '#6bb8a8',
      700: '#5a9d90',
      800: '#4a8278',
      900: '#3a6760',
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
