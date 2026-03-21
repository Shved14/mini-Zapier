import { prisma } from "../utils/prisma";
import { AppError } from "./auth.service";
import { createInAppNotification } from "./notify.service";

const PLAN_LIMITS: Record<string, { maxWorkflows: number; maxRuns: number }> = {
  FREE: { maxWorkflows: 1, maxRuns: 10 },
  PRO: { maxWorkflows: -1, maxRuns: -1 },
};

const TRIAL_DAYS = 3;

function getLimits(plan: string) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

export async function createSubscription(userId: string) {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.subscription.create({
    data: {
      userId,
      plan: "FREE",
      status: "active",
      trialEndsAt: null,
    },
  });
}

export async function getSubscription(userId: string) {
  let sub = await prisma.subscription.findUnique({ where: { userId } });

  if (!sub) {
    sub = await createSubscription(userId);
  }

  // Auto-expire PRO trial → revert to FREE
  if (sub.status === "trial" && sub.plan === "PRO" && sub.trialEndsAt && new Date() > sub.trialEndsAt) {
    sub = await prisma.subscription.update({
      where: { id: sub.id },
      data: { plan: "FREE", status: "active", trialEndsAt: null },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { plan: "free" },
    }).catch(() => { });

    // Notify: trial expired
    createInAppNotification({
      userId,
      type: "trial_expired",
      title: "PRO Trial Expired",
      message: "Your PRO trial has ended. You've been switched back to the Free plan.",
    }).catch(() => { });
  }

  // Notify: trial ending soon (<=1 day left)
  if (sub.status === "trial" && sub.plan === "PRO" && sub.trialEndsAt) {
    const hoursLeft = (sub.trialEndsAt.getTime() - Date.now()) / 3600000;
    if (hoursLeft > 0 && hoursLeft <= 24) {
      createInAppNotification({
        userId,
        type: "trial_expiring",
        title: "PRO Trial Ending Soon",
        message: `Your PRO trial ends in less than ${Math.ceil(hoursLeft)} hours. Upgrade to keep unlimited access.`,
      }).catch(() => { });
    }
  }

  return {
    id: sub.id,
    userId: sub.userId,
    plan: sub.plan,
    status: sub.status,
    trialEndsAt: sub.trialEndsAt,
    createdAt: sub.createdAt,
    limits: getLimits(sub.plan),
  };
}

export async function activateTrial(userId: string) {
  let sub = await prisma.subscription.findUnique({ where: { userId } });

  if (!sub) {
    sub = await createSubscription(userId);
  }

  // Only allow trial if currently on FREE + active (not already trialing)
  if (sub.plan === "PRO") {
    throw new AppError(400, "You are already on PRO plan");
  }
  if (sub.status === "trial") {
    throw new AppError(400, "Trial is already active");
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { plan: "PRO", status: "trial", trialEndsAt },
  });

  // Update User.plan
  await prisma.user.update({
    where: { id: userId },
    data: { plan: "pro" },
  }).catch(() => { });

  return getSubscription(userId);
}

export async function upgradePlan(userId: string, plan: string) {
  const validPlans = ["FREE", "PRO"];
  if (!validPlans.includes(plan)) {
    throw new AppError(400, `Invalid plan: ${plan}`);
  }

  let sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) {
    sub = await createSubscription(userId);
  }

  // Block downgrade to FREE while PRO trial is active
  if (plan === "FREE" && sub.plan === "PRO" && sub.status === "trial" && sub.trialEndsAt && new Date() < sub.trialEndsAt) {
    throw new AppError(400, "Cannot switch to FREE while PRO trial is active. It will auto-revert when trial ends.");
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { plan, status: "active", trialEndsAt: null },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { plan: plan.toLowerCase() },
  }).catch(() => { });

  return getSubscription(userId);
}

export async function checkLimits(userId: string) {
  const sub = await getSubscription(userId);

  return {
    plan: sub.plan,
    status: sub.status,
    trialEndsAt: sub.trialEndsAt,
    limits: getLimits(sub.plan),
  };
}
