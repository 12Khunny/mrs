import express from "express";
import {
  getLoadedTruckDetail,
  getLoadedTruckList,
  getLoadedTruckListRange,
  saveLoadedTruck,
} from "./loaded.controller.js";

const router = express.Router();

router.get("/loadedTruck/loadedTruckDetail", getLoadedTruckDetail);
router.get("/loadedTruck/loadedTruckList", getLoadedTruckList);
router.get("/loadedTruck/loadedTruckList/:startDate/:endDate", getLoadedTruckListRange);
router.post("/loadedTruck/save", saveLoadedTruck);

export default router;
