import express from "express";
import { store, index, update, destroy, show } from "../controllers/tag.controller.js";
import {authMiddleware} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post("/",authMiddleware, store);
router.get("/",authMiddleware, index);
router.get("/:id",authMiddleware, show);
router.put("/:id",authMiddleware, update);
router.delete("/:id",authMiddleware, destroy);

export default router;