import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared-types": path.resolve(__dirname, "../../packages/shared-types"),
      "@shared-utils": path.resolve(__dirname, "../../packages/shared-utils"),
      "@shared-api": path.resolve(__dirname, "../../packages/shared-api"),
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
