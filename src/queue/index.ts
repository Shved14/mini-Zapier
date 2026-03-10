import { Queue, QueueScheduler } from "bullmq";
import { getRedisClient } from "../config/redis";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const WORKFLOW_QUEUE_NAME = "workflow-jobs";

let workflowQueue: Queue | null = null;

export const getWorkflowQueue = () => {
  if (!workflowQueue) {
    const connection = getRedisClient();
    workflowQueue = new Queue(WORKFLOW_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    });
  }
  return workflowQueue;
};

export const initQueues = async () => {
  const connection = getRedisClient();

  new QueueScheduler(WORKFLOW_QUEUE_NAME, {
    connection,
  });

  logger.info(
    `BullMQ queues initialized (Redis: ${env.REDIS_HOST}:${env.REDIS_PORT})`
  );
};

