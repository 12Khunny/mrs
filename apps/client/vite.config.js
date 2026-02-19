import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared-types": path.resolve(__dirname, "../../packages/shared-types"),
      "@shared-utils": path.resolve(__dirname, "../../packages/shared-utils"),
      "@shared-api": path.resolve(__dirname, "../../packages/shared-api"),
      "@mrs/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },

  server: {
    port: 5173,
    open: true,
  },

  build: {
    outDir: "dist",
  },
});
