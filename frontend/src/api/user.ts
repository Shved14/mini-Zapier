import { api } from "./client";

export type SubscriptionInfo = {
  plan: string;
  status: string;
  trialEndsAt?: string | null;
} | null;

export type MeResponse = {
  id: string;
  email: string;
  name?: string | null;
  subscription: SubscriptionInfo;
};

export const userApi = {
  async getMe(): Promise<MeResponse> {
    const res = await api.get<MeResponse>("/api/users/me");
    return res.data;
  },
  async updateMe(data: { name?: string }) {
    const res = await api.patch<MeResponse>("/api/users/me", data);
    return res.data;
  },
};

