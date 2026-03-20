import { api } from "./client";

export type WorkflowMemberRef = {
  id: string;
  workflowId: string;
  userId: string;
  role: string;
  status: string;
  createdAt: string;
};

export type Workflow = {
  id: string;
  name: string;
  userId: string;
  status: string;
  isActive?: boolean;
  triggerType?: string;
  triggerConfig?: Record<string, unknown>;
  workflowJson?: unknown;
  slackWebhook?: string | null;
  members?: WorkflowMemberRef[];
  createdAt: string;
  updatedAt?: string;
};

export const workflowsApi = {
  async list(): Promise<Workflow[]> {
    const res = await api.get<{ items: Workflow[] } | Workflow[]>("/workflows");
    return Array.isArray(res.data) ? res.data : (res.data as any).items ?? [];
  },

  async get(id: string): Promise<Workflow> {
    const res = await api.get<Workflow>(`/workflows/${id}`);
    return res.data;
  },

  async create(payload: Partial<Workflow> & { name: string }) {
    const data = {
      ...payload,
      workflowJson: payload.workflowJson ?? {
        nodes: [{ id: "trigger-1", type: "trigger", config: {}, position: { x: 250, y: 50 }, data: { label: "Start" } }],
        edges: [],
      },
    };
    const res = await api.post<Workflow>("/workflows", data);
    return res.data;
  },

  async update(id: string, payload: Partial<Workflow>) {
    const res = await api.put<Workflow>(`/workflows/${id}`, payload);
    return res.data;
  },

  async patchStatus(id: string, status: string) {
    const res = await api.patch<Workflow>(`/workflows/${id}/status`, { status });
    return res.data;
  },

  async remove(id: string) {
    await api.delete(`/workflows/${id}`);
  },

  async run(id: string, payload?: unknown) {
    const res = await api.post(`/workflows/${id}/run`, payload ?? {});
    return res.data;
  },

  async getLogs(id: string) {
    const res = await api.get(`/workflows/${id}/logs`);
    return res.data;
  },
};

