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
        cream: {
          50: '#faf8f5',
          100: '#f5f0eb',
          200: '#ebe4db',
        },
        navy: {
          800: '#1a2332',
          900: '#0f1724',
          950: '#0a1018',
        },
        sage: {
          400: '#7d9b7f',
          500: '#5f8761',
          600: '#4a7a4d',
        },
        forest: {
          400: '#3d6b41',
          500: '#2d5a31',
          600: '#1f4a23',
        },
      },
    },
  },
  plugins: [],
}
