import { Router } from "express";
import { getRuns, getRunById } from "../controllers/run.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.get("/", getRuns);
router.get("/:id", getRunById);

export default router;
