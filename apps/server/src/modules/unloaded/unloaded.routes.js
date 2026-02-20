import express from "express";
import {
  getUnloadedTruckDetail,
  saveUnloadedTruck,
} from "./unloaded.controller.js";

const router = express.Router();

router.get("/unloadedTruck/unloadedTruckDetail/:id", getUnloadedTruckDetail);
router.post("/unloadedTruck/save", saveUnloadedTruck);

export default router;
