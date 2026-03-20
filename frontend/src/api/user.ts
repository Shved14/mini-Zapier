import { api } from "./client";

export type MeResponse = {
  id: string;
  email: string;
  name?: string | null;
};

export const userApi = {
  async getMe(): Promise<MeResponse> {
    const res = await api.get<MeResponse>("/auth/me");
    return res.data;
  },
  async updateMe(data: { name?: string }) {
    const res = await api.patch<MeResponse>("/auth/me", data);
    return res.data;
  },
};

