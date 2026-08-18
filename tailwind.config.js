/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#08080c',
          900: '#0a0a0f',
          850: '#0e0e15',
          800: '#13131c',
          700: '#1b1b26',
        },
        rose: {
          DEFAULT: '#ff4f9a',
          soft: '#ff7ab8',
          pale: '#ffd6e8',
        },
        champagne: {
          DEFAULT: '#e8d5b5',
          soft: '#f2e6d0',
        },
        gold: '#d4af7a',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.32em',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
