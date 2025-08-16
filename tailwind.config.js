/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          500: '#10b981',
        },
        error: {
          500: '#ef4444',
        },
        warning: {
          500: '#f59e0b',
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'bounce-gentle': 'bounce-gentle 2s infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': {
            transform: 'scale(0.8)',
            opacity: '1',
          },
          '100%': {
            transform: 'scale(2.4)',
            opacity: '0',
          },
        },
        'bounce-gentle': {
          '0%, 100%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(-5px)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
      },
    },
  },
  plugins: [],
}
