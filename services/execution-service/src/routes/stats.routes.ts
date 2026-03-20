import { Router } from "express";
import { getStatsHandler, getRunsOverTimeHandler, getRecentActivityHandler } from "../controllers/stats.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getStatsHandler);
router.get("/runs-over-time", getRunsOverTimeHandler);
router.get("/recent-activity", getRecentActivityHandler);

export default router;
