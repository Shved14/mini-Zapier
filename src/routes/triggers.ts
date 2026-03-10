import { Router, Request, Response } from "express";
import { enqueueWorkflowExecution } from "../services/triggerService";
import { reloadCronScheduler } from "../services/cronScheduler";
import { runService } from "../services/runService";

export const triggerRoutes = Router();

// 1) Webhook trigger
// POST /api/webhook/:workflowId
triggerRoutes.post("/webhook/:workflowId", async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  const payload = req.body ?? {};

  const job = await enqueueWorkflowExecution({
    workflowId,
    payload,
    source: "webhook",
  });

  res.status(202).json({
    message: "Webhook received; workflow enqueued",
    workflowId,
    jobId: job.id,
  });
});

// 3) Email trigger
// POST /api/trigger/email
// body: { workflowId: string, payload?: any }
triggerRoutes.post("/trigger/email", async (req: Request, res: Response) => {
  const { workflowId, payload } = req.body ?? {};

  if (!workflowId) {
    res.status(400).json({ message: 'Missing "workflowId" in body' });
    return;
  }

  const job = await enqueueWorkflowExecution({
    workflowId,
    payload: payload ?? {},
    source: "email",
  });

  res.status(202).json({
    message: "Email trigger received; workflow enqueued",
    workflowId,
    jobId: job.id,
  });
});

// Cron reload (удобно для демо/разработки)
// POST /api/cron/reload
triggerRoutes.post("/cron/reload", async (_req: Request, res: Response) => {
  await reloadCronScheduler();
  res.json({ message: "Cron scheduler reloaded" });
});

// Resume workflow run
// POST /api/runs/:id/resume
triggerRoutes.post("/runs/:id/resume", async (req: Request, res: Response) => {
  const { id } = req.params;

  const { run, job } = await runService.resumeRun(id);

  res.status(202).json({
    message: "Run resume enqueued",
    runId: run.id,
    workflowId: run.workflowId,
    jobId: job.id,
    startFromNodeId: run.currentNodeId,
  });
});

