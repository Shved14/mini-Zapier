import { api } from "./client";

export type NotificationMeta = {
  inviteToken?: string;
  workflowId?: string;
  workflowName?: string;
  role?: string;
  inviterEmail?: string;
  nodeId?: string;
  nodeType?: string;
  durationMs?: number;
  nodesExecuted?: number;
  error?: string;
  [key: string]: any;
};

export type Notification = {
  id: string;
  userId: string;
  type: string;
  channel: string;
  title: string;
  message: string;
  meta: NotificationMeta | null;
  read: boolean;
  relatedId: string | null;
  status: string;
  createdAt: string;
};

export const notificationsApi = {
  async list(): Promise<Notification[]> {
    const res = await api.get<Notification[]>("/notifications/me");
    return res.data;
  },

  async unreadCount(): Promise<number> {
    const res = await api.get<{ count: number }>("/notifications/me/unread-count");
    return res.data.count;
  },

  async markRead(id: string) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllRead() {
    const res = await api.post("/notifications/me/read-all");
    return res.data;
  },
};
