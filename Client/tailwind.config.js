/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-blue': '#1B3C53',
        'light-blue': '#456882',
        'light-gray1': '#F5F5F5',
        'light-gray2': '#D3D3D3',
        'dark-gray3': '#5F5F5F',
        'dark-gray4': '#303030',
        'orange': '#FF914D',
        'light-orange': '#FAB95B',
        'logo-blue': '#063192',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}