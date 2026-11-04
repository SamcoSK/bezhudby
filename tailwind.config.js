/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vice: {
          pink: '#ff2a85',
          hotpink: '#ff007f',
          purple: '#9d00ff',
          deep: '#120422',
          cyan: '#00f0ff',
          teal: '#05d9e8',
          yellow: '#ffe600',
          dark: '#0a0518',
          card: '#160a2c',
          border: '#331758',
        },
        brand: {
          50:  '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f472b6',
          400: '#ff2a85',
          500: '#ff007f',
          600: '#e1006a',
          700: '#be0055',
          800: '#9d00ff',
          900: '#7000b8',
          950: '#120422',
        },
        accent: {
          400: '#00f0ff',
          500: '#05d9e8',
          600: '#01a9b4',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'neon-pink': '0 0 15px rgba(255, 42, 133, 0.5), 0 0 30px rgba(255, 42, 133, 0.2)',
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.5), 0 0 30px rgba(0, 240, 255, 0.2)',
        'neon-purple': '0 0 20px rgba(157, 0, 255, 0.4)',
      },
      animation: {
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
