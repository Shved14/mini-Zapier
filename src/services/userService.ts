import { prisma } from "../config/prisma";
import { subscriptionService } from "./subscriptionService";

export const userService = {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const err = new Error("User not found");
      (err as any).statusCode = 404;
      throw err;
    }

    const sub = await subscriptionService.getActiveSubscription(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription: sub
        ? {
            plan: sub.plan,
            status: sub.status,
            trialEndsAt: sub.trialEndsAt,
          }
        : null,
    };
  },

  async updateMe(userId: string, data: { name?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
      },
    });

    const sub = await subscriptionService.getActiveSubscription(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription: sub
        ? {
            plan: sub.plan,
            status: sub.status,
            trialEndsAt: sub.trialEndsAt,
          }
        : null,
    };
  },
};

