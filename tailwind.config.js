/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        'mood-flow-banner': "url('/src/assets/images/mood-flow-banner.png')",
        'mobile-mood-flow-banner': "url('/src/assets/images/mood-flow-mobile.png')",
        'back': "url('/src/assets/images/grid.png')"
      },
      backgroundSize: {
        'auto': 'auto',
        'cover': 'cover',
        'contain': 'contain',
        '120-100': '120% 100%',
        '130-100': '130% 100%',
        '100-130': '100% 130%',
      },
      colors: {
        'light-beige': '#fcf7eb',
        'antique-white': ' #f7ead9',
        'light-yellow': '#fcebaf',
        'light-green': '#dfeeb7',
        'dark-green': '#b6d367',
        'light-orange': '#ffcc99',
        'dark-orange': 'rgb(243 171 92)',
        'pink-orange': '#efaea5',
        'light-pink': '#e86868',
        'light-blue': '#bbd5f3',
        'light-blue-dark': '#9abee2',
        'dark-blue': '#113d54',
        'brown': 'rgb(230 220 205)',

      },
      fontFamily: {
        'pencil-font': ['pencil-font', "sans-serif"],
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(2px)', easing: 'ease-in-out' },
          '50%': { transform: 'translateY(-5px)', easing: 'ease-in-out' },
        },
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'bounce-custom': 'bounce 1.5s infinite ease-in-out',

      },

    },
  },
  plugins: [],
}

