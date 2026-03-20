import { Worker, Job } from "bullmq";
import { redisConnection } from "./connection";
import { WORKFLOW_QUEUE_NAME, WorkflowJobData } from "./workflow.queue";
import { runWorkflow } from "../engine/runner";
import { logger } from "../utils/logger";

export function startWorker(): Worker {
  const worker = new Worker<WorkflowJobData>(
    WORKFLOW_QUEUE_NAME,
    async (job: Job<WorkflowJobData>) => {
      logger.info(`Processing job ${job.id}`, {
        workflowId: job.data.workflowId,
        attempt: job.attemptsMade + 1,
      });

      const result = await runWorkflow(job.data);

      // Always return the result (even on failure) so steps/logs are preserved
      // in job.returnvalue for the Runs UI to display
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
