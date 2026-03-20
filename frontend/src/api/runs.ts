import { api } from "./client";

export type StepLog = {
  id: string;
  nodeId: string;
  nodeType: string;
  status: "pending" | "running" | "completed" | "failed";
  input?: unknown;
  output?: unknown;
  error?: string | null;
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
};

export type WorkflowRun = {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string | null;
  finishedAt: string | null;
  progress: number;
  result?: unknown;
  error?: string | null;
  steps: StepLog[];
  logs?: string[];
};

export const runsApi = {
  async list(): Promise<WorkflowRun[]> {
    const res = await api.get<WorkflowRun[]>("/runs");
    return res.data;
  },

  async get(id: string): Promise<WorkflowRun> {
    const res = await api.get<WorkflowRun>(`/runs/${id}`);
    return res.data;
  },

  async resume(id: string) {
    const res = await api.post(`/runs/${id}/resume`, {});
    return res.data;
  },
};

