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

export type SubscriptionUsage = {
  subscription: Subscription;
  usage: {
    workflows: number;
    runs: number;
  };
};

export const subscriptionApi = {
  async get(): Promise<Subscription> {
    const res = await api.get<Subscription>("/auth/subscription");
    return res.data;
  },

  async getWithUsage(): Promise<SubscriptionUsage> {
    const [subRes, statsRes, workflowsRes] = await Promise.allSettled([
      api.get<Subscription>("/auth/subscription"),
      api.get<{ total: number }>("/stats"),
      api.get<any[]>("/workflows"),
    ]);

    const subscription = subRes.status === "fulfilled" ? subRes.value.data : null;
    const runs = statsRes.status === "fulfilled" ? (statsRes.value.data as any).total ?? 0 : 0;
    const workflows = workflowsRes.status === "fulfilled" ? (Array.isArray(workflowsRes.value.data) ? workflowsRes.value.data.length : 0) : 0;

    return {
      subscription: subscription!,
      usage: { workflows, runs },
    };
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
