import { Queue, JobsOptions } from "bullmq";
import { getRedisClientForBullMQ } from "../config/redis";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const WORKFLOW_QUEUE_NAME = "workflow-jobs";

export type WorkflowJobPayload = {
  workflowId: string;
  payload: unknown;
  runId?: string;
  startFromNodeId?: string;
};

let workflowQueue: Queue<WorkflowJobPayload> | null = null;

export const getWorkflowQueue = (): Queue<WorkflowJobPayload> => {
  if (!workflowQueue) {
    const connection = getRedisClientForBullMQ();

    workflowQueue = new Queue(WORKFLOW_QUEUE_NAME, {
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
    }) as Queue<WorkflowJobPayload>;
  }

  return workflowQueue!;
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

