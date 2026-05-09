/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        display: ["IBM Plex Sans", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          500: "#22d3ee",
          600: "#06b6d4",
        },
      },
    },
  },
  plugins: [],
};
