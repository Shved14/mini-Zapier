import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export const WORKFLOW_QUEUE_NAME = "workflow-execution";

export const workflowQueue = new Queue(WORKFLOW_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export interface StepData {
  id: string;
  nodeId: string;
  nodeType: string;
  status: string;
  input?: unknown;
  output?: unknown;
  error?: string | null;
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
}

export interface WorkflowJobData {
  workflowId: string;
  userId: string;
  workflowName?: string;
  workflowJson: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  steps?: StepData[];
}

export interface WorkflowNode {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  source: string;
  target: string;
}
