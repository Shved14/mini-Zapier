import { api } from "./client";

export type Workflow = {
  id: string;
  name: string;
  isActive: boolean;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  workflowJson?: unknown;
  createdAt: string;
};

export const workflowsApi = {
  async list(): Promise<Workflow[]> {
    const res = await api.get<Workflow[]>("/workflows");
    return res.data;
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

  async remove(id: string) {
    await api.delete(`/workflows/${id}`);
  },

  async run(id: string, payload?: unknown) {
    const res = await api.post(`/execute`, {
      workflowId: id,
      input: payload ?? {},
    });
    return res.data;
  },
};

