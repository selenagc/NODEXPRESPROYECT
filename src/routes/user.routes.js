import express from "express";
import { registerUser, loginUser } from "../controllers/user.controller.js";
import {authMiddleware} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post("/register",authMiddleware, registerUser);
router.post("/login", loginUser);

export default router;