/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        'mood-flow-banner': "url('/src/assets/images/mood-flow-banner.png')",
      }
    },
  },
  plugins: [],
}

