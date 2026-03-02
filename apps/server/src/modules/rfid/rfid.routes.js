import { Router } from "express";
import {
  getLatestDetection,
  getRfidStatus,
  pushManualDetection,
  pushMockDetection,
  resolveTagToTruck,
  setMockConnection,
} from "./rfid.controller.js";

const router = Router();
const requireManualAuth =
  (process.env.MRS_REQUIRE_AUTH_FOR_MANUAL ?? "false").toLowerCase() === "true";
const requireManualAuthIfEnabled = (req, res, next) => {
  if (!requireManualAuth || req.headers.authorization) {
    next();
    return;
  }
  res.status(401).json({ message: "Unauthorized" });
};

router.get("/rfid/status", getRfidStatus);
router.get("/rfid/detection", getLatestDetection);
router.get("/rfid/resolve", resolveTagToTruck);

router.post("/rfid/manual", requireManualAuthIfEnabled, pushManualDetection);
if (process.env.NODE_ENV !== "production") {
  // Mock endpoints for local/dev testing before hardware integration.
  router.post("/rfid/mock/connection", setMockConnection);
  router.post("/rfid/mock/detection", pushMockDetection);
}

export default router;
