import express from "express";
import { AuthContract } from "@mrs/shared-api";
import { login, externalLogin, me } from "./auth.controller.js";

const router = express.Router();

router.post(AuthContract.login.path, login);
router.get(AuthContract.me.path, me);
router.post("/authen/login", externalLogin);

export default router;
