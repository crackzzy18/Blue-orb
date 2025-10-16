/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        accent: '#C4F1E0',
        'accent-warm': '#FFD6A5',
        'accent-coral': '#FFADAD',
      },
    },
  },
  plugins: [],
}
