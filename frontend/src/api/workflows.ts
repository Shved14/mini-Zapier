import { api, PaginatedResponse } from "./client";

export type Workflow = {
  id: string;
  name: string;
  isActive: boolean;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  createdAt: string;
};

export type WorkflowRunSummary = {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  finishedAt?: string | null;
};

export const workflowsApi = {
  async list(): Promise<PaginatedResponse<Workflow>> {
    const res = await api.get<PaginatedResponse<Workflow>>("/api/workflows");
    return res.data;
  },

  async get(id: string): Promise<Workflow> {
    const res = await api.get<Workflow>(`/api/workflows/${id}`);
    return res.data;
  },

  async create(payload: Partial<Workflow> & { name: string; triggerType: string }) {
    const res = await api.post<Workflow>("/api/workflows", payload);
    return res.data;
  },

  async update(id: string, payload: Partial<Workflow>) {
    const res = await api.put<Workflow>(`/api/workflows/${id}`, payload);
    return res.data;
  },

  async remove(id: string) {
    await api.delete(`/api/workflows/${id}`);
  },

  async run(id: string, payload?: unknown) {
    const res = await api.post(`/api/workflows/${id}/run`, payload ?? {});
    return res.data;
  },
};

