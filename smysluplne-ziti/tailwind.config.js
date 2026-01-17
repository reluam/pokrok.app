/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors (matching pokrok app)
        primary: {
          50: 'var(--color-primary-50, #fef3e7)',
          100: 'var(--color-primary-100, #fde4c4)',
          200: 'var(--color-primary-200, #fbc98d)',
          300: 'var(--color-primary-300, #f9a855)',
          400: 'var(--color-primary-400, #f68b1d)',
          500: 'var(--color-primary-500, #E8871E)',
          600: 'var(--color-primary-600, #d16a0a)',
          700: 'var(--color-primary-700, #b04f08)',
          800: 'var(--color-primary-800, #8f3d0c)',
          900: 'var(--color-primary-900, #76320e)',
        },
        // Playful Design System Colors
        playful: {
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
          outline: {
            base: '#5D4037',
            light: '#8D6E63',
            lighter: '#A1887F',
          },
        },
        // Minimalist Design Colors
        sage: {
          50: '#f6f7f6',
          100: '#e3e7e3',
          200: '#c7d0c7',
          300: '#a3b0a3',
          400: '#7d8f7d',
          500: '#637363', // Šalvějová zelená
          600: '#4f5f4f',
          700: '#414f41',
          800: '#374237',
          900: '#2f3a2f',
        },
        cream: {
          50: '#fefcf9',
          100: '#fdf8f0',
          200: '#faefe0',
          300: '#f5e1c8',
          400: '#eecfa5',
          500: '#e5b882', // Krémová
          600: '#d99f5f',
          700: '#c2854a',
          800: '#a06a3e',
          900: '#825736',
        },
        anthracite: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d', // Antracitová
        },
        // Text colors
        'text-primary': '#5D4037',
        'text-secondary': '#8D6E63',
        'text-light': '#A1887F',
        // Background
        background: 'var(--color-background, #FFFAF5)',
        // Gray scale
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        playful: ["'Comic Neue'", "'Nunito'", 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'playful-sm': '8px',
        'playful-md': '12px',
        'playful-lg': '16px',
        'playful-xl': '24px',
      },
      boxShadow: {
        'playful-sm': '0 2px 4px rgba(93, 64, 55, 0.1)',
        'playful-md': '0 4px 8px rgba(93, 64, 55, 0.15)',
        'playful-lg': '0 8px 16px rgba(93, 64, 55, 0.2)',
        'playful': '0 4px 12px rgba(93, 64, 55, 0.25)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
