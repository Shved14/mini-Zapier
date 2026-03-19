import { prisma } from "../utils/prisma";

export async function logActivity(
  workflowId: string,
  userId: string,
  action: string,
  metadata?: Record<string, unknown>
) {
  return prisma.activityLog.create({
    data: { workflowId, userId, action, metadata: metadata as any ?? undefined },
  });
}

export async function getActivityLogs(workflowId: string, limit: number = 50) {
  return prisma.activityLog.findMany({
    where: { workflowId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
