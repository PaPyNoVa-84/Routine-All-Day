/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['ui-sans-serif','system-ui','-apple-system','Segoe UI','Roboto','Inter','Arial'] },
      boxShadow: { soft: '0 4px 16px rgba(0,0,0,.06)' }
    }
  },
  plugins: [],
};
