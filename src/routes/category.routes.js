import express from "express";
import { store, update, destroy, index,show } from "../controllers/category.controller.js";

const router = express.Router();

router.post("/", store);
router.get("/", index);
router.get("/:id", show);
router.put("/:id", update);
router.delete("/:id", destroy);

export default router;