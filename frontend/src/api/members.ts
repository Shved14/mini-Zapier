import { api } from "./client";

export type WorkflowMember = {
  id: string;
  workflowId: string;
  userId: string;
  role: string;
  createdAt: string;
  user?: { id: string; name?: string | null; email: string };
};

export type WorkflowInvite = {
  id: string;
  workflowId: string;
  email: string;
  token: string;
  role: string;
  status: string;
  createdAt: string;
};

export type MembersResponse = {
  ownerId: string;
  members: WorkflowMember[];
  invites: WorkflowInvite[];
};

export const membersApi = {
  async list(workflowId: string): Promise<MembersResponse> {
    const res = await api.get<MembersResponse>(`/workflows/${workflowId}/members`);
    return res.data;
  },

  async inviteByEmail(workflowId: string, email: string, role: string = "viewer") {
    const res = await api.post<WorkflowInvite>(`/workflows/${workflowId}/invite`, { email, role });
    return res.data;
  },

  async acceptInviteByToken(token: string) {
    const res = await api.post(`/invite/${token}/accept`);
    return res.data;
  },

  async leave(workflowId: string) {
    const res = await api.post(`/workflows/${workflowId}/leave`);
    return res.data;
  },

  async remove(workflowId: string, userId: string) {
    await api.delete(`/workflows/${workflowId}/members/${userId}`);
  },
};
