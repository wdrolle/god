/** @type {import('tailwindcss').Config} */
module.exports = {
  // Use 'class' so NextThemes can toggle dark mode by adding a .dark class
  darkMode: 'class',  
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // Tailwind's blue-600
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // reference color
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  // Add any Tailwind plugins you find useful
  plugins: [
    require('@tailwindcss/forms'), // optional but helps style <form> elements
  ],
};
