/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Poppins"', '"Cairo"', '"Noto Sans Arabic"', '"Roboto"', '"Helvetica"', '"Arial"', 'sans-serif'],
        arabic: ['"Cairo"', '"Tajawal"', '"Noto Sans Arabic"', '"Amiri"', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e3a5f',
          900: '#0f172a',
          950: '#0a0f1a'
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem'
      }
    }
  },
  plugins: []
};
