import { Worker, Job } from "bullmq";
import { WORKFLOW_QUEUE_NAME } from "../queue";
import { getRedisClient } from "../config/redis";
import { logger } from "../utils/logger";
import { executeWorkflowRun } from "../services/workflowEngine";

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

      // Делегируем всю логику движку выполнения workflow
      await executeWorkflowRun({ workflowId, payload });
    },
    {
      connection,
      // concurrency = 1, чтобы шаги конкретного job всегда шли строго последовательно
      concurrency: 1,
    }
  );

  worker.on("completed", (job) =>
    logger.info(`Workflow job completed`, { jobId: job.id })
  );

  worker.on("failed", (job, err) =>
    logger.error(`Workflow job failed`, { jobId: job?.id, error: err })
  );
};

