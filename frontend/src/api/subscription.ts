import { api } from "./client";

export type Subscription = {
  id: string;
  userId: string;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  createdAt: string;
  limits: {
    maxWorkflows: number;
    maxRuns: number;
  };
};

export const subscriptionApi = {
  async get(): Promise<Subscription> {
    const res = await api.get<Subscription>("/auth/subscription");
    return res.data;
  },

  async activateTrial(): Promise<Subscription> {
    const res = await api.post<Subscription>("/auth/subscription/activate-trial");
    return res.data;
  },

  async upgrade(plan: string): Promise<Subscription> {
    const res = await api.post<Subscription>("/auth/subscription/upgrade", { plan });
    return res.data;
  },
};
