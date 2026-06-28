/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["IBM Plex Sans Arabic", "Tajawal", "Cairo", "Segoe UI", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#050816",
        royal: "#8B5CF6",
        pulse: "#A855F7",
        aqua: "#3B82F6",
        gold: "#ffc94a",
      },
      boxShadow: {
        glow: "0 20px 70px rgba(139, 92, 246, 0.28)",
        soft: "0 18px 45px rgba(15, 23, 42, 0.10)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(rgba(124, 58, 237, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 58, 237, 0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
