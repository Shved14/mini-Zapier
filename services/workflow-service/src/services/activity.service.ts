import { prisma } from "../utils/prisma";

export interface ActivityMetadata {
  workflowName?: string;
  nodeName?: string;
  nodeType?: string;
  nodeId?: string;
  fromNode?: string;
  toNode?: string;
  source?: string;
  target?: string;
  config?: Record<string, unknown>;
  previousName?: string;
  newName?: string;
  email?: string;
  role?: string;
  status?: string;
  userEmail?: string;
  [key: string]: unknown;
}

export interface ActivityLogWithUser {
  id: string;
  workflowId: string;
  userId: string;
  action: string;
  metadata: ActivityMetadata | null;
  createdAt: Date;
}

export async function logActivity(
  workflowId: string,
  userId: string,
  action: string,
  metadata?: ActivityMetadata,
  userEmail?: string
) {
  const meta = { ...(metadata ?? {}), userEmail: userEmail ?? metadata?.userEmail };
  return prisma.activityLog.create({
    data: {
      workflowId,
      userId,
      action,
      metadata: meta as any,
    },
  });
}

export async function getActivityLogs(workflowId: string, limit: number = 50) {
  const logs = await prisma.activityLog.findMany({
    where: { workflowId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Fetch user details for all logs
  const userIds = [...new Set(logs.map(log => log.userId))];
  const users = await prisma.$queryRaw<Array<{ id: string, email: string, name: string | null }>>`
    SELECT id, email, name FROM auth.users WHERE id = ANY(${userIds})
  ` as Array<{ id: string, email: string, name: string | null }>;

  const userMap = users.reduce((map, user) => {
    map[user.id] = user;
    return map;
  }, {} as Record<string, { id: string, email: string, name: string | null }>);

  return logs.map((log) => {
    const meta = (log.metadata as any) ?? {};
    const user = userMap[log.userId];
    const displayName = user?.name || user?.email || log.userId.slice(0, 8) + "...";

    return {
      id: log.id,
      workflowId: log.workflowId,
      userId: log.userId,
      action: log.action,
      metadata: { ...meta, userEmail: user?.email },
      createdAt: log.createdAt,
      message: formatMessage(log.action, { ...meta, userName: displayName }),
      user: {
        id: log.userId,
        email: user?.email || log.userId,
        name: user?.name || null,
      },
    };
  });
}

function formatMessage(action: string, meta: any): string {
  const user = meta.userName || meta.userEmail || "Someone";

  switch (action) {
    case "workflow_created":
      return `${user} created workflow "${meta.name || meta.workflowName || ""}"`;
    case "workflow_renamed":
      return `${user} renamed workflow from "${meta.previousName}" to "${meta.newName}"`;
    case "workflow_updated":
      return `${user} updated workflow`;
    case "node_added":
      return `${user} added ${meta.nodeType || "node"} node`;
    case "node_deleted":
      return `${user} removed ${meta.nodeType || "node"} node`;
    case "node_config_updated":
      return `${user} updated config of ${meta.nodeType || "node"} node`;
    case "edge_added":
      return `${user} connected ${meta.source || "?"} → ${meta.target || "?"}`;
    case "edge_deleted":
      return `${user} disconnected ${meta.source || "?"} → ${meta.target || "?"}`;
    case "status_changed":
      return `${user} changed status to "${meta.status || "?"}"`;
    case "settings_updated":
      return `${user} updated workflow settings`;
    case "workflow_run_started":
      return `${user} started workflow execution`;
    case "workflow_run_completed":
      return `Workflow "${meta.workflowName || ""}" completed successfully${meta.durationMs ? ` (${meta.durationMs}ms)` : ""}`;
    case "workflow_run_failed":
      return `Workflow "${meta.workflowName || ""}" failed${meta.error ? `: ${meta.error}` : ""}`;
    case "member_invited":
      return `${user} invited ${meta.email || "someone"}`;
    case "member_joined":
      return `${meta.email || user} joined the workflow`;
    case "member_left":
      return `${meta.email || user} left the workflow`;
    case "invite_accepted":
      return `${user} accepted the invite`;
    default:
      return `${user} performed ${action}`;
  }
}

// Action constants for type safety
export const ACTIVITY_ACTIONS = {
  WORKFLOW_CREATED: "workflow_created",
  WORKFLOW_UPDATED: "workflow_updated",
  WORKFLOW_DELETED: "workflow_deleted",
  WORKFLOW_RENAMED: "workflow_renamed",
  WORKFLOW_RUN: "workflow_run",
  NODE_ADDED: "node_added",
  NODE_DELETED: "node_deleted",
  NODE_UPDATED: "node_updated",
  NODE_CONFIG_UPDATED: "node_config_updated",
  EDGE_ADDED: "edge_added",
  EDGE_DELETED: "edge_deleted",
  STATUS_CHANGED: "status_changed",
  SETTINGS_UPDATED: "settings_updated",
  WORKFLOW_RUN_COMPLETED: 'workflow_run_completed',
  WORKFLOW_RUN_FAILED: 'workflow_run_failed',
  MEMBER_INVITED: 'member_invited',
  MEMBER_JOINED: 'member_joined',
  MEMBER_LEFT: 'member_left',
} as const;
