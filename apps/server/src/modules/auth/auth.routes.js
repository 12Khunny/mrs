import express from "express";
import { AuthContract } from "@mrs/shared-api";
import { login } from "./auth.controller.js";

const router = express.Router();

router.post(AuthContract.login.path, login);

export default router;
