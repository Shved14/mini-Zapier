import { prisma } from "../utils/prisma";
import { AppError } from "./auth.service";

const PLAN_LIMITS: Record<string, { maxWorkflows: number; maxRuns: number }> = {
  FREE: { maxWorkflows: 1, maxRuns: 10 },
  PRO: { maxWorkflows: Infinity, maxRuns: Infinity },
};

const TRIAL_DAYS = 3;

export async function createSubscription(userId: string) {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing) return existing;

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  return prisma.subscription.create({
    data: {
      userId,
      plan: "FREE",
      status: "trial",
      trialEndsAt,
    },
  });
}

export async function getSubscription(userId: string) {
  let sub = await prisma.subscription.findUnique({ where: { userId } });

  if (!sub) {
    sub = await createSubscription(userId);
  }

  // Auto-expire trial
  if (sub.status === "trial" && sub.trialEndsAt && new Date() > sub.trialEndsAt) {
    sub = await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "active" },
    });
  }

  return {
    id: sub.id,
    userId: sub.userId,
    plan: sub.plan,
    status: sub.status,
    trialEndsAt: sub.trialEndsAt,
    createdAt: sub.createdAt,
    limits: PLAN_LIMITS[sub.plan] ?? PLAN_LIMITS.FREE,
  };
}

export async function activateTrial(userId: string) {
  let sub = await prisma.subscription.findUnique({ where: { userId } });

  if (!sub) {
    sub = await createSubscription(userId);
    return getSubscription(userId);
  }

  if (sub.status !== "active" && sub.status !== "expired") {
    throw new AppError(400, "Trial is already active");
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { plan: "PRO", status: "trial", trialEndsAt },
  });

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

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { plan, status: "active", trialEndsAt: null },
  });

  // Also update User.plan field for quick access
  await prisma.user.update({
    where: { id: userId },
    data: { plan: plan.toLowerCase() },
  });

  return getSubscription(userId);
}

export async function checkLimits(userId: string) {
  const sub = await getSubscription(userId);
  const limits = PLAN_LIMITS[sub.plan] ?? PLAN_LIMITS.FREE;

  // Determine effective plan: during trial, use the trial plan's limits
  const effectivePlan = sub.status === "trial" ? sub.plan : sub.plan;

  return {
    plan: sub.plan,
    status: sub.status,
    trialEndsAt: sub.trialEndsAt,
    limits: {
      maxWorkflows: limits.maxWorkflows === Infinity ? -1 : limits.maxWorkflows,
      maxRuns: limits.maxRuns === Infinity ? -1 : limits.maxRuns,
    },
  };
}
