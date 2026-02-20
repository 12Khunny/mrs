import express from "express";
import {
  getLoadedTruckDetail,
  getLoadedTruckList,
  saveLoadedTruck,
} from "./loaded.controller.js";

const router = express.Router();

router.get("/loadedTruck/loadedTruckDetail", getLoadedTruckDetail);
router.get("/loadedTruck/loadedTruckList", getLoadedTruckList);
router.post("/loadedTruck/save", saveLoadedTruck);

export default router;
