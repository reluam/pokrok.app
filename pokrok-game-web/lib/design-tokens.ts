/**
 * Design Tokens for Playful Animated Style
 * Based on the cartoon-like, playful design with pastel colors and dark brown outlines
 */

export const colors = {
  // Pastel Background Colors
  pink: {
    light: '#FFE5E5',
    base: '#FFB3BA',
    dark: '#FF9AA2',
  },
  yellowGreen: {
    light: '#E5FFE5',
    base: '#B3FFB3',
    dark: '#9AFF9A',
  },
  purple: {
    light: '#E5E5FF',
    base: '#B3B3FF',
    dark: '#9A9AFF',
  },
  yellow: {
    light: '#FFF9E5',
    base: '#FFE5B3',
    dark: '#FFD699',
  },
  
  // Outline & Text Colors
  outline: {
    base: '#5D4037',      // Dark brown for thick borders
    light: '#8D6E63',     // Lighter brown
    lighter: '#A1887F',   // Light brown
  },
  
  text: {
    primary: '#5D4037',   // Dark brown text
    secondary: '#8D6E63', // Lighter brown text
    light: '#A1887F',     // Light brown text
    white: '#FFFFFF',
  },
  
  // Status Colors (still playful)
  success: {
    light: '#E5FFE5',
    base: '#B3FFB3',
    dark: '#9AFF9A',
  },
  error: {
    light: '#FFE5E5',
    base: '#FFB3BA',
    dark: '#FF9AA2',
  },
  warning: {
    light: '#FFF9E5',
    base: '#FFE5B3',
    dark: '#FFD699',
  },
  
  // Background
  background: {
    base: '#FFFAF5',      // Off-white base
    pattern: '#FFF9F0',   // Pattern background
  },
}

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
}

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
}

export const borderWidth = {
  thin: '2px',
  base: '3px',
  thick: '4px',
}

export const shadows = {
  sm: '0 2px 4px rgba(93, 64, 55, 0.1)',
  md: '0 4px 8px rgba(93, 64, 55, 0.15)',
  lg: '0 8px 16px rgba(93, 64, 55, 0.2)',
  playful: '0 4px 12px rgba(93, 64, 55, 0.25)',
}

export const typography = {
  fontFamily: {
    playful: "var(--font-baloo-2), sans-serif",
    sans: "var(--font-baloo-2), sans-serif",
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  letterSpacing: {
    tight: '-0.01em',
    normal: '0.01em',
    wide: '0.05em',
  },
}

export const animations = {
  duration: {
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
    slower: '800ms',
  },
  easing: {
    playful: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

export const patterns = {
  stripesPinkYellow: {
    background: 'repeating-linear-gradient(45deg, #FFE5E5, #FFE5E5 10px, #FFF9E5 10px, #FFF9E5 20px)',
  },
  stripesPurplePink: {
    background: 'repeating-linear-gradient(45deg, #E5E5FF, #E5E5FF 10px, #FFE5E5 10px, #FFE5E5 20px)',
  },
  dots: {
    background: 'radial-gradient(circle, #5D4037 1px, transparent 1px)',
    backgroundSize: '12px 12px',
  },
}

export const zIndex = {
  base: 1,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
}

