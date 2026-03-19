import { Router, Request, Response } from "express";
import { emitStepUpdate, emitRunUpdate, getConnectedClientsCount, getRoomSize } from "../socket/server";
import { StepStatus } from "../events/types";
import { logger } from "../utils/logger";

const router = Router();

const VALID_STATUSES: StepStatus[] = ["waiting", "running", "success", "failed"];

router.post("/step", (req: Request, res: Response): void => {
  const { runId, stepId, status } = req.body;

  if (!runId || typeof runId !== "string") {
    res.status(400).json({ message: "runId is required" });
    return;
  }
  if (!stepId || typeof stepId !== "string") {
    res.status(400).json({ message: "stepId is required" });
    return;
  }
  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    return;
  }

  emitStepUpdate({ runId, stepId, status });
  logger.info("Step event emitted via HTTP", { runId, stepId, status });
  res.json({ ok: true });
});

router.post("/run", (req: Request, res: Response): void => {
  const { runId, status } = req.body;

  if (!runId || typeof runId !== "string") {
    res.status(400).json({ message: "runId is required" });
    return;
  }
  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    return;
  }

  emitRunUpdate({ runId, status });
  logger.info("Run event emitted via HTTP", { runId, status });
  res.json({ ok: true });
});

router.get("/stats", (_req: Request, res: Response): void => {
  res.json({
    connectedClients: getConnectedClientsCount(),
  });
});

router.get("/stats/:runId", (req: Request, res: Response): void => {
  const size = getRoomSize(req.params.runId);
  res.json({
    runId: req.params.runId,
    subscribers: size,
  });
});

export default router;
