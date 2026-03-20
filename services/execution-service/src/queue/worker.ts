import { Worker, Job } from "bullmq";
import { redisConnection } from "./connection";
import { WORKFLOW_QUEUE_NAME, WorkflowJobData } from "./workflow.queue";
import { runWorkflow } from "../engine/runner";
import { logger } from "../utils/logger";

export function startWorker(): Worker {
  const worker = new Worker<WorkflowJobData>(
    WORKFLOW_QUEUE_NAME,
    async (job: Job<WorkflowJobData>) => {
      const jobData = job.data as WorkflowJobData;
      console.log(`🚀 You started workflow execution`, {
        workflowId: jobData.workflowId,
        jobId: job.id,
        userId: jobData.userId,
      });

      const result = await runWorkflow(job.data);

      // Log each step execution
      result.logs.forEach((log, index) => {
        console.log(`✅ Step ${index + 1} completed: ${log.type} (${log.nodeId})`, {
          status: log.status,
          duration: log.durationMs,
        });
      });

      // Store step results in job data so they're accessible even for failed jobs
      await job.updateData({
        ...job.data,
        steps: result.logs.map((log) => ({
          id: log.nodeId,
          nodeId: log.nodeId,
          nodeType: log.type,
          status: log.status === "success" ? "completed" : "failed",
          input: log.input,
          output: log.output,
          error: log.error || null,
          startedAt: log.startedAt,
          finishedAt: log.finishedAt,
          duration: log.durationMs,
        })),
      });

      // Update progress
      await job.updateProgress(100);

      // Don't throw — return result so it's available via returnvalue
      // The workflow status (completed/failed) is tracked inside the result
      return result;
    },
    {
      connection: redisConnection,
      concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
      limiter: {
        max: Number(process.env.RATE_LIMIT_MAX) || 50,
        duration: Number(process.env.RATE_LIMIT_DURATION) || 60000,
      },
    }
  );

  worker.on("completed", (job) => {
    logger.info(`Job ${job.id} completed`, { workflowId: job.data.workflowId });
  });

  worker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`, {
      workflowId: job?.data.workflowId,
      attempt: job?.attemptsMade,
    });
  });

  worker.on("error", (err) => {
    logger.error(`Worker error: ${err.message}`);
  });

  logger.info("Workflow worker started", {
    concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
  });

  return worker;
}

startWorker();
