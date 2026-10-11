/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          DEFAULT: '#0A0A14',
          alt: '#0D0D1A',
          card: '#141422',
        },
        up: {
          DEFAULT: '#8B5CF6',
          dark: '#7C3AED',
          light: '#A78BFA',
        },
        neon: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
        },
        ink: '#F4F4F5',
        muted: '#A1A1AA',
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
