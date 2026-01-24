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
        // Legacy primary colors (keep for backward compatibility)
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
        // Direct utility classes for easier use
        'playful-pink': '#FFE5E5',
        'playful-pink-dark': '#FF9AA2',
        'playful-yellow-green': '#E5FFE5',
        'playful-yellow-green-dark': '#9AFF9A',
        'playful-purple': '#E5E5FF',
        'playful-purple-dark': '#9A9AFF',
        'playful-yellow': '#FFF9E5',
        'playful-yellow-dark': '#FFD699',
        'playful-outline-base': '#5D4037',
        background: 'var(--color-background, #FFFAF5)',
        'text-primary': '#5D4037', // Updated to dark brown
        'text-secondary': '#8D6E63',
        'text-light': '#A1887F',
        'white-50': 'rgba(255, 255, 255, 0.5)',
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
        }
      },
      fontFamily: {
        sans: ['var(--font-baloo-2)', 'sans-serif'],
        playful: ['var(--font-baloo-2)', 'sans-serif'],
        mono: ['var(--font-baloo-2)', 'monospace'],
      },
      borderRadius: {
        'playful-sm': '8px',
        'playful-md': '12px',
        'playful-lg': '16px',
        'playful-xl': '24px',
      },
      borderWidth: {
        'playful-thin': '2px',
        'playful-base': '3px',
        'playful-thick': '4px',
      },
      boxShadow: {
        'playful-sm': '0 2px 4px rgba(93, 64, 55, 0.1)',
        'playful-md': '0 4px 8px rgba(93, 64, 55, 0.15)',
        'playful-lg': '0 8px 16px rgba(93, 64, 55, 0.2)',
        'playful': '0 4px 12px rgba(93, 64, 55, 0.25)',
      },
      animation: {
        'playful-bounce': 'playfulBounce 0.5s ease-in-out',
        'playful-wiggle': 'playfulWiggle 0.5s ease-in-out',
        'playful-pulse': 'playfulPulse 1s ease-in-out infinite',
        'playful-slide-in': 'playfulSlideIn 0.3s ease-out',
        'playful-float': 'playfulFloat 3s ease-in-out infinite',
      },
      keyframes: {
        playfulBounce: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-8px) scale(1.05)' },
        },
        playfulWiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
        playfulPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.9' },
        },
        playfulSlideIn: {
          'from': { transform: 'translateX(-100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        playfulFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
