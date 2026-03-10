import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRouter from "./src/modules/auth/auth.routes.js";
import loadedRouter from "./src/modules/loaded/loaded.routes.js";
import unloadedRouter from "./src/modules/unloaded/unloaded.routes.js";
import rfidRouter from "./src/modules/rfid/rfid.routes.js";

const app = express();
app.set("etag", false);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parsePort = (value, fallback = 5000) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};
const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
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
const defaultCorsOrigins = Array.isArray(defaults?.cors?.allowedOrigins)
  ? defaults.cors.allowedOrigins
  : ["http://localhost:5173", "http://localhost:5261"];
const allowNullOrigin = parseBoolean(
  process.env.MRS_ALLOW_NULL_ORIGIN,
  parseBoolean(defaults?.cors?.allowNullOrigin, true)
);
const allowedOrigins = (
  process.env.MRS_WEB_ORIGIN ?? defaultCorsOrigins.join(",")
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (origin === "null") {
      if (!allowNullOrigin) {
        callback(new Error("Not allowed by CORS"));
        return;
      }
      callback(null, true);
      return;
    }
    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: process.env.MRS_JSON_LIMIT ?? "1mb" }));

app.use("/api/rfid", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.use((req, _res, next) => {
  const cookieName = process.env.MRS_AUTH_COOKIE ?? "mrs_auth";
  if (!req.headers.authorization && req.cookies?.[cookieName]) {
    req.headers.authorization = `Bearer ${req.cookies[cookieName]}`;
  }
  next();
});

app.use("/api", authRouter);
app.use("/api", loadedRouter);
app.use("/api", unloadedRouter);
app.use("/api", rfidRouter);

const PORT = parsePort(process.env.MRS_PORT, defaultServerPort);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
