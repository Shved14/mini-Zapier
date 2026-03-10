import { Queue, QueueScheduler, JobsOptions } from "bullmq";
import { getRedisClient } from "../config/redis";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const WORKFLOW_QUEUE_NAME = "workflow-jobs";

export type WorkflowJobPayload = {
  workflowId: string;
  payload: unknown;
};

let workflowQueue: Queue<WorkflowJobPayload> | null = null;
let workflowQueueScheduler: QueueScheduler | null = null;

export const getWorkflowQueue = (): Queue<WorkflowJobPayload> => {
  if (!workflowQueue) {
    const connection = getRedisClient();

    workflowQueue = new Queue<WorkflowJobPayload>(WORKFLOW_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3, // базовый ретрай
        backoff: {
          type: "exponential",
          delay: 3000, // 3 секунды с экспоненциальным ростом
        },
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    });
  }

  return workflowQueue;
};

export const initWorkflowQueue = async (): Promise<void> => {
  if (!workflowQueueScheduler) {
    const connection = getRedisClient();

    workflowQueueScheduler = new QueueScheduler(WORKFLOW_QUEUE_NAME, {
      connection,
    });

    logger.info(
      `Workflow queue scheduler initialized (Redis: ${env.REDIS_HOST}:${env.REDIS_PORT})`
    );
  }
};

export const enqueueWorkflowJob = async (
  data: WorkflowJobPayload,
  options: JobsOptions = {}
) => {
  const queue = getWorkflowQueue();

  const job = await queue.add("run-workflow", data, {
    // можно переопределить дефолты, если нужно
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    ...options,
  });

  logger.info("Workflow job enqueued", {
    jobId: job.id,
    workflowId: data.workflowId,
  });

  return job;
};

