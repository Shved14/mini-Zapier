import { api } from "./client";

export type WorkflowVersion = {
  id: string;
  workflowId: string;
  version: number;
  workflowJson: unknown;
  createdAt: string;
};

export const versionsApi = {
  async list(workflowId: string): Promise<WorkflowVersion[]> {
    const res = await api.get<WorkflowVersion[]>(`/workflows/${workflowId}/versions`);
    return res.data;
  },

  async restore(workflowId: string, versionId: string) {
    const res = await api.post(`/workflows/${workflowId}/restore/${versionId}`);
    return res.data;
  },
};
