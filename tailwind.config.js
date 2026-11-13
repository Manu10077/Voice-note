/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        diary: {
          50: '#fdfbf7',
          100: '#f7f4ed',
          200: '#eee8dc',
          300: '#ded3c0',
          400: '#c5b49b',
          500: '#ad9577',
          600: '#947a5f',
          700: '#79604c',
          800: '#644f41',
          900: '#534237',
          950: '#2d221c',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        pulseWave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
      },
      animation: {
        pulseWave: 'pulseWave 1.2s ease-in-out infinite',
        breathe: 'breathe 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

