/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f6f4',
          100: '#e7e5df',
          200: '#cfcac0',
          300: '#b5ad9e',
          400: '#9a8f7b',
          500: '#7f735f',
          600: '#665c4b',
          700: '#4c4437',
          800: '#332e26',
          900: '#1f1c16',
        },
        brass: {
          50: '#fbf6ea',
          100: '#f3e7c3',
          200: '#e6d18b',
          300: '#d1b056',
          400: '#b9962f',
          500: '#9b7f22',
          600: '#7a6319',
          700: '#5c4a13',
          800: '#3f330d',
          900: '#2c2309',
        },
        slate: {
          50: '#f2f5f7',
          100: '#e0e6eb',
          200: '#c2cdd6',
          300: '#9daebd',
          400: '#7890a3',
          500: '#5d7688',
          600: '#485a6a',
          700: '#374550',
          800: '#262f38',
          900: '#181d22',
        }
      },
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
    },
  },
  plugins: [],
}
