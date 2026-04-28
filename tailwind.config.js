/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          950: '#0a0a0f',
          900: '#0f0f1a',
          800: '#1a1a2e',
          700: '#252540',
        },
        ember: {
          500: '#c0392b',
          400: '#e74c3c',
          300: '#ff6b6b',
        },
        gold: {
          500: '#d4af37',
          400: '#f0c040',
          300: '#ffd700',
        },
        echo: {
          500: '#6c3483',
          400: '#8e44ad',
          300: '#a569bd',
        },
      },
    },
  },
  plugins: [],
}
