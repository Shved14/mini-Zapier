import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { workflowQueue, WorkflowJobData } from "./queue/workflow.queue";
import { startWorker } from "./queue/worker";
import { getRegisteredTypes } from "./executors/registry";
import { logger } from "./utils/logger";
import runRoutes from "./routes/run.routes";

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", async (_req, res) => {
  try {
    const waiting = await workflowQueue.getWaitingCount();
    const active = await workflowQueue.getActiveCount();
    const completed = await workflowQueue.getCompletedCount();
    const failed = await workflowQueue.getFailedCount();

    res.json({
      status: "ok",
      service: "execution-service",
      queue: { waiting, active, completed, failed },
      executors: getRegisteredTypes(),
    });
  } catch {
    res.status(503).json({ status: "error", service: "execution-service" });
  }
});

// API routes
app.use("/api/runs", runRoutes);

// Execute endpoint - called by workflow-service
app.post("/execute", async (req, res) => {
  try {
    const { workflowId, userId, workflowJson, workflowName } = req.body;

    if (!workflowId || !userId || !workflowJson) {
      res.status(400).json({ message: "workflowId, userId, and workflowJson are required" });
      return;
    }

    const job = await workflowQueue.add(`workflow:${workflowId}`, {
      workflowId,
      userId,
      workflowJson,
      workflowName: workflowName || "Unnamed Workflow",
    } as any);

    logger.info(`Job enqueued`, { jobId: job.id, workflowId, workflowName });

    res.status(202).json({
      message: "Workflow execution queued",
      jobId: job.id,
      workflowId,
    });
  } catch (err: any) {
    logger.error(`Failed to enqueue job: ${err.message}`);
    res.status(500).json({ message: "Failed to enqueue workflow execution" });
  }
});

app.get("/jobs/:jobId", async (req, res) => {
  try {
    const job = await workflowQueue.getJob(req.params.jobId);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    const state = await job.getState();

    res.json({
      jobId: job.id,
      workflowId: job.data.workflowId,
      state,
      attemptsMade: job.attemptsMade,
      result: job.returnvalue ?? null,
      failedReason: job.failedReason ?? null,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn ?? null,
    });
  } catch (err: any) {
    logger.error(`Failed to get job status: ${err.message}`);
    res.status(500).json({ message: "Failed to get job status" });
  }
});

async function main() {
  try {
    startWorker();

    app.listen(PORT, () => {
      logger.info(`Execution service running on port ${PORT}`);
    });
  } catch (error: any) {
    logger.error(`Failed to start execution service: ${error.message}`);
    process.exit(1);
  }
}

main();
