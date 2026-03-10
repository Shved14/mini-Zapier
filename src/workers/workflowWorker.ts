import { Worker, Job } from "bullmq";
import { WORKFLOW_QUEUE_NAME } from "../queue";
import { getRedisClient } from "../config/redis";
import { logger } from "../utils/logger";
import { prisma } from "../config/prisma";

type WorkflowJobData = {
  workflowId: string;
  payload: unknown;
};

export const startWorkflowWorker = () => {
  const connection = getRedisClient();

  const worker = new Worker<WorkflowJobData>(
    WORKFLOW_QUEUE_NAME,
    async (job: Job<WorkflowJobData>) => {
      const { workflowId, payload } = job.data;

      logger.info(`Processing workflow ${workflowId}`, { jobId: job.id });

      const run = await prisma.workflowRun.create({
        data: {
          workflowId,
          status: "completed",
          payload: payload as any,
        },
      });

      logger.info("Workflow run stored", { runId: run.id });
    },
    { connection }
  );

  worker.on("completed", (job) =>
    logger.info(`Job completed`, { jobId: job.id })
  );

  worker.on("failed", (job, err) =>
    logger.error(`Job failed`, { jobId: job?.id, error: err })
  );
};

