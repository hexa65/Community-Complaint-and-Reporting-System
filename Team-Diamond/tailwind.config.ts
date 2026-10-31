import type { Config } from "tailwindcss";

// Brand tokens are defined once here so every member's components look the same.
// Status colours: the text colour (e.g. text-pending) is dark enough to read on its
// "-soft" background (e.g. bg-pending-soft).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        asphalt: "#2B3742",
        paint: "#F5C400",
        surface: "#F2F5F7",
        ink: "#1C2630",
        pending: { DEFAULT: "#9A5510", soft: "#FBEBD8" },
        progress: { DEFAULT: "#2D6CB0", soft: "#DCEAF8" },
        resolved: { DEFAULT: "#17714A", soft: "#D8F0E3" },
      },
      fontFamily: {
        display: ["Archivo", "Arial Narrow", "Arial", "sans-serif"],
        sans: ["Public Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;