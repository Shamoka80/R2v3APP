/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0084D9", // Main blue
          light: "#66C2FF",   // Hover/active
          dark: "#003366",    // Strong emphasis
        },
        secondary: {
          DEFAULT: "#32B44A", // Main green
          light: "#6DDC81",   // Hover/active
          dark: "#1D7030",    // Strong emphasis
        },
        accent: {
          DEFAULT: "#F58220", // Orange accent
          dark: "#C85C00",    // Strong CTA hover
        },
        neutral: {
          light: "#F9FAFB",   // App background
          DEFAULT: "#B0B5BA", // Borders, dividers
          dark: "#5C6369",    // Secondary text
          text: "#2E2E2E",    // Main text
        },
        utility: {
          white: "#FFFFFF",
          error: "#D32F2F",   // Critical errors
          success: "#32B44A", // Reinforce green
          warning: "#F58220", // Reinforce orange
        },
      },
    },
  },
  plugins: [],
};
