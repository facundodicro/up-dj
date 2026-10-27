/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          DEFAULT: '#F6F1ED',
          alt: '#F1EAE4',
          card: '#FFFFFF',
        },
        clay: {
          soft: '#EFE7DE',
          DEFAULT: '#E2D3C6',
          deep: '#C9B39F',
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
        ink: '#17171C',
        muted: '#6F635A',
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        presskit: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
