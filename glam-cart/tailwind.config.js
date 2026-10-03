/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F2EDE4',
        'cream-dark': '#E7DFD1',
        ink: '#1F1C18',
        charcoal: '#2B2723',
        stone: '#6E6459',
        olive: '#5C6B4F',
        terracotta: '#C97B4A',
        sand: '#EFE6D8',
       
      },

      
      fontFamily: {
        brand: ['"Bodoni Moda"', 'serif'],
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },

  
  plugins: [],
}
