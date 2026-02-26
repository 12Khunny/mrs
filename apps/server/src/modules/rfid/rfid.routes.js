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

router.get("/rfid/status", getRfidStatus);
router.get("/rfid/detection", getLatestDetection);
router.get("/rfid/resolve", resolveTagToTruck);

// Mock endpoints for local/dev testing before hardware integration.
router.post("/rfid/manual", pushManualDetection);
router.post("/rfid/mock/connection", setMockConnection);
router.post("/rfid/mock/detection", pushMockDetection);

export default router;
