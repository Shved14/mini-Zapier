import { api, PaginatedResponse } from "./client";

export type StepLog = {
  id: string;
  runId: string;
  stepId: string;
  stepType: string;
  status: string;
  input: unknown;
  output: unknown;
  error?: string | null;
  startedAt: string;
  finishedAt?: string | null;
  createdAt: string;
};

export type WorkflowRun = {
  id: string;
  workflowId: string;
  status: string;
  currentNodeId?: string | null;
  startedAt: string;
  finishedAt?: string | null;
  workflow?: {
    id: string;
    name: string;
  };
  stepLogs?: StepLog[];
};

export const runsApi = {
  async list(): Promise<PaginatedResponse<WorkflowRun>> {
    const res = await api.get<PaginatedResponse<WorkflowRun>>("/api/runs");
    return res.data;
  },

  async get(id: string): Promise<WorkflowRun> {
    const res = await api.get<WorkflowRun>(`/api/runs/${id}`);
    return res.data;
  },

  async resume(id: string) {
    const res = await api.post(`/api/runs/${id}/resume`, {});
    return res.data;
  },
};

