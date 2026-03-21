import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { workflowQueue, WorkflowJobData } from "./queue/workflow.queue";
import { startWorker } from "./queue/worker";
import { getRegisteredTypes } from "./executors/registry";
import { logger } from "./utils/logger";
import runRoutes from "./routes/run.routes";
import statsRoutes from "./routes/stats.routes";
import { explainError } from "./services/aiService";

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
app.use("/api/stats", statsRoutes);

// Legacy endpoints
app.post("/execute", async (req, res) => {
  try {
    const { workflowId, userId, workflowJson, workflowName } = req.body as WorkflowJobData & { workflowName?: string };

    if (!workflowId || !userId || !workflowJson) {
      res.status(400).json({ message: "workflowId, userId, and workflowJson are required" });
      return;
    }

    // Check subscription limits before enqueuing
    try {
      const AUTH_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3001";
      const limitsRes = await fetch(`${AUTH_URL}/auth/subscription/check-limits`, {
        headers: { "X-User-ID": userId },
      });
      if (limitsRes.ok) {
        const limits = await limitsRes.json() as any;
        const maxRuns = limits.limits?.maxRuns ?? -1;
        if (maxRuns > 0) {
          const completed = await workflowQueue.getCompleted();
          const active = await workflowQueue.getActive();
          const waiting = await workflowQueue.getWaiting();
          const allJobs = [...completed, ...active, ...waiting];
          const userRunCount = allJobs.filter((j: any) => j.data?.userId === userId).length;
          if (userRunCount >= maxRuns) {
            res.status(403).json({
              message: `Run limit reached (${maxRuns} runs on ${limits.plan} plan). Upgrade to PRO for unlimited runs.`,
              code: "RUN_LIMIT_REACHED",
            });
            return;
          }
        }
      }
    } catch (limitErr: any) {
      logger.warn(`Failed to check subscription limits: ${limitErr.message}`);
    }

    const job = await workflowQueue.add(`workflow:${workflowId}`, {
      workflowId,
      userId,
      workflowJson,
      workflowName: workflowName || "Unknown Workflow",
    });

    logger.info(`Job enqueued`, { jobId: job.id, workflowId });

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

// ─── Workflow Templates ───
const workflowTemplates = [
  {
    id: "tpl-webhook-telegram",
    name: "Webhook → Telegram",
    description: "Receive a webhook and forward payload to a Telegram chat.",
    icon: "📱",
    nodes: [
      { id: "trigger-1", type: "trigger", config: {}, position: { x: 250, y: 50 } },
      { id: "telegram-1", type: "telegram", config: { chatId: "", message: "New webhook: {{JSON.stringify(input)}}" }, position: { x: 250, y: 200 } },
    ],
    edges: [{ source: "trigger-1", target: "telegram-1" }],
  },
  {
    id: "tpl-cron-http",
    name: "Scheduled HTTP Check",
    description: "Periodically call an API endpoint and check the response.",
    icon: "🌐",
    nodes: [
      { id: "trigger-1", type: "trigger", config: { schedule: "*/5 * * * *" }, position: { x: 250, y: 50 } },
      { id: "http-1", type: "http", config: { url: "https://api.example.com/health", method: "GET", headers: {} }, position: { x: 250, y: 200 } },
    ],
    edges: [{ source: "trigger-1", target: "http-1" }],
  },
  {
    id: "tpl-http-transform-email",
    name: "HTTP → Transform → Email",
    description: "Fetch data from an API, transform it, then send an email report.",
    icon: "📧",
    nodes: [
      { id: "trigger-1", type: "trigger", config: {}, position: { x: 250, y: 50 } },
      { id: "http-1", type: "http", config: { url: "https://api.example.com/data", method: "GET", headers: {} }, position: { x: 250, y: 180 } },
      { id: "transform-1", type: "transform", config: { expression: "return { summary: input.data?.length + ' items fetched' }" }, position: { x: 250, y: 310 } },
      { id: "email-1", type: "email", config: { to: "", subject: "Daily Report", body: "<h2>Report</h2><p>{{input.summary}}</p>" }, position: { x: 250, y: 440 } },
    ],
    edges: [
      { source: "trigger-1", target: "http-1" },
      { source: "http-1", target: "transform-1" },
      { source: "transform-1", target: "email-1" },
    ],
  },
  {
    id: "tpl-http-db",
    name: "HTTP → Database",
    description: "Fetch data from an API and store results in a database.",
    icon: "🗄️",
    nodes: [
      { id: "trigger-1", type: "trigger", config: {}, position: { x: 250, y: 50 } },
      { id: "http-1", type: "http", config: { url: "https://api.example.com/data", method: "GET", headers: {} }, position: { x: 250, y: 200 } },
      { id: "db-1", type: "db", config: { operation: "query", query: "INSERT INTO results (data) VALUES ($1)" }, position: { x: 250, y: 350 } },
    ],
    edges: [
      { source: "trigger-1", target: "http-1" },
      { source: "http-1", target: "db-1" },
    ],
  },
  {
    id: "tpl-trigger-http-telegram",
    name: "API Monitor + Alert",
    description: "Monitor an API endpoint and send Telegram alerts on changes.",
    icon: "🔔",
    nodes: [
      { id: "trigger-1", type: "trigger", config: {}, position: { x: 250, y: 50 } },
      { id: "http-1", type: "http", config: { url: "https://api.example.com/status", method: "GET", headers: {} }, position: { x: 250, y: 180 } },
      { id: "transform-1", type: "transform", config: { expression: "return { alert: 'Status: ' + JSON.stringify(input) }" }, position: { x: 250, y: 310 } },
      { id: "telegram-1", type: "telegram", config: { chatId: "", message: "🚨 {{input.alert}}" }, position: { x: 250, y: 440 } },
    ],
    edges: [
      { source: "trigger-1", target: "http-1" },
      { source: "http-1", target: "transform-1" },
      { source: "transform-1", target: "telegram-1" },
    ],
  },
  {
    id: "tpl-email-db",
    name: "Email Notification → Database Log",
    description: "Send an email and log the result to a database.",
    icon: "📝",
    nodes: [
      { id: "trigger-1", type: "trigger", config: {}, position: { x: 250, y: 50 } },
      { id: "email-1", type: "email", config: { to: "", subject: "Notification", body: "<p>Hello from mini-Zapier!</p>" }, position: { x: 250, y: 200 } },
      { id: "db-1", type: "db", config: { operation: "query", query: "INSERT INTO email_log (status) VALUES ('sent')" }, position: { x: 250, y: 350 } },
    ],
    edges: [
      { source: "trigger-1", target: "email-1" },
      { source: "email-1", target: "db-1" },
    ],
  },
];

// AI error explanation endpoint
app.post("/api/explain-error", async (req, res) => {
  try {
    const { error, nodeType, config } = req.body;
    if (!error || !nodeType) {
      res.status(400).json({ message: "error and nodeType are required" });
      return;
    }
    const result = await explainError(error, nodeType, config || {});
    res.json(result);
  } catch (err: any) {
    logger.error(`[explain-error] ${err.message}`);
    res.status(500).json({ message: "Failed to explain error" });
  }
});

// Test single node endpoint
app.post("/api/test-node", async (req, res) => {
  try {
    const { node, input } = req.body;
    if (!node || !node.type) {
      res.status(400).json({ message: "node with type is required" });
      return;
    }
    const { getExecutor } = await import("./executors/registry");
    const executor = getExecutor(node.type);
    const start = Date.now();
    let result;
    try {
      result = await executor.run(node.config || {}, input || null);
    } catch (err: any) {
      result = { success: false, error: err.message };
    }
    const durationMs = Date.now() - start;
    res.json({ ...result, durationMs });
  } catch (err: any) {
    logger.error(`[test-node] ${err.message}`);
    res.status(500).json({ message: "Failed to test node", error: err.message });
  }
});

// Workflow templates endpoint
app.get("/api/templates", (_req, res) => {
  res.json(workflowTemplates);
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
