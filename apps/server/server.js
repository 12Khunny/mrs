import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./src/modules/auth/auth.routes.js";
import loadedRouter from "./src/modules/loaded/loaded.routes.js";
import unloadedRouter from "./src/modules/unloaded/unloaded.routes.js";
import rfidRouter from "./src/modules/rfid/rfid.routes.js";

const app = express();
const allowedOrigins = (
  process.env.MRS_WEB_ORIGIN ?? "http://localhost:5173,http://localhost:5261"
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
app.use(cookieParser());
app.use(express.json());

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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
