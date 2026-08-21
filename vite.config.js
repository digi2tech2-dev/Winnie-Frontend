import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2020",
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules[\\/]react(?:-dom|-router|-router-dom)?[\\/]/.test(id)) return "vendor-react";
          if (id.includes("node_modules/framer-motion/")) return "vendor-motion";
          if (id.includes("node_modules/i18next/") || id.includes("node_modules/react-i18next/")) return "vendor-i18n";
          return undefined;
        },
      },
    },
  },
});
