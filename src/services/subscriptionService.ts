import { prisma } from "../config/prisma";

const FREE_MAX_WORKFLOWS = 3;
const FREE_MAX_RUNS_PER_DAY = 100;

export const subscriptionService = {
  async createDefaultForUser(userId: string) {
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return prisma.subscription.create({
      data: {
        userId,
        plan: "FREE",
        status: "active",
        trialEndsAt,
      },
    });
  },

  async getActiveSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async canCreateWorkflow(userId: string) {
    const sub = await this.getActiveSubscription(userId);
    if (!sub || sub.plan !== "FREE") {
      return true;
    }

    const count = await prisma.workflow.count({
      where: { userId },
    });

    return count < FREE_MAX_WORKFLOWS;
  },

  async canRunWorkflowForOwner(userId: string) {
    const sub = await this.getActiveSubscription(userId);
    if (!sub || sub.plan !== "FREE") {
      return true;
    }

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    const count = await prisma.workflowRun.count({
      where: {
        workflow: {
          userId,
        },
        startedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return count < FREE_MAX_RUNS_PER_DAY;
  },
};

