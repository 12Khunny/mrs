import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parsePort = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};
const loadDefaults = () => {
  const defaultsPath = path.resolve(__dirname, "../../config/mrs.defaults.json");
  try {
    const raw = fs.readFileSync(defaultsPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
};
const defaults = loadDefaults();
const defaultServerPort = parsePort(defaults?.ports?.server, 5000);
const defaultClientPort = parsePort(defaults?.ports?.clientDev, 5173);
const defaultApiBaseUrl = defaults?.urls?.apiBase ?? `http://localhost:${defaultServerPort}/api`;
const defaultMonitorUrl =
  defaults?.urls?.rfidMonitor ??
  `http://localhost:${parsePort(defaults?.ports?.readerService, 5261)}/api/rfid-monitor.html`;
const devApiProxyTarget = process.env.VITE_DEV_API_PROXY || `http://localhost:${defaultServerPort}`;
const devClientPort = parsePort(process.env.VITE_PORT, defaultClientPort);

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  define: {
    __MRS_DEFAULT_API_BASE_URL__: JSON.stringify(defaultApiBaseUrl),
    __MRS_DEFAULT_RFID_MONITOR_URL__: JSON.stringify(defaultMonitorUrl),
  },

  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: devClientPort,
    open: true,
    proxy: {
      "/api": {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: "dist",
  },
});
