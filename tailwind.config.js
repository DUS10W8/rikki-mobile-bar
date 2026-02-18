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
      fontSize: {
        // Improved mobile typography for readability
        "xs": ["0.875rem", { lineHeight: "1.25rem" }],
        "sm": ["1rem", { lineHeight: "1.5rem" }],
        "base": ["1.125rem", { lineHeight: "1.75rem" }],
        "lg": ["1.25rem", { lineHeight: "1.75rem" }],
        "xl": ["1.5rem", { lineHeight: "2rem" }],
        "2xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "3xl": ["2.25rem", { lineHeight: "2.75rem" }],
        "4xl": ["3rem", { lineHeight: "3.5rem" }],
        "5xl": ["3.75rem", { lineHeight: "4.5rem" }],
      },
      spacing: {
        // Better touch targets and spacing for mobile
        "touch": "2.75rem", // 44px minimum touch target (WCAG guideline)
      },
    },
  },
  plugins: [],
};

