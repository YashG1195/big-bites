/** @type {import('tailwindcss').Config} */
const { COLORS } = require('./src/constants/colors');

module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        background: '#121212',
        surface: '#1E1E1E',
        text: '#FFFFFF',
        textMuted: '#A0A0A0',
        border: '#2C2C2C',
      }
    },
  },
  plugins: [],
}
