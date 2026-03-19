import { api } from "./client";

export type WorkflowMember = {
  id: string;
  workflowId: string;
  userId: string;
  role: string;
  status: string;
  createdAt: string;
};

export type MembersResponse = {
  ownerId: string;
  members: WorkflowMember[];
};

export const membersApi = {
  async list(workflowId: string): Promise<MembersResponse> {
    const res = await api.get<MembersResponse>(`/workflows/${workflowId}/members`);
    return res.data;
  },

  async invite(workflowId: string, userId: string, role: string = "viewer") {
    const res = await api.post<WorkflowMember>(`/workflows/${workflowId}/invite`, { userId, role });
    return res.data;
  },

  async acceptInvite(workflowId: string, inviteId: string) {
    const res = await api.post(`/workflows/${workflowId}/invite/${inviteId}/accept`);
    return res.data;
  },

  async declineInvite(workflowId: string, inviteId: string) {
    const res = await api.post(`/workflows/${workflowId}/invite/${inviteId}/decline`);
    return res.data;
  },

  async remove(workflowId: string, userId: string) {
    await api.delete(`/workflows/${workflowId}/members/${userId}`);
  },
};
