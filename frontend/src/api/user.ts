import { api } from "./client";

export type MeResponse = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
};

export type RegisterResponse = {
  message: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    emailVerified: boolean;
  };
};

export type VerifyEmailResponse = {
  token: string;
  user: MeResponse;
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
  async verifyEmail(email: string, code: string): Promise<VerifyEmailResponse> {
    const res = await api.post<VerifyEmailResponse>("/auth/verify-email", { email, code });
    return res.data;
  },
};

