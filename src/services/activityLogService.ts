import { prisma } from "../config/prisma";
import { sseService } from "./sseService";

export type ActivityAction =
  | "node_added"
  | "node_removed"
  | "node_connected"
  | "node_config_updated"
  | "workflow_created"
  | "workflow_renamed"
  | "workflow_updated"
  | "workflow_executed"
  | "workflow_deleted"
  | "status_changed"
  | "member_invited"
  | "member_joined"
  | "member_left"
  | "member_removed"
  | "invite_accepted"
  | "settings_updated";

export const activityLogService = {
  async log(params: {
    workflowId: string;
    userId: string;
    action: ActivityAction;
    metadata?: Record<string, unknown>;
  }) {
    const entry = await prisma.activityLog.create({
      data: {
        workflowId: params.workflowId,
        userId: params.userId,
        action: params.action,
        metadata: params.metadata as any,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Broadcast to SSE clients
    sseService.broadcast(params.workflowId, "activity", entry);

    return entry;
  },

  async listByWorkflow(workflowId: string) {
    return prisma.activityLog.findMany({
      where: { workflowId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  },
};
