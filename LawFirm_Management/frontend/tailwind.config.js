/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7e6',
          100: '#fdecc3',
          200: '#fbd98a',
          300: '#f8c04d',
          400: '#f5a726',
          500: '#f2931a',
          600: '#D4A857', // Main golden accent
          700: '#b87a1a',
          800: '#94601a',
          900: '#7a4f1a',
        },
        secondary: {
          50: '#f4f4f6',
          100: '#e8e8ec',
          200: '#d1d1d9',
          300: '#b3b3c0',
          400: '#8f8fa3',
          500: '#6b6b85',
          600: '#525269',
          700: '#424254',
          800: '#1F1A2E', // Main dark navy background
          900: '#1a1a2e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 