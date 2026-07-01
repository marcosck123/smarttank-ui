/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brown: {
          50:  '#fdf8f3',
          100: '#f5ede0',
          200: '#e8d5bb',
          300: '#d4b896',
          400: '#be9770',
          500: '#a87a52',
          600: '#8c6040',
          700: '#6f4a2f',
          800: '#52361f',
          900: '#332010',
          950: '#1c1008',
        },
      },
      boxShadow: {
        'warm-sm': '0 1px 3px 0 rgba(82,54,31,0.08), 0 1px 2px -1px rgba(82,54,31,0.06)',
        'warm-md': '0 4px 12px 0 rgba(82,54,31,0.10), 0 2px 4px -2px rgba(82,54,31,0.08)',
        'warm-lg': '0 10px 30px 0 rgba(82,54,31,0.12), 0 4px 8px -4px rgba(82,54,31,0.08)',
      },
    },
  },
  plugins: [],
}
