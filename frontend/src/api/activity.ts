import { api } from "./client";

export type ActivityLog = {
  id: string;
  workflowId: string;
  userId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: { id: string; name?: string | null; email: string };
};

export const activityApi = {
  async list(workflowId: string): Promise<ActivityLog[]> {
    const res = await api.get<ActivityLog[]>(`/workflows/${workflowId}/logs`);
    return res.data;
  },
};
