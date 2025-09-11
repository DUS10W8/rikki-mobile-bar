/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#EADFC6",   // parchment page bg
          parchment: "#EADFC6",
          chrome: "#C9C9C9",    // light borders
          ink: "#141414",       // main text
          sea: "#2E9B8A",       // teal accent
          rust: "#B96B4D",      // copper accent
        },
      },
      fontFamily: {
        heading: ["'Playfair Display'", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
